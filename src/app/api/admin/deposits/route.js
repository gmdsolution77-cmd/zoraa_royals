import { getDb, initDb, toIdQuery } from '@/lib/mongodb';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'requests')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const deposits = await db.collection('deposits').find().sort({ createdAt: -1 }).toArray();
    return Response.json({ success: true, deposits });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'requests')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { depositId, action, rejectionReason, editedAmount, editedBonusAmount, editedTotalCredited } = await req.json();
    const db = await getDb();

    const depositQuery = toIdQuery(depositId);

    const deposit = await db.collection('deposits').findOne(depositQuery);
    if (!deposit) {
      return Response.json({ success: false, error: 'Deposit request not found' }, { status: 404 });
    }

    if (deposit.status !== 'pending') {
      return Response.json({ success: false, error: `Deposit already ${deposit.status}` }, { status: 400 });
    }

    if (action === 'approve') {
      // Allow admin overrides/edits
      const finalAmount = (editedAmount !== undefined && !isNaN(parseFloat(editedAmount)))
        ? parseFloat(editedAmount)
        : deposit.amount;

      const finalBonus = (editedBonusAmount !== undefined && !isNaN(parseFloat(editedBonusAmount)))
        ? parseFloat(editedBonusAmount)
        : (deposit.bonusAmount || 0);

      const totalToCredit = (editedTotalCredited !== undefined && !isNaN(parseFloat(editedTotalCredited)))
        ? parseFloat(editedTotalCredited)
        : (deposit.totalCredited !== undefined ? parseFloat(deposit.totalCredited) : parseFloat(finalAmount + finalBonus));

      await db.collection('users').updateOne(
        { email: deposit.userEmail },
        {
          $inc: { balance: totalToCredit },
          $set: { firstDepositMade: true },
        }
      );

      await db.collection('deposits').updateOne(
        { _id: deposit._id },
        {
          $set: {
            status: 'approved',
            amount: finalAmount,
            bonusAmount: finalBonus,
            totalCredited: totalToCredit,
            editedByAdmin: (editedTotalCredited !== undefined || editedAmount !== undefined),
            processedBy: session.username,
            processedAt: new Date(),
          },
        }
      );

      // Record in ledger
      await db.collection('ledger').insertOne({
        userId: deposit.userId,
        type: 'deposit_approved',
        amount: totalToCredit,
        depositAmount: deposit.amount,
        bonusAmount: deposit.bonusAmount || 0,
        description: `Deposit Approved via ${deposit.methodName}: $${deposit.amount.toFixed(2)} + $${(deposit.bonusAmount || 0).toFixed(2)} bonus`,
        createdAt: new Date(),
      });

      // Notification
      await db.collection('notifications').insertOne({
        userId: deposit.userId,
        title: '🎉 Deposit Approved & Credited!',
        message: `Your deposit of $${deposit.amount.toFixed(2)} with +$${(deposit.bonusAmount || 0).toFixed(2)} bonus ($${totalToCredit.toFixed(2)} total) has been approved and added to your wallet!`,
        type: 'payment',
        read: false,
        createdAt: new Date(),
      });

      // Auto-queue Game Account Creation if player does not have a game account for this game yet
      try {
        const targetGame = deposit.gameTitle || 'Orion Stars';
        const cleanPlayerEmail = (deposit.userEmail || deposit.senderEmail || '').toLowerCase().trim();

        if (cleanPlayerEmail) {
          const existingGameAcc = await db.collection('gameAccounts').findOne({
            userEmail: cleanPlayerEmail,
            gameTitle: new RegExp(`^${targetGame.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            status: 'READY',
          });

          if (!existingGameAcc) {
            const existingPending = await db.collection('accountRequests').findOne({
              userEmail: cleanPlayerEmail,
              gameTitle: targetGame,
              status: 'PENDING',
            });

            if (!existingPending) {
              await db.collection('accountRequests').insertOne({
                userEmail: cleanPlayerEmail,
                userName: deposit.userName || deposit.username || cleanPlayerEmail.split('@')[0],
                gameTitle: targetGame,
                gameId: deposit.gameId || '',
                transferAmount: 0,
                initialDepositAmount: deposit.amount,
                creditedSC: totalToCredit,
                status: 'PENDING',
                source: 'auto_from_approved_deposit',
                depositId: deposit._id.toString(),
                notes: `Auto-generated from approved deposit #${deposit._id.toString()} ($${deposit.amount} USD). Please create ${targetGame} game credentials for player.`,
                createdAt: new Date(),
              });

              await db.collection('notifications').insertOne({
                userId: deposit.userId,
                title: `🎮 ${targetGame} Account Creation In Progress!`,
                message: `Your deposit was approved! Because you don't have a ${targetGame} game account yet, our staff desk has automatically queued your account creation. You will receive your login credentials shortly!`,
                type: 'account_request',
                read: false,
                createdAt: new Date(),
              });
            }
          }
        }
      } catch (autoAccErr) {
        console.warn('Auto account request error:', autoAccErr.message);
      }

      // Check Referral Bonus Engine
      try {
        const targetUser = await db.collection('users').findOne({
          $or: [
            { email: deposit.userEmail },
            { username: deposit.userName },
          ].filter(Boolean)
        });

        if (targetUser && targetUser.referredBy && !targetUser.referralBonusAwarded) {
          const priorCount = await db.collection('deposits').countDocuments({
            $or: [{ userId: deposit.userId }, { userEmail: deposit.userEmail }],
            status: 'approved',
            _id: { $ne: deposit._id },
          });

          if (priorCount === 0) {
            const sysSettings = await db.collection('system_settings').findOne({ key: 'general' });
            const refBonusPercent = Number(sysSettings?.referralBonusPercent ?? sysSettings?.referralBonusPercentage ?? 50);

            const cleanRef = targetUser.referredBy.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const referrer = await db.collection('users').findOne({
              $or: [
                { username: { $regex: `^${cleanRef}$`, $options: 'i' } },
                { referralCode: { $regex: `^${cleanRef}$`, $options: 'i' } },
              ],
            });

            if (referrer && referrer._id.toString() !== targetUser._id.toString()) {
              const bonusAmount = Number(((finalAmount * refBonusPercent) / 100).toFixed(2));
              if (bonusAmount > 0) {
                const oldBal = Number((referrer.balance !== undefined ? referrer.balance : (referrer.balanceSC || 0)).toFixed(2));
                const newBal = Number((oldBal + bonusAmount).toFixed(2));

                await db.collection('users').updateOne(
                  { _id: referrer._id },
                  {
                    $inc: {
                      balance: bonusAmount,
                      balanceSC: bonusAmount,
                      totalReferralBonusEarned: bonusAmount,
                      affiliateCommissionsEarned: bonusAmount,
                    },
                  }
                );

                await db.collection('ledger').insertOne({
                  userId: referrer._id.toString(),
                  username: referrer.username,
                  type: 'referral_bonus',
                  currency: 'USD',
                  amount: bonusAmount,
                  balanceBefore: oldBal,
                  balanceAfter: newBal,
                  performedBy: session.username,
                  staffRole: session.role,
                  referenceId: deposit._id.toString(),
                  notes: `${refBonusPercent}% referral bonus from friend @${targetUser.username}'s first approved deposit ($${finalAmount})`,
                  createdAt: new Date(),
                });

                await db.collection('notifications').insertOne({
                  userId: referrer._id,
                  title: '🎁 Referral Bonus Received!',
                  message: `Congratulations! Your referred friend @${targetUser.username} made their first deposit of $${Number(finalAmount).toFixed(2)}. You received a ${refBonusPercent}% referral bonus of +$${bonusAmount.toFixed(2)} USD added directly to your wallet!`,
                  type: 'referral_bonus',
                  read: false,
                  createdAt: new Date(),
                });

                await db.collection('users').updateOne(
                  { _id: targetUser._id },
                  { $set: { referralBonusAwarded: true, firstDepositMade: true } }
                );
              }
            }
          }
        }
      } catch (refErr) {
        console.error('Error crediting referral bonus in admin deposits:', refErr);
      }

      return Response.json({ success: true, message: `Deposit of $${totalToCredit.toFixed(2)} credited successfully` });
    } else if (action === 'reject') {
      const reason = rejectionReason || 'Payment could not be verified by cashier';

      await db.collection('deposits').updateOne(
        { _id: deposit._id },
        {
          $set: {
            status: 'rejected',
            rejectionReason: reason,
            processedBy: session.username,
            processedAt: new Date(),
          },
        }
      );

      await db.collection('notifications').insertOne({
        userId: deposit.userId,
        title: '⚠️ Deposit Request Declined',
        message: `Your deposit request for $${deposit.amount.toFixed(2)} was declined. Reason: ${reason}`,
        type: 'alert',
        read: false,
        createdAt: new Date(),
      });

      return Response.json({ success: true, message: 'Deposit rejected' });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
