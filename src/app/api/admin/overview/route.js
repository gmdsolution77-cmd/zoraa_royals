import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'overview')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const usersCount = await db.collection('users').countDocuments();
    const deposits = await db.collection('deposits').find().toArray();
    const withdrawals = await db.collection('withdrawals').find().toArray();
    const pendingAccountRequests = await db.collection('account_requests').countDocuments({ status: 'pending' });

    const totalDepositsUSD = deposits
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const totalWithdrawalsUSD = withdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const pendingDepositsCount = deposits.filter(d => d.status === 'pending').length;
    const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

    return Response.json({
      success: true,
      stats: {
        totalUsers: usersCount,
        totalDepositsUSD,
        totalWithdrawalsUSD,
        pendingDepositsCount,
        pendingWithdrawalsCount,
        pendingAccountRequests,
        netRevenue: totalDepositsUSD - totalWithdrawalsUSD,
      },
      recentDeposits: deposits.slice(0, 8),
      recentWithdrawals: withdrawals.slice(0, 8),
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
