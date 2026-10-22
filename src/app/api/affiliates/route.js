import { NextResponse } from 'next/server';
import { getSessionUser, ROLES } from '@/lib/auth';
import { getDb, toIdQuery } from '@/lib/mongodb';

export async function GET(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const usersCol = db.collection('users');

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    // Admin view
    if (mode === 'admin' && session.role === ROLES.SUPER_ADMIN) {
      const topReferrers = await usersCol
        .find({ affiliateCommissionsEarned: { $gt: 0 } })
        .sort({ affiliateCommissionsEarned: -1 })
        .limit(50)
        .toArray();

      return NextResponse.json({
        success: true,
        affiliates: topReferrers.map(u => ({
          userId: u._id.toString(),
          username: u.username,
          referralCode: u.referralCode,
          commissionsEarned: u.affiliateCommissionsEarned || 0,
          commissionsUnpaid: u.affiliateCommissionsUnpaid || 0,
        })),
      });
    }

    // Player stats
    const user = await usersCol.findOne(toIdQuery(session.id || session.userId));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Fetch referral bonus % from settings
    const sysSettings = await db.collection('system_settings').findOne({ key: 'general' });
    const referralBonusPercent = Number(sysSettings?.referralBonusPercent ?? sysSettings?.referralBonusPercentage ?? 50);

    // Find all users referred by this player (by username or code)
    const refConditions = [{ referredBy: user.username }];
    if (user.referralCode) {
      refConditions.push({ referredBy: user.referralCode });
    }

    const referredUsers = await usersCol
      .find({ $or: refConditions })
      .project({ username: 1, createdAt: 1, totalDeposited: 1, firstDepositMade: 1, referralBonusAwarded: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    const activeDepositors = referredUsers.filter(u => (u.totalDeposited || 0) > 0 || u.firstDepositMade || u.referralBonusAwarded).length;
    const refCode = user.referralCode || user.username;

    return NextResponse.json({
      success: true,
      stats: {
        referralCode: refCode,
        referralBonusPercent,
        referralBonusTitle: sysSettings?.referralBonusTitle || 'FRIEND REFERRAL BONUS',
        referralBonusSubtitle: sysSettings?.referralBonusSubtitle || 'Earn instant % bonus directly into your wallet when friends join and make their first deposit!',
        referralLink: `/?ref=${refCode}`,
        totalReferrals: referredUsers.length,
        activeDepositors,
        commissionsEarned: Number(user.totalReferralBonusEarned || user.affiliateCommissionsEarned || 0),
        commissionsUnpaid: user.affiliateCommissionsUnpaid || 0,
        referees: referredUsers.map(r => ({
          username: r.username,
          joinedAt: r.createdAt,
          hasDeposited: (r.totalDeposited || 0) > 0 || !!r.firstDepositMade || !!r.referralBonusAwarded,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Claim Unpaid Affiliate Commission
export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const usersCol = db.collection('users');
    const ledgerCol = db.collection('ledger');

    const user = await usersCol.findOne(toIdQuery(session.id || session.userId));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const claimable = user.affiliateCommissionsUnpaid || 0;
    if (claimable <= 0) {
      return NextResponse.json({ success: false, error: 'No unpaid commission available to claim.' }, { status: 400 });
    }

    const oldSC = user.balanceSC || 0;
    const newSC = Number((oldSC + claimable).toFixed(2));

    await usersCol.updateOne(
      { _id: user._id },
      {
        $inc: { balanceSC: claimable },
        $set: { affiliateCommissionsUnpaid: 0 },
      }
    );

    // Ledger record
    await ledgerCol.insertOne({
      userId: user._id.toString(),
      username: user.username,
      type: 'referral_bonus',
      currency: 'SC',
      amount: claimable,
      balanceBefore: oldSC,
      balanceAfter: newSC,
      performedBy: 'player',
      notes: `Claimed ${claimable} SC affiliate commission into playable wallet`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${claimable} SC into your playable balance!`,
      claimedAmount: claimable,
      newBalance: newSC,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
