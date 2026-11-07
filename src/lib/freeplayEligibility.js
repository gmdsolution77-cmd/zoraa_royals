/**
 * Server-side freeplay gate: one lifetime claim after staff approval;
 * no duplicate submissions while a desk review is open.
 */
export async function resolveFreeplaySubmissionGate(db, user) {
  if (!user) {
    return {
      allowed: false,
      reason: 'not_authenticated',
      message: 'Please sign in to complete your Freeplay verification task.',
    };
  }

  const email = String(user.email || '')
    .toLowerCase()
    .trim();
  const userId = user._id ? user._id.toString() : '';

  const pendingTask = await db.collection('freeplay_tasks').findOne({
    $or: [{ userId }, { email }],
    status: 'pending',
  });

  const pendingRequest = await db.collection('accountRequests').findOne({
    userEmail: email,
    status: 'PENDING',
    $or: [{ freeplayPending: true }, { source: 'freeplay_task' }],
  });

  const pendingReview = Boolean(pendingTask || pendingRequest);

  // Repair stale flags (claimed in DB but review still open — e.g. old bugs)
  if (user.freeplayClaimed && pendingReview) {
    await db
      .collection('users')
      .updateOne(
        { _id: user._id },
        { $set: { freeplayClaimed: false, signupBonusClaimed: false }, $unset: { freeplayClaimedAt: '' } }
      )
      .catch(() => {});
    user.freeplayClaimed = false;
    user.signupBonusClaimed = false;
  }

  if (pendingReview) {
    return {
      allowed: false,
      reason: 'pending_review',
      message:
        'Your freeplay request is already with our team. Please wait for approval or rejection before submitting again.',
      pendingTaskId: pendingTask?.taskId || pendingRequest?.freeplayTaskId || null,
    };
  }

  if (user.freeplayClaimed) {
    return {
      allowed: false,
      reason: 'already_claimed',
      message: 'You have already used your one-time signup freeplay. Make a deposit to unlock reload bonuses.',
    };
  }

  return { allowed: true, reason: null, message: null };
}

/** Claimed only after staff approval — not while a desk ticket is still open. */
export function isFreeplayFullyClaimed(user, { pending = false } = {}) {
  return Boolean(user?.freeplayClaimed) && !pending;
}
