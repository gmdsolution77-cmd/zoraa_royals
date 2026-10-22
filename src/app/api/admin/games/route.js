import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const db = await getDb();
    const games = await db.collection('games').find().sort({ createdAt: -1 }).toArray();
    return Response.json({ success: true, games });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'games')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { action, gameData, gameId } = await req.json();
    const db = await getDb();

    if (action === 'toggle_active') {
      const game = await db.collection('games').findOne({ gameId });
      if (!game) return Response.json({ success: false, error: 'Game not found' }, { status: 404 });

      await db.collection('games').updateOne(
        { gameId },
        { $set: { isActive: !game.isActive } }
      );
      return Response.json({ success: true, message: 'Game status updated' });
    }

    if (action === 'toggle_featured') {
      const game = await db.collection('games').findOne({ gameId });
      if (!game) return Response.json({ success: false, error: 'Game not found' }, { status: 404 });

      await db.collection('games').updateOne(
        { gameId },
        { $set: { isFeatured: !game.isFeatured } }
      );
      return Response.json({ success: true, message: 'Game featured status updated' });
    }

    if (action === 'create') {
      if (!gameData.gameId || !gameData.title) {
        return Response.json({ success: false, error: 'gameId and title are required' }, { status: 400 });
      }

      await db.collection('games').insertOne({
        ...gameData,
        isActive: true,
        createdAt: new Date(),
      });
      return Response.json({ success: true, message: 'Game added successfully' });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
