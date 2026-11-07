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

  if (user.freeplayClaimed) {
    return {
      allowed: false,
      reason: 'already_claimed',
      message: 'You have already used your one-time signup freeplay. Make a deposit to unlock reload bonuses.',
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

  if (pendingTask || pendingRequest) {
    return {
      allowed: false,
      reason: 'pending_review',
      message:
        'Your freeplay request is already with our team. Please wait for approval or rejection before submitting again.',
      pendingTaskId: pendingTask?.taskId || pendingRequest?.freeplayTaskId || null,
    };
  }

  return { allowed: true, reason: null, message: null };
}
