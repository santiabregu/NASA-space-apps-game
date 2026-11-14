import { CircleCheck, Lock, Satellite, Star } from 'lucide-react'
import { IMAGEN_PIEZA } from '../imagenes.js'
import { estaBloqueada } from '../piezas.js'

function estiloBorde({ instaladas, seleccionada, recomendada }) {
  if (instaladas > 0) return 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_14px_rgba(52,211,153,.25)]'
  if (seleccionada) return 'border-cyan-400 bg-cyan-950/50'
  if (recomendada) return 'border-amber-300/50 bg-slate-900/60 shadow-[0_0_14px_rgba(252,211,77,.15)]'
  return 'border-slate-400/20 bg-slate-900/60'
}

function Marca({ bloqueada, instaladas, recomendada, nivelRequerido }) {
  if (bloqueada) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
        <Lock className="h-3.5 w-3.5" /> Level {nivelRequerido}
      </span>
    )
  }
  if (instaladas > 0) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-300">
        <CircleCheck className="h-3.5 w-3.5" /> Installed{instaladas > 1 && ` ×${instaladas}`}
      </span>
    )
  }
  if (recomendada) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-300">
        <Star className="h-3.5 w-3.5 fill-current" /> Recommended
      </span>
    )
  }
  return null
}

// seleccionada = la pieza que se está viendo (Almacén); instaladas = cuántas lleva ya el diseño.
export default function TarjetaPieza({
  pieza,
  nivel,
  seleccionada = false,
  instaladas = 0,
  recomendada = false,
  onElegir,
  onPrevisualizar,
  onFinPrevisualizar,
  deshabilitada = false,
  aviso,
}) {
  const bloqueada = estaBloqueada(pieza, nivel)
  const imagen = IMAGEN_PIEZA[pieza.id]
  const atenuada = bloqueada || (deshabilitada && instaladas === 0)

  return (
    <button
      type="button"
      disabled={deshabilitada}
      onClick={() => onElegir(pieza)}
      onMouseEnter={() => !deshabilitada && onPrevisualizar?.(pieza)}
      onMouseLeave={onFinPrevisualizar}
      onFocus={() => !deshabilitada && onPrevisualizar?.(pieza)}
      onBlur={onFinPrevisualizar}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left backdrop-blur-md transition enabled:hover:-translate-y-0.5 enabled:hover:border-cyan-400/70 enabled:active:scale-[0.98] disabled:cursor-not-allowed ${estiloBorde(
        { instaladas, seleccionada, recomendada },
      )} ${atenuada ? 'opacity-55' : ''}`}
    >
      {imagen ? (
        <img src={imagen} alt="" loading="lazy" className="h-14 w-14 shrink-0 object-contain" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
          <Satellite className="h-7 w-7" strokeWidth={1.5} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex w-full items-start justify-between gap-2">
          <span className="font-semibold">{pieza.nombre}</span>
          <Marca bloqueada={bloqueada} instaladas={instaladas} recomendada={recomendada} nivelRequerido={pieza.nivelRequerido} />
        </span>
        <span className="text-xs text-slate-400">{pieza.explicacion}</span>
        {aviso && <span className="text-xs text-amber-300">{aviso}</span>}
      </span>
    </button>
  )
}
