import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'users')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const users = await db.collection('users').find().sort({ createdAt: -1 }).toArray();

    const safeUsers = users.map(u => ({
      id: u._id,
      username: u.username,
      email: u.email,
      role: u.role || 'player',
      vipTier: u.vipTier || 'Bronze',
      balanceSC: u.balanceSC || 0,
      balanceGC: u.balanceGC || 0,
      isBanned: !!u.isBanned,
      isVerified: !!u.isVerified,
      createdAt: u.createdAt,
    }));

    return Response.json({ success: true, users: safeUsers });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'users')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { userId, action, role, vipTier } = await req.json();
    const db = await getDb();

    if (action === 'toggle_ban') {
      const user = await db.collection('users').findOne({ _id: userId });
      if (!user) return Response.json({ success: false, error: 'User not found' }, { status: 404 });

      const newBanned = !user.isBanned;
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { isBanned: newBanned } }
      );
      return Response.json({ success: true, message: `User ${newBanned ? 'banned' : 'unbanned'}` });
    }

    if (action === 'update_profile') {
      const updateDoc = {};
      if (role) updateDoc.role = role;
      if (vipTier) updateDoc.vipTier = vipTier;

      await db.collection('users').updateOne(
        { _id: userId },
        { $set: updateDoc }
      );
      return Response.json({ success: true, message: 'User updated successfully' });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
