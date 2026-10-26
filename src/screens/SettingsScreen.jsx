import { memo, useRef, useState } from 'react';
import { Download, Lock, Upload } from 'lucide-react';
import { clearWeatherCache } from '../lib/weather';
import { useStore } from '../store';

const inputClass =
  'w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40 disabled:opacity-50';

function exportData() {
  const { plans, activePlanId, sessions, settings, weights, history, goals, goalChecks, events } = useStore.getState();
  const safeSettings = { ...settings };
  delete safeSettings.openrouterKey;
  return {
    app: 'goodays',
    format: 1,
    exportedAt: new Date().toISOString(),
    plans,
    activePlanId,
    sessions,
    settings: safeSettings,
    weights,
    history,
    goals,
    goalChecks,
    events,
  };
}

function Toggle({ label, note, on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} className="flex w-full items-center justify-between gap-3 py-1 text-left">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {note && <span className="block text-xs text-3">{note}</span>}
      </span>
      <span className="relative h-7 w-12 shrink-0 rounded-full transition" style={{ background: on ? 'var(--accent)' : 'rgb(var(--ink-rgb) / 0.12)' }}>
        <span
          className="absolute top-1 h-5 w-5 rounded-full transition-all"
          style={{ left: on ? '1.5rem' : '0.25rem', background: on ? 'var(--on-accent)' : 'var(--text-2)' }}
        />
      </span>
    </button>
  );
}

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex rounded-xl p-1" style={{ background: 'rgb(var(--ink-rgb) / 0.06)' }} role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className="rounded-lg px-3.5 py-1 text-sm font-semibold"
            style={value === v ? { background: 'var(--accent-grad)', color: 'var(--on-accent)' } : { color: 'var(--text-2)' }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const importData = useStore((s) => s.importData);
  const counts = {
    sessions: useStore((s) => Object.keys(s.sessions).length),
    history: useStore((s) => s.history.length),
    weights: useStore((s) => Object.keys(s.weights).length),
  };
  const fileRef = useRef(null);
  const [message, setMessage] = useState('');

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goodays-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      // Backups made before the rename say 'routin.fit'.
      if (data.app !== 'goodays' && data.app !== 'routin.fit') throw new Error('This is not a goodays backup.');
      const before = useStore.getState();
      importData(data);
      const after = useStore.getState();
      setMessage(
        `Imported ${after.history.length - before.history.length} past workouts and ${
          Object.keys(after.weights).length - Object.keys(before.weights).length
        } new weights.`,
      );
    } catch (err) {
      setMessage(`Couldn't import: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="sticky-head">
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>

      <section className="glass space-y-4 p-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Your name</span>
          <span className="block text-xs text-3">Used in the greeting on Today.</span>
          <input
            value={settings.name}
            onChange={(e) => setSettings({ name: e.target.value.slice(0, 30) })}
            placeholder="Name"
            autoComplete="given-name"
            className={inputClass}
          />
        </label>
        <Toggle
          label="Local weather"
          note="Uses your location, rounded to about 1 km, to ask Open-Meteo for the weather. Nothing is stored on a server."
          on={settings.weather === 'on'}
          onChange={(on) => {
            if (!on) clearWeatherCache();
            setSettings({ weather: on ? 'on' : 'off' });
          }}
        />
        <Segmented
          label="Temperature"
          value={settings.tempUnit}
          options={[['celsius', '°C'], ['fahrenheit', '°F']]}
          onChange={(v) => setSettings({ tempUnit: v })}
        />
        <Toggle
          label="Session sound"
          note="Soft rain during stretches and meditation. Mute any time."
          on={settings.music}
          onChange={(on) => setSettings({ music: on })}
        />
      </section>

      <section className="glass space-y-2 p-4">
        <h2 className="font-semibold">Connections</h2>
        {[
          ['Strava', 'Post your sessions as activities'],
          ['Apple Health / Health Connect', 'Heart rate and calories from your watch'],
        ].map(([name, note]) => (
          <div key={name} className="flex items-center justify-between gap-3 py-1">
            <span>
              <span className="block text-sm font-semibold">{name}</span>
              <span className="block text-xs text-3">{note}</span>
            </span>
            <span className="label shrink-0 text-[10px] text-3">With the app</span>
          </div>
        ))}
      </section>

      <section className="glass space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-3" />
          <h2 className="font-semibold">Account</h2>
        </div>
        <p className="text-xs text-3">
          Sign-in arrives after the test phase. Until then everything is saved on this device only, so keep a backup.
        </p>
        <input disabled placeholder="Email" className={inputClass} />
        <input disabled type="password" placeholder="Password" className={inputClass} />
      </section>

      <section className="glass space-y-3 p-4">
        <div>
          <h2 className="font-semibold">Backup</h2>
          <p className="mt-0.5 text-xs text-3">
            {counts.sessions} sessions · {counts.history} imported workouts · {counts.weights} saved weights
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={download} className="btn-ghost flex flex-1 items-center justify-center gap-2 py-2.5 text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" />
        </div>
        {message && <p className="text-xs text-2">{message}</p>}
      </section>

      <section className="glass space-y-3 p-4">
        <div>
          <h2 className="font-semibold">AI plan import (optional)</h2>
          <p className="mt-0.5 text-xs text-3">
            Only used when a pasted plan can't be read. Uses OpenRouter; the key stays on this device and is never
            included in backups.
          </p>
        </div>
        <input
          type="password"
          value={settings.openrouterKey}
          onChange={(e) => setSettings({ openrouterKey: e.target.value.trim() })}
          placeholder="OpenRouter API key"
          autoComplete="off"
          className={inputClass}
        />
        <input
          value={settings.openrouterModel}
          onChange={(e) => setSettings({ openrouterModel: e.target.value.trim() })}
          placeholder="Model id, as listed on openrouter.ai/models"
          className={inputClass}
        />
      </section>
    </div>
  );
}

// Memoized: the app shell redraws on page and sky changes; this page only needs its own data.
export default memo(SettingsScreen);
