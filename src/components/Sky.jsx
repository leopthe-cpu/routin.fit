// The painted sky: a flat base colour, a low sun glow, a haze from the top and a
// fine film grain over everything. Pure CSS plus one SVG noise filter, so it
// costs nothing to animate or keep on screen.

export default function Sky({ sky }) {
  return (
    <div aria-hidden="true" className="absolute inset-0" style={{ background: sky.base, transition: 'background 900ms ease' }}>
      <div className="sun-glow absolute inset-0" style={{ background: sky.glow }} />
      <div className="absolute inset-0" style={{ background: sky.haze }} />
      <svg className="absolute inset-0 h-full w-full" style={{ mixBlendMode: 'soft-light', opacity: 0.6 }}>
        <filter id="sky-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sky-grain)" />
      </svg>
    </div>
  );
}
