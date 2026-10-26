import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET - Check Freeplay eligibility and claim status
export async function GET(req) {
  try {
    await initDb();
    const db = await getDb();
    const settingsDoc = await db.collection('system_settings').findOne({ key: 'general' });
    const configuredAmount = Number(
      settingsDoc?.freeplayAmountSC ?? settingsDoc?.signupBonusAmount ?? 5.0
    );

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({
        success: true,
        claimed: false,
        canClaim: true,
        amount: configuredAmount,
        bonusAmount: configuredAmount,
        title: `$${configuredAmount.toFixed(0)} One-Time Signup Freeplay`,
      });
    }

    const usersCol = db.collection('users');
    let user = null;
    const userId = session.userId || session.id;
    if (userId && ObjectId.isValid(userId)) {
      user = await usersCol.findOne({ _id: new ObjectId(userId) });
    }
    if (!user && session.email) {
      user = await usersCol.findOne({ email: session.email.toLowerCase().trim() });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const claimed = Boolean(user.freeplayClaimed || user.signupBonusClaimed);
    const canClaim = !claimed;

    return NextResponse.json({
      success: true,
      claimed,
      canClaim,
      amount: configuredAmount,
      bonusAmount: configuredAmount,
      signupBonusClaimed: claimed,
      title: `$${configuredAmount.toFixed(0)} One-Time Signup Freeplay`,
      welcomeBonusPercent: Number(settingsDoc?.welcomeBonusPercent || settingsDoc?.welcomeBonusPercentage || 300),
      welcomeBonusPercentage: Number(settingsDoc?.welcomeBonusPercent || settingsDoc?.welcomeBonusPercentage || 300),
      claimedAt: user.freeplayClaimedAt || null,
      message: canClaim
        ? `Claim your complimentary $${configuredAmount.toFixed(2)} signup freeplay now!`
        : `You have already claimed your $${configuredAmount.toFixed(2)} signup freeplay bonus.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Claim Freeplay Bonus
export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to claim your Freeplay bonus.' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const settingsDoc = await db.collection('system_settings').findOne({ key: 'general' });
    const configuredAmount = Number(
      settingsDoc?.freeplayAmountSC ?? settingsDoc?.signupBonusAmount ?? 5.0
    );
    const matchBonusPct = Number(settingsDoc?.welcomeBonusPercent || settingsDoc?.welcomeBonusPercentage || 300);

    const usersCol = db.collection('users');
    let user = null;
    const userId = session.userId || session.id;
    if (userId && ObjectId.isValid(userId)) {
      user = await usersCol.findOne({ _id: new ObjectId(userId) });
    }
    if (!user && session.email) {
      user = await usersCol.findOne({ email: session.email.toLowerCase().trim() });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please log in again.' },
        { status: 404 }
      );
    }

    if (user.freeplayClaimed || user.signupBonusClaimed) {
      return NextResponse.json({
        success: false,
        alreadyClaimed: true,
        error: `You have already claimed your Freeplay bonus! Make a deposit to receive up to ${matchBonusPct}% match bonuses.`,
        message: `You have already claimed your Freeplay bonus! Make a deposit to receive up to ${matchBonusPct}% match bonuses.`,
      });
    }

    const awardSC = configuredAmount;
    const oldBalance = Number(user.balanceSC ?? user.balance ?? 0);
    const newBalance = Number((oldBalance + awardSC).toFixed(2));
    const now = new Date();

    await usersCol.updateOne(
      { _id: user._id },
      {
        $inc: {
          balance: awardSC,
          balanceSC: awardSC,
        },
        $set: {
          freeplayClaimed: true,
          signupBonusClaimed: true,
          freeplayClaimedAt: now,
        },
      }
    );

    // Record in ledger
    const ledgerCol = db.collection('ledger');
    await ledgerCol.insertOne({
      userId: user._id.toString(),
      userEmail: user.email,
      username: user.username,
      type: 'freeplay_bonus',
      amount: awardSC,
      currency: 'USD',
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      description: `🎁 $${awardSC.toFixed(2)} Freeplay Bonus claimed from lobby`,
      status: 'completed',
      createdAt: now,
    });

    // Notification
    await db.collection('notifications').insertOne({
      userId: user._id,
      title: '🎁 $5 Signup Freeplay Claimed!',
      message: `Your account has been credited with $${awardSC.toFixed(2)} complimentary freeplay! Good luck at Zorra Royals!`,
      type: 'bonus',
      read: false,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `🎉 $${awardSC.toFixed(2)} Freeplay bonus credited to your wallet!`,
      newBalance,
      newBalanceSC: newBalance,
      claimed: true,
      amount: awardSC,
      bonusAmount: awardSC,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
