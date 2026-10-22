import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, entries: [] });
    }

    const db = await getDb();
    const entries = await db.collection('ledger').find({
      userId: session.id,
    }).sort({ createdAt: -1 }).limit(100).toArray();

    return Response.json({ success: true, entries });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
