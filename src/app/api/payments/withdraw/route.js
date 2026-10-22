import { NextResponse } from 'next/server';
import { getSessionUser, ROLES } from '@/lib/auth';
import { getDb, toIdQuery, toObjectId } from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';

// GET: List Redemptions
export async function GET(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const stage = searchParams.get('stage');

    const db = await getDb();
    const redemptionsCol = db.collection('redemptions');

    const isStaff =
      session.role === ROLES.SUPER_ADMIN ||
      session.role === ROLES.FINANCIAL_MANAGER ||
      session.role === ROLES.OPERATION_ADMIN ||
      session.role === ROLES.COIN_MANAGER;
    const query = {};

    if (!isStaff) {
      query.userId = session.userId;
    }

    if (status && status !== 'all') {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    if (stage && stage !== 'all') {
      query.stage = stage;
    }

    const items = await redemptionsCol.find(query).sort({ createdAt: -1 }).limit(100).toArray();

    return NextResponse.json({
      success: true,
      redemptions: items.map(r => ({
        id: r._id.toString(),
        userId: r.userId,
        username: r.username,
        amount: r.amount,
        gameTitle: r.gameTitle || 'Standard Platform',
        gameUsername: r.gameUsername || null,
        gameScreenshot: r.gameScreenshot || null,
        qrCodeImage: r.qrCodeImage || null,
        payoutMethod: r.payoutMethod,
        destinationAddress: r.destinationAddress,
        status: r.status,
        stage: r.stage || (r.status === 'pending_coin' ? 'coin_verification' : 'finance_payout'),
        processedBy: r.processedBy || null,
        coinApprovedBy: r.coinApprovedBy || null,
        coinApprovedAt: r.coinApprovedAt || null,
        rejectReason: r.rejectReason || r.coinRejectReason || r.financeRejectReason || null,
        coinRejectReason: r.coinRejectReason || null,
        financeRejectReason: r.financeRejectReason || null,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Player Request Redemption
export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Please login.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount,
      payoutMethod,
      destinationAddress,
      gameTitle,
      gameScreenshot,
      qrCodeImage,
      notes,
    } = body;

    const redeemAmount = Number(amount);
    if (!redeemAmount || redeemAmount < 10.0) {
      return NextResponse.json({ success: false, error: 'Minimum cashout is $10.00.' }, { status: 400 });
    }

    if (!destinationAddress || !destinationAddress.trim()) {
      return NextResponse.json({ success: false, error: 'Your recipient Tag Name / Cashtag is required.' }, { status: 400 });
    }

    if (!payoutMethod) {
      return NextResponse.json({ success: false, error: 'Payout method is required.' }, { status: 400 });
    }

    if (!gameScreenshot) {
      return NextResponse.json({ success: false, error: 'Game score / winning screenshot is required.' }, { status: 400 });
    }

    if (!qrCodeImage) {
      return NextResponse.json({ success: false, error: 'Your recipient QR Code image / screenshot is required.' }, { status: 400 });
    }

    const db = await getDb();
    const usersCol = db.collection('users');
    const redemptionsCol = db.collection('redemptions');
    const ledgerCol = db.collection('ledger');

    const user = await usersCol.findOne(toIdQuery(session.id || session.userId));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    // 0. Enforce Active Game Account Check
    const cleanPlayerEmail = (user.email || session.email || '').toLowerCase().trim();
    const existingGameAccounts = await db.collection('gameAccounts').find({
      userEmail: cleanPlayerEmail,
      status: 'READY',
    }).toArray();

    let matchedGameAcc = null;
    if (existingGameAccounts.length > 0) {
      if (gameTitle) {
        matchedGameAcc = existingGameAccounts.find(a =>
          a.gameTitle?.toLowerCase() === String(gameTitle).toLowerCase() ||
          a.gameName?.toLowerCase() === String(gameTitle).toLowerCase()
        ) || existingGameAccounts[0];
      } else {
        matchedGameAcc = existingGameAccounts[0];
      }
    } else {
      matchedGameAcc = await db.collection('game_accounts').findOne({
        $or: [{ userEmail: cleanPlayerEmail }, { userId: user._id.toString() }]
      });
    }

    if (!matchedGameAcc) {
      return NextResponse.json({
        success: false,
        error: '⚠️ Active Game Account Required: You must create and register a game account on a game platform before requesting a cashout/withdrawal. Please play on a registered game account first.',
        requiresGameAccount: true,
      }, { status: 400 });
    }

    const finalGameTitle = (gameTitle || matchedGameAcc.gameTitle || matchedGameAcc.gameName || 'Sweepstakes Platform').trim();
    const finalGameUsername = (body.gameUsername || matchedGameAcc.username || matchedGameAcc.gameUsername || 'N/A').trim();

    // 1. Create Redemption Record (Winnings verified from game screenshot; wallet balance untouched)
    const insertRes = await redemptionsCol.insertOne({
      userId: user._id.toString(),
      username: user.username,
      amount: redeemAmount,
      gameTitle: finalGameTitle,
      gameUsername: finalGameUsername,
      gameScreenshot,
      qrCodeImage,
      payoutMethod,
      destinationAddress: destinationAddress.trim(),
      notes: notes || '',
      status: 'pending',
      stage: 'finance_payout',
      processedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Write Immutable Ledger Entry
    await ledgerCol.insertOne({
      userId: user._id.toString(),
      username: user.username,
      type: 'redemption_requested',
      currency: 'USD',
      amount: redeemAmount,
      balanceBefore: user.balanceSC ?? user.balance ?? 0,
      balanceAfter: user.balanceSC ?? user.balance ?? 0,
      performedBy: 'player',
      referenceId: insertRes.insertedId.toString(),
      notes: `Cashout request ($${redeemAmount}) submitted for ${gameTitle || 'Game Platform'} via ${payoutMethod} to Tag: ${destinationAddress.trim()}`,
      createdAt: new Date(),
    });

    // 3. Send Notification to User
    await db.collection('notifications').insertOne({
      userId: user._id,
      title: '💸 Cashout Request Submitted',
      message: `Your cashout request for $${redeemAmount.toFixed(2)} from ${gameTitle || 'game'} has been queued. Our financial desk is verifying your game screenshot and will dispatch to ${destinationAddress.trim()}.`,
      type: 'withdraw',
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Cashout request for $${redeemAmount.toFixed(2)} submitted successfully! Our financial team will dispatch your payout to ${destinationAddress.trim()}.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Approve or Reject Redemption (Coin Desk & Finance Desk)
export async function PUT(req) {
  try {
    const session = await getSessionUser();
    const authorizedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.FINANCIAL_MANAGER,
      ROLES.OPERATION_ADMIN,
      ROLES.COIN_MANAGER,
    ];
    if (!session || !authorizedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized staff action.' }, { status: 403 });
    }

    const { redemptionId, action, rejectReason } = await req.json();

    if (!redemptionId || !action) {
      return NextResponse.json({ success: false, error: 'Redemption ID and action required.' }, { status: 400 });
    }

    const db = await getDb();
    const redemptionsCol = db.collection('redemptions');
    const usersCol = db.collection('users');
    const ledgerCol = db.collection('ledger');

    const redemption = await redemptionsCol.findOne(toIdQuery(redemptionId));
    if (!redemption) {
      return NextResponse.json({ success: false, error: 'Redemption not found.' }, { status: 404 });
    }

    const user = await usersCol.findOne(toIdQuery(redemption.userId));

    // ACTION 1: COIN DESK APPROVAL (Verify game score & forward to Finance / Ledger)
    if (action === 'coin_approve') {
      await redemptionsCol.updateOne(
        { _id: redemption._id },
        {
          $set: {
            status: 'pending',
            stage: 'finance_payout',
            coinApprovedBy: `${session.username} (${session.role})`,
            coinApprovedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      await ledgerCol.insertOne({
        userId: redemption.userId,
        username: redemption.username,
        type: 'coin_verification_passed',
        currency: 'SC',
        amount: redemption.amount,
        balanceBefore: user ? user.balanceSC : 0,
        balanceAfter: user ? user.balanceSC : 0,
        performedBy: session.username,
        staffRole: session.role,
        referenceId: redemptionId,
        notes: `Game score screenshot verified for ${redemption.gameTitle || 'platform'}. Forwarded to Finance Ledger for payout.`,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Game score verified! Cashout passed to Finance Ledger for payout.',
      });
    }

    // ACTION 2: COIN DESK REJECTION (Invalid screenshot, wrong score, etc.)
    if (action === 'coin_reject') {
      const reason = rejectReason?.trim() || 'Game winning screenshot could not be verified or score mismatch.';

      await redemptionsCol.updateOne(
        { _id: redemption._id },
        {
          $set: {
            status: 'rejected_by_coin',
            stage: 'rejected_coin',
            rejectReason: reason,
            coinRejectReason: reason,
            processedBy: `${session.username} (${session.role})`,
            updatedAt: new Date(),
          },
        }
      );

      // Notify player
      await db.collection('notifications').insertOne({
        userId: toObjectId(redemption.userId),
        title: '❌ Cashout Verification Declined',
        message: `Your cashout request for $${Number(redemption.amount).toFixed(2)} from ${redemption.gameTitle || 'game'} could not be verified. Note: ${reason}`,
        type: 'withdraw_rejected',
        read: false,
        createdAt: new Date(),
      });

      const currentBal = user ? (user.balanceSC ?? user.balance ?? 0) : 0;
      await ledgerCol.insertOne({
        userId: redemption.userId,
        username: redemption.username,
        type: 'redemption_rejected_by_coin',
        currency: 'USD',
        amount: redemption.amount,
        balanceBefore: currentBal,
        balanceAfter: currentBal,
        performedBy: session.username,
        staffRole: session.role,
        referenceId: redemptionId,
        notes: `Coin Manager rejected cashout: ${reason}`,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Cashout rejected by Coin Desk. Note saved and sent to player.',
      });
    }

    // ACTION 3: FINANCE DESK APPROVE / DISPATCH (Payment sent via Cash App QR / Address)
    // NOTE: Cashout is based on game winnings verified via screenshot, NOT deducted from website balance!
    if (action === 'approve' || action === 'finance_dispatch') {
      if (redemption.status === 'approved') {
        return NextResponse.json({ success: false, error: 'Redemption is already approved.' }, { status: 400 });
      }

      await redemptionsCol.updateOne(
        { _id: redemption._id },
        {
          $set: {
            status: 'approved',
            stage: 'completed',
            processedBy: `${session.username} (${session.role})`,
            updatedAt: new Date(),
          },
        }
      );

      // Increment user's total redeemed stats without deducting website balance
      await usersCol.updateOne(
        toIdQuery(redemption.userId),
        {
          $inc: {
            totalRedeemed: redemption.amount,
          },
        }
      );

      const currentBal = user ? (user.balanceSC ?? user.balance ?? 0) : 0;

      // Record in ledger
      await ledgerCol.insertOne({
        userId: redemption.userId,
        username: redemption.username,
        type: 'redemption_dispatched',
        currency: 'USD',
        amount: redemption.amount,
        balanceBefore: currentBal,
        balanceAfter: currentBal,
        performedBy: session.username,
        staffRole: session.role,
        referenceId: redemptionId,
        notes: `Cashout ($${redemption.amount}) approved & dispatched via ${redemption.payoutMethod} to Tag/Address: ${redemption.destinationAddress}. Platform: ${redemption.gameTitle || 'Game'}`,
        createdAt: new Date(),
      });

      // Notification to user
      await db.collection('notifications').insertOne({
        userId: toObjectId(redemption.userId),
        title: '✅ Cashout Dispatched Successfully!',
        message: `Your cashout of $${Number(redemption.amount).toFixed(2)} from ${redemption.gameTitle || 'game'} has been dispatched via ${redemption.payoutMethod} to your tag: ${redemption.destinationAddress}.`,
        type: 'withdraw_approved',
        read: false,
        createdAt: new Date(),
      });

      // Email notification
      if (user?.email) {
        sendEmail({
          to: user.email,
          subject: 'Zorra Royals Cashout Dispatched!',
          html: `<p>Hi ${user.username}, your prize cashout of $${redemption.amount} via ${redemption.payoutMethod} has been sent to your tag ${redemption.destinationAddress}!</p>`,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, message: `Cashout dispatched to ${redemption.destinationAddress}! Website balance untouched.` });
    }

    // ACTION 4: FINANCE DESK REJECT (Address invalid, QR scan error, etc.)
    if (action === 'reject' || action === 'finance_reject') {
      const reason = rejectReason?.trim() || 'Payment dispatch failed or recipient tag/QR code was invalid.';

      await redemptionsCol.updateOne(
        { _id: redemption._id },
        {
          $set: {
            status: 'rejected_by_finance',
            stage: 'rejected_finance',
            rejectReason: reason,
            financeRejectReason: reason,
            processedBy: `${session.username} (${session.role})`,
            updatedAt: new Date(),
          },
        }
      );

      // Notification to user
      await db.collection('notifications').insertOne({
        userId: toObjectId(redemption.userId),
        title: '❌ Cashout Request Declined',
        message: `Your cashout request for $${Number(redemption.amount).toFixed(2)} via ${redemption.payoutMethod} was rejected by finance desk. Note: ${reason}`,
        type: 'withdraw_rejected',
        read: false,
        createdAt: new Date(),
      });

      // Log in ledger
      const currentBal = user ? (user.balanceSC ?? user.balance ?? 0) : 0;
      await ledgerCol.insertOne({
        userId: redemption.userId,
        username: redemption.username,
        type: 'redemption_rejected_by_finance',
        currency: 'USD',
        amount: redemption.amount,
        balanceBefore: currentBal,
        balanceAfter: currentBal,
        performedBy: session.username,
        staffRole: session.role,
        referenceId: redemptionId,
        notes: `Finance desk rejected payout ($${redemption.amount}): ${reason}`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: 'Payout rejected by Finance. Note sent to player.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
