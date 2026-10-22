import { getDb, initDb, toIdQuery } from '@/lib/mongodb';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'finance')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const withdrawals = await db.collection('withdrawals').find().sort({ createdAt: -1 }).toArray();
    return Response.json({ success: true, withdrawals });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'finance')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { withdrawalId, action, transactionRef, rejectionReason } = await req.json();
    const db = await getDb();

    const query = toIdQuery(withdrawalId);

    const withdrawal = await db.collection('withdrawals').findOne(query);
    if (!withdrawal) {
      return Response.json({ success: false, error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return Response.json({ success: false, error: `Withdrawal already ${withdrawal.status}` }, { status: 400 });
    }

    if (action === 'approve') {
      // 1. Permanently deduct from user's wallet balance upon approval
      await db.collection('users').updateOne(
        { email: withdrawal.userEmail },
        { $inc: { balance: -withdrawal.amount } }
      );

      await db.collection('withdrawals').updateOne(
        { _id: withdrawal._id },
        {
          $set: {
            status: 'approved',
            transactionRef: transactionRef || '',
            processedBy: session.username,
            processedAt: new Date(),
          },
        }
      );

      await db.collection('ledger').insertOne({
        userId: withdrawal.userId,
        type: 'withdrawal_completed',
        amount: -withdrawal.amount,
        description: `Cashout Approved & Paid: $${withdrawal.amount.toFixed(2)} USD via ${withdrawal.payoutMethod}`,
        createdAt: new Date(),
      });

      await db.collection('notifications').insertOne({
        userId: withdrawal.userId,
        title: '💸 Payout Approved & Sent!',
        message: `Your cashout for $${withdrawal.amount.toFixed(2)} USD has been approved and sent via ${withdrawal.payoutMethod} to ${withdrawal.destinationAddress}. Ref: ${transactionRef || 'N/A'}.`,
        type: 'withdrawal',
        read: false,
        createdAt: new Date(),
      });

      return Response.json({ success: true, message: 'Withdrawal marked approved and balance deducted' });
    } else if (action === 'reject') {
      const reason = rejectionReason || 'Payment declined by cashier';

      // Frozen hold is released automatically since withdrawal is no longer 'pending'
      await db.collection('withdrawals').updateOne(
        { _id: withdrawal._id },
        {
          $set: {
            status: 'rejected',
            rejectionReason: reason,
            processedBy: session.username,
            processedAt: new Date(),
          },
        }
      );

      await db.collection('ledger').insertOne({
        userId: withdrawal.userId,
        type: 'withdrawal_cancelled',
        amount: 0,
        description: `Withdrawal Declined (Freeze Released): ${reason}`,
        createdAt: new Date(),
      });

      await db.collection('notifications').insertOne({
        userId: withdrawal.userId,
        title: '↩️ Withdrawal Declined (Freeze Released)',
        message: `Your withdrawal request for $${withdrawal.amount.toFixed(2)} was declined (${reason}). The hold has been lifted and funds are available in your balance.`,
        type: 'alert',
        read: false,
        createdAt: new Date(),
      });

      return Response.json({ success: true, message: 'Withdrawal rejected and freeze released' });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
