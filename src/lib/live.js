import { meditationActive, meditationProgress, sessionProgress, timerLeft } from '../store';

/**
 * What is running right now, in one shape for the in-app island and the
 * iPhone's Live Activity: a workout or stretch (a rest or move timer counting
 * down, else time so far) or a meditation (time left). Null when nothing is.
 *
 * Times are absolute (`endsAt`, `startedAt`, ms) so the phone can tick the
 * clock by itself; `seconds` is the value to show now (and while paused).
 */
export function liveSummary({ active, timer, meditation }, now = Date.now()) {
  if (active && !active.endedAt) {
    const { done, total } = sessionProgress(active);
    const timed = timer?.sessionKey === active.key;
    const morning = active.kind === 'morning';
    const title = morning ? 'Stretches' : active.snapshot.title;
    const status = timed ? (timer.complete ? timer.label : 'Rest') : `${done} of ${total} ${morning ? 'moves' : 'sets'}`;
    const paused = timed && !!timer.pausedAt;
    const startedAt = new Date(active.startedAt).getTime();
    return {
      kind: active.kind,
      date: active.date,
      title,
      status: `${status}${paused ? ' · paused' : ''}`,
      fraction: total ? done / total : 0,
      paused,
      countsDown: timed,
      endsAt: timed ? timer.endsAt : null,
      startedAt: timed ? null : startedAt,
      seconds: timed ? timerLeft(timer, now) : Math.max(0, Math.floor((now - startedAt) / 1000)),
    };
  }
  if (meditationActive(meditation)) {
    const { length, elapsed, left } = meditationProgress(meditation, now);
    const paused = !!meditation.pausedAt;
    return {
      kind: 'meditate',
      date: null,
      title: `Meditation · ${meditation.type}`,
      status: paused ? 'Paused' : `${meditation.minutes} min`,
      fraction: length ? elapsed / length : 0,
      paused,
      countsDown: true,
      endsAt: paused ? null : now + left * 1000,
      startedAt: null,
      seconds: Math.ceil(left),
    };
  }
  return null;
}
