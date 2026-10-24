import { getDb, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = await getDb();
    const settings = await db.collection('system_settings').findOne({ key: 'general' });

    const welcomePct = settings?.welcomeBonusPercent !== undefined 
      ? Number(settings.welcomeBonusPercent) 
      : (settings?.welcomeBonusPercentage !== undefined ? Number(settings.welcomeBonusPercentage) : 100);

    const regularPct = settings?.regularBonusPercent !== undefined 
      ? Number(settings.regularBonusPercent) 
      : (settings?.regularBonusPercentage !== undefined ? Number(settings.regularBonusPercentage) : 20);

    const refPct = settings?.referralBonusPercent !== undefined 
      ? Number(settings.referralBonusPercent) 
      : (settings?.referralBonusPercentage !== undefined ? Number(settings.referralBonusPercentage) : 50);

    const minCashout = Number(settings?.minCashoutThreshold ?? settings?.minWithdrawal ?? 50);

    return Response.json({
      success: true,
      settings: {
        siteName: settings?.siteName || 'Zorra Royals',
        welcomeBonusPercent: welcomePct,
        welcomeBonusPercentage: welcomePct,
        welcomeBonusTitle: settings?.welcomeBonusTitle || 'FIRST DEPOSIT BONUS',
        welcomeBonusSubtitle: settings?.welcomeBonusSubtitle || 'Claim a royal match on your first deposit! Fast credits & prompt payouts.',
        regularBonusPercent: regularPct,
        regularBonusPercentage: regularPct,
        regularBonusTitle: settings?.regularBonusTitle || 'REGULAR RELOAD BONUS',
        regularBonusSubtitle: settings?.regularBonusSubtitle || 'Enjoy bonus on every reload! Boost your palace treasury anytime.',
        referralBonusPercent: refPct,
        referralBonusPercentage: refPct,
        referralBonusTitle: settings?.referralBonusTitle || 'FRIEND REFERRAL BONUS',
        referralBonusSubtitle: settings?.referralBonusSubtitle || 'Earn instant bonus directly in your wallet when your friends join and make their first deposit!',
        signupBonusAmount: settings?.signupBonusAmount !== undefined ? settings.signupBonusAmount : 3.0,
        minDeposit: Number(settings?.minDeposit || 10.0),
        maxDeposit: Number(settings?.maxDeposit || 10000.0),
        minWithdrawal: minCashout,
        minCashoutThreshold: minCashout,
        maxDailyWithdrawal: Number(settings?.maxDailyWithdrawal || 5000.0),
        geoRestrictionEnabled: Boolean(settings?.geoRestrictionEnabled),
      },
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
