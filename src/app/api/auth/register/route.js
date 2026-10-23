import { getDb, initDb } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await initDb();
    const { username, email, password, referralCode, referredBy, otp } = await req.json();

    if (!username || !email || !password) {
      return Response.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    if (!otp) {
      return Response.json({ success: false, error: 'Email verification code (OTP) is required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = await getDb();
    const usersCol = db.collection('users');
    const otpsCol = db.collection('otps');

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();
    const cleanOtp = String(otp).trim();

    // 1. Verify OTP code
    const otpRecord = await otpsCol.findOne({ email: cleanEmail });
    if (!otpRecord) {
      return Response.json(
        { success: false, error: 'No verification code found for this email. Please request a new code.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await otpsCol.deleteOne({ _id: otpRecord._id });
      return Response.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpRecord.code !== cleanOtp) {
      await otpsCol.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      return Response.json(
        { success: false, error: 'Invalid verification code. Please check your email and try again.' },
        { status: 400 }
      );
    }

    // OTP verified! Delete record to prevent replay
    await otpsCol.deleteOne({ _id: otpRecord._id });

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

    // Dynamic signup freeplay amount (default $5.00 to match Player Paradise)
    const settings = await db.collection('system_settings').findOne({ key: 'general' });
    const signupBonus = Number(settings?.freeplayAmountSC ?? settings?.signupBonusAmount ?? 5.0);

    const newUser = {
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'player',
      vipTier: 'Bronze',
      balance: 0,
      balanceSC: 0,
      balanceGC: 10000,
      availableSpins: 0,
      referralCode: generatedReferralCode,
      referredBy: referrer ? referrer.username : null,
      totalReferralBonusEarned: 0,
      signupBonusClaimed: false,
      freeplayClaimed: false,
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
      message: `Welcome! Click 'GET FREEPLAY' in the lobby to claim your complimentary $${signupBonus.toFixed(2)} welcome bonus!`,
      type: 'bonus',
      read: false,
      createdAt: new Date(),
    });

    // Send royal welcome email asynchronously
    sendEmail({
      to: cleanEmail,
      subject: 'Welcome to Zorra Royals VIP Palace!',
      html: getWelcomeEmailTemplate(cleanUsername),
    }).catch((err) => console.error('[WELCOME EMAIL ERROR]', err));

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
