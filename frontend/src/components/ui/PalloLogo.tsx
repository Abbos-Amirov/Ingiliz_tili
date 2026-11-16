/** Pallo! learning-centre logo (same artwork as /public/pallo-logo.svg). */
export function PalloLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Pallo!"
    >
      <circle cx="50" cy="50" r="50" fill="#55199E" />
      <g stroke="#FFFFFF" strokeWidth="19" strokeLinecap="round">
        <line x1="19.5" y1="50" x2="80.5" y2="50" />
        <line x1="32.5" y1="27.5" x2="67.5" y2="72.5" />
        <line x1="67.5" y1="27.5" x2="32.5" y2="72.5" />
      </g>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#55199E"
        fontWeight="900"
        fontSize="12.5"
        textLength="40"
        lengthAdjust="spacingAndGlyphs"
        style={{ fontFamily: "var(--font-display), 'Arial Black', sans-serif" }}
      >
        PALLO!
      </text>
    </svg>
  );
}
