// The iPhone app's extras: haptics, notifications, the Live Activity on the
// Lock Screen and Dynamic Island, and data for home-screen widgets. In the
// browser every function here quietly does nothing, so callers never check.
import { Capacitor, registerPlugin } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

// Our own small plugin (ios/App/App/GoodaysNativePlugin.swift).
const Goodays = registerPlugin('GoodaysNative');

// Plugins load on first use, so the web build never downloads them.
const haptics = () => import('@capacitor/haptics');
const notifications = () => import('@capacitor/local-notifications').then((m) => m.LocalNotifications);

const quiet = (p) => p.catch(() => {});

/** A light tap (ticking a set, each countdown number); `heavy` for starts and finishes. */
export function tap(heavy = false) {
  if (!isNative) return;
  quiet(haptics().then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: heavy ? ImpactStyle.Medium : ImpactStyle.Light })));
}

/** The "done" buzz: a session or meditation finished. */
export function success() {
  if (!isNative) return;
  quiet(haptics().then(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType.Success })));
}

// Notification ids: one slot each, so rescheduling replaces the old one.
const ALARM_ID = 1;
const TIMER_ID = 2;

/** Ask once for notification permission (iOS shows its own prompt the first time). */
export async function allowNotifications() {
  if (!isNative) return false;
  try {
    const n = await notifications();
    const { display } = await n.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

/** The daily alarm as a repeating notification, so it rings with the phone locked. */
export async function syncAlarm(alarm) {
  if (!isNative) return;
  try {
    const n = await notifications();
    await n.cancel({ notifications: [{ id: ALARM_ID }] });
    if (!alarm?.on) return;
    const [hour, minute] = alarm.time.split(':').map(Number);
    await n.schedule({
      notifications: [
        {
          id: ALARM_ID,
          title: 'Good morning',
          body: 'A new day. Take it slow.',
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          extra: { open: 'alarm' },
        },
      ],
    });
  } catch {
    // Permission refused or unavailable: the in-app alarm still rings while open.
  }
}

/** A notification for when the current rest or move timer runs out; null clears it. */
export async function syncTimerAlert(live) {
  if (!isNative) return;
  try {
    const n = await notifications();
    await n.cancel({ notifications: [{ id: TIMER_ID }] });
    if (!live?.countsDown || live.paused || !live.endsAt || live.endsAt <= Date.now() + 1000) return;
    const meditate = live.kind === 'meditate';
    await n.schedule({
      notifications: [
        {
          id: TIMER_ID,
          title: meditate ? 'Meditation complete' : live.status === 'Rest' ? 'Rest is over' : 'Next move',
          body: meditate ? 'Take a breath before you get up.' : live.title,
          schedule: { at: new Date(live.endsAt) },
        },
      ],
    });
  } catch {
    // Ignored: same as above.
  }
}

/** Start, update or end (null) the Live Activity for whatever is running. */
export function syncLiveActivity(live) {
  if (!isNative) return;
  if (!live) {
    quiet(Goodays.endActivity());
    return;
  }
  quiet(
    Goodays.updateActivity({
      kind: live.kind,
      title: live.title,
      status: live.status,
      fraction: live.fraction,
      paused: live.paused,
      countsDown: live.countsDown,
      // Seconds since 1970, which is what Swift's Date(timeIntervalSince1970:) takes.
      endsAt: live.endsAt ? live.endsAt / 1000 : 0,
      startedAt: live.startedAt ? live.startedAt / 1000 : 0,
      seconds: live.seconds,
    }),
  );
}

/** Today at a glance for the home-screen and Lock Screen widgets. */
export function syncWidgets(today) {
  if (!isNative) return;
  quiet(Goodays.setWidgetData({ json: JSON.stringify(today) }));
}
