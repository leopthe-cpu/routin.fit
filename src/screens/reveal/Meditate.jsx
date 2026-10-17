import { useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useStore, meditationProgress } from '../../store';
import { clock } from '../../lib/clock';
import { startAmbient } from '../../lib/ambient';
import { GlassButton, GlassCard } from './parts';

// Breath patterns in seconds. Box breathing for "Breathing"; the others use a
// slow, even in/out rhythm.
const PATTERNS = {
  Breathing: [
    ['Breathe in', 4, 'in'],
    ['Hold', 4, 'hold'],
    ['Breathe out', 4, 'out'],
    ['Hold', 4, 'rest'],
  ],
  default: [
    ['Breathe in', 5, 'in'],
    ['Breathe out', 5, 'out'],
  ],
};

const GUIDES = {
  Breathing: ['Four counts in, four to hold, four out, four to rest.', 'Let the shoulders drop on every out-breath.'],
  'Body scan': [
    'Notice your feet and legs.',
    'Soften your belly and lower back.',
    'Let your shoulders and jaw relax.',
    'Notice your whole body at once.',
  ],
  Mindfulness: [
    'Notice the breath without changing it.',
    'When the mind wanders, gently come back.',
    'Sounds come and go. Let them.',
  ],
  Sleep: ['Let your body grow heavy.', 'Each breath out, sink a little deeper.', 'Nothing to do now.'],
  Focus: [
    'Rest your attention on one breath at a time.',
    'Count ten breaths, then start again.',
    'Back to the breath, as often as needed.',
  ],
};

const OPTIONS = [
  { label: 'Type', options: ['Breathing', 'Body scan', 'Mindfulness', 'Sleep', 'Focus'] },
  { label: 'Length', options: ['3 min', '5 min', '10 min', '15 min', '20 min'] },
  { label: 'Sound', options: ['Rain', 'Silence'] },
];

function phaseAt(type, secs) {
  const pattern = PATTERNS[type] ?? PATTERNS.default;
  const cycle = pattern.reduce((n, p) => n + p[1], 0);
  let t = secs % cycle;
  for (const [word, len, kind] of pattern) {
    if (t < len) return { word, len, kind, left: len - t };
    t -= len;
  }
  return { word: pattern[0][0], len: pattern[0][1], kind: pattern[0][2], left: pattern[0][1] };
}

/** The sun at the bottom of the sky, swelling with each in-breath. */
function BreathSun({ sky, kind, seconds }) {
  const big = kind === 'in' || kind === 'hold';
  return (
    <div
      aria-hidden="true"
      className="breath-sun pointer-events-none absolute inset-0 -z-10"
      style={{
        background: `radial-gradient(70% 45% at 50% 100%, ${sky.dots[0]} 0%, ${sky.dots[1]}AA 35%, transparent 75%)`,
        mixBlendMode: 'screen',
        transform: `scale(${big ? 1.35 : 0.85})`,
        opacity: big ? 0.95 : 0.45,
        transitionDuration: `${seconds}s`,
      }}
    />
  );
}

function Run({ m, sky, now }) {
  const { pauseMeditation, resumeMeditation } = useStore();
  const { elapsed, left } = meditationProgress(m, now);
  const paused = !!m.pausedAt;
  const phase = phaseAt(m.type, Math.floor(elapsed));
  const guides = GUIDES[m.type] ?? GUIDES.Mindfulness;
  const guide = guides[Math.floor(elapsed / 20) % guides.length];

  return (
    <>
      <BreathSun sky={sky} kind={paused ? 'out' : phase.kind} seconds={paused ? 1.2 : phase.len} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="text-[44px] font-light leading-tight">{paused ? 'Paused' : phase.word}</span>
        <span className="max-w-[300px] text-[18px] font-light leading-snug opacity-85">{guide}</span>
      </div>
      <div className="flex items-center justify-between gap-3 pb-1">
        <span className="text-[40px] font-light tabular-nums">{clock(Math.ceil(left))}</span>
        <GlassButton onClick={paused ? resumeMeditation : pauseMeditation} aria-label={paused ? 'Resume' : 'Pause'}>
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {paused ? 'Resume' : 'Pause'}
        </GlassButton>
      </div>
    </>
  );
}

/**
 * Pick a practice, then Begin counts 3-2-1 into a timed session: a breath cue,
 * a short guide line, and the sun swelling and fading with the breath. The
 * session lives in the store, so minimizing keeps it (and its sound) going.
 */
export default function Meditate({ sky, now, countdown }) {
  const musicOn = useStore((s) => s.settings.music);
  const m = useStore((s) => s.meditation);
  const { startMeditation, clearMeditation } = useStore();
  const [picked, setPicked] = useState({ Type: 'Breathing', Length: '5 min', Sound: musicOn ? 'Rain' : 'Silence' });

  if (m && !m.doneAt) return <Run m={m} sky={sky} now={now} />;
  if (m?.doneAt) {
    return (
      <GlassCard className="mt-auto gap-3">
        <p className="text-[30px] font-light leading-tight">Session complete.</p>
        <p className="text-[16px] opacity-85">
          {m.minutes} min of {m.type.toLowerCase()}. Take a moment before you get up.
        </p>
        <GlassButton className="self-start" onClick={clearMeditation}>
          <RotateCcw className="h-4 w-4" /> Again
        </GlassButton>
      </GlassCard>
    );
  }

  const begin = () => {
    // Sound has to start inside the tap.
    if (picked.Sound === 'Rain') startAmbient();
    countdown(() =>
      startMeditation({ type: picked.Type, minutes: parseInt(picked.Length, 10), sound: picked.Sound }),
    );
  };

  return (
    <GlassCard className="mt-auto gap-4">
      <span className="text-[28px] font-light">Pick a practice</span>
      {OPTIONS.map((g) => (
        <div key={g.label} className="flex flex-col gap-2">
          <span className="label text-[10px] opacity-70">{g.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {g.options.map((o) => (
              <button
                key={o}
                onClick={() => setPicked((p) => ({ ...p, [g.label]: o }))}
                aria-pressed={picked[g.label] === o}
                className="min-h-[36px] rounded-2xl px-3 text-sm"
                style={{
                  background: picked[g.label] === o ? 'var(--glass-btn)' : 'transparent',
                  border: '1px solid var(--glass-border)',
                  boxShadow: picked[g.label] === o ? 'inset 0 0 0 1px currentColor' : 'none',
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={begin}
        className="mt-1 flex h-14 items-center justify-center gap-2 rounded-[18px] text-lg font-semibold"
        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
      >
        <Play className="h-5 w-5" fill="currentColor" /> Begin
      </button>
    </GlassCard>
  );
}
