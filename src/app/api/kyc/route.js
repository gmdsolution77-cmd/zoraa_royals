import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, status: 'unauthenticated' });
    }

    const db = await getDb();
    const kyc = await db.collection('kyc_verifications').findOne({ userId: session.id });
    return Response.json({
      success: true,
      status: kyc ? kyc.status : 'not_submitted',
      kycData: kyc || null,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, idType, idNumber, state, documentUrl } = await req.json();

    if (!fullName || !idType) {
      return Response.json({ success: false, error: 'Full name and ID type are required' }, { status: 400 });
    }

    const db = await getDb();
    const kycRecord = {
      userId: session.id,
      userEmail: session.email,
      fullName,
      idType,
      idNumber: idNumber || '',
      state: state || '',
      documentUrl: documentUrl || '',
      status: 'pending_review',
      submittedAt: new Date(),
    };

    await db.collection('kyc_verifications').insertOne(kycRecord);

    await db.collection('notifications').insertOne({
      userId: session.id,
      title: '🛡️ Identity Verification Submitted',
      message: 'Your VIP KYC verification documents have been received. Verification typically takes under 1 hour.',
      type: 'kyc',
      read: false,
      createdAt: new Date(),
    });

    return Response.json({ success: true, message: 'KYC documents submitted for review' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
