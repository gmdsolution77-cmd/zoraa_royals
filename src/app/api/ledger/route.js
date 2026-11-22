import { ObjectId } from 'mongodb';
import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function isStaffRole(role) {
  const r = String(role || '').toLowerCase();
  return Boolean(r && r !== 'player');
}

function buildIdList(strIds) {
  const out = [];
  for (const s of strIds) {
    const clean = String(s || '').trim();
    if (!clean) continue;
    out.push(clean);
    if (/^[0-9a-fA-F]{24}$/.test(clean)) {
      try {
        out.push(new ObjectId(clean));
      } catch {}
    }
  }
  return out;
}

export async function GET(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, entries: [], records: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const usernameFilter = (searchParams.get('username') || '').trim();
    const typeFilter = (searchParams.get('type') || 'all').trim().toLowerCase();
    const limitParam = Math.min(300, Math.max(20, Number(searchParams.get('limit') || 150)));

    const db = await getDb();
    const isStaff = isStaffRole(session.role);
    const query = {};

    if (!isStaff) {
      query.userId = session.id;
    } else if (usernameFilter) {
      const escaped = usernameFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { username: { $regex: escaped, $options: 'i' } },
        { notes: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (typeFilter && typeFilter !== 'all') {
      if (typeFilter === 'deposit') {
        query.type = { $regex: 'deposit', $options: 'i' };
      } else if (typeFilter === 'redemption') {
        query.type = { $regex: 'redemption|withdraw|cashout|coin_verification', $options: 'i' };
      } else if (typeFilter === 'coin_load') {
        query.type = { $regex: 'game_transfer|game_load|coin_load', $options: 'i' };
      } else if (typeFilter === 'admin_adjustment') {
        query.type = { $regex: 'admin|adjust|allot|credit|debit|bonus|freeplay|referral', $options: 'i' };
      } else {
        query.type = typeFilter;
      }
    }

    const rawEntries = await db
      .collection('ledger')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limitParam)
      .toArray();

    // Hydrate deposit & cashout screenshots by referenceId so Transaction Logs show proof images
    const refIds = [...new Set(rawEntries.map((e) => e.referenceId).filter(Boolean).map(String))];
    const idCandidates = buildIdList(refIds);

    const depositProofMap = new Map();
    const redemptionProofMap = new Map();
    const freeplayProofMap = new Map();

    if (idCandidates.length > 0) {
      const [depDocs, redDocs, accDocs] = await Promise.all([
        db
          .collection('deposits')
          .find({ _id: { $in: idCandidates } }, { projection: { _id: 1, proofImage: 1 } })
          .toArray(),
        db
          .collection('redemptions')
          .find({ _id: { $in: idCandidates } }, { projection: { _id: 1, gameScreenshot: 1, qrCodeImage: 1 } })
          .toArray(),
        db
          .collection('accountRequests')
          .find({ _id: { $in: idCandidates } }, { projection: { _id: 1, freeplayScreenshot: 1, screenshot: 1 } })
          .toArray(),
      ]);

      for (const d of depDocs) {
        if (d.proofImage) depositProofMap.set(String(d._id), d.proofImage);
      }
      for (const r of redDocs) {
        if (r.gameScreenshot || r.qrCodeImage) {
          redemptionProofMap.set(String(r._id), {
            gameScreenshot: r.gameScreenshot || null,
            qrCodeImage: r.qrCodeImage || null,
          });
        }
      }
      for (const a of accDocs) {
        const img = a.freeplayScreenshot || a.screenshot || null;
        if (img) freeplayProofMap.set(String(a._id), img);
      }
    }

    const records = rawEntries.map((e) => {
      const refKey = e.referenceId ? String(e.referenceId) : '';
      const depImg = e.proofImage || (refKey ? depositProofMap.get(refKey) : null) || null;
      const redImgs = refKey ? redemptionProofMap.get(refKey) : null;
      const fpImg = refKey ? freeplayProofMap.get(refKey) : null;

      return {
        ...e,
        id: String(e._id),
        _id: String(e._id),
        username: e.username || e.performedBy || 'Player',
        type: e.type || 'transaction',
        amount: Number(e.amount || 0),
        status:
          e.status ||
          (String(e.type || '').includes('reject')
            ? 'rejected'
            : String(e.type || '').includes('freeze') || String(e.type || '').includes('requested')
            ? 'pending'
            : 'completed'),
        notes: e.notes || e.description || e.reason || '—',
        proofImage: depImg || fpImg || null,
        gameScreenshot: e.gameScreenshot || redImgs?.gameScreenshot || null,
        qrCodeImage: e.qrCodeImage || redImgs?.qrCodeImage || null,
        createdAt: e.createdAt || new Date(),
      };
    });

    return Response.json({
      success: true,
      records,
      entries: records,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message, records: [], entries: [] }, { status: 500 });
  }
}
