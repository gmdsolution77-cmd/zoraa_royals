import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: session.email });

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const settings = await db.collection('system_settings').findOne({ key: 'general' });
    const signupBonus = settings?.signupBonusAmount !== undefined ? settings.signupBonusAmount : 3.0;

    const canClaim = !user.signupBonusClaimed;

    return Response.json({
      success: true,
      canClaim,
      bonusAmount: signupBonus,
      signupBonusClaimed: !!user.signupBonusClaimed,
      title: '$3 One-Time Signup Freeplay',
      message: canClaim
        ? `Claim your complimentary $${signupBonus.toFixed(2)} signup freeplay now!`
        : `You have already claimed your $${signupBonus.toFixed(2)} signup bonus.`,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, error: 'Please log in to claim freeplay' }, { status: 401 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: session.email });

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.signupBonusClaimed) {
      return Response.json({
        success: false,
        error: 'You have already claimed your one-time $3.00 signup freeplay.',
      }, { status: 400 });
    }

    const settings = await db.collection('system_settings').findOne({ key: 'general' });
    const signupBonus = settings?.signupBonusAmount !== undefined ? settings.signupBonusAmount : 3.0;

    const now = new Date();

    await db.collection('users').updateOne(
      { email: session.email },
      {
        $inc: { balance: signupBonus },
        $set: {
          signupBonusClaimed: true,
          freeplayClaimedAt: now,
        },
      }
    );

    // Ledger entry
    await db.collection('ledger').insertOne({
      userId: user._id,
      type: 'signup_bonus',
      amount: signupBonus,
      description: 'One-Time $3 Signup Freeplay Claimed',
      createdAt: now,
    });

    // Notification
    await db.collection('notifications').insertOne({
      userId: user._id,
      title: '🎁 $3 Signup Freeplay Claimed!',
      message: `Your account has been credited with $${signupBonus.toFixed(2)} complimentary freeplay! Good luck!`,
      type: 'bonus',
      read: false,
      createdAt: now,
    });

    const userBalance = user.balance !== undefined ? user.balance : (user.balanceSC || 0);

    return Response.json({
      success: true,
      message: `Claimed $${signupBonus.toFixed(2)} signup freeplay bonus!`,
      bonusAmount: signupBonus,
      newBalance: +(userBalance + signupBonus).toFixed(2),
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
