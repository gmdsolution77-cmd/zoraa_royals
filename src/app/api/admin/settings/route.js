import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const db = await getDb();
    const settings = await db.collection('system_settings').findOne({ key: 'general' });
    return Response.json({ success: true, settings });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'settings')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const updatedData = await req.json();
    const db = await getDb();

    delete updatedData._id;
    delete updatedData.key;

    if (updatedData.welcomeBonusPercent !== undefined) {
      updatedData.welcomeBonusPercentage = Number(updatedData.welcomeBonusPercent);
    } else if (updatedData.welcomeBonusPercentage !== undefined) {
      updatedData.welcomeBonusPercent = Number(updatedData.welcomeBonusPercentage);
    }

    if (updatedData.regularBonusPercent !== undefined) {
      updatedData.regularBonusPercentage = Number(updatedData.regularBonusPercent);
    } else if (updatedData.regularBonusPercentage !== undefined) {
      updatedData.regularBonusPercent = Number(updatedData.regularBonusPercentage);
    }

    if (updatedData.referralBonusPercent !== undefined) {
      updatedData.referralBonusPercentage = Number(updatedData.referralBonusPercent);
    } else if (updatedData.referralBonusPercentage !== undefined) {
      updatedData.referralBonusPercent = Number(updatedData.referralBonusPercentage);
    }

    if (updatedData.minCashoutThreshold !== undefined) {
      updatedData.minWithdrawal = Number(updatedData.minCashoutThreshold);
    } else if (updatedData.minWithdrawal !== undefined) {
      updatedData.minCashoutThreshold = Number(updatedData.minWithdrawal);
    }

    await db.collection('system_settings').updateOne(
      { key: 'general' },
      {
        $set: {
          ...updatedData,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return Response.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  return POST(req);
}
