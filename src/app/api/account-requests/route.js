import { NextResponse } from 'next/server';
import { getDb, toIdQuery } from '@/lib/mongodb';
import { getSessionUser, ROLES } from '@/lib/auth';

// GET Account Requests
export async function GET(req) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    let email = searchParams.get('email');
    const status = searchParams.get('status');

    const isStaff = session && ['super_admin', 'operation_admin', 'financial_manager', 'coin_manager', 'chat_support'].includes(session.role);
    if (!email && session && !isStaff) {
      email = session.email;
    }

    const db = await getDb();
    const query = {};

    if (email) {
      query.userEmail = email.toLowerCase().trim();
    }
    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    const requests = await db
      .collection('accountRequests')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = requests.map(r => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      userEmail: r.userEmail,
      userName: r.userName || r.userEmail?.split('@')[0],
      gameTitle: r.gameTitle,
      gameId: r.gameId || '',
      status: (r.status || 'PENDING').toUpperCase(),
      gameAccountUsername: r.gameAccountUsername || '',
      gameAccountPassword: r.gameAccountPassword || '',
      username: r.gameAccountUsername || '',
      password: r.gameAccountPassword || '',
      transferAmount: Number(r.transferAmount || 0),
      source: r.source || 'player_request',
      initialDepositAmount: r.initialDepositAmount || null,
      depositId: r.depositId || null,
      notes: r.notes || '',
      rejectionReason: r.rejectionReason || r.rejectReason || '',
      createdAt: r.createdAt || new Date(),
    }));

    return NextResponse.json({
      success: true,
      accountRequests: formatted,
      requests: formatted,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST - User requests an account for a game
export async function POST(req) {
  try {
    const session = await getSessionUser();
    const body = await req.json();
    const userEmail = (session?.email || body.userEmail || '').toLowerCase().trim();
    const userName = session?.username || body.userName || userEmail.split('@')[0];
    const gameTitle = String(body.gameTitle || '').trim();
    const gameId = body.gameId || '';

    const transferAmount = Number(body.transferAmount || 0);

    if (!userEmail || !gameTitle) {
      return NextResponse.json({ success: false, message: 'Game title and user email are required.' }, { status: 400 });
    }

    const db = await getDb();
    const requestsCol = db.collection('accountRequests');
    const usersCol = db.collection('users');
    const ledgerCol = db.collection('ledger');

    const user = await usersCol.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const currentSC = Number(user.balanceSC || 0);
    const frozen = Math.max(0, Number(user.frozenBalance || 0));
    const available = Math.max(0, Number((currentSC - frozen).toFixed(2)));

    // Verify player is not trying to load more than available balance
    if (transferAmount > available) {
      return NextResponse.json({
        success: false,
        message: `Cannot load $${transferAmount.toFixed(2)} SC. You only have $${available.toFixed(2)} SC available ($${frozen.toFixed(2)} currently frozen in processing).`,
      }, { status: 400 });
    }

    // Check if player already has a PENDING request for this game
    const existingPending = await requestsCol.findOne({
      userEmail,
      gameTitle: new RegExp(`^${gameTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      status: 'PENDING',
    });

    if (existingPending) {
      return NextResponse.json({
        success: false,
        message: `You already have a pending load request for ${gameTitle} ($${Number(existingPending.transferAmount || 0).toFixed(2)} SC). Please wait for staff approval.`,
      }, { status: 400 });
    }

    // 1. FREEZE the coins immediately in user wallet so they cannot be spent elsewhere
    if (transferAmount > 0) {
      await usersCol.updateOne(
        { _id: user._id },
        { $inc: { frozenBalance: transferAmount } }
      );

      await ledgerCol.insertOne({
        userId: user._id.toString(),
        username: user.username,
        type: 'game_load_freeze',
        currency: 'SC',
        amount: transferAmount,
        balanceBefore: currentSC,
        balanceAfter: currentSC,
        frozenAmount: transferAmount,
        performedBy: 'player',
        referenceId: gameTitle,
        notes: `Frozen $${transferAmount.toFixed(2)} SC in escrow for loading into ${gameTitle}`,
        createdAt: new Date(),
      });
    }

    // Look up existing game account username if player already has an account for this game
    const existingGameAcc = await db.collection('gameAccounts').findOne({
      userEmail,
      gameTitle: new RegExp(`^${gameTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      status: 'READY',
    });

    const gameAccountUsername = body.gameUsername || body.gameAccountUsername || existingGameAcc?.username || null;

    // 2. Create the Load / Account Request
    const newRequest = {
      userEmail,
      userName,
      gameTitle,
      gameId,
      gameAccountUsername,
      transferAmount,
      status: 'PENDING',
      createdAt: new Date(),
    };

    const res = await requestsCol.insertOne(newRequest);

    return NextResponse.json({
      success: true,
      requestId: res.insertedId.toString(),
      message: `Load request for ${gameTitle} submitted! $${transferAmount.toFixed(2)} SC is frozen in escrow until staff approves or rejects.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT - Admin approves or cancels account request
export async function PUT(req) {
  try {
    const session = await getSessionUser();
    if (!session || !['super_admin', 'operation_admin', 'financial_manager', 'coin_manager', 'chat_support'].includes(session.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized staff action.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, username, password } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, message: 'ID and action are required.' }, { status: 400 });
    }

    const db = await getDb();
    const requestsCol = db.collection('accountRequests');
    const targetRequest = await requestsCol.findOne(toIdQuery(id));

    if (!targetRequest) {
      return NextResponse.json({ success: false, message: 'Request not found.' }, { status: 404 });
    }

    const usersCol = db.collection('users');
    const ledgerCol = db.collection('ledger');
    const cleanEmail = targetRequest.userEmail.toLowerCase().trim();
    const cleanTitle = targetRequest.gameTitle;
    const originalFrozen = Number(targetRequest.transferAmount || 0);
    const finalTransferAmount = body.transferAmount !== undefined && !isNaN(Number(body.transferAmount))
      ? Math.max(0, Number(body.transferAmount))
      : originalFrozen;

    if (action === 'approve') {
      const gameAccountsCol = db.collection('gameAccounts');

      // 1. Permanently deduct balance and clear frozen escrow
      const user = await usersCol.findOne({ email: cleanEmail });
      if (user) {
        const oldSC = Number(user.balanceSC || 0);
        const newSC = Number(Math.max(0, oldSC - finalTransferAmount).toFixed(2));

        const userUpdate = {};
        if (finalTransferAmount > 0) {
          userUpdate.balanceSC = -finalTransferAmount;
        }
        if (originalFrozen > 0) {
          userUpdate.frozenBalance = -originalFrozen;
        }

        if (Object.keys(userUpdate).length > 0) {
          await usersCol.updateOne(
            { _id: user._id },
            { $inc: userUpdate }
          );
        }

        if (finalTransferAmount > 0) {
          await ledgerCol.insertOne({
            userId: user._id.toString(),
            username: user.username,
            type: 'game_transfer',
            currency: 'SC',
            amount: -finalTransferAmount,
            balanceBefore: oldSC,
            balanceAfter: newSC,
            performedBy: session.username,
            staffRole: session.role,
            referenceId: targetRequest._id.toString(),
            notes: `Game account coin load into ${cleanTitle} (Account ID: ${username || targetRequest.userName}${originalFrozen !== finalTransferAmount ? ` - Admin adjusted from $${originalFrozen} to $${finalTransferAmount}` : ''})`,
            createdAt: new Date(),
          });
        }
      }

      // 2. Update request status to READY with final transfer amount
      await requestsCol.updateOne(
        { _id: targetRequest._id },
        {
          $set: {
            status: 'READY',
            transferAmount: finalTransferAmount,
            gameAccountUsername: username,
            gameAccountPassword: password,
            approvedBy: session.username,
            approvedAt: new Date(),
          },
        }
      );

      const rawUser = username || cleanEmail.split('@')[0];
      const cleanU = String(rawUser).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'royal';
      const finalUsername = String(username || `${cleanU}${Math.floor(100 + Math.random() * 900)}`).toLowerCase().replace(/\s+/g, '');
      const passPrefixes = ['Zr', 'Rz', 'Vip', 'Roy', 'Zor', 'Kng'];
      const prefix = passPrefixes[Math.floor(Math.random() * passPrefixes.length)];
      const finalPassword = password || `${prefix}@${Math.random().toString(36).substring(2, 5)}${Math.floor(1000 + Math.random() * 9000)}`;

      await gameAccountsCol.updateOne(
        { userEmail: cleanEmail, gameTitle: cleanTitle },
        {
          $set: {
            userEmail: cleanEmail,
            gameTitle: cleanTitle,
            username: finalUsername,
            password: finalPassword,
            status: 'READY',
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: `Coin load for ${cleanTitle} approved! $${transferAmount.toFixed(2)} SC deducted from player balance.`,
      });
    } else if (action === 'cancel' || action === 'reject') {
      const reason = body.reason || body.rejectionReason || 'Staff desk rejected request or platform currently unavailable.';

      // Unfreeze player's coins so they return to available balance
      if (transferAmount > 0) {
        const user = await usersCol.findOne({ email: cleanEmail });
        if (user) {
          await usersCol.updateOne(
            { _id: user._id },
            { $inc: { frozenBalance: -transferAmount } }
          );

          await ledgerCol.insertOne({
            userId: user._id.toString(),
            username: user.username,
            type: 'game_load_unfreeze',
            currency: 'SC',
            amount: transferAmount,
            balanceBefore: user.balanceSC,
            balanceAfter: user.balanceSC,
            performedBy: session.username,
            staffRole: session.role,
            referenceId: targetRequest._id.toString(),
            notes: `Game coin load rejected ($${transferAmount} SC unfrozen & returned): ${reason}`,
            createdAt: new Date(),
          });
        }
      }

      await requestsCol.updateOne(
        { _id: targetRequest._id },
        {
          $set: {
            status: 'REJECTED',
            rejectionReason: reason,
            cancelledBy: session.username,
            cancelledAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Request rejected. Coins unfrozen and reason note logged for player.',
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
