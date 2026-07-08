// Kasha brand mark, recreated in code per the 2023 Branding Guidelines
// (no source logo file was provided, so this rebuilds the described geometry:
// three uniform triangles, yellow always in the middle, pink/yellow/blue,
// all aligned on the same plane).

export function KashaTriangleMark({
  className = '',
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size * 3}
      height={size}
      viewBox="0 0 84 28"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {[
        { x: 0, color: '#E2156A' }, // pink
        { x: 28, color: '#EBCD1A' }, // yellow - always centered
        { x: 56, color: '#1E499F' }, // blue
      ].map((t) => (
        <g key={t.x} transform={`translate(${t.x}, 0)`}>
          <path
            d="M14 2 L26 26 L2 26 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M14 12 L20 26 L8 26 Z" fill={t.color} />
        </g>
      ))}
    </svg>
  );
}

export function KashaWordmark({
  className = '',
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <span
        className={`font-sans text-2xl font-extrabold tracking-tight ${
          dark ? 'text-white' : 'text-black'
        }`}
      >
        K
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" className="-mx-0.5">
        <path
          d="M12 2 L22 22 L2 22 Z"
          fill="none"
          stroke={dark ? '#fff' : '#000'}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M12 11 L17 22 L7 22 Z" fill="#E2156A" />
      </svg>
      <span
        className={`font-sans text-2xl font-extrabold tracking-tight ${
          dark ? 'text-white' : 'text-black'
        }`}
      >
        SHA
      </span>
    </div>
  );
}

export function KashaTagline({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-sans text-xs font-bold uppercase tracking-widest text-kasha-yellow ${className}`}
    >
      Access. Choice. Trust.
    </span>
  );
}
