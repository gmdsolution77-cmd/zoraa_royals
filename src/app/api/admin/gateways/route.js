import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'gateways')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const gateways = await db.collection('payment_methods').find().sort({ createdAt: -1 }).toArray();
    return Response.json({ success: true, gateways });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'gateways')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { action, gatewayData, methodId } = await req.json();
    const db = await getDb();

    if (action === 'toggle_active') {
      const gw = await db.collection('payment_methods').findOne({ methodId });
      if (!gw) return Response.json({ success: false, error: 'Gateway not found' }, { status: 404 });

      await db.collection('payment_methods').updateOne(
        { methodId },
        { $set: { isActive: !gw.isActive } }
      );
      return Response.json({ success: true, message: 'Gateway active status updated' });
    }

    if (action === 'update_details') {
      await db.collection('payment_methods').updateOne(
        { methodId },
        {
          $set: {
            accountDetails: gatewayData.accountDetails,
            instructions: gatewayData.instructions,
            minDeposit: parseFloat(gatewayData.minDeposit || 10),
            maxDeposit: parseFloat(gatewayData.maxDeposit || 5000),
          },
        }
      );
      return Response.json({ success: true, message: 'Gateway details updated' });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
