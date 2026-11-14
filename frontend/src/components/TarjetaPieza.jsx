import { IMAGEN_PIEZA } from '../imagenes.js'
import { estaBloqueada } from '../piezas.js'

export default function TarjetaPieza({ pieza, nivel, seleccionada = false, onElegir, deshabilitada = false, aviso }) {
  const bloqueada = estaBloqueada(pieza, nivel)
  const imagen = IMAGEN_PIEZA[pieza.id]

  return (
    <button
      type="button"
      disabled={deshabilitada}
      onClick={() => onElegir(pieza)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left backdrop-blur-md transition enabled:hover:-translate-y-0.5 enabled:hover:border-cyan-400/70 enabled:active:scale-[0.98] disabled:cursor-not-allowed ${
        seleccionada ? 'border-cyan-400 bg-cyan-950/50' : 'border-slate-400/20 bg-slate-900/60'
      } ${bloqueada || deshabilitada ? 'opacity-55' : ''}`}
    >
      {imagen ? (
        <img src={imagen} alt="" loading="lazy" className="h-14 w-14 shrink-0 object-contain" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-2xl">🛰️</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex w-full items-start justify-between gap-2">
          <span className="font-semibold">{pieza.nombre}</span>
          {bloqueada && <span className="shrink-0 text-xs text-slate-400">🔒 Level {pieza.nivelRequerido}</span>}
        </span>
        <span className="text-xs text-slate-400">{pieza.explicacion}</span>
        {aviso && <span className="text-xs text-amber-300">{aviso}</span>}
      </span>
    </button>
  )
}
