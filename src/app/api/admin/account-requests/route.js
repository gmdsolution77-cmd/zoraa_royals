import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'account_requests')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const requests = await db.collection('account_requests').find().sort({ createdAt: -1 }).toArray();
    const accounts = await db.collection('game_accounts').find().sort({ createdAt: -1 }).toArray();

    return Response.json({ success: true, requests, accounts });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'account_requests')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { requestId, platformUsername, platformPassword, platformPin, gameUrl, action } = await req.json();
    const db = await getDb();

    const request = await db.collection('account_requests').findOne({ _id: requestId });
    if (!request) {
      return Response.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    if (action === 'assign') {
      if (!platformUsername || !platformPassword) {
        return Response.json({ success: false, error: 'Platform username and password are required' }, { status: 400 });
      }

      // Create / upsert in game_accounts
      const newAccount = {
        userId: request.userId,
        userEmail: request.userEmail,
        gameId: request.gameId,
        gameTitle: request.gameTitle,
        username: platformUsername.trim(),
        password: platformPassword.trim(),
        pin: platformPin ? platformPin.trim() : '',
        gameUrl: gameUrl || 'https://orionstars.vip',
        status: 'active',
        assignedBy: session.username,
        createdAt: new Date(),
      };

      await db.collection('game_accounts').insertOne(newAccount);

      await db.collection('account_requests').updateOne(
        { _id: requestId },
        {
          $set: {
            status: 'fulfilled',
            assignedUsername: platformUsername.trim(),
            fulfilledBy: session.username,
            fulfilledAt: new Date(),
          },
        }
      );

      // Notify player
      await db.collection('notifications').insertOne({
        userId: request.userId,
        title: `🔑 ${request.gameTitle} Credentials Ready!`,
        message: `Your gaming account has been created! Username: "${platformUsername.trim()}". Open your Game Vault to view credentials and start playing!`,
        type: 'game_account',
        read: false,
        createdAt: new Date(),
      });

      return Response.json({ success: true, message: 'Game credentials assigned successfully' });
    } else if (action === 'reject') {
      await db.collection('account_requests').updateOne(
        { _id: requestId },
        {
          $set: {
            status: 'declined',
            fulfilledBy: session.username,
            fulfilledAt: new Date(),
          },
        }
      );
      return Response.json({ success: true, message: 'Request declined' });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
