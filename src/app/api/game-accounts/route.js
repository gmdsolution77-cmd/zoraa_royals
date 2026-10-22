import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/auth';

// GET game credentials (by player email or session)
export async function GET(req) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || session?.email;

    if (!email) {
      return NextResponse.json({ success: true, gameAccounts: [], accounts: [] });
    }

    const db = await getDb();
    const cleanEmail = email.toLowerCase().trim();

    // Check gameAccounts (primary) and legacy game_accounts
    const accounts = await db
      .collection('gameAccounts')
      .find({ userEmail: cleanEmail, status: 'READY' })
      .toArray();

    // If empty, check legacy collection
    let finalAccounts = accounts;
    if (finalAccounts.length === 0) {
      finalAccounts = await db
        .collection('game_accounts')
        .find({ $or: [{ userEmail: cleanEmail }, { userId: session?.userId || session?.id }] })
        .toArray();
    }

    const formatted = finalAccounts.map(acc => ({
      id: acc._id.toString(),
      _id: acc._id.toString(),
      userEmail: acc.userEmail,
      gameTitle: acc.gameTitle || acc.gameName || 'Game Platform',
      gameId: acc.gameId || '',
      username: acc.username || acc.gameUsername,
      password: acc.password || acc.gamePassword || '••••••••',
      pin: acc.pin || '',
      status: acc.status || 'READY',
      createdAt: acc.createdAt || new Date(),
    }));

    return NextResponse.json({
      success: true,
      gameAccounts: formatted,
      accounts: formatted,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
