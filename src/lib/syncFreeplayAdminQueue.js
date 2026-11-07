/**
 * Keeps Coins Allotment queue in sync: pending freeplay_tasks must have a PENDING accountRequests row.
 * Repairs rows that were set READY before freeplay wallet review finished.
 */
export async function syncFreeplayAdminQueue(db) {
  const tasksCol = db.collection('freeplay_tasks');
  const requestsCol = db.collection('accountRequests');

  const pendingTasks = await tasksCol.find({ status: 'pending' }).sort({ createdAt: -1 }).toArray();

  for (const task of pendingTasks) {
    const email = String(task.email || '')
      .toLowerCase()
      .trim();
    if (!email) continue;

    const taskId = task.taskId || '';

    const rejectedForTask = await requestsCol.findOne({
      userEmail: email,
      status: 'REJECTED',
      $or: [{ freeplayTaskId: taskId }, { source: 'freeplay_task' }],
    });
    if (rejectedForTask && (!taskId || rejectedForTask.freeplayTaskId === taskId)) {
      await tasksCol.updateMany(
        { email, taskId: taskId || rejectedForTask.freeplayTaskId, status: 'pending' },
        {
          $set: {
            status: 'rejected',
            rejectionReason: rejectedForTask.rejectionReason || 'Closed by staff',
            rejectedAt: rejectedForTask.cancelledAt || new Date(),
          },
        }
      );
      continue;
    }

    const pendingReq = await requestsCol.findOne({
      userEmail: email,
      status: 'PENDING',
      $or: [{ freeplayTaskId: taskId }, { source: 'freeplay_task', freeplayPending: true }],
    });

    if (pendingReq) continue;

    const stuckReady = await requestsCol.findOne({
      userEmail: email,
      status: 'READY',
      $or: [{ freeplayTaskId: taskId }, { source: 'freeplay_task', freeplayPending: true }],
    });

    if (stuckReady) {
      await requestsCol.updateOne(
        { _id: stuckReady._id },
        {
          $set: {
            status: 'PENDING',
            freeplayPending: true,
            source: 'freeplay_task',
            freeplayAmount: Number(stuckReady.freeplayAmount || task.amount || 3),
            freeplayScreenshot: stuckReady.freeplayScreenshot || task.screenshot || '',
            freeplayTaskId: taskId || stuckReady.freeplayTaskId,
          },
          $unset: {
            approvedAt: '',
            approvedBy: '',
            gameAccountUsername: '',
            gameAccountPassword: '',
          },
        }
      );
      continue;
    }

    const anyForTask = await requestsCol.findOne({
      userEmail: email,
      freeplayTaskId: taskId,
    });

    if (anyForTask?.status === 'REJECTED' || anyForTask?.status === 'CANCELLED') {
      await tasksCol.updateMany(
        { email, ...(taskId ? { taskId } : {}), status: 'pending' },
        { $set: { status: 'rejected', rejectionReason: anyForTask.rejectionReason || 'Rejected by staff' } }
      );
      continue;
    }

    if (!anyForTask) {
      await requestsCol.insertOne({
        userId: task.userId || '',
        userName: task.username || email.split('@')[0],
        userEmail: email,
        gameTitle: task.gameTitle || 'Selected Game',
        requestType: 'ACCOUNT_CREATION',
        status: 'PENDING',
        source: 'freeplay_task',
        freeplayPending: true,
        freeplayAmount: Number(task.amount || 3),
        freeplayScreenshot: task.screenshot || '',
        freeplayTaskId: taskId,
        transferAmount: 0,
        createdAt: task.createdAt || new Date(),
      });
    }
  }
}
