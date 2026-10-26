import { NextResponse } from 'next/server';
import { getSessionUser, ROLES } from '@/lib/auth';
import { getDb, toIdQuery } from '@/lib/mongodb';

// GET: List Promos (Admin all=true OR Public active list)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    const db = await getDb();
    const promosCol = db.collection('promotions');
    const query = all ? {} : { isActive: true };

    const promos = await promosCol.find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      promotions: promos.map(p => ({
        id: p._id.toString(),
        code: p.code,
        title: p.title,
        description: p.description || '',
        rewardUSD: p.rewardUSD !== undefined ? p.rewardUSD : (p.rewardSC || 0),
        rewardSC: p.rewardUSD !== undefined ? p.rewardUSD : (p.rewardSC || 0),
        minDeposit: p.minDeposit || 0,
        tag: p.tag || 'EXCLUSIVE',
        timesUsed: p.timesUsed || 0,
        isActive: p.isActive !== false,
        expiresAt: p.expiresAt || '',
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Admin Create Promo OR Player Redeem Code / Daily Bonus
export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;
    const db = await getDb();
    const promosCol = db.collection('promotions');

    // 1. Admin Create Promo Code
    if (action === 'admin_create') {
      if (session.role === 'player') {
        return NextResponse.json({ success: false, error: 'Unauthorized. Staff only.' }, { status: 403 });
      }

      const { code, title, description, rewardUSD, rewardSC, minDeposit, tag, expiresAt, isActive } = body;
      if (!code) {
        return NextResponse.json({ success: false, error: 'Promo code is required.' }, { status: 400 });
      }

      const cleanCode = code.trim().toUpperCase();
      const existing = await promosCol.findOne({ code: cleanCode });
      if (existing) {
        return NextResponse.json({ success: false, error: `Promo code "${cleanCode}" already exists.` }, { status: 400 });
      }

      const amt = Number(rewardUSD !== undefined ? rewardUSD : (rewardSC || 10));

      const newPromo = {
        code: cleanCode,
        title: (title || 'Royal Bonus Drop').trim(),
        description: (description || 'Claim instant dollar credits directly to your wallet.').trim(),
        rewardUSD: amt,
        rewardSC: amt,
        minDeposit: Number(minDeposit || 0),
        tag: (tag || 'EXCLUSIVE').toUpperCase(),
        expiresAt: expiresAt || null,
        isActive: isActive !== false,
        timesUsed: 0,
        createdBy: session.username || 'Admin',
        createdAt: new Date(),
      };

      const res = await promosCol.insertOne(newPromo);

      return NextResponse.json({
        success: true,
        message: `Promo code "${cleanCode}" created successfully!`,
        promo: { ...newPromo, id: res.insertedId.toString() },
      });
    }

    // 2. Player Daily Bonus Claim
    if (action === 'daily_bonus') {
      const usersCol = db.collection('users');
      const ledgerCol = db.collection('ledger');
      const user = await usersCol.findOne(toIdQuery(session.id || session.userId));
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const now = new Date();
      const lastDaily = user.lastDailyClaim ? new Date(user.lastDailyClaim) : null;

      if (lastDaily) {
        const diffHours = (now.getTime() - lastDaily.getTime()) / (1000 * 3600);
        if (diffHours < 24) {
          const remainingHours = (24 - diffHours).toFixed(1);
          return NextResponse.json({
            success: false,
            error: `Daily bonus already claimed! Next bonus in ${remainingHours} hours.`,
          }, { status: 400 });
        }
      }

      // Read dynamic daily bonus rewards from system settings
      const sysSettings = await db.collection('system_settings').findOne({ key: 'general' });
      const dailyRewards = Array.isArray(sysSettings?.dailyRewards) && sysSettings.dailyRewards.length === 7
        ? sysSettings.dailyRewards.map(Number)
        : [
            Number(sysSettings?.dailyRewardDay1 ?? 1.0),
            Number(sysSettings?.dailyRewardDay2 ?? 1.5),
            Number(sysSettings?.dailyRewardDay3 ?? 2.0),
            Number(sysSettings?.dailyRewardDay4 ?? 2.5),
            Number(sysSettings?.dailyRewardDay5 ?? 3.0),
            Number(sysSettings?.dailyRewardDay6 ?? 4.0),
            Number(sysSettings?.dailyRewardDay7 ?? 5.0),
          ];

      const streak = ((user.dailyStreak || 0) % 7) + 1;
      const rewardUSD = Number(dailyRewards[streak - 1] || 1.0);

      const oldBal = user.balance || user.balanceSC || 0;
      const newBal = Number((oldBal + rewardUSD).toFixed(2));

      await usersCol.updateOne(
        { _id: user._id },
        {
          $inc: { balance: rewardUSD, balanceSC: rewardUSD },
          $set: { lastDailyClaim: now, dailyStreak: streak },
        }
      );

      await ledgerCol.insertOne({
        userId: user._id.toString(),
        username: user.username,
        type: 'daily_bonus',
        currency: 'USD',
        amount: rewardUSD,
        balanceBefore: oldBal,
        balanceAfter: newBal,
        performedBy: 'player',
        notes: `Day ${streak} Daily Palace Reward: +$${rewardUSD} USD`,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: `Claimed Day ${streak} Bonus! Received $${rewardUSD} USD.`,
        rewardUSD,
        streak,
        newBalance: newBal,
      });
    }

    // 3. Player Promo Code Redemption
    const { code } = body;
    if (!code) {
      return NextResponse.json({ success: false, error: 'Promo code is required.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const promo = await promosCol.findOne({ code: cleanCode, isActive: true });
    if (!promo) {
      return NextResponse.json({ success: false, error: 'Invalid or expired promo code.' }, { status: 404 });
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Promo code has expired.' }, { status: 400 });
    }

    const redemptionsCol = db.collection('promo_redemptions');
    const usersCol = db.collection('users');
    const ledgerCol = db.collection('ledger');

    const uid = session.id || session.userId;
    const user = await usersCol.findOne(toIdQuery(uid));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const alreadyUsed = await redemptionsCol.findOne({ userId: uid, promoCode: cleanCode });
    if (alreadyUsed) {
      return NextResponse.json({ success: false, error: 'You have already redeemed this promo code.' }, { status: 400 });
    }

    const rewardUSD = Number(promo.rewardUSD !== undefined ? promo.rewardUSD : (promo.rewardSC || 0));
    const oldBal = user.balance || user.balanceSC || 0;
    const newBal = Number((oldBal + rewardUSD).toFixed(2));

    await usersCol.updateOne(
      { _id: user._id },
      { $inc: { balance: rewardUSD, balanceSC: rewardUSD } }
    );

    await promosCol.updateOne(
      { _id: promo._id },
      { $inc: { timesUsed: 1 } }
    );

    await redemptionsCol.insertOne({
      userId: uid,
      username: session.username,
      promoCode: cleanCode,
      rewardUSD,
      createdAt: new Date(),
    });

    await ledgerCol.insertOne({
      userId: user._id.toString(),
      username: user.username,
      type: 'promo_code',
      currency: 'USD',
      amount: rewardUSD,
      balanceBefore: oldBal,
      balanceAfter: newBal,
      performedBy: 'player',
      notes: `Promo code ${cleanCode} applied: +$${rewardUSD} USD`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Promo code "${cleanCode}" applied! +$${rewardUSD} USD added to your wallet.`,
      rewardUSD,
      newBalance: newBal,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Admin update promo code details or toggle active/paused
export async function PUT(req) {
  try {
    const session = await getSessionUser();
    if (!session || session.role === 'player') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, code, title, description, rewardUSD, rewardSC, minDeposit, tag, isActive, expiresAt } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Promo ID required.' }, { status: 400 });
    }

    const db = await getDb();
    const updateFields = {};

    if (code !== undefined && code.trim()) updateFields.code = code.trim().toUpperCase();
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (rewardUSD !== undefined) {
      const amt = Number(rewardUSD);
      updateFields.rewardUSD = amt;
      updateFields.rewardSC = amt;
    } else if (rewardSC !== undefined) {
      const amt = Number(rewardSC);
      updateFields.rewardUSD = amt;
      updateFields.rewardSC = amt;
    }
    if (minDeposit !== undefined) updateFields.minDeposit = Number(minDeposit);
    if (tag !== undefined) updateFields.tag = (tag || 'EXCLUSIVE').toUpperCase();
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);
    if (expiresAt !== undefined) updateFields.expiresAt = expiresAt;
    updateFields.updatedAt = new Date();

    await db.collection('promotions').updateOne(
      toIdQuery(id),
      { $set: updateFields }
    );

    return NextResponse.json({ success: true, message: 'Promo code updated successfully.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Admin remove promo code
export async function DELETE(req) {
  try {
    const session = await getSessionUser();
    if (!session || session.role === 'player') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Promo ID required.' }, { status: 400 });
    }

    const db = await getDb();
    await db.collection('promotions').deleteOne(toIdQuery(id));

    return NextResponse.json({ success: true, message: 'Promo code deleted.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
