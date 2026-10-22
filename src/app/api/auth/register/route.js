import { getDb, initDb } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await initDb();
    const { username, email, password, referralCode, referredBy } = await req.json();

    if (!username || !email || !password) {
      return Response.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = await getDb();
    const usersCol = db.collection('users');

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    const existing = await usersCol.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (existing) {
      return Response.json({ success: false, error: 'Username or email already registered' }, { status: 400 });
    }

    // Lookup referrer if code provided
    const refCodeInput = (referralCode || referredBy || '').toString().trim();
    let referrer = null;
    if (refCodeInput) {
      referrer = await usersCol.findOne({
        $or: [
          { username: { $regex: `^${refCodeInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
          { referralCode: { $regex: `^${refCodeInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        ]
      });
    }

    // Generate unique personal referral code for the new user
    const unamePrefix = cleanUsername.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'VIP';
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedReferralCode = `${unamePrefix}${randSuffix}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get signup bonus from settings ($3 default)
    const settings = await db.collection('system_settings').findOne({ key: 'general' });
    const signupBonus = settings?.signupBonusAmount !== undefined ? settings.signupBonusAmount : 3.0;

    const newUser = {
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'player',
      vipTier: 'Bronze',
      balance: parseFloat(signupBonus),
      balanceSC: parseFloat(signupBonus),
      balanceGC: 10000,
      referralCode: generatedReferralCode,
      referredBy: referrer ? referrer.username : null,
      totalReferralBonusEarned: 0,
      signupBonusClaimed: true,
      firstDepositMade: false,
      isVerified: false,
      createdAt: new Date(),
    };

    const result = await usersCol.insertOne(newUser);
    const userId = result.insertedId;

    // Notify referrer that a friend joined
    if (referrer) {
      await db.collection('notifications').insertOne({
        userId: referrer._id,
        title: '🤝 New Friend Joined!',
        message: `Your friend @${cleanUsername} just registered using your referral! When they make their first deposit, you will receive a royal bonus reward directly into your wallet balance.`,
        type: 'referral',
        read: false,
        createdAt: new Date(),
      });
    }

    // Create welcome notification
    await db.collection('notifications').insertOne({
      userId,
      title: '👑 Welcome to Zorra Royals!',
      message: `Your account has been credited with $${signupBonus.toFixed(2)} instant signup freeplay! Enjoy VIP Sweepstakes gaming!`,
      type: 'bonus',
      read: false,
      createdAt: new Date(),
    });

    // Record welcome bonus in ledger
    await db.collection('ledger').insertOne({
      userId,
      type: 'signup_bonus',
      amount: parseFloat(signupBonus),
      description: 'One-Time Signup Freeplay Bonus',
      createdAt: new Date(),
    });

    const tokenPayload = {
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      role: 'player',
      vipTier: 'Bronze',
    };

    const token = signToken(tokenPayload);
    const cookieStore = await cookies();
    cookieStore.set('zorra_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 3600,
      path: '/',
    });

    return Response.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        username: cleanUsername,
        role: 'player',
        vipTier: 'Bronze',
        balance: parseFloat(signupBonus),
        balanceSC: parseFloat(signupBonus),
        referralCode: generatedReferralCode,
        referredBy: referrer ? referrer.username : null,
        firstDepositMade: false,
        signupBonusClaimed: true,
      },
      token,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
