import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, error: 'Please log in to play' }, { status: 401 });
    }

    const { gameId, betAmount, currency = 'SC', action = 'play', customData = {} } = await req.json();

    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      return Response.json({ success: false, error: 'Invalid bet amount' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: session.email });

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isSC = currency === 'SC';
    const currentBalance = isSC ? (user.balanceSC || 0) : (user.balanceGC || 0);

    if (currentBalance < bet) {
      return Response.json({
        success: false,
        error: `Insufficient ${isSC ? 'Sweeps Coins' : 'Gold Coins'} balance. Make a quick deposit or claim freeplay!`,
      }, { status: 400 });
    }

    let winAmount = 0;
    let resultDetails = {};

    // 1. Royal 777 Slots
    if (gameId === 'royal-777') {
      const symbols = ['👑', '💎', '7️⃣', '🔔', '🍒', '⭐'];
      const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
      const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
      const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

      let multiplier = 0;
      if (reel1 === reel2 && reel2 === reel3) {
        if (reel1 === '👑') multiplier = 50; // Royal Crown Jackpot!
        else if (reel1 === '💎') multiplier = 25; // Diamond
        else if (reel1 === '7️⃣') multiplier = 15; // Lucky 7
        else if (reel1 === '🔔') multiplier = 10;
        else if (reel1 === '⭐') multiplier = 8;
        else multiplier = 5; // Cherries
      } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        multiplier = 1.5; // Two of a kind
      } else if (Math.random() < 0.25) {
        multiplier = 1.2; // Minor scatter
      }

      winAmount = +(bet * multiplier).toFixed(2);
      resultDetails = {
        reels: [reel1, reel2, reel3],
        isWin: multiplier > 0,
        multiplier,
      };
    }

    // 2. Royal Rocket Crash
    else if (gameId === 'royal-crash') {
      const cashoutAt = parseFloat(customData.cashoutAt || 2.0);
      // Realistic crash point with house edge ~3%
      const r = Math.random();
      const crashPoint = +(0.97 / (1 - r)).toFixed(2);
      const safeCrash = Math.max(1.0, Math.min(crashPoint, 100.0));

      if (cashoutAt <= safeCrash) {
        winAmount = +(bet * cashoutAt).toFixed(2);
        resultDetails = {
          crashedAt: safeCrash,
          cashedOutAt: cashoutAt,
          isWin: true,
          multiplier: cashoutAt,
        };
      } else {
        winAmount = 0;
        resultDetails = {
          crashedAt: safeCrash,
          cashedOutAt: cashoutAt,
          isWin: false,
          multiplier: 0,
        };
      }
    }

    // 3. Royal Roulette
    else if (gameId === 'royal-roulette') {
      const chosenColor = customData.color || 'red'; // 'red', 'black', 'zero'
      const landedNumber = Math.floor(Math.random() * 37); // 0 to 36
      let landedColor = 'red';
      if (landedNumber === 0) landedColor = 'green';
      else if ([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].includes(landedNumber)) {
        landedColor = 'black';
      }

      let multiplier = 0;
      if (chosenColor === landedColor) {
        multiplier = landedColor === 'green' ? 36 : 2;
      }

      winAmount = +(bet * multiplier).toFixed(2);
      resultDetails = {
        number: landedNumber,
        color: landedColor,
        isWin: multiplier > 0,
        multiplier,
      };
    }

    // 4. Royal VIP Blackjack
    else if (gameId === 'royal-blackjack') {
      const playerCard1 = Math.floor(Math.random() * 10) + 2;
      const playerCard2 = Math.floor(Math.random() * 10) + 2;
      const dealerCard1 = Math.floor(Math.random() * 10) + 2;
      const dealerCard2 = Math.floor(Math.random() * 10) + 2;

      let playerTotal = playerCard1 + playerCard2;
      let dealerTotal = dealerCard1 + dealerCard2;

      if (playerTotal > 21) playerTotal = 21;
      if (dealerTotal > 21) dealerTotal = 20;

      let multiplier = 0;
      if (playerTotal === 21) {
        multiplier = 2.5; // Natural Blackjack
      } else if (playerTotal > dealerTotal) {
        multiplier = 2.0; // Win
      } else if (playerTotal === dealerTotal) {
        multiplier = 1.0; // Push
      }

      winAmount = +(bet * multiplier).toFixed(2);
      resultDetails = {
        playerCards: [playerCard1, playerCard2],
        dealerCards: [dealerCard1, dealerCard2],
        playerTotal,
        dealerTotal,
        isWin: multiplier >= 1.0,
        multiplier,
      };
    } else {
      return Response.json({ success: false, error: 'Unsupported internal game' }, { status: 400 });
    }

    // Calculate net delta
    const netDelta = winAmount - bet;

    // Update balances
    const updateQuery = isSC
      ? { $inc: { balanceSC: netDelta } }
      : { $inc: { balanceGC: netDelta } };

    await db.collection('users').updateOne({ email: session.email }, updateQuery);

    // Update game play count
    await db.collection('games').updateOne(
      { gameId },
      { $inc: { playsCount: 1 } }
    );

    const newBalance = isSC
      ? (user.balanceSC || 0) + netDelta
      : (user.balanceGC || 0) + netDelta;

    return Response.json({
      success: true,
      gameId,
      currency,
      betAmount: bet,
      winAmount,
      netProfit: netDelta,
      newBalance: +newBalance.toFixed(2),
      resultDetails,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
