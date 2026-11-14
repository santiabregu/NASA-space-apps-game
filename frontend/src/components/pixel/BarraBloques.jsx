const SEGMENTOS = 20
const COLOR_VACIO = '#1d2b53'

// Barra por bloques, como en las consolas antiguas: no necesita animación para verse avanzar.
export default function BarraBloques({ fraccion, color, className = 'h-6' }) {
  const llenos = Math.ceil(Math.min(1, Math.max(0, fraccion)) * SEGMENTOS)
  return (
    <div className={`flex gap-0.5 border-4 border-black bg-black ${className}`}>
      {Array.from({ length: SEGMENTOS }, (_, segmento) => (
        <span key={segmento} className="flex-1" style={{ background: segmento < llenos ? color : COLOR_VACIO }} />
      ))}
    </div>
  )
}
