import { memo, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, ClipboardPaste, ListPlus, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../store';
import { fromISODate, todayISO } from '../lib/dates';
import { EVENT_KINDS, calendarItems, eventId, formatTime, kindInfo, kindsIn, monthGrid, parseSchedule } from '../lib/events';

const inputClass =
  'w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/40';

/** Ask the Plans list below to open its "new plan from text" editor. */
export const NEW_PLAN_EVENT = 'goodays:new-plan';

function KindPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Activity">
      {EVENT_KINDS.map((k) => {
        const on = value === k.id;
        return (
          <button
            key={k.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(k.id)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={on ? { background: 'var(--accent-grad)', color: 'var(--on-accent)' } : { background: 'rgb(var(--ink-rgb) / 0.06)', color: 'var(--text-2)' }}
          >
            <k.icon className="h-3.5 w-3.5" /> {k.label}
          </button>
        );
      })}
    </div>
  );
}

function EventEditor({ initial, onCancel, onSave }) {
  const [e, setE] = useState(initial);
  const put = (patch) => setE((x) => ({ ...x, ...patch }));
  return (
    <div className="glass space-y-3 p-4">
      <KindPicker value={e.kind} onChange={(kind) => put({ kind })} />
      <input value={e.title} onChange={(x) => put({ title: x.target.value })} placeholder={`${kindInfo(e.kind).label} (name)`} className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={e.date} onChange={(x) => x.target.value && put({ date: x.target.value })} aria-label="Date" className={inputClass} />
        <input type="time" value={e.time ?? ''} onChange={(x) => put({ time: x.target.value || null })} aria-label="Time" className={inputClass} />
      </div>
      <input value={e.place} onChange={(x) => put({ place: x.target.value })} placeholder="Where (optional)" className={inputClass} />
      <input value={e.note} onChange={(x) => put({ note: x.target.value })} placeholder="Note (optional)" className={inputClass} />
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1 py-2.5 text-sm">
          Cancel
        </button>
        <button
          onClick={() => onSave({ ...e, title: e.title.trim() || kindInfo(e.kind).label, place: e.place.trim(), note: e.note.trim() })}
          className="btn-primary flex-1 py-2.5 text-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/** Paste a fixture list or training calendar; every date in it becomes an event. */
function ScheduleImport({ onCancel, onAdd }) {
  const [kind, setKind] = useState('soccer');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const found = useMemo(() => parseSchedule(text), [text]);
  const name = title.trim();
  // With a name, every line under a date is detail; without one, the first line names the event.
  const add = () =>
    onAdd(
      found.map((f) => ({
        id: eventId(),
        kind,
        title: name || f.details[0] || kindInfo(kind).label,
        date: f.date,
        time: f.time,
        place: '',
        note: (name ? f.details : f.details.slice(1)).join(' · '),
      })),
    );
  return (
    <div className="glass space-y-3 p-4">
      <p className="text-sm text-2">Paste a schedule: a league's fixtures, a race calendar, a training block. Every date becomes an event.</p>
      <KindPicker value={kind} onChange={setKind} />
      <input value={title} onChange={(x) => setTitle(x.target.value)} placeholder="Name for these, e.g. Olympique DG" className={inputClass} />
      <textarea
        value={text}
        onChange={(x) => setText(x.target.value)}
        rows={7}
        placeholder={'Wed 28 Oct @ 8:00pm\nCentral Tech (4)\n\nSat 31 Oct 7:30am\nLong run, river loop'}
        className={`${inputClass} font-mono text-xs leading-relaxed`}
      />
      {text.trim() && (
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-2">{found.length ? `Found ${found.length} date${found.length > 1 ? 's' : ''}` : 'No dates found yet'}</p>
          {found.map((f, i) => (
            <p key={i} className="flex gap-2 text-3">
              <span className="w-24 shrink-0 text-2">
                {fromISODate(f.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="w-14 shrink-0">{formatTime(f.time)}</span>
              <span className="truncate">{f.details[0] ?? ''}</span>
            </p>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1 py-2.5 text-sm">
          Cancel
        </button>
        <button disabled={!found.length} onClick={add} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-40">
          Add {found.length || ''} event{found.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
}

function AddMenu({ onPick, onClose }) {
  const options = [
    { id: 'event', icon: CalendarPlus, title: 'Event', sub: 'A game, run, ride or class' },
    { id: 'schedule', icon: ClipboardPaste, title: 'Paste a schedule', sub: 'Fixtures or a training calendar' },
    { id: 'plan', icon: ListPlus, title: 'Workout plan', sub: 'A weekly plan from text' },
  ];
  return (
    <div className="glass space-y-1 p-2">
      {options.map((o) => (
        <button key={o.id} onClick={() => onPick(o.id)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left active:bg-white/5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgb(var(--ink-rgb) / 0.07)' }}>
            <o.icon className="h-4 w-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{o.title}</span>
            <span className="text-xs text-3">{o.sub}</span>
          </span>
        </button>
      ))}
      <button onClick={onClose} className="w-full py-2 text-xs text-3">
        Cancel
      </button>
    </div>
  );
}

function Agenda({ iso, items, onOpenSession, onEdit, onDelete }) {
  const when = fromISODate(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="space-y-2">
      <p className="label text-3">{when}</p>
      {!items.length && <p className="text-sm text-3">Nothing here. A free day.</p>}
      {items.map((it) => {
        const k = kindInfo(it.kind);
        const done = it.status === 'done' || it.status === 'partial';
        const body = (
          <>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: done ? 'var(--accent)' : 'rgb(var(--ink-rgb) / 0.07)', color: done ? 'var(--on-accent)' : undefined }}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <k.icon className="h-4 w-4" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="line-clamp-2 text-[15px] font-medium leading-snug">{it.title}</span>
              <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-3">
                {k.label}
                {it.time && ` · ${formatTime(it.time)}`}
                {it.place && (
                  <>
                    {' · '}
                    <MapPin className="h-3 w-3 shrink-0" /> {it.place}
                  </>
                )}
              </span>
              {it.note && <span className="line-clamp-2 text-xs text-3">{it.note}</span>}
            </span>
          </>
        );
        if (!it.eventId) {
          return (
            <button
              key={it.id}
              onClick={() => onOpenSession(iso, it.kind === 'stretch' ? 'morning' : 'workout')}
              className="glass tile flex w-full items-center gap-3 p-3 text-left"
            >
              {body}
            </button>
          );
        }
        return (
          <div key={it.id} className="glass flex items-center gap-3 p-3">
            {body}
            <button onClick={() => onEdit(it.eventId)} aria-label={`Edit ${it.title}`} className="p-1 text-3">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => confirm(`Delete "${it.title}"?`) && onDelete(it.eventId)} aria-label={`Delete ${it.title}`} className="p-1 text-3">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * The month at a glance: the plan's stretches and workouts plus every event,
 * a filter that offers only what's in view, and the chosen day's agenda.
 */
function CalendarSection({ selectedDate, onSelectDate, onOpenSession }) {
  const plan = useStore((s) => s.activePlan());
  const sessions = useStore((s) => s.sessions);
  const events = useStore((s) => s.events);
  const { addEvents, updateEvent, deleteEvent } = useStore.getState();
  const [month, setMonth] = useState(selectedDate);
  const [filter, setFilter] = useState('all');
  const [mode, setMode] = useState(null); // null | 'menu' | 'event' | 'schedule' | event id (editing)
  const today = todayISO();

  // Follow the week view when it moves to another month.
  useEffect(() => setMonth(selectedDate), [selectedDate]);

  const grid = useMemo(() => monthGrid(month), [month]);
  const byDay = useMemo(() => calendarItems({ plan, sessions, events }, grid.map((g) => g.iso)), [plan, sessions, events, grid]);
  const inMonth = useMemo(() => Object.fromEntries(grid.filter((g) => g.inMonth).map((g) => [g.iso, byDay[g.iso]])), [grid, byDay]);
  const kinds = kindsIn(inMonth);
  const active = kinds.some((k) => k.id === filter) ? filter : 'all';
  const shown = (items) => (active === 'all' ? items : items.filter((i) => i.kind === active));

  const first = fromISODate(month);
  const shiftMonth = (n) => {
    const d = new Date(first.getFullYear(), first.getMonth() + n, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const pick = (choice) => {
    if (choice === 'plan') {
      setMode(null);
      window.dispatchEvent(new Event(NEW_PLAN_EVENT));
    } else setMode(choice);
  };
  const editing = mode && !['menu', 'event', 'schedule'].includes(mode) ? events.find((e) => e.id === mode) : null;

  return (
    <section className="space-y-3" aria-label="Calendar">
      <div className="flex items-center gap-1">
        <h2 className="flex-1 text-xl font-bold">
          {first.toLocaleDateString(undefined, { month: 'long', year: first.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })}
        </h2>
        <button aria-label="Previous month" onClick={() => shiftMonth(-1)} className="flex h-9 w-9 items-center justify-center text-3">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button aria-label="Next month" onClick={() => shiftMonth(1)} className="flex h-9 w-9 items-center justify-center text-3">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setMode(mode ? null : 'menu')}
          aria-label={mode ? 'Close' : 'Add'}
          className="ml-1 flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold"
          style={{ background: 'var(--accent-grad)', color: 'var(--on-accent)' }}
        >
          {mode ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {mode ? '' : 'Add'}
        </button>
      </div>

      {mode === 'menu' && <AddMenu onPick={pick} onClose={() => setMode(null)} />}
      {mode === 'event' && (
        <EventEditor
          initial={{ id: eventId(), kind: 'run', title: '', date: selectedDate, time: null, place: '', note: '' }}
          onCancel={() => setMode(null)}
          onSave={(e) => {
            addEvents([e]);
            onSelectDate(e.date);
            setMode(null);
          }}
        />
      )}
      {mode === 'schedule' && (
        <ScheduleImport
          onCancel={() => setMode(null)}
          onAdd={(list) => {
            addEvents(list);
            onSelectDate(list[0].date);
            setMode(null);
          }}
        />
      )}
      {editing && (
        <EventEditor
          key={editing.id}
          initial={editing}
          onCancel={() => setMode(null)}
          onSave={(e) => {
            updateEvent(e.id, e);
            onSelectDate(e.date);
            setMode(null);
          }}
        />
      )}

      {/* Only the kinds this month actually has. */}
      {kinds.length > 1 && (
        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5" role="radiogroup" aria-label="Show">
          {[{ id: 'all', plural: 'All' }, ...kinds].map((k) => {
            const on = active === k.id;
            return (
              <button
                key={k.id}
                role="radio"
                aria-checked={on}
                onClick={() => setFilter(k.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={on ? { background: 'var(--accent-grad)', color: 'var(--on-accent)' } : { background: 'rgb(var(--ink-rgb) / 0.06)', color: 'var(--text-2)' }}
              >
                {k.icon && <k.icon className="h-3.5 w-3.5" />} {k.plural}
              </button>
            );
          })}
        </div>
      )}

      <div className="glass p-2">
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="label py-1 text-[10px] text-3">
              {w}
            </span>
          ))}
          {grid.map((g) => {
            const items = shown(byDay[g.iso]);
            const sel = g.iso === selectedDate;
            return (
              <button
                key={g.iso}
                onClick={() => onSelectDate(g.iso)}
                aria-label={`${g.date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${items.length} item${items.length === 1 ? '' : 's'}`}
                aria-pressed={sel}
                className="flex h-[52px] flex-col items-center gap-1 rounded-xl pt-1.5"
                style={{
                  opacity: g.inMonth ? 1 : 0.35,
                  background: sel ? 'rgb(var(--ink-rgb) / 0.12)' : 'transparent',
                }}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] tabular-nums ${g.iso === today ? 'font-bold' : ''}`}
                  style={g.iso === today ? { background: 'var(--accent-grad)', color: 'var(--on-accent)' } : undefined}
                >
                  {g.date.getDate()}
                </span>
                <span className="flex items-center gap-0.5">
                  {items.slice(0, 3).map((it) => {
                    const Icon = kindInfo(it.kind).icon;
                    const done = it.status === 'done' || it.status === 'partial';
                    return <Icon key={it.id} className="h-2.5 w-2.5" strokeWidth={2.4} style={{ opacity: done ? 0.4 : 0.85 }} aria-hidden="true" />;
                  })}
                  {items.length > 3 && <span className="text-[9px] leading-none text-3">+{items.length - 3}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Agenda
        iso={selectedDate}
        items={shown(byDay[selectedDate] ?? calendarItems({ plan, sessions, events }, [selectedDate])[selectedDate])}
        onOpenSession={onOpenSession}
        onEdit={(id) => setMode(id)}
        onDelete={deleteEvent}
      />
    </section>
  );
}

// Memoized: the app shell redraws on page and sky changes; this section only needs its own data.
export default memo(CalendarSection);
