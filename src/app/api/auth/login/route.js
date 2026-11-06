import { getDb, initDb } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await initDb();
    const body = await req.json();
    const rawId = String(body.identifier || body.email || '').trim();
    const password = body.password;

    if (!rawId || !password) {
      return Response.json({ success: false, error: 'Username/Email and password are required' }, { status: 400 });
    }

    const db = await getDb();
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Must match forgot-password / register lookup: emails are case-insensitive, usernames case-insensitive
    let user;
    if (rawId.includes('@')) {
      const emailLower = rawId.toLowerCase();
      user = await db.collection('users').findOne({
        $or: [{ email: emailLower }, { email: { $regex: new RegExp(`^${esc(emailLower)}$`, 'i') } }],
      });
    } else {
      user = await db.collection('users').findOne({
        username: { $regex: new RegExp(`^${esc(rawId)}$`, 'i') },
      });
    }

    if (!user) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const hashToTest = user.password || user.passwordHash;
    let match = false;
    if (hashToTest) {
      const looksHashed = typeof hashToTest === 'string' && hashToTest.startsWith('$2');
      if (looksHashed) {
        match = await bcrypt.compare(password, hashToTest);
      } else {
        // Legacy / imported accounts: plain text or non-bcrypt hash — try direct compare, then bcrypt if it was stored wrong
        match = hashToTest === password || (await bcrypt.compare(password, hashToTest));
      }
    }
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
