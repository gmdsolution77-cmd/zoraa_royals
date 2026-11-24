import { getDb, initDb, toIdQuery } from '@/lib/mongodb';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { notifyPlayer } from '@/lib/notify';
import { syncRequestCardStatusInChat, postConciergeReplyToPlayerChat } from '@/lib/adminChatRequests';

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

      await syncRequestCardStatusInChat(db, {
        requestId: loadReq._id.toString(),
        status: 'approved',
        updates: {
          processedBy: session.username,
          processedAt: new Date().toISOString(),
        },
      });

      // 3. Ledger record
      await db.collection('ledger').insertOne({
        userId: user._id,
        type: 'game_load',
        amount: -loadReq.amount,
        description: `Loaded $${loadReq.amount.toFixed(2)} to ${loadReq.gameName} (Username: ${loadReq.gameUsername})`,
        createdAt: new Date(),
      });

      notifyPlayer({
        userId: user._id.toString(),
        userEmail: user.email,
        username: user.username,
        title: '✅ Game Credits Loaded Successfully!',
        message: `$${loadReq.amount.toFixed(2)} has been loaded into your ${loadReq.gameName} account (${loadReq.gameUsername}) and deducted from your balance. Good luck!`,
        type: 'game_load',
        data: { url: '/games' },
      });

      const gAcc = await db.collection('gameAccounts').findOne({
        userEmail: loadReq.clientEmail,
        gameTitle: new RegExp(`^${String(loadReq.gameName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        status: { $in: ['READY', 'ready', 'active'] },
      });
      const loadLines = [
        `✅ $${loadReq.amount.toFixed(2)} SC loaded into your ${loadReq.gameName} account!`,
        '',
        `🎮 Platform: ${loadReq.gameName}`,
        `👤 Game ID: ${loadReq.gameUsername || gAcc?.username || '—'}`,
      ];
      if (gAcc?.password) {
        loadLines.push(`🔑 Password: ${gAcc.password}`);
      }
      loadLines.push('', '— Zorra Royals VIP Concierge');
      await postConciergeReplyToPlayerChat(db, {
        userId: user._id.toString(),
        userEmail: user.email,
        username: user.username,
        text: loadLines.join('\n'),
        agentName: session.username,
      });

      try {
        const { publishAccountRequestUpdated } = await import('@/lib/realtimePublish');
        publishAccountRequestUpdated({
          requestId: loadReq._id.toString(),
          status: 'READY',
          gameTitle: loadReq.gameName,
          userEmail: loadReq.clientEmail,
          userId: user._id.toString(),
          transferAmount: loadReq.amount,
        });
      } catch {}

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

      await syncRequestCardStatusInChat(db, {
        requestId: loadReq._id.toString(),
        status: 'rejected',
        updates: {
          rejectReason: reason,
          processedBy: session.username,
          processedAt: new Date().toISOString(),
        },
      });

      notifyPlayer({
        userId: user._id.toString(),
        userEmail: user.email,
        username: user.username,
        title: '❌ Game Load Request Declined',
        message: `Your request to load $${loadReq.amount.toFixed(2)} into ${loadReq.gameName} (${loadReq.gameUsername}) was rejected: "${reason}". No funds were deducted.`,
        type: 'alert',
        data: { url: '/games' },
      });

      await postConciergeReplyToPlayerChat(db, {
        userId: user._id.toString(),
        userEmail: user.email,
        username: user.username,
        text: `⚠️ Your $${loadReq.amount.toFixed(2)} SC load for ${loadReq.gameName} was declined.\n\nReason: ${reason}\n\n— Zorra Royals VIP Concierge`,
        agentName: session.username,
      });

      try {
        const { publishAccountRequestUpdated } = await import('@/lib/realtimePublish');
        publishAccountRequestUpdated({
          requestId: loadReq._id.toString(),
          status: 'REJECTED',
          gameTitle: loadReq.gameName,
          userEmail: loadReq.clientEmail,
          userId: user._id.toString(),
          reason,
        });
      } catch {}

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
