import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { notifyStaff } from '@/lib/notify';
import { resolveFreeplaySubmissionGate } from '@/lib/freeplayEligibility';

// GET - Check Freeplay eligibility, configured amount, active toggle and pending task status
export async function GET(req) {
  try {
    await initDb();
    const db = await getDb();
    const settingsDoc = await db.collection('system_settings').findOne({ key: 'general' });
    const configuredAmount = settingsDoc?.freeplayAmountSC !== undefined 
      ? Number(settingsDoc.freeplayAmountSC) 
      : (settingsDoc?.signupBonusAmount !== undefined ? Number(settingsDoc.signupBonusAmount) : 3.0);
    const freeplayActive = settingsDoc?.freeplayActive !== false;

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({
        success: true,
        claimed: false,
        canClaim: freeplayActive,
        amount: configuredAmount,
        bonusAmount: configuredAmount,
        freeplayActive,
        pending: false,
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

    const claimed = Boolean(user?.freeplayClaimed);
    const gate = user ? await resolveFreeplaySubmissionGate(db, user) : { allowed: true };
    const pendingReview = gate.reason === 'pending_review';

    const pendingTask = pendingReview
      ? await db.collection('freeplay_tasks').findOne({
          $or: [
            { userId: user?._id ? user._id.toString() : '' },
            { email: user?.email ? user.email.toLowerCase().trim() : '' },
          ],
          status: 'pending',
        })
      : null;

    return NextResponse.json({
      success: true,
      claimed,
      canClaim: !claimed && freeplayActive && !pendingReview,
      canSubmit: gate.allowed && freeplayActive,
      amount: configuredAmount,
      bonusAmount: configuredAmount,
      signupBonusClaimed: claimed,
      freeplayActive,
      pending: pendingReview,
      pendingTask: pendingTask
        ? {
            taskId: pendingTask.taskId,
            gameTitle: pendingTask.gameTitle,
            createdAt: pendingTask.createdAt,
          }
        : gate.pendingTaskId
        ? { taskId: gate.pendingTaskId, gameTitle: null, createdAt: null }
        : null,
      claimedAt: user?.freeplayClaimedAt || null,
      message: claimed
        ? `You have already claimed your $${configuredAmount.toFixed(2)} signup freeplay bonus.`
        : pendingReview
        ? (gate.message ||
            `Your Freeplay verification task${gate.pendingTaskId ? ` (#${gate.pendingTaskId})` : ''} is under staff review.`)
        : `Claim your complimentary $${configuredAmount.toFixed(2)} signup freeplay now!`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Submit Freeplay Verification Task
export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to complete your Freeplay verification task.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { gameTitle, taskId, screenshot } = body;

    const db = await getDb();
    const settingsDoc = await db.collection('system_settings').findOne({ key: 'general' });
    if (settingsDoc?.freeplayActive === false) {
      return NextResponse.json(
        { success: false, message: 'Freeplay promotions are currently paused or inactive.' },
        { status: 400 }
      );
    }

    const configuredAmount = settingsDoc?.freeplayAmountSC !== undefined 
      ? Number(settingsDoc.freeplayAmountSC) 
      : (settingsDoc?.signupBonusAmount !== undefined ? Number(settingsDoc.signupBonusAmount) : 3.0);

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
        { success: false, message: 'User not found. Please log in again.' },
        { status: 404 }
      );
    }

    const submitGate = await resolveFreeplaySubmissionGate(db, user);
    if (!submitGate.allowed) {
      return NextResponse.json(
        {
          success: false,
          alreadyClaimed: submitGate.reason === 'already_claimed',
          pending: submitGate.reason === 'pending_review',
          message: submitGate.message,
        },
        { status: submitGate.reason === 'pending_review' ? 409 : 400 }
      );
    }

    // Require game selection and screenshot proof
    if (!gameTitle || !String(gameTitle).trim()) {
      return NextResponse.json(
        { success: false, message: 'Please select a casino game platform for your freeplay credits.' },
        { status: 400 }
      );
    }

    if (!screenshot || !String(screenshot).trim()) {
      return NextResponse.json(
        { success: false, message: 'Please upload your Inbox screenshot proof before submitting.' },
        { status: 400 }
      );
    }

    const resolvedTaskId = taskId || `FP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Record submission into freeplay_tasks collection
    await db.collection('freeplay_tasks').insertOne({
      taskId: resolvedTaskId,
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      gameTitle: String(gameTitle).trim(),
      screenshot,
      amount: configuredAmount,
      status: 'pending',
      createdAt: new Date(),
    });

    // 2. Create account request with freeplay attached for staff to approve
    await db.collection('accountRequests').insertOne({
      userId: user._id.toString(),
      userName: user.username,
      userEmail: user.email,
      gameTitle: String(gameTitle).trim(),
      requestType: 'ACCOUNT_CREATION',
      status: 'PENDING',
      source: 'freeplay_task',
      freeplayPending: true,
      freeplayAmount: configuredAmount,
      freeplayScreenshot: screenshot,
      freeplayTaskId: resolvedTaskId,
      createdAt: new Date(),
    });

    // 3. Notify staff
    notifyStaff({
      type: 'freeplay_task_submitted',
      title: 'Freeplay Task Proof Submitted 🎁',
      message: `Player ${user.username} submitted Inbox screenshot for $${configuredAmount.toFixed(2)} Freeplay on ${gameTitle}.`,
      data: {
        userId: user._id.toString(),
        username: user.username,
        gameTitle,
        amount: String(configuredAmount),
        taskId: resolvedTaskId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `🎉 Freeplay task submitted! Our 24/7 staff will verify your Inbox screenshot and load your $${configuredAmount.toFixed(2)} Freeplay credentials shortly.`,
      taskId: resolvedTaskId,
      amount: configuredAmount,
    });
  } catch (err) {
    console.error('Freeplay Task submission error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
