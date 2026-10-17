import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { parsePlanText } from './lib/parsePlan';
import { restSecondsFor } from './lib/estimate';
import { todayISO } from './lib/dates';
import { exerciseKey } from './lib/weights';
import { findStretch } from './data/stretches';
import { moveSeconds } from './lib/morning';
import { DEFAULT_PLAN_NAME, DEFAULT_PLAN_TEXT } from './data/defaultPlan';

// localStorage can throw (private mode, blocked storage). Fall back to memory.
const memory = new Map();
const safeStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

export function makePlan(name, text, startDate = todayISO()) {
  const { days } = parsePlanText(text);
  return {
    id: `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    sourceText: text,
    startDate,
    createdAt: new Date().toISOString(),
    days,
  };
}

export const sessionKey = (date, kind) => `${date}|${kind}`;

export { moveSeconds, morningMinutes } from './lib/morning';

/** Items a session tracks: exercises for a workout, moves for the morning routine. */
export function sessionItems(session) {
  if (session.kind === 'morning') {
    return session.snapshot.items.map((name, i) => ({ id: `m-${i}`, name, sets: 1 }));
  }
  return session.snapshot.exercises;
}

export function sessionProgress(session) {
  if (!session) return { done: 0, total: 0 };
  const items = sessionItems(session);
  const total = items.reduce((n, it) => n + it.sets, 0);
  const done = items.reduce((n, it) => n + (session.done[it.id]?.length ?? 0), 0);
  return { done, total };
}

/** 'todo' | 'progress' | 'done' | 'partial' (ended before every set was ticked). */
export function sessionStatus(session) {
  if (!session) return 'todo';
  if (!session.endedAt) return 'progress';
  const { done, total } = sessionProgress(session);
  return done >= total ? 'done' : 'partial';
}

/** Whole seconds left on a timer, counting a paused timer as stopped. */
export function timerLeft(timer, now = Date.now()) {
  if (!timer) return 0;
  return Math.max(0, Math.ceil((timer.endsAt - (timer.pausedAt ?? now)) / 1000));
}

const initialPlan = makePlan(DEFAULT_PLAN_NAME, DEFAULT_PLAN_TEXT);

export const useStore = create(
  persist(
    (set, get) => ({
      plans: [initialPlan],
      activePlanId: initialPlan.id,
      sessions: {},
      activeSessionKey: null,
      // { endsAt, total, label, sessionKey, complete?: { itemId, setIndex } }
      timer: null,
      settings: {
        openrouterKey: '',
        openrouterModel: '',
        unit: 'kg',
        name: '',
        // 'on' once the user has asked for weather (it needs location permission).
        weather: 'off',
        tempUnit: 'celsius',
        music: true,
      },
      // Index of the greeting phrase shown last, so the next visit gets a new one.
      lastPhrase: -1,
      // Simple recurring goals shown on Today: { id, title, days: ['Mon', …] }.
      goals: [],
      // Goal ticks per day: { 'YYYY-MM-DD|goalId': true }.
      goalChecks: {},
      // Current working weight per exercise key: { value, unit, updatedAt }. Stays until changed.
      weights: {},
      // Imported past workouts: [{ date, key, name, sets: [{ value, unit }] }]
      history: [],

      activePlan: () => {
        const { plans, activePlanId } = get();
        return plans.find((p) => p.id === activePlanId) ?? plans[0];
      },

      addPlan: (plan, makeActive = true) =>
        set((s) => ({ plans: [...s.plans, plan], activePlanId: makeActive ? plan.id : s.activePlanId })),
      updatePlan: (id, patch) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deletePlan: (id) =>
        set((s) => {
          const plans = s.plans.filter((p) => p.id !== id);
          return { plans, activePlanId: s.activePlanId === id ? plans[0]?.id ?? null : s.activePlanId };
        }),
      setActivePlan: (id) => set({ activePlanId: id }),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setLastPhrase: (i) => set({ lastPhrase: i }),

      addGoal: (title, days) =>
        set((s) => ({
          goals: [...s.goals, { id: `goal-${Date.now().toString(36)}`, title, days }],
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      toggleGoal: (date, id) =>
        set((s) => {
          const goalChecks = { ...s.goalChecks };
          const k = `${date}|${id}`;
          if (goalChecks[k]) delete goalChecks[k];
          else goalChecks[k] = true;
          return { goalChecks };
        }),

      setWeight: (key, value, unit) =>
        set((s) => ({
          weights: { ...s.weights, [key]: { value, unit, updatedAt: new Date().toISOString() } },
        })),

      /** Merge a backup or an import file. Newer weights win; history is de-duplicated. */
      importData: (data) =>
        set((s) => {
          const weights = { ...s.weights };
          for (const [k, w] of Object.entries(data.weights ?? {})) {
            if (!weights[k] || (w.updatedAt ?? '') > (weights[k].updatedAt ?? '')) weights[k] = w;
          }
          const seen = new Set(s.history.map((h) => `${h.date}|${h.key}`));
          const history = [...s.history];
          for (const h of data.history ?? []) {
            if (!seen.has(`${h.date}|${h.key}`)) {
              history.push(h);
              seen.add(`${h.date}|${h.key}`);
            }
          }
          const ids = new Set(s.plans.map((p) => p.id));
          const plans = [...s.plans, ...(data.plans ?? []).filter((p) => !ids.has(p.id))];
          const sessions = { ...(data.sessions ?? {}), ...s.sessions };
          const goalIds = new Set(s.goals.map((g) => g.id));
          const goals = [...s.goals, ...(data.goals ?? []).filter((g) => !goalIds.has(g.id))];
          const goalChecks = { ...(data.goalChecks ?? {}), ...s.goalChecks };
          return { weights, history, plans, sessions, goals, goalChecks };
        }),

      /** Start (or resume) a session. The day's content is snapshotted so later plan edits don't break it. */
      startSession: ({ date, kind, day, planId }) => {
        const key = sessionKey(date, kind);
        const existing = get().sessions[key];
        if (existing && !existing.endedAt) {
          set({ activeSessionKey: key });
          return key;
        }
        const snapshot =
          kind === 'morning'
            ? { title: 'Morning stretches', minutes: day.morning.minutes, items: day.morning.items }
            : { title: day.title, exercises: day.exercises };
        set((s) => ({
          activeSessionKey: key,
          sessions: {
            ...s.sessions,
            [key]: {
              key, kind, date, dayKey: day.key, planId, snapshot,
              startedAt: new Date().toISOString(), endedAt: null, done: {},
            },
          },
        }));
        return key;
      },

      toggleSet: (key, itemId, setIndex) => {
        const session = get().sessions[key];
        if (!session || session.endedAt) return;
        const current = session.done[itemId] ?? [];
        const checking = !current.includes(setIndex);
        const nextDone = {
          ...session.done,
          [itemId]: checking ? [...current, setIndex].sort((a, b) => a - b) : current.filter((i) => i !== setIndex),
        };
        // Remember the weight each workout set was done with, for progress charts.
        let loads = session.loads ?? {};
        if (session.kind === 'workout') {
          const item = session.snapshot.exercises.find((e) => e.id === itemId);
          const w = item && (get().weights[exerciseKey(item.name)] ?? item.startWeight);
          const byItem = { ...(loads[itemId] ?? {}) };
          if (checking && w) byItem[setIndex] = { value: w.value, unit: w.unit };
          if (!checking) delete byItem[setIndex];
          loads = { ...loads, [itemId]: byItem };
        }
        const updated = { ...session, done: nextDone, loads };
        set((s) => ({ sessions: { ...s.sessions, [key]: updated } }));

        if (!checking) return;
        if (session.kind === 'workout') {
          get().maybeStartRest(updated, itemId, setIndex);
          return;
        }
        const t = get().timer;
        if (t?.complete?.itemId === itemId) set({ timer: null });
        // The morning routine finishes itself once every move is ticked.
        const p = sessionProgress(updated);
        if (p.done >= p.total) get().finishSession(key);
      },

      maybeStartRest: (session, itemId, setIndex) => {
        const items = sessionItems(session);
        const ex = items.find((e) => e.id === itemId);
        const { done, total } = sessionProgress(session);
        if (!ex || done >= total) return;
        if (ex.supersetGroup) {
          const partners = items.filter((e) => e.supersetGroup === ex.supersetGroup);
          const roundDone = partners.every((p) => setIndex >= p.sets || session.done[p.id]?.includes(setIndex));
          if (!roundDone) return;
        }
        const seconds = restSecondsFor(ex);
        set({
          timer: { endsAt: Date.now() + seconds * 1000, total: seconds, label: 'Rest', sessionKey: session.key },
        });
      },

      /**
       * Timed morning move. Ticks the move off when it ends and starts the next one;
       * moves done per side get a halfway cue to switch.
       */
      startMoveTimer: (key, index) => {
        const session = get().sessions[key];
        if (!session) return;
        const name = session.snapshot.items[index];
        const seconds = moveSeconds(session.snapshot, index);
        const stretch = findStretch(name);
        const now = Date.now();
        set({
          timer: {
            endsAt: now + seconds * 1000,
            total: seconds,
            label: stretch?.name ?? name.charAt(0).toUpperCase() + name.slice(1),
            sessionKey: key,
            complete: { itemId: `m-${index}`, setIndex: 0 },
            switchAt: stretch?.dose.perSide ? now + (seconds * 1000) / 2 : null,
            sideLabels: stretch?.dose.sideLabels ?? ['First side', 'Second side'],
          },
        });
      },

      /** Freeze the timer; resuming shifts its end (and switch cue) by the time spent paused. */
      pauseTimer: () =>
        set((s) => (s.timer && !s.timer.pausedAt ? { timer: { ...s.timer, pausedAt: Date.now() } } : {})),
      resumeTimer: () =>
        set((s) => {
          if (!s.timer?.pausedAt) return {};
          const shift = Date.now() - s.timer.pausedAt;
          const rest = { ...s.timer };
          delete rest.pausedAt;
          return {
            timer: { ...rest, endsAt: rest.endsAt + shift, switchAt: rest.switchAt ? rest.switchAt + shift : rest.switchAt },
          };
        }),

      adjustTimer: (deltaSeconds) =>
        set((s) =>
          s.timer ? { timer: { ...s.timer, endsAt: s.timer.endsAt + deltaSeconds * 1000, total: s.timer.total + deltaSeconds } } : {},
        ),
      clearTimer: () => set({ timer: null }),

      /** Called by the app-wide ticker when a timer runs out. */
      expireTimer: () => {
        const t = get().timer;
        if (!t) return;
        set({ timer: null });
        if (t.complete) {
          const session = get().sessions[t.sessionKey];
          if (session && !session.done[t.complete.itemId]?.includes(t.complete.setIndex)) {
            get().toggleSet(t.sessionKey, t.complete.itemId, t.complete.setIndex);
          }
          // Flow straight into the next unticked move.
          const after = get().sessions[t.sessionKey];
          if (after?.kind === 'morning' && !after.endedAt) {
            const next = after.snapshot.items.findIndex((_, i) => !after.done[`m-${i}`]?.includes(0));
            if (next >= 0) get().startMoveTimer(t.sessionKey, next);
          }
        }
      },

      finishSession: (key) =>
        set((s) => ({
          sessions: { ...s.sessions, [key]: { ...s.sessions[key], endedAt: new Date().toISOString() } },
          activeSessionKey: s.activeSessionKey === key ? null : s.activeSessionKey,
          timer: s.timer?.sessionKey === key ? null : s.timer,
        })),

      reopenSession: (key) =>
        set((s) => ({
          sessions: { ...s.sessions, [key]: { ...s.sessions[key], endedAt: null } },
          activeSessionKey: key,
        })),

      discardSession: (key) =>
        set((s) => {
          const sessions = { ...s.sessions };
          delete sessions[key];
          return {
            sessions,
            activeSessionKey: s.activeSessionKey === key ? null : s.activeSessionKey,
            timer: s.timer?.sessionKey === key ? null : s.timer,
          };
        }),
    }),
    {
      name: 'workout-app',
      version: 4,
      migrate: (persisted, version) => {
        // v2: drop the vague "Hyper-mobility & posture flow" move from saved plans.
        if (version < 2 && persisted?.plans) {
          persisted.plans = persisted.plans.map((p) => {
            if (!p.sourceText?.includes('Hyper-mobility & posture flow, ')) return p;
            const sourceText = p.sourceText.replaceAll('Hyper-mobility & posture flow, ', '');
            return { ...p, sourceText, days: parsePlanText(sourceText).days };
          });
        }
        // v3: the starter plan gains a leg day, moves the upper-body day to Saturday,
        // and carries starting weights. Only replaces the untouched starter plan.
        if (version < 3 && persisted?.plans) {
          persisted.plans = persisted.plans.map((p) =>
            p.name === DEFAULT_PLAN_NAME &&
            !p.sourceText?.includes('@') &&
            p.sourceText?.includes('Fri: Upper Body, Forearms & Rear Delts')
              ? { ...p, sourceText: DEFAULT_PLAN_TEXT, days: parsePlanText(DEFAULT_PLAN_TEXT).days }
              : p,
          );
        }
        // v4: one-off reset of the most recently started session (the owner's
        // test run on 16–17 Oct 2026) so it can be started again from scratch.
        if (version < 4 && persisted?.sessions) {
          const latest = Object.values(persisted.sessions)
            .filter((x) => x.date >= '2026-10-16')
            .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
          if (latest) {
            delete persisted.sessions[latest.key];
            if (persisted.activeSessionKey === latest.key) persisted.activeSessionKey = null;
            if (persisted.timer?.sessionKey === latest.key) persisted.timer = null;
          }
        }
        return persisted;
      },
      storage: createJSONStorage(() => safeStorage),
      // Keep defaults for settings added after a user's data was first saved.
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        settings: { ...current.settings, ...(persisted?.settings ?? {}) },
      }),
      partialize: (s) => ({
        plans: s.plans,
        activePlanId: s.activePlanId,
        sessions: s.sessions,
        activeSessionKey: s.activeSessionKey,
        timer: s.timer,
        settings: s.settings,
        weights: s.weights,
        history: s.history,
        lastPhrase: s.lastPhrase,
        goals: s.goals,
        goalChecks: s.goalChecks,
      }),
    },
  ),
);
