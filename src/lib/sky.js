// The sky at the top of Today follows the clock: five looks through the day.
// Each sky has a base colour, a low sun glow, a haze from the top, an ink colour
// for text drawn on it, three accent dots and a fill for the week bar.

export const SKIES = {
  early: {
    base: '#7F8CC4',
    ink: '#FFFFFF',
    dots: ['#F28A5B', '#F7B267', '#B9A6F2'],
    glow: 'radial-gradient(120% 70% at 50% 108%, #FF6A2B 0%, #FF9A4D 22%, #F2C2A0 42%, rgba(196,182,224,0.6) 62%, rgba(127,140,196,0) 82%)',
    haze: 'linear-gradient(180deg, rgba(110,124,190,0.9) 0%, rgba(110,124,190,0) 55%)',
    bar: 'linear-gradient(90deg, #F6E3B4 0%, #F2C2A0 45%, #B9C8F0 100%)',
  },
  morning: {
    base: '#8EC9F4',
    ink: '#14202E',
    dots: ['#FFC24A', '#FFE08A', '#8EC9F4'],
    glow: 'radial-gradient(120% 75% at 50% 110%, #FFB23A 0%, #FFD36E 24%, #FFF0C2 44%, rgba(190,228,250,0.6) 64%, rgba(142,201,244,0) 84%)',
    haze: 'linear-gradient(180deg, rgba(120,190,240,0.85) 0%, rgba(120,190,240,0) 55%)',
    bar: 'linear-gradient(90deg, #FFE7A3 0%, #FFF4D6 45%, #BFE3FA 100%)',
  },
  afternoon: {
    base: '#4AA8EE',
    ink: '#0F2236',
    dots: ['#FFF6C8', '#9ED8FF', '#4AA8EE'],
    glow: 'radial-gradient(110% 80% at 50% 112%, #FFFBE6 0%, #FFF3B8 22%, #CDEBFF 48%, rgba(120,195,245,0.6) 68%, rgba(74,168,238,0) 86%)',
    haze: 'linear-gradient(180deg, rgba(56,150,230,0.9) 0%, rgba(56,150,230,0) 50%)',
    bar: 'linear-gradient(90deg, #FFF6C8 0%, #CDEBFF 55%, #7CC4F5 100%)',
  },
  late: {
    base: '#F5B97E',
    ink: '#2A120A',
    dots: ['#E8442B', '#FF8C42', '#FFD08A'],
    glow: 'radial-gradient(115% 70% at 50% 110%, #D9301E 0%, #F25C2A 20%, #FF9248 40%, rgba(255,200,140,0.7) 62%, rgba(245,185,126,0) 84%)',
    haze: 'linear-gradient(180deg, rgba(255,214,160,0.9) 0%, rgba(255,214,160,0) 55%)',
    bar: 'linear-gradient(90deg, #FFE0B0 0%, #FFB27A 50%, #F25C2A 100%)',
  },
  evening: {
    base: '#0E1A3A',
    ink: '#F2F6FF',
    dots: ['#CFE4FF', '#7FA8E6', '#3A5A9C'],
    glow: 'radial-gradient(110% 70% at 50% 112%, #E8F2FF 0%, #A9CBF5 18%, #4F78C2 40%, rgba(32,54,110,0.7) 62%, rgba(14,26,58,0) 84%)',
    haze: 'linear-gradient(180deg, rgba(8,14,34,0.95) 0%, rgba(8,14,34,0) 60%)',
    bar: 'linear-gradient(90deg, #E8F2FF 0%, #A9CBF5 50%, #4F78C2 100%)',
  },
};

/** Which sky to show at a given hour (0–23). */
export function slotFor(hour) {
  if (hour >= 5 && hour < 7) return 'early';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'afternoon';
  if (hour >= 15 && hour < 18) return 'late';
  return 'evening';
}

export function greetingFor(slot) {
  if (slot === 'early' || slot === 'morning') return 'Good morning';
  if (slot === 'afternoon' || slot === 'late') return 'Good afternoon';
  return 'Good evening';
}

/** Glass panels laid over the full sky: lighter on bright skies, subtler on dark ones. */
export function glassFor(sky) {
  const dark = sky.ink === '#FFFFFF' || sky.ink === '#F2F6FF';
  return dark
    ? { bg: 'rgba(255,255,255,0.16)', border: 'rgba(255,255,255,0.38)', btn: 'rgba(255,255,255,0.14)', track: 'rgba(255,255,255,0.3)', onInk: '#1A1F3A', inkRgb: '242 246 255', solid: 'rgba(18, 24, 52, 0.8)', card: 'rgba(18, 24, 52, 0.42)' }
    : { bg: 'rgba(255,255,255,0.32)', border: 'rgba(255,255,255,0.6)', btn: 'rgba(255,255,255,0.35)', track: 'rgba(20,32,46,0.15)', onInk: '#FFFFFF', inkRgb: hexToRgb(sky.ink), solid: 'rgba(255, 255, 255, 0.86)', card: 'rgba(255, 255, 255, 0.5)' };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export const PHRASES = [
  'Another beautiful day out there.',
  'Small steps, every single day.',
  'Show up. That is most of it.',
  'The best session is the one you start.',
  'Slow is smooth. Smooth is strong.',
  'Breathe in. Today counts.',
  'Strong is built quietly.',
  'Move a little. Feel a lot better.',
  'Consistency beats intensity.',
  'Your future self says thanks.',
  'Five minutes still counts.',
  'Stand tall. Breathe deep.',
  'Progress, not perfection.',
  'Rest is part of the plan.',
  'Keep the promise you made yourself.',
  'Good form, good day.',
  'One more good habit today.',
  'Calm mind, strong body.',
  'Make today a little lighter.',
  'You are allowed to enjoy this.',
];

/** A phrase for this visit, never the same as the last one shown. */
export function pickPhrase(lastIndex, random = Math.random) {
  if (PHRASES.length < 2) return 0;
  let i = Math.floor(random() * PHRASES.length);
  if (i === lastIndex) i = (i + 1) % PHRASES.length;
  return i;
}
