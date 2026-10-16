import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { parsePlanText } from './lib/parsePlan';
import { restSecondsFor } from './lib/estimate';
import { todayISO } from './lib/dates';
import { exerciseKey } from './lib/weights';
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
      settings: { openrouterKey: '', openrouterModel: '', unit: 'kg' },
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
          return { weights, history, plans, sessions };
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
          const w = item && get().weights[exerciseKey(item.name)];
          const byItem = { ...(loads[itemId] ?? {}) };
          if (checking && w) byItem[setIndex] = { value: w.value, unit: w.unit };
          if (!checking) delete byItem[setIndex];
          loads = { ...loads, [itemId]: byItem };
        }
        const updated = { ...session, done: nextDone, loads };
        set((s) => ({ sessions: { ...s.sessions, [key]: updated } }));

        if (!checking) return;
        if (session.kind === 'workout') get().maybeStartRest(updated, itemId, setIndex);
        else {
          const t = get().timer;
          if (t?.complete?.itemId === itemId) set({ timer: null });
        }
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

      /** Timed move for the morning routine; ticks the move off when it ends. */
      startMoveTimer: (key, itemId, seconds, label) =>
        set({
          timer: {
            endsAt: Date.now() + seconds * 1000, total: seconds, label, sessionKey: key,
            complete: { itemId, setIndex: 0 },
          },
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
      version: 1,
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
      }),
    },
  ),
);
