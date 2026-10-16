import { useState } from 'react';
import { Eyebrow, GlassCard } from './parts';

const MEDITATION = [
  { label: 'Type', options: ['Breathing', 'Body scan', 'Mindfulness', 'Sleep', 'Focus'] },
  { label: 'Length', options: ['3 min', '5 min', '10 min', '15 min', '20 min'] },
  { label: 'Sound', options: ['Rain', 'Ocean', 'Forest', 'Silence'] },
];

export function MeditatePreview() {
  const [picked, setPicked] = useState({ Type: 'Breathing', Length: '5 min', Sound: 'Rain' });
  return (
    <GlassCard className="mt-auto gap-4">
      <Eyebrow>Meditate · coming soon</Eyebrow>
      <span className="text-[28px] font-light">Pick a practice</span>
      {MEDITATION.map((g) => (
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
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-sm leading-snug opacity-80">
        Guided sessions arrive in a later version. The rain sound you hear is the one stretches use.
      </p>
    </GlassCard>
  );
}

const ALARMS = [
  { time: '6:30', sound: 'Sunrise, slow fade-in', days: 'Weekdays' },
  { time: '8:00', sound: 'Birdsong', days: 'Sat, Sun' },
];

export function AlarmsPreview() {
  return (
    <GlassCard className="mt-auto gap-1">
      <Eyebrow>Alarms · coming with the phone app</Eyebrow>
      {ALARMS.map((a) => (
        <div key={a.time} className="flex items-center justify-between py-3 opacity-80" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <span className="flex flex-col gap-0.5">
            <span className="text-[34px] font-light leading-none">{a.time}</span>
            <span className="text-[13px]">
              {a.sound} · {a.days}
            </span>
          </span>
          <span className="label text-[10px]">Example</span>
        </div>
      ))}
      <p className="mt-3 text-sm leading-snug opacity-85">
        Gentle alarms that brighten like a sunrise. A web app can&rsquo;t reliably ring when your phone is locked, so real
        alarms come with the iPhone and Android app.
      </p>
    </GlassCard>
  );
}
