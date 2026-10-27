import { NextResponse } from 'next/server';
import { getSessionUser, ROLES } from '@/lib/auth';
import { getDb, toIdQuery } from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';

// GET: List Deposits (Admin / Financial Manager) or Player's own
export async function GET(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const db = await getDb();
    const depositsCol = db.collection('deposits');

    const query = {};
    const isStaff =
      session.role === ROLES.SUPER_ADMIN ||
      session.role === ROLES.FINANCIAL_MANAGER ||
      session.role === ROLES.OPERATION_ADMIN;

    if (!isStaff) {
      query.userId = session.userId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const deposits = await depositsCol.find(query).sort({ createdAt: -1 }).limit(100).toArray();

    return NextResponse.json({
      success: true,
      deposits: deposits.map(d => {
        const bonusType = d.bonusType || 'welcome';
        const bonusPercent = d.bonusPercent ?? (bonusType === 'welcome' ? 300 : 50);
        const bonusSC = d.bonusSC !== undefined ? d.bonusSC : Number(((d.amount * bonusPercent) / 100).toFixed(2));
        const totalSC = d.totalSC !== undefined ? d.totalSC : Number((d.amount + bonusSC).toFixed(2));
        const totalGC = d.totalGC !== undefined ? d.totalGC : (d.amount * 10000);

        return {
          id: d._id.toString(),
          userId: d.userId,
          username: d.username,
          amount: d.amount,
          methodName: d.methodName,
          senderNote: d.senderNote || '',
          senderTag: d.senderTag || d.senderNote || '',
          senderEmail: d.senderEmail || '',
          proofImage: d.proofImage || null,
          txHash: d.txHash || '',
          bonusType,
          bonusPercent,
          bonusSC,
          totalSC,
          totalGC,
          gameTitle: d.gameTitle || 'Orion Stars',
          gameUsername: d.gameUsername || null,
          hasGameAccount: d.hasGameAccount !== undefined ? d.hasGameAccount : Boolean(d.gameUsername),
          creditedSC: d.creditedSC || null,
          status: d.status,
          processedBy: d.processedBy || null,
          rejectReason: d.rejectReason || null,
          createdAt: d.createdAt,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Player Submit Deposit Request
export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, methodId, methodName, senderTag, senderEmail, senderNote, proofImage, txHash, gameTitle, gameUsername } = body;

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 5) {
      return NextResponse.json({ success: false, error: 'Minimum deposit is $5.00.' }, { status: 400 });
    }

    if (!methodName) {
      return NextResponse.json({ success: false, error: 'Payment method is required.' }, { status: 400 });
    }

    const db = await getDb();
    const depositsCol = db.collection('deposits');
    const usersCol = db.collection('users');
    const settingsCol = db.collection('system_settings');

    const uid = session.id || session.userId;
    const [user, settings, prevApproved] = await Promise.all([
      usersCol.findOne(toIdQuery(uid)),
      settingsCol.findOne({ key: 'general' }),
      depositsCol.findOne({
        $or: [{ userId: uid }, { username: session.username }],
        status: 'approved',
      }),
    ]);

    // Check whether player is claiming Welcome Bonus or Regular Bonus
    const hasClaimedWelcome = Boolean(
      user?.welcomeBonusClaimed ||
      (user?.totalDeposited && user.totalDeposited > 0) ||
      prevApproved
    );
    const bonusType = hasClaimedWelcome ? 'regular' : 'welcome';
    const bonusPercent = hasClaimedWelcome
      ? Number(settings?.regularBonusPercent ?? settings?.regularBonusPercentage ?? 50)
      : Number(settings?.welcomeBonusPercent ?? settings?.welcomeBonusPercentage ?? 300);
    const bonusMax = hasClaimedWelcome
      ? Number(settings?.regularBonusMax ?? 2500)
      : Number(settings?.welcomeBonusMax ?? 7500);

    const bonusSC = Number(Math.min((depositAmount * bonusPercent) / 100, bonusMax).toFixed(2));
    const totalSC = Number((depositAmount + bonusSC).toFixed(2));
    const totalGC = depositAmount * 10000;

    const cleanUserEmail = (user?.email || session?.email || '').toLowerCase().trim();
    const reqGameTitle = body.gameTitle ? String(body.gameTitle).trim() : null;

    // Check if player already has an account for requested game or any game
    const existingGameAcc = await db.collection('gameAccounts').findOne({
      userEmail: cleanUserEmail,
      status: 'READY',
      ...(reqGameTitle ? { gameTitle: new RegExp(`^${reqGameTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : {})
    }) || await db.collection('gameAccounts').findOne({
      userEmail: cleanUserEmail,
      status: 'READY'
    }) || await db.collection('game_accounts').findOne({
      $or: [{ userEmail: cleanUserEmail }, { userId: uid }]
    });

    const targetGameTitle = reqGameTitle || existingGameAcc?.gameTitle || 'Orion Stars';
    const finalGameUsername = body.gameUsername ? String(body.gameUsername).trim() : (existingGameAcc?.username || existingGameAcc?.gameUsername || null);
    const hasGameAccount = Boolean(finalGameUsername);

    const newDeposit = {
      userId: uid,
      username: session.username,
      amount: depositAmount,
      methodId: methodId || 'custom',
      methodName,
      senderTag: (senderTag || senderNote || '').trim(),
      senderEmail: (senderEmail || '').trim(),
      senderNote: (senderNote || senderTag || '').trim(),
      proofImage: proofImage || null,
      txHash: txHash || '',
      gameTitle: targetGameTitle,
      gameUsername: finalGameUsername,
      hasGameAccount,
      bonusType,
      bonusPercent,
      bonusSC,
      totalSC,
      totalGC,
      status: 'pending',
      processedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await depositsCol.insertOne(newDeposit);

    return NextResponse.json({
      success: true,
      depositId: res.insertedId.toString(),
      calculatedCoins: {
        totalSC,
        bonusSC,
        bonusType,
        bonusPercent,
        totalGC,
      },
      message: 'Deposit submitted successfully! Our financial desk is verifying your transaction.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Financial Manager & Super Admin Approve / Reject Deposit
export async function PUT(req) {
  try {
    const session = await getSessionUser();
    const authorizedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.FINANCIAL_MANAGER,
      ROLES.OPERATION_ADMIN,
    ];
    if (!session || !authorizedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Financial Manager access required.' }, { status: 403 });
    }

    const { depositId, action, rejectReason, customSC, customGC } = await req.json();

    if (!depositId || !action) {
      return NextResponse.json({ success: false, error: 'Deposit ID and action required.' }, { status: 400 });
    }

    const db = await getDb();
    const depositsCol = db.collection('deposits');
    const usersCol = db.collection('users');
    const ledgerCol = db.collection('ledger');

    const deposit = await depositsCol.findOne(toIdQuery(depositId));
    if (!deposit) {
      return NextResponse.json({ success: false, error: 'Deposit record not found.' }, { status: 404 });
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json({ success: false, error: `Deposit is already marked as ${deposit.status}.` }, { status: 400 });
    }

    const user = await usersCol.findOne(toIdQuery(deposit.userId));
    if (!user) {
      return NextResponse.json({ success: false, error: 'Associated player not found.' }, { status: 404 });
    }

    if (action === 'approve') {
      // Determine final coins to credit (use custom if provided, otherwise auto-calculated totalSC)
      const creditedSC = customSC !== undefined && customSC !== null && customSC !== ''
        ? Number(customSC)
        : (deposit.totalSC !== undefined ? Number(deposit.totalSC) : Number((deposit.amount + (deposit.bonusSC || 0)).toFixed(2)));
      const creditedGC = customGC !== undefined && customGC !== null && customGC !== ''
        ? Number(customGC)
        : (deposit.totalGC !== undefined ? Number(deposit.totalGC) : deposit.amount * 10000);

      const oldSC = user.balanceSC ?? user.balance ?? 0;
      const newSC = Number((oldSC + creditedSC).toFixed(2));

      // 1. Credit Player Balance & mark welcome bonus claimed if first time
      const userUpdate = {
        $inc: {
          balance: creditedSC,
          balanceSC: creditedSC,
          balanceGC: creditedGC,
          totalDeposited: deposit.amount,
          availableSpins: 2, // 2 Free Spins unlocked per approved deposit
        },
      };

      if (!user.welcomeBonusClaimed) {
        userUpdate.$set = { welcomeBonusClaimed: true };
      }

      await usersCol.updateOne({ _id: user._id }, userUpdate);

      // 2. Mark Deposit as Approved
      await depositsCol.updateOne(
        { _id: deposit._id },
        {
          $set: {
            status: 'approved',
            creditedSC,
            creditedGC,
            processedBy: `${session.username} (${session.role})`,
            updatedAt: new Date(),
          },
        }
      );

      // 3. Write Immutable Ledger
      await ledgerCol.insertOne({
        userId: user._id.toString(),
        username: user.username,
        type: 'deposit',
        currency: 'USD',
        amount: creditedSC,
        balanceBefore: oldSC,
        balanceAfter: newSC,
        performedBy: session.username,
        staffRole: session.role,
        referenceId: depositId,
        notes: `Deposit $${deposit.amount} approved ($${creditedSC} credited: $${deposit.amount} base + $${deposit.bonusSC || 0} ${deposit.bonusType || 'welcome'} bonus). Method: ${deposit.methodName}. Tag: ${deposit.senderTag || deposit.senderNote || 'N/A'}. Email: ${deposit.senderEmail || 'N/A'}. TXID: ${deposit.txHash || 'N/A'}`,
        createdAt: new Date(),
      });

      // 4. Send Notification to User
      await db.collection('notifications').insertOne({
        userId: user._id,
        title: '✅ Deposit Verified & Credited!',
        message: `Your deposit of $${Number(deposit.amount).toFixed(2)} via ${deposit.methodName} has been approved! +$${creditedSC.toFixed(2)} USD has been credited directly to your royal wallet balance.`,
        type: 'deposit',
        read: false,
        createdAt: new Date(),
      });

      // 4b. Auto-queue Game Account Creation if player does not have a game account for this game yet
      const targetGame = deposit.gameTitle || 'Orion Stars';
      const cleanPlayerEmail = (user.email || deposit.senderEmail || '').toLowerCase().trim();

      const existingGameAcc = await db.collection('gameAccounts').findOne({
        userEmail: cleanPlayerEmail,
        gameTitle: new RegExp(`^${targetGame.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        status: 'READY',
      });

      if (!existingGameAcc) {
        const existingPending = await db.collection('accountRequests').findOne({
          userEmail: cleanPlayerEmail,
          gameTitle: targetGame,
          status: 'PENDING',
        });

        if (!existingPending) {
          await db.collection('accountRequests').insertOne({
            userEmail: cleanPlayerEmail,
            userName: user.username || deposit.username,
            gameTitle: targetGame,
            gameId: deposit.gameId || '',
            transferAmount: 0,
            initialDepositAmount: deposit.amount,
            creditedSC,
            status: 'PENDING',
            source: 'auto_from_approved_deposit',
            depositId: deposit._id.toString(),
            notes: `Auto-generated from approved deposit #${deposit._id.toString()} ($${deposit.amount} USD). Please create ${targetGame} game credentials for player.`,
            createdAt: new Date(),
          });

          await db.collection('notifications').insertOne({
            userId: user._id,
            title: `🎮 ${targetGame} Account Creation In Progress!`,
            message: `Your deposit was approved! Because you don't have a ${targetGame} game account yet, our staff desk has automatically queued your account creation. You will receive your game login credentials shortly!`,
            type: 'account_request',
            read: false,
            createdAt: new Date(),
          });
        }
      }

      // 5. Check Referral Bonus Engine (Dynamic % from admin settings on friend's first deposit!)
      if (user.referredBy) {
        // Confirm this is truly their first approved deposit
        const priorApprovedCount = await depositsCol.countDocuments({
          userId: deposit.userId,
          status: 'approved',
          _id: { $ne: deposit._id },
        });

        const isFirstDeposit = priorApprovedCount === 0 && !user.referralBonusAwarded;

        if (isFirstDeposit) {
          // Fetch dynamic system settings
          const sysSettings = await db.collection('system_settings').findOne({ key: 'general' });
          const refBonusPercent = Number(sysSettings?.referralBonusPercent ?? sysSettings?.referralBonusPercentage ?? 50);

          // Find referrer by username or referralCode
          const cleanRef = (user.referredBy || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const referrer = await usersCol.findOne({
            $or: [
              { username: { $regex: `^${cleanRef}$`, $options: 'i' } },
              { referralCode: { $regex: `^${cleanRef}$`, $options: 'i' } },
            ],
          });

          if (referrer && referrer._id.toString() !== user._id.toString()) {
            const bonusAmount = Number(((deposit.amount * refBonusPercent) / 100).toFixed(2));

            if (bonusAmount > 0) {
              const oldRefBal = Number((referrer.balance !== undefined ? referrer.balance : (referrer.balanceSC || 0)).toFixed(2));
              const newRefBal = Number((oldRefBal + bonusAmount).toFixed(2));

              // 1. Directly add bonus amount to referrer's wallet
              await usersCol.updateOne(
                { _id: referrer._id },
                {
                  $inc: {
                    balance: bonusAmount,
                    balanceSC: bonusAmount,
                    totalReferralBonusEarned: bonusAmount,
                    affiliateCommissionsEarned: bonusAmount,
                  },
                }
              );

              // 2. Write immutable ledger record for referrer
              await ledgerCol.insertOne({
                userId: referrer._id.toString(),
                username: referrer.username,
                type: 'referral_bonus',
                currency: 'USD',
                amount: bonusAmount,
                balanceBefore: oldRefBal,
                balanceAfter: newRefBal,
                performedBy: session.username || 'System',
                staffRole: session.role || 'System',
                referenceId: depositId,
                notes: `${refBonusPercent}% referral bonus from friend @${user.username}'s first approved deposit ($${deposit.amount})`,
                createdAt: new Date(),
              });

              // 3. Send celebratory in-app notification to referrer
              await db.collection('notifications').insertOne({
                userId: referrer._id,
                title: '🎁 Referral Bonus Received!',
                message: `Congratulations! Your referred friend @${user.username} made their first deposit of $${Number(deposit.amount).toFixed(2)}. You received a ${refBonusPercent}% referral bonus of +$${bonusAmount.toFixed(2)} USD added directly to your wallet!`,
                type: 'referral_bonus',
                read: false,
                createdAt: new Date(),
              });

              // Mark referral bonus as awarded for this user
              await usersCol.updateOne(
                { _id: user._id },
                { $set: { referralBonusAwarded: true, firstDepositMade: true } }
              );
            }
          }
        }
      }

      // Send confirmation email
      sendEmail({
        to: user.email,
        subject: `Deposit Confirmed: $${creditedSC} credited to your Zorra Royals wallet!`,
        html: `<p>Hi ${user.username}, your deposit of $${deposit.amount} via ${deposit.methodName} was verified and $${creditedSC} USD was credited to your account. Best of luck at the games!</p>`,
      }).catch(() => {});

      return NextResponse.json({ success: true, message: `Deposit approved! Credited $${creditedSC} to ${user.username}.` });
    } else if (action === 'reject') {
      const reason = rejectReason?.trim() || body.rejectionReason?.trim() || 'Payment receipt could not be verified in ledger.';

      await depositsCol.updateOne(
        { _id: deposit._id },
        {
          $set: {
            status: 'rejected',
            rejectReason: reason,
            rejectionReason: reason,
            adminNote: reason,
            processedBy: `${session.username} (${session.role})`,
            updatedAt: new Date(),
          },
        }
      );

      // Notification to user with reason
      await db.collection('notifications').insertOne({
        userId: user._id,
        title: '❌ Deposit Request Declined',
        message: `Your deposit of $${Number(deposit.amount).toFixed(2)} via ${deposit.methodName} could not be approved. Reason: ${reason}. Please contact 24/7 VIP Concierge if you need assistance.`,
        type: 'deposit_rejected',
        read: false,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: 'Deposit rejected.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
