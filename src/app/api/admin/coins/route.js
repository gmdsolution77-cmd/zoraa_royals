import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'coins_allotment')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { targetEmail, action = 'credit', amountSC = 0, amountGC = 0, reason } = await req.json();

    if (!targetEmail) {
      return Response.json({ success: false, error: 'Target player email is required' }, { status: 400 });
    }

    const sc = parseFloat(amountSC) || 0;
    const gc = parseInt(amountGC, 10) || 0;

    if (sc <= 0 && gc <= 0) {
      return Response.json({ success: false, error: 'Please enter a positive coin amount' }, { status: 400 });
    }

    const db = await getDb();
    const targetUser = await db.collection('users').findOne({ email: targetEmail.toLowerCase().trim() });

    if (!targetUser) {
      return Response.json({ success: false, error: 'Player account not found' }, { status: 404 });
    }

    const multiplier = action === 'debit' ? -1 : 1;
    const deltaSC = sc * multiplier;
    const deltaGC = gc * multiplier;

    await db.collection('users').updateOne(
      { email: targetUser.email },
      { $inc: { balanceSC: deltaSC, balanceGC: deltaGC } }
    );

    // Ledger record
    await db.collection('ledger').insertOne({
      userId: targetUser._id,
      type: action === 'debit' ? 'admin_deduction' : 'admin_allotment',
      amountSC: deltaSC,
      amountGC: deltaGC,
      description: `Staff ${action.toUpperCase()}: ${reason || 'Manual coin adjustment'} by ${session.username}`,
      createdAt: new Date(),
    });

    // Notify player
    await db.collection('notifications').insertOne({
      userId: targetUser._id,
      title: action === 'debit' ? '📉 Balance Adjustment' : '👑 Royal Coin Allotment!',
      message: `Your balance was ${action === 'debit' ? 'debited' : 'credited'} by ${sc > 0 ? '$' + sc.toFixed(2) + ' SC ' : ''}${gc > 0 ? gc.toLocaleString() + ' GC' : ''}. Reason: ${reason || 'VIP Concierge adjustment'}.`,
      type: 'bonus',
      read: false,
      createdAt: new Date(),
    });

    return Response.json({
      success: true,
      message: `Successfully ${action === 'debit' ? 'debited' : 'allotted'} ${sc} SC and ${gc} GC for ${targetUser.username}`,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
