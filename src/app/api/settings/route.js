import { getDb, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = await getDb();
    const settings = await db.collection('system_settings').findOne({ key: 'general' });

    return Response.json({
      success: true,
      settings: {
        siteName: settings?.siteName || 'Zorra Royals',
        welcomeBonusPercentage: settings?.welcomeBonusPercentage !== undefined ? settings.welcomeBonusPercentage : (settings?.welcomeBonusPercent !== undefined ? settings.welcomeBonusPercent : 100),
        regularBonusPercentage: settings?.regularBonusPercentage !== undefined ? settings.regularBonusPercentage : (settings?.regularBonusPercent !== undefined ? settings.regularBonusPercent : 20),
        referralBonusPercentage: settings?.referralBonusPercentage !== undefined ? settings.referralBonusPercentage : (settings?.referralBonusPercent !== undefined ? settings.referralBonusPercent : 50),
        referralBonusTitle: settings?.referralBonusTitle || 'FRIEND REFERRAL BONUS',
        referralBonusSubtitle: settings?.referralBonusSubtitle || 'Earn instant bonus directly in your wallet when your friends join and make their first deposit!',
        signupBonusAmount: settings?.signupBonusAmount !== undefined ? settings.signupBonusAmount : 3.0,
        minDeposit: settings?.minDeposit || 10.0,
        maxDeposit: settings?.maxDeposit || 10000.0,
        minWithdrawal: settings?.minWithdrawal || 25.0,
        maxDailyWithdrawal: settings?.maxDailyWithdrawal || 5000.0,
      },
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
