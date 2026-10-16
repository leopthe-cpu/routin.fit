import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Clock, ExternalLink, Play, RotateCcw, Trash2 } from 'lucide-react';
import { useStore, sessionKey, sessionProgress, morningMinutes, moveSeconds } from '../store';
import { estimateWorkoutMinutes, restSecondsFor, toBlocks } from '../lib/estimate';
import { fromISODate } from '../lib/dates';
import { formLinks } from '../lib/youtube';
import { findStretch } from '../data/stretches';
import WeightControl from '../components/WeightControl';

function FormLinks({ name }) {
  const links = formLinks(name);
  return (
    <div className="flex shrink-0 items-center gap-1">
      {links.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Watch ${l.label} form on YouTube`}
          title={l.label}
          className="flex items-center gap-1 rounded-lg p-1 text-3 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          {links.length > 1 && <span className="max-w-[4.5rem] truncate text-[10px]">{l.label.split(' ')[0]}</span>}
        </a>
      ))}
    </div>
  );
}

/** Minutes since the session started, ticking once a second. */
function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = String(secs % 60).padStart(2, '0');
  return <span className="tabular-nums">{h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`}</span>;
}

const dotStyle = (on) => ({
  background: on ? 'rgba(34,197,94,0.9)' : 'rgb(var(--ink-rgb) / 0.06)',
  border: `1px solid ${on ? 'rgba(74,222,128,0.9)' : 'rgb(var(--ink-rgb) / 0.15)'}`,
});

const playStyle = { background: 'var(--accent-grad)', color: 'var(--on-accent)', border: '1px solid rgb(var(--ink-rgb) / 0.25)' };

function SetDots({ count, done, disabled, playFirst, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => {
        const on = done.includes(i);
        const play = playFirst && i === 0;
        return (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onToggle(i)}
            aria-label={play ? 'Start: set 1' : `Set ${i + 1}${on ? ' done' : ''}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition disabled:opacity-40"
            style={play ? playStyle : dotStyle(on)}
          >
            {on ? <Check className="h-4 w-4" strokeWidth={3} /> : play ? <Play className="ml-0.5 h-4 w-4" fill="currentColor" /> : i + 1}
          </button>
        );
      })}
    </div>
  );
}

function ExerciseCard({ ex, session, finished, playFirst, onToggle }) {
  const done = session?.done[ex.id] ?? [];
  const complete = done.length >= ex.sets;
  return (
    <div className={`glass p-4 ${complete ? 'glass-done' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold leading-snug">{ex.name}</h4>
          {ex.note && <p className="mt-0.5 text-xs text-3">{ex.note}</p>}
        </div>
        <FormLinks name={ex.name} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="pill" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
          {ex.sets} × {ex.target.label}
        </span>
        {!ex.supersetGroup && <span className="text-xs text-3">rest {restSecondsFor(ex)} s</span>}
      </div>
      <div className="mt-3">
        <WeightControl name={ex.name} planWeight={ex.startWeight} />
      </div>
      <div className="mt-3">
        <SetDots count={ex.sets} done={done} disabled={finished} playFirst={playFirst} onToggle={(i) => onToggle(ex.id, i)} />
      </div>
    </div>
  );
}

function MoveCard({ name, index, on, timing, seconds, finished, playable, onTick, onPlay }) {
  const stretch = findStretch(name);
  const title = stretch?.name ?? name.charAt(0).toUpperCase() + name.slice(1);
  return (
    <div className={`glass p-4 ${on ? 'glass-done' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold leading-snug">
            <span className="mr-1.5 text-3">{index + 1}.</span>
            {title}
          </h4>
          {stretch && <p className="mt-1 text-xs text-2">{stretch.what}</p>}
        </div>
        <FormLinks name={name} />
      </div>
      {stretch && <p className="mt-2 text-xs leading-relaxed text-3">{stretch.benefit}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          disabled={finished}
          onClick={onTick}
          aria-label={on ? `Untick ${title}` : `Tick ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
          style={dotStyle(on)}
        >
          {on && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1 text-xs">
          <p className="flex items-center gap-1 text-2">
            <Clock className="h-3 w-3 shrink-0" /> {seconds} s
            {stretch?.dose.perSide && ` · switch at ${Math.round(seconds / 2)} s`}
          </p>
          {stretch && <p className="truncate text-3">{stretch.dose.label}</p>}
        </div>
        {playable && !on && (
          <button
            onClick={onPlay}
            aria-label={`Start ${title} timer`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={timing ? { background: 'rgb(var(--ink-rgb) / 0.12)', border: '1px solid var(--accent)' } : playStyle}
          >
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function SessionScreen({ date, kind, onBack, embedded = false }) {
  const plan = useStore((s) => s.activePlan());
  const key = sessionKey(date, kind);
  const session = useStore((s) => s.sessions[key]);
  const timer = useStore((s) => s.timer);
  const { startSession, toggleSet, finishSession, reopenSession, discardSession, startMoveTimer } = useStore();

  const dayDate = fromISODate(date);
  const dayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayDate.getDay()];
  // An ongoing or finished session uses its own snapshot; otherwise preview the plan.
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
  const minutes = isMorning ? morningMinutes(content) : estimateWorkoutMinutes(content.exercises);
  const previewTotal = isMorning ? content.items.length : content.exercises.reduce((n, e) => n + e.sets, 0);
  const shownTotal = session ? total : previewTotal;
  const allDone = session && done >= total;

  // No start button: the first tap on a set or move starts the session.
  const ensureStarted = () => {
    if (!session) startSession({ date, kind, day, planId: plan.id });
  };
  const onToggle = (itemId, i) => {
    ensureStarted();
    toggleSet(key, itemId, i);
  };
  const onPlayMove = (index) => {
    ensureStarted();
    startMoveTimer(key, index);
  };

  return (
    <div className="space-y-5 pb-4">
      {!embedded && (
        <BackButton
          onBack={onBack}
          label={dayDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
        />
      )}

      {/* Embedded in the full-screen view, the title and Start button sit above the list instead. */}
      <header className={embedded && !session ? 'hidden' : undefined}>
        {!embedded && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-3">
              {isMorning ? 'Morning routine' : "Today's workout"}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{content.title}</h1>
            <p className="text-sm text-2">
              ≈ {minutes} min · {shownTotal} {isMorning ? 'moves' : 'sets'}
              {started && (
                <>
                  {' · '}
                  <span className="text-white">
                    <Elapsed since={session.startedAt} />
                  </span>
                </>
              )}
            </p>
          </>
        )}
        {!session && !embedded && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-3">
            <Play className="h-3 w-3" /> Tap the play button to start
            {isMorning ? '; each move flows into the next.' : ' with set 1.'}
          </p>
        )}
        {session && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgb(var(--ink-rgb) / 0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${total ? (done / total) * 100 : 0}%`,
                  background: finished ? (done >= total ? '#22c55e' : '#fbbf24') : 'var(--accent-grad)',
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

      {isMorning ? (
        <div className="space-y-2">
          {content.items.map((name, i) => {
            const id = `m-${i}`;
            return (
              <MoveCard
                key={id}
                name={name}
                index={i}
                on={!!session?.done[id]?.includes(0)}
                timing={timer?.sessionKey === key && timer.complete?.itemId === id}
                seconds={moveSeconds(content, i)}
                finished={finished}
                playable={!finished && (!!session || i === 0)}
                onTick={() => onToggle(id, 0)}
                onPlay={() => onPlayMove(i)}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {toBlocks(content.exercises).map((block, bi) => {
            const cards = block.exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                session={session}
                finished={finished}
                playFirst={!session && ex.id === content.exercises[0].id}
                onToggle={onToggle}
              />
            ));
            return block.group && block.exercises.length > 1 ? (
              <div key={bi} className="relative pl-4">
                <div className="absolute bottom-3 left-0 top-3 w-1 rounded-full" style={{ background: 'var(--accent-grad)' }} />
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Superset {block.group} · rest {restSecondsFor(block.exercises[0])} s after both
                </p>
                <div className="space-y-2">{cards}</div>
              </div>
            ) : (
              cards[0]
            );
          })}
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
    <button onClick={onBack} className="-ml-2 flex min-h-[44px] items-center gap-1 px-2 text-sm text-2">
      <ChevronLeft className="h-4 w-4" /> {label}
    </button>
  );
}
