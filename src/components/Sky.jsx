// The painted sky: a flat base colour, a low sun glow, a haze from the top and a
// fine film grain over everything. The grain is a small noise tile drawn once
// and repeated, so it costs nothing per frame; only the glow and bloom move,
// and they pause whenever a session covers the screen.

let grainUrl = null;

/** A 160 CSS-pixel tile of soft film grain, made once and reused. */
function grain() {
  if (grainUrl) return grainUrl;
  try {
    // Drawn at the screen's pixel density so each speck is one real pixel (fine, like film).
    const size = Math.round(160 * Math.min(3, window.devicePixelRatio || 1));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      // Mostly faint dark specks with a few light ones: reads as grain without tinting the sky.
      const light = Math.random() < 0.35;
      const v = light ? 255 : 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.floor(Math.random() * (light ? 14 : 20));
    }
    ctx.putImageData(img, 0, 0);
    grainUrl = canvas.toDataURL('image/png');
  } catch {
    grainUrl = 'none';
  }
  return grainUrl;
}

export default function Sky({ sky }) {
  const tile = grain();
  return (
    <div aria-hidden="true" className="absolute inset-0" style={{ background: sky.base, transition: 'background 900ms ease' }}>
      {/* Wider than the sky so the pulsing glow never shows an edge. */}
      <div className="sun-glow absolute -inset-x-[20%] top-[-10%] bottom-0" style={{ background: sky.glow }} />
      <div className="absolute inset-0" style={{ background: sky.haze }} />
      <div className="sun-halo absolute inset-0" />
      {tile !== 'none' && (
        <div className="absolute inset-0" style={{ backgroundImage: `url(${tile})`, backgroundSize: '160px 160px' }} />
      )}
    </div>
  );
}
