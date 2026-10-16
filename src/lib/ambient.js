// Soft background sound for stretching and meditation, generated in the browser
// (filtered noise that sounds like steady rain), so there are no audio files to
// download or license. Browsers only allow audio to start from a tap, so
// `start` must be called from a click handler.

let ctx = null;
let nodes = null;

function noiseBuffer(context, seconds = 4) {
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown-ish noise: integrate white noise, which softens the hiss.
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.04 * white) / 1.04;
    data[i] = last * 3.2;
  }
  return buffer;
}

export function startAmbient() {
  try {
    if (nodes) return;
    ctx = ctx ?? new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    nodes = { source, gain };
  } catch {
    nodes = null; // no audio on this device
  }
}

export function stopAmbient() {
  if (!nodes || !ctx) return;
  const { source, gain } = nodes;
  nodes = null;
  try {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    source.stop(ctx.currentTime + 0.7);
  } catch {
    // already stopped
  }
}
