import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, deposits: [], withdrawals: [], gameLoads: [], timeline: [] });
    }

    const db = await getDb();
    const cleanEmail = session.email ? session.email.toLowerCase().trim() : '';
    const userId = session.userId || session.id;

    const userQuery = {
      $or: [
        { userId: userId },
        { userEmail: cleanEmail },
        { clientEmail: cleanEmail },
        { email: cleanEmail },
      ].filter(q => Object.values(q)[0]),
    };

    const [deposits, redemptions, legacyWithdrawals, accountReqLoads, legacyLoads] = await Promise.all([
      db.collection('deposits').find(userQuery).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection('redemptions').find(userQuery).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection('withdrawals').find(userQuery).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection('accountRequests').find({
        ...userQuery,
        transferAmount: { $gt: 0 },
      }).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection('game_load_requests').find(userQuery).sort({ createdAt: -1 }).limit(50).toArray(),
    ]);

    // Format deposits
    const formattedDeposits = deposits.map(d => ({
      id: d._id.toString(),
      kind: 'deposit',
      title: `Deposit via ${d.methodName || 'Payment'}`,
      amount: Number(d.amount || 0),
      bonusAmount: Number(d.bonusSC || d.bonusAmount || 0),
      totalCredited: Number(d.creditedSC || d.totalSC || d.amount || 0),
      status: d.status,
      rejectionReason: d.rejectReason || d.rejectionReason || d.adminNote || '',
      rejectReason: d.rejectReason || d.rejectionReason || d.adminNote || '',
      adminNote: d.rejectReason || d.rejectionReason || d.adminNote || '',
      createdAt: d.createdAt,
    }));

    // Format withdrawals / redemptions
    const formattedWithdrawals = [
      ...redemptions.map(r => ({
        id: r._id.toString(),
        kind: 'withdrawal',
        title: `Prize Cashout via ${r.payoutMethod || 'Cashout'}`,
        amount: Number(r.amount || 0),
        status: r.status,
        stage: r.stage || (r.status === 'pending_coin' ? 'coin_verification' : 'finance_payout'),
        rejectionReason: r.rejectReason || r.coinRejectReason || r.financeRejectReason || r.adminNote || '',
        destinationAddress: r.destinationAddress,
        createdAt: r.createdAt,
      })),
      ...legacyWithdrawals.map(w => ({
        id: w._id.toString(),
        kind: 'withdrawal',
        title: `Withdrawal via ${w.payoutMethod || 'Cashout'}`,
        amount: Number(w.amount || 0),
        status: w.status,
        stage: w.status === 'pending' ? 'review' : w.status,
        rejectionReason: w.rejectionReason || w.rejectReason || w.adminNote || '',
        destinationAddress: w.destinationAddress,
        createdAt: w.createdAt,
      })),
    ];

    // Format game coin loads
    const formattedLoads = [
      ...accountReqLoads.map(g => ({
        id: g._id.toString(),
        kind: 'game_load',
        title: `Load ${g.gameTitle}`,
        amount: Number(g.transferAmount || 0),
        gameName: g.gameTitle,
        gameUsername: g.gameAccountUsername || g.userName,
        status: (g.status || 'PENDING').toLowerCase(),
        rejectionReason: g.rejectionReason || g.rejectReason || g.adminNote || g.notes || '',
        rejectReason: g.rejectionReason || g.rejectReason || g.adminNote || g.notes || '',
        adminNote: g.rejectionReason || g.rejectReason || g.adminNote || g.notes || '',
        createdAt: g.createdAt,
      })),
      ...legacyLoads.map(g => ({
        id: g._id.toString(),
        kind: 'game_load',
        title: `Load ${g.gameName}`,
        amount: Number(g.amount || 0),
        gameName: g.gameName,
        gameUsername: g.gameUsername,
        status: g.status,
        rejectionReason: g.rejectionReason || g.rejectReason || g.adminNote || '',
        rejectReason: g.rejectionReason || g.rejectReason || g.adminNote || '',
        adminNote: g.rejectionReason || g.rejectReason || g.adminNote || '',
        createdAt: g.createdAt,
      })),
    ];

    // Combined unified timeline
    const timeline = [...formattedDeposits, ...formattedWithdrawals, ...formattedLoads].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return NextResponse.json({
      success: true,
      deposits: formattedDeposits,
      withdrawals: formattedWithdrawals,
      gameLoads: formattedLoads,
      timeline,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
