import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const referer = req.headers.get('referer') || '';
    const isAdminQuery = searchParams.get('admin') === 'true' || referer.includes('/admin');

    const session = await getSessionUser(isAdminQuery ? 'admin' : 'player');
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false, user: null });
    }

    const db = await getDb();
    const uid = session.userId || session.id;
    const userOr = [];
    if (uid) {
      userOr.push({ _id: uid });
      if (typeof uid === 'string' && /^[0-9a-fA-F]{24}$/.test(uid.trim())) {
        try {
          userOr.push({ _id: new ObjectId(uid.trim()) });
        } catch {}
      }
    }
    if (session.email) {
      userOr.push({ email: session.email.toLowerCase().trim() });
    }

    const user = await db.collection('users').findOne({
      $or: userOr.length > 0 ? userOr : [{ _id: null }],
    });

    if (!user) {
      return NextResponse.json({ success: false, authenticated: false, user: null });
    }

    if (user.isBanned) {
      return NextResponse.json({ success: false, authenticated: false, user: null, error: 'Account suspended.' });
    }

    // Direct escrow balance on user document
    const userDocFrozen = Math.max(0, Number(user.frozenBalance || 0));

    // Also check pending redemptions in DB as fail-safe
    const pendingRedemptions = await db.collection('redemptions').find({
      $or: [{ userId: user._id.toString() }, { userEmail: user.email }],
      status: { $in: ['pending', 'pending_coin'] },
    }).toArray();
    const redemptionsFrozen = pendingRedemptions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const frozenBalance = Number(Math.max(userDocFrozen, redemptionsFrozen).toFixed(2));
    const balanceSC = Number((user.balanceSC !== undefined ? user.balanceSC : (user.balance || 0)).toFixed(2));
    const availableBalance = Math.max(0, Number((balanceSC - frozenBalance).toFixed(2)));

    // Ensure user has a personal referral code
    let userReferralCode = user.referralCode;
    if (!userReferralCode) {
      const unamePrefix = (user.username || 'VIP').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'VIP';
      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      userReferralCode = `${unamePrefix}${randSuffix}`;
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { referralCode: userReferralCode } }
      );
    }

    const safeUser = {
      id: user._id.toString(),
      userId: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'player',
      vipTier: user.vipTier || 'Bronze',
      balance: balanceSC,
      balanceSC: balanceSC,
      balanceGC: Number(user.balanceGC || 0),
      frozenBalance: frozenBalance,
      availableBalance: availableBalance,
      availableSC: availableBalance,
      referralCode: userReferralCode,
      referredBy: user.referredBy || null,
      totalReferralBonusEarned: Number(user.totalReferralBonusEarned || user.affiliateCommissionsEarned || 0),
      firstDepositMade: Boolean(user.firstDepositMade || (user.totalDeposited && user.totalDeposited > 0)),
      welcomeBonusClaimed: Boolean(user.welcomeBonusClaimed || (user.totalDeposited && user.totalDeposited > 0)),
      signupBonusClaimed: !!user.signupBonusClaimed,
      isVerified: user.isVerified || false,
      kycStatus: user.kycStatus || 'none',
      totalDeposited: Number(user.totalDeposited || 0),
      totalRedeemed: Number(user.totalRedeemed || 0),
    };

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: safeUser,
    });
  } catch (err) {
    return NextResponse.json({ success: false, authenticated: false, error: err.message }, { status: 500 });
  }
}
