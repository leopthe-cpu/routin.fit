import { Check, ChevronLeft, ExternalLink, Play, RotateCcw, Trash2 } from 'lucide-react';
import { useStore, sessionKey, sessionProgress } from '../store';
import { estimateWorkoutMinutes, restSecondsFor, toBlocks } from '../lib/estimate';
import { fromISODate } from '../lib/dates';

const youtubeUrl = (name) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} form`)}`;

function SetDots({ count, done, disabled, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => {
        const on = done.includes(i);
        return (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onToggle(i)}
            aria-label={`Set ${i + 1}${on ? ' done' : ''}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition disabled:opacity-40"
            style={{
              background: on ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${on ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.15)'}`,
            }}
          >
            {on ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
          </button>
        );
      })}
    </div>
  );
}

function ExerciseCard({ ex, session, started, onToggle }) {
  const done = session?.done[ex.id] ?? [];
  const complete = done.length >= ex.sets;
  return (
    <div className={`glass p-4 ${complete ? 'glass-done' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold leading-snug">{ex.name}</h4>
          {ex.note && <p className="mt-0.5 text-xs text-3">{ex.note}</p>}
        </div>
        <a
          href={youtubeUrl(ex.name)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Watch ${ex.name} form on YouTube`}
          className="shrink-0 p-1 text-3 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="pill" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
          {ex.sets} × {ex.target.label}
        </span>
        {!ex.supersetGroup && <span className="text-xs text-3">rest {restSecondsFor(ex)} s</span>}
      </div>
      <div className="mt-3">
        <SetDots count={ex.sets} done={done} disabled={!started} onToggle={(i) => onToggle(ex.id, i)} />
      </div>
    </div>
  );
}

export default function SessionScreen({ date, kind, onBack }) {
  const plan = useStore((s) => s.activePlan());
  const key = sessionKey(date, kind);
  const session = useStore((s) => s.sessions[key]);
  const timer = useStore((s) => s.timer);
  const { startSession, toggleSet, finishSession, reopenSession, discardSession, startMoveTimer } = useStore();

  const dayDate = fromISODate(date);
  const dayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayDate.getDay()];
  // An ongoing or finished session uses its own snapshot; otherwise preview today's plan.
  const day = plan?.days[dayKey];
  const started = !!session && !session.endedAt;
  const finished = !!session?.endedAt;
  const { done, total } = sessionProgress(session);

  const content = session
    ? session.snapshot
    : kind === 'morning'
      ? day?.morning && { title: 'Morning stretches', minutes: day.morning.minutes, items: day.morning.items }
      : day && { title: day.title, exercises: day.exercises };

  if (!content) {
    return (
      <div className="space-y-4">
        <BackButton onBack={onBack} label="Back" />
        <p className="glass p-4 text-sm text-2">Nothing planned for this day.</p>
      </div>
    );
  }

  const isMorning = kind === 'morning';
  const minutes = isMorning ? content.minutes : estimateWorkoutMinutes(content.exercises);
  const previewTotal = isMorning ? content.items.length : content.exercises.reduce((n, e) => n + e.sets, 0);
  const shownTotal = session ? total : previewTotal;
  const allDone = session && done >= total;
  const perMove = isMorning ? Math.max(20, Math.round((content.minutes * 60) / content.items.length)) : 0;

  const start = () => startSession({ date, kind, day, planId: plan.id });
  const onToggle = (itemId, i) => {
    toggleSet(key, itemId, i);
    // Morning routine finishes itself once every move is ticked.
    const s = useStore.getState().sessions[key];
    const p = sessionProgress(s);
    if (isMorning && p.done >= p.total) finishSession(key);
  };

  return (
    <div className="space-y-5 pb-4">
      <BackButton
        onBack={onBack}
        label={dayDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
      />

      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-3">
          {isMorning ? 'Morning stretches' : "Today's workout"}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{content.title}</h1>
        <p className="text-sm text-2">
          ≈ {minutes} min · {shownTotal} {isMorning ? 'moves' : 'sets'}
        </p>
        {session && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${total ? (done / total) * 100 : 0}%`,
                  background: finished ? (done >= total ? '#22c55e' : '#fbbf24') : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                }}
              />
            </div>
            <p className="mt-1 text-xs text-3">
              {finished
                ? `${done >= total ? 'Completed' : `Ended early · ${done}/${total}`} at ${new Date(session.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `${done} of ${total} done`}
            </p>
          </div>
        )}
      </header>

      {!session && (
        <button onClick={start} className="btn-primary flex w-full items-center justify-center gap-2 py-3.5">
          <Play className="h-4 w-4" /> Start {isMorning ? 'stretches' : 'session'}
        </button>
      )}

      {isMorning ? (
        <div className="space-y-2">
          {content.items.map((name, i) => {
            const id = `m-${i}`;
            const on = session?.done[id]?.includes(0);
            const timing = timer?.sessionKey === key && timer.complete?.itemId === id;
            return (
              <div key={id} className={`glass flex items-center gap-3 p-3 ${on ? 'glass-done' : ''}`}>
                <button
                  disabled={!started}
                  onClick={() => onToggle(id, 0)}
                  aria-label={on ? `Untick ${name}` : `Tick ${name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
                  style={{
                    background: on ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${on ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.15)'}`,
                  }}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3} />}
                </button>
                <span className="flex-1 text-sm">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                <a href={youtubeUrl(name)} target="_blank" rel="noreferrer" aria-label={`Watch ${name} on YouTube`} className="p-1 text-3">
                  <ExternalLink className="h-4 w-4" />
                </a>
                {started && !on && (
                  <button
                    onClick={() => startMoveTimer(key, id, perMove, name)}
                    className="pill"
                    style={{ background: timing ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.08)', color: '#22d3ee' }}
                  >
                    <Play className="h-3 w-3" /> {perMove}s
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {toBlocks(content.exercises).map((block, bi) =>
            block.group && block.exercises.length > 1 ? (
              <div key={bi} className="relative pl-4">
                <div className="absolute bottom-3 left-0 top-3 w-1 rounded-full" style={{ background: 'linear-gradient(#6366f1, #06b6d4)' }} />
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#22d3ee' }}>
                  Superset {block.group} · rest {restSecondsFor(block.exercises[0])} s after both
                </p>
                <div className="space-y-2">
                  {block.exercises.map((ex) => (
                    <ExerciseCard key={ex.id} ex={ex} session={session} started={started} onToggle={onToggle} />
                  ))}
                </div>
              </div>
            ) : (
              <ExerciseCard key={block.exercises[0].id} ex={block.exercises[0]} session={session} started={started} onToggle={onToggle} />
            ),
          )}
        </div>
      )}

      {started && (
        <button
          onClick={() => finishSession(key)}
          className={`${allDone ? 'btn-primary' : 'btn-ghost'} flex w-full items-center justify-center gap-2 py-3.5`}
        >
          <Check className="h-4 w-4" /> {allDone ? 'Finish session' : 'End session early'}
        </button>
      )}

      {session && (
        <div className="flex gap-2">
          {finished && (
            <button onClick={() => reopenSession(key)} className="btn-ghost flex flex-1 items-center justify-center gap-2 py-2.5 text-sm">
              <RotateCcw className="h-4 w-4" /> Reopen
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Discard this session and its progress?')) discardSession(key);
            }}
            className="btn-ghost flex flex-1 items-center justify-center gap-2 py-2.5 text-sm text-2"
          >
            <Trash2 className="h-4 w-4" /> Discard
          </button>
        </div>
      )}
    </div>
  );
}

function BackButton({ onBack, label }) {
  return (
    <button onClick={onBack} className="-ml-1 flex items-center gap-1 text-sm text-2">
      <ChevronLeft className="h-4 w-4" /> {label}
    </button>
  );
}
