import { useRef, useState } from 'react';
import { Download, Lock, Upload } from 'lucide-react';
import { useStore } from '../store';

const inputClass =
  'w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-indigo-400 disabled:opacity-50';

function exportData() {
  const { plans, activePlanId, sessions, settings, weights, history } = useStore.getState();
  const safeSettings = { ...settings };
  delete safeSettings.openrouterKey;
  return {
    app: 'routin.fit',
    format: 1,
    exportedAt: new Date().toISOString(),
    plans,
    activePlanId,
    sessions,
    settings: safeSettings,
    weights,
    history,
  };
}

export default function SettingsScreen() {
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
    a.download = `routin-fit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'routin.fit') throw new Error('This is not a routin.fit file.');
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
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>

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
