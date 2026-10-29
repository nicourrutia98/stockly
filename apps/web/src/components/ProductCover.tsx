/**
 * Stockly — cover SVG por categoría (M1b, spec_id=20).
 *
 * No generamos imágenes en runtime: cada producto recibe un cover
 * local determinista por categoría. Render inmediato (no red, no
 * prompts), sin "AI slop" — el cliente ve una estantería reconocible
 * con un motivo por categoría. Tamaño 600×600 viewBox para cualquier
 * uso (tarjeta 1:1, OG, etc.).
 *
 * Paleta restringida a la marca (#0F4C81, #F5B700, neutros) para que
 * ningún producto "salte" del resto.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
export const CATEGORY_ART: Record<string, { bg: string; motif: string }> = {
  'Café y Bebidas': { bg: '#0F4C81', motif: 'cup' },
  Despensa: { bg: '#1E5AA8', motif: 'pantry' },
  Lácteos: { bg: '#0A3B66', motif: 'bottle' },
  Aseo: { bg: '#334155', motif: 'soap' },
  Papelería: { bg: '#F5B700', motif: 'book' },
};

const FALLBACK = { bg: '#0F4C81', motif: 'cup' } as const;

interface Props {
  category: string;
  /** Texto corto (3-4 chars) que aparece bajo el motivo. */
  code: string;
  /** Tamaño CSS en px. */
  size?: number;
  title?: string;
}

export function ProductCover({ category, code, size = 200, title }: Props) {
  const art = CATEGORY_ART[category] ?? FALLBACK;
  const ink = category === 'Papelería' ? '#0F172A' : '#FFFFFF';
  const codeColor = ink;

  return (
    <svg
      role="img"
      aria-label={title ?? `Imagen de ${category}`}
      width={size}
      height={size}
      viewBox="0 0 600 600"
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8, background: art.bg }}
    >
      <rect x="0" y="0" width="600" height="600" fill={art.bg} />
      <g transform="translate(170 150)">
        {art.motif === 'cup' && <MotifCup ink={ink} />}
        {art.motif === 'pantry' && <MotifPantry ink={ink} />}
        {art.motif === 'bottle' && <MotifBottle ink={ink} />}
        {art.motif === 'soap' && <MotifDrop ink={ink} />}
        {art.motif === 'book' && <MotifBook ink={ink} />}
      </g>
      <text
        x="50%"
        y="92%"
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
        fontSize="48"
        fontWeight="600"
        fill={codeColor}
        opacity="0.9"
      >
        {code}
      </text>
    </svg>
  );
}

interface Ink {
  ink: string;
}

function MotifCup({ ink }: Ink) {
  return (
    <g stroke={ink} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 80 h240 a20 20 0 0 1 20 20 v110 a100 100 0 0 1 -100 100 h-80 a100 100 0 0 1 -100 -100 v-110 a20 20 0 0 1 20 -20 z" fill={ink} opacity="0.95" stroke="none" />
      <path d="M280 110 h30 a40 40 0 0 1 40 40 v40 a40 40 0 0 1 -40 40 h-30" />
      <path d="M120 10 v40" />
      <path d="M160 10 v40" opacity="0.6" />
      <path d="M200 10 v40" opacity="0.3" />
    </g>
  );
}

function MotifPantry({ ink }: Ink) {
  return (
    <g stroke={ink} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="70" y="90" width="120" height="30" rx="8" fill={ink} stroke="none" opacity="0.95" />
      <path d="M60 130 h140 v130 a30 30 0 0 1 -30 30 h-80 a30 30 0 0 1 -30 -30 z" fill={ink} opacity="0.9" stroke="none" />
      <path d="M100 190 h60" />
      <path d="M100 225 h60" opacity="0.5" />
    </g>
  );
}

function MotifBottle({ ink }: Ink) {
  return (
    <g stroke={ink} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M105 20 h50 v50 l25 40 v150 a30 30 0 0 1 -30 30 h-60 a30 30 0 0 1 -30 -30 v-150 l25 -40 z" fill={ink} opacity="0.92" stroke="none" />
      <path d="M60 200 h140" />
    </g>
  );
}

function MotifDrop({ ink }: Ink) {
  return (
    <g stroke={ink} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M130 30 c40 60 70 100 70 150 a70 70 0 0 1 -140 0 c0 -50 30 -90 70 -150 z" fill={ink} opacity="0.92" stroke="none" />
      <path d="M95 190 a40 40 0 0 0 25 35" />
    </g>
  );
}

function MotifBook({ ink }: Ink) {
  return (
    <g stroke={ink} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M130 60 c-40 -20 -80 -20 -110 0 v190 c30 -20 70 -20 110 0 c40 -20 80 -20 110 0 v-190 c-30 -20 -70 -20 -110 0 z" fill={ink} opacity="0.92" stroke="none" />
      <path d="M130 60 v190" />
    </g>
  );
}
