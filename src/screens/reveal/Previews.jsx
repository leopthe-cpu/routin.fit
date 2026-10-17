import { Eyebrow, GlassCard } from './parts';

const ALARMS = [
  { time: '6:30', sound: 'Sunrise, slow fade-in', days: 'Weekdays' },
  { time: '8:00', sound: 'Birdsong', days: 'Sat, Sun' },
];

export function AlarmsPreview() {
  return (
    <GlassCard className="mt-auto gap-1">
      <Eyebrow>Alarms · coming with the phone app</Eyebrow>
      {ALARMS.map((a) => (
        <div
          key={a.time}
          className="flex items-center justify-between py-3 opacity-80"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
        >
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
        Gentle alarms that brighten like a sunrise. A web app can&rsquo;t reliably ring when your phone is locked, so
        real alarms come with the iPhone and Android app.
      </p>
    </GlassCard>
  );
}
