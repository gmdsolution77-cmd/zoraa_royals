// Web Audio API Sound Synthesizer for Vegas One Admin Notifications
// Zero external file dependencies - 100% reliable in all browsers

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const AVAILABLE_TUNES = [
  {
    id: 'chaching',
    name: 'Cash Register (Cha-Ching)',
    desc: 'Classic register drawer & coin chime',
    badge: 'Popular',
    icon: '💰',
  },
  {
    id: 'jackpot',
    name: 'Casino Jackpot Fanfare',
    desc: 'Ascending high-energy victory arpeggio',
    badge: 'Vegas',
    icon: '🎰',
  },
  {
    id: 'bell',
    name: 'Crystal Bell Ding',
    desc: 'Crisp, modern glass chime notification',
    badge: 'Clean',
    icon: '🔔',
  },
  {
    id: 'marimba',
    name: 'Warm Marimba Chime',
    desc: 'Gentle, pleasant harmonic marimba ding',
    badge: 'Soft',
    icon: '🎵',
  },
  {
    id: 'arcade',
    name: 'Arcade 8-Bit Coin',
    desc: 'Retro video game coin jump effect',
    badge: 'Retro',
    icon: '👾',
  },
  {
    id: 'radar',
    name: 'Cyber Pulse Alert',
    desc: 'High-tech double radar ping',
    badge: 'Tech',
    icon: '⚡',
  },
];

export function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function playTune(tuneId = 'chaching', volume = 0.7) {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const masterVol = Math.max(0.01, Math.min(1, volume));
  const now = ctx.currentTime;

  switch (tuneId) {
    case 'chaching': {
      // 1. Mechanical cash register click
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(320, now);
      clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.05);
      clickGain.gain.setValueAtTime(0.3 * masterVol, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.06);

      // 2. High Coin Ding 1 (E6 - 1318.5 Hz)
      const coin1 = ctx.createOscillator();
      const coin1Gain = ctx.createGain();
      coin1.type = 'sine';
      coin1.frequency.setValueAtTime(1318.5, now + 0.04);
      coin1Gain.gain.setValueAtTime(0.001, now);
      coin1Gain.gain.setValueAtTime(0.4 * masterVol, now + 0.04);
      coin1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      coin1.connect(coin1Gain);
      coin1Gain.connect(ctx.destination);
      coin1.start(now + 0.04);
      coin1.stop(now + 0.45);

      // 3. High Coin Ding 2 (B6 - 1975.5 Hz shimmer)
      const coin2 = ctx.createOscillator();
      const coin2Gain = ctx.createGain();
      coin2.type = 'sine';
      coin2.frequency.setValueAtTime(1975.5, now + 0.12);
      coin2Gain.gain.setValueAtTime(0.001, now);
      coin2Gain.gain.setValueAtTime(0.55 * masterVol, now + 0.12);
      coin2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      coin2.connect(coin2Gain);
      coin2Gain.connect(ctx.destination);
      coin2.start(now + 0.12);
      coin2.stop(now + 0.75);

      // 4. Harmonic overtone (E7 - 2637 Hz)
      const coin3 = ctx.createOscillator();
      const coin3Gain = ctx.createGain();
      coin3.type = 'triangle';
      coin3.frequency.setValueAtTime(2637, now + 0.13);
      coin3Gain.gain.setValueAtTime(0.001, now);
      coin3Gain.gain.setValueAtTime(0.2 * masterVol, now + 0.13);
      coin3Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      coin3.connect(coin3Gain);
      coin3Gain.connect(ctx.destination);
      coin3.start(now + 0.13);
      coin3.stop(now + 0.5);
      break;
    }

    case 'jackpot': {
      // Ascending arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const notes = [
        { freq: 523.25, time: 0, dur: 0.18 },
        { freq: 659.25, time: 0.12, dur: 0.18 },
        { freq: 783.99, time: 0.24, dur: 0.22 },
        { freq: 1046.5, time: 0.36, dur: 0.65 },
        { freq: 1318.5, time: 0.48, dur: 0.75 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(0.4 * masterVol, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + dur);
      });
      break;
    }

    case 'bell': {
      // Crisp Crystal Bell
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc2.frequency.setValueAtTime(1760, now); // A6 overtone

      gain.gain.setValueAtTime(0.5 * masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.95);
      osc2.stop(now + 0.95);
      break;
    }

    case 'marimba': {
      // Warm marimba chord (Ding - Dong)
      const chords = [
        { freqs: [659.25, 987.77], time: 0, dur: 0.3 },
        { freqs: [880, 1318.5], time: 0.16, dur: 0.6 },
      ];

      chords.forEach(({ freqs, time, dur }) => {
        freqs.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);
          gain.gain.setValueAtTime(0.35 * masterVol, now + time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + time);
          osc.stop(now + time + dur);
        });
      });
      break;
    }

    case 'arcade': {
      // 8-Bit jump/coin chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.5, now + 0.08);
      gain.gain.setValueAtTime(0.25 * masterVol, now);
      gain.gain.setValueAtTime(0.25 * masterVol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
      break;
    }

    case 'radar': {
      // High-tech cyber double beep
      [0, 0.15].forEach(timeOffset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(1900, now + timeOffset + 0.08);
        gain.gain.setValueAtTime(0.35 * masterVol, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.12);
      });
      break;
    }

    default: {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.3 * masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
  }
}

// ============================================================================
// Dynamic Chrome Tab Favicon Badge Generator
// Dynamically paints a notification pill on the favicon showing 1, 2, 3...
// ============================================================================
let originalFavicon = null;
let lastBadgeCount = -1;

export function updateFaviconBadge(count = 0) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (count === lastBadgeCount) return;
  lastBadgeCount = count;

  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  if (!originalFavicon) {
    originalFavicon = link.href || '/favicon.png';
  }

  if (count <= 0) {
    link.href = originalFavicon;
    return;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(img, 0, 0, 64, 64);

      // Red notification badge bubble with white stroke
      ctx.beginPath();
      ctx.arc(46, 18, 16, 0, 2 * Math.PI);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = count > 99 ? '99+' : `${count}`;
      ctx.fillText(label, 46, 19);

      link.href = canvas.toDataURL('image/png');
    };
    img.onerror = () => {
      ctx.fillStyle = '#08090C';
      ctx.fillRect(0, 0, 64, 64);
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, 2 * Math.PI);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count > 9 ? '9+' : String(count), 32, 33);
      link.href = canvas.toDataURL('image/png');
    };
    img.src = '/favicon.png';
  } catch (e) {
    console.warn('Favicon badge note:', e);
  }
}

// ============================================================================
// Chrome Desktop & Web Push Notification Dispatcher
// Dispatches immediate Chrome desktop notification with sound and focus action
// ============================================================================
export function sendDesktopNotification(title, body, url = '/admin') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const options = {
      body,
      icon: '/apple-touch-icon.png',
      badge: '/apple-touch-icon.png',
      tag: 'zorra-alert-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      silent: false,
    };
    const notification = new window.Notification(title, options);
    notification.onclick = () => {
      window.focus();
      if (url && typeof window !== 'undefined') {
        if (window.location.pathname !== url) {
          window.location.href = url;
        }
      }
      notification.close();
    };
  } catch (err) {
    console.warn('Chrome notification dispatch note:', err);
  }
}

export async function requestDesktopNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return Notification.permission;
  }
}
