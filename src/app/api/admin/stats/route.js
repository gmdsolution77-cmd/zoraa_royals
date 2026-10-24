import { NextResponse } from 'next/server';
import { getSessionUser, ROLES } from '@/lib/auth';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    const authorizedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.OPERATION_ADMIN,
      ROLES.FINANCIAL_MANAGER,
      ROLES.COIN_MANAGER,
      ROLES.CHAT_SUPPORT,
    ];
    if (!session || !authorizedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized staff access.' }, { status: 403 });
    }

    await initDb();
    const db = await getDb();

    // 1. Players count
    const totalPlayers = (await db.collection('users').countDocuments({ role: ROLES.PLAYER })) || 0;

    // 2. Pending deposits and redemptions
    const pendingDeposits = (await db.collection('deposits').countDocuments({ status: 'pending' })) || 0;
    const pendingRedemptions = (await db.collection('redemptions').countDocuments({ status: 'pending' })) || 0;
    const pendingKyc = (await db.collection('kyc_requests').countDocuments({ status: 'pending' })) || 0;

    // 3. Deposit & Redemption financial aggregates
    let totalDeposited = 0;
    let totalRedeemed = 0;

    try {
      const depositStats = await db.collection('deposits').aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).toArray();
      totalDeposited = Number(depositStats[0]?.total) || 0;
    } catch {
      // Fallback manual sum
      const docs = await db.collection('deposits').find({ status: 'approved' }).toArray();
      totalDeposited = docs.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    }

    try {
      const redemptionStats = await db.collection('redemptions').aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).toArray();
      totalRedeemed = Number(redemptionStats[0]?.total) || 0;
    } catch {
      const docs = await db.collection('redemptions').find({ status: 'approved' }).toArray();
      totalRedeemed = docs.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    }

    const netGGR = Number((totalDeposited - totalRedeemed).toFixed(2)) || 0;

    // 4. Game Activity volume
    let totalWagers = 0;
    let totalPayouts = 0;
    let totalRounds = 0;

    try {
      const activityStats = await db.collection('game_activity').aggregate([
        {
          $group: {
            _id: null,
            totalBets: { $sum: '$betAmount' },
            totalWins: { $sum: '$winAmount' },
            totalRounds: { $sum: 1 },
          },
        },
      ]).toArray();
      totalWagers = Number(activityStats[0]?.totalBets) || 0;
      totalPayouts = Number(activityStats[0]?.totalWins) || 0;
      totalRounds = Number(activityStats[0]?.totalRounds) || 0;
    } catch {
      totalRounds = (await db.collection('game_activity').countDocuments({})) || 0;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPlayers,
        totalDeposited: Number(totalDeposited.toFixed(2)),
        totalRedeemed: Number(totalRedeemed.toFixed(2)),
        netGGR,
        pendingDeposits,
        pendingRedemptions,
        pendingKyc,
        totalWagers: Number(totalWagers.toFixed(2)),
        totalPayouts: Number(totalPayouts.toFixed(2)),
        totalRounds,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
