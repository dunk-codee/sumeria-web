/** Íconos de redes (trazo, heredan el color del texto). */

type IconProps = { size?: number; className?: string };

export function WhatsAppIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3.5 20.5l1.2-4.1a8.6 8.6 0 1 1 3.1 3l-4.3 1.1z" />
      <path d="M9.2 8.3c.2-.5.5-.6.9-.6h.5l.9 2.1-.7.9c.5 1.1 1.4 2 2.5 2.5l.9-.7 2.1.9v.5c0 .4-.1.7-.6.9-1.7.8-6.3-3.5-6.5-6.5z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x={3.5} y={3.5} width={17} height={17} rx={5} />
      <circle cx={12} cy={12} r={3.8} />
      <circle cx={17.1} cy={6.9} r={0.6} fill="currentColor" stroke="none" />
    </svg>
  );
}
