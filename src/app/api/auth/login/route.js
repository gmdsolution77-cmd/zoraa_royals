import { getDb, initDb } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await initDb();
    const body = await req.json();
    const id = (body.identifier || body.email || '').toLowerCase().trim();
    const password = body.password;

    if (!id || !password) {
      return Response.json({ success: false, error: 'Username/Email and password are required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({
      $or: [
        { email: id },
        { username: { $regex: new RegExp(`^${id}$`, 'i') } }
      ]
    });

    if (!user) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const hashToTest = user.password || user.passwordHash;
    const match = hashToTest ? await bcrypt.compare(password, hashToTest) : false;
    if (!match) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isBanned) {
      return Response.json({ success: false, error: 'Account suspended. Contact royal support.' }, { status: 403 });
    }

    const tokenPayload = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role || 'player',
      vipTier: user.vipTier || 'Bronze',
    };

    const token = signToken(tokenPayload);
    const cookieStore = await cookies();
    const referer = req.headers.get('referer') || '';
    const isStaff = user.role && user.role !== 'player';
    const isExplicitAdminPortal = referer.includes('/admin') || body.adminPortal === true;

    if (isExplicitAdminPortal) {
      if (!isStaff) {
        return Response.json({ success: false, error: 'Access Denied: Not authorized for administration.' }, { status: 403 });
      }
      // Independent cookie for admin portal: does NOT overwrite player session
      cookieStore.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 3600,
        path: '/',
        sameSite: 'lax',
      });
    } else {
      // Independent cookie for player: does NOT overwrite admin session
      cookieStore.set('zorra_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 3600,
        path: '/',
        sameSite: 'lax',
      });
    }

    const safeUser = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      vipTier: user.vipTier,
      balanceSC: user.balanceSC || 0,
      balanceGC: user.balanceGC || 0,
      freeplayClaimed: user.freeplayClaimed || false,
      streakDay: user.streakDay || 1,
    };

    return Response.json({ success: true, user: safeUser, token });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
