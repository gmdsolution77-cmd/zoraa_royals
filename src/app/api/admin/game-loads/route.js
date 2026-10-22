import { getDb, initDb, toIdQuery } from '@/lib/mongodb';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'requests')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const loads = await db
      .collection('game_load_requests')
      .find()
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
    if (!session || !hasPermission(session.role, 'requests')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { requestId, action, rejectionReason } = await req.json();
    const db = await getDb();

    const query = toIdQuery(requestId);

    const loadReq = await db.collection('game_load_requests').findOne(query);
    if (!loadReq) {
      return Response.json({ success: false, error: 'Game load request not found' }, { status: 404 });
    }

    if (loadReq.status !== 'pending') {
      return Response.json({ success: false, error: `Request already ${loadReq.status}` }, { status: 400 });
    }

    const user = await db.collection('users').findOne({ email: loadReq.clientEmail });
    if (!user) {
      return Response.json({ success: false, error: 'Client user account not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const userBalance = user.balance !== undefined ? user.balance : (user.balanceSC || 0);
      if (userBalance < loadReq.amount) {
        return Response.json({
          success: false,
          error: `Client only has $${userBalance.toFixed(2)}, cannot deduct $${loadReq.amount.toFixed(2)}`,
        }, { status: 400 });
      }

      // 1. Deduct from client's wallet balance (both balance and balanceSC)
      await db.collection('users').updateOne(
        { email: loadReq.clientEmail },
        { $inc: { balance: -loadReq.amount, balanceSC: -loadReq.amount } }
      );

      // 2. Mark load request approved
      await db.collection('game_load_requests').updateOne(
        { _id: loadReq._id },
        {
          $set: {
            status: 'approved',
            processedBy: session.username,
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      // 3. Ledger record
      await db.collection('ledger').insertOne({
        userId: user._id,
        type: 'game_load',
        amount: -loadReq.amount,
        description: `Loaded $${loadReq.amount.toFixed(2)} to ${loadReq.gameName} (Username: ${loadReq.gameUsername})`,
        createdAt: new Date(),
      });

      // 4. Notification to user
      await db.collection('notifications').insertOne({
        userId: user._id,
        title: '✅ Game Credits Loaded Successfully!',
        message: `$${loadReq.amount.toFixed(2)} has been loaded into your ${loadReq.gameName} account (${loadReq.gameUsername}) and deducted from your balance. Good luck!`,
        type: 'game_load',
        read: false,
        createdAt: new Date(),
      });

      return Response.json({
        success: true,
        message: `Successfully loaded $${loadReq.amount.toFixed(2)} into ${loadReq.gameName} for ${loadReq.clientName}`,
      });
    } else if (action === 'reject') {
      const reason = rejectionReason?.trim() || 'Declined by administrator';

      await db.collection('game_load_requests').updateOne(
        { _id: loadReq._id },
        {
          $set: {
            status: 'rejected',
            rejectionReason: reason,
            processedBy: session.username,
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      // Notification to user with exact reason
      await db.collection('notifications').insertOne({
        userId: user._id,
        title: '❌ Game Load Request Declined',
        message: `Your request to load $${loadReq.amount.toFixed(2)} into ${loadReq.gameName} (${loadReq.gameUsername}) was rejected: "${reason}". No funds were deducted.`,
        type: 'alert',
        read: false,
        createdAt: new Date(),
      });

      return Response.json({
        success: true,
        message: `Load request declined with reason: "${reason}"`,
      });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
