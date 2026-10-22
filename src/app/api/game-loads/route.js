import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const db = await getDb();
    const loads = await db
      .collection('game_load_requests')
      .find({
        $or: [
          { userId: session.userId },
          { clientEmail: session.email },
          { userEmail: session.email },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ success: true, loads });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { gameId, gameUsername, amount } = await req.json();

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return Response.json({ success: false, error: 'Invalid load amount' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: session.email });
    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let finalGameUsername = (gameUsername || '').trim();
    if (!finalGameUsername) {
      const cleanEmail = (user.email || session.email).toLowerCase().trim();
      const existingGameAcc = await db.collection('gameAccounts').findOne({
        userEmail: cleanEmail,
        status: 'READY',
      });
      if (existingGameAcc) {
        finalGameUsername = existingGameAcc.username;
      }
    }

    if (!finalGameUsername) {
      return Response.json({ success: false, error: 'Active game account username is required to load credits.' }, { status: 400 });
    }

    const totalBalance = user.balance !== undefined ? parseFloat(user.balance) : (parseFloat(user.balanceSC) || 0);

    // Calculate existing frozen withdrawals
    const pendingWithdrawalsList = await db.collection('withdrawals').find({
      $or: [{ userId: user._id }, { userEmail: user.email }],
      status: 'pending',
    }).toArray();

    const existingFrozen = pendingWithdrawalsList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const availableBalance = Math.max(0, +(totalBalance - existingFrozen).toFixed(2));

    if (numAmount > availableBalance) {
      return Response.json({
        success: false,
        error: `Insufficient available balance. You have $${availableBalance.toFixed(2)} available to play ($${existingFrozen.toFixed(2)} is currently frozen in pending withdrawal review).`,
      }, { status: 400 });
    }

    const game = await db.collection('games').findOne({ gameId });
    const gameName = game?.title || gameId;

    const loadRequest = {
      userId: user._id,
      clientName: user.username,
      clientEmail: user.email,
      gameId,
      gameName,
      gameUsername: finalGameUsername,
      amount: numAmount,
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      rejectionReason: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('game_load_requests').insertOne(loadRequest);

    // Notification to user
    await db.collection('notifications').insertOne({
      userId: user._id,
      title: '🎮 Game Load Request Submitted',
      message: `Your request to load $${numAmount.toFixed(2)} into ${gameName} (Account: ${finalGameUsername}) is submitted. Admin will process and load your game credits shortly.`,
      type: 'game_load',
      read: false,
      createdAt: new Date(),
    });

    return Response.json({
      success: true,
      message: `Request to load $${numAmount.toFixed(2)} into ${gameName} submitted successfully.`,
      requestId: result.insertedId,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
