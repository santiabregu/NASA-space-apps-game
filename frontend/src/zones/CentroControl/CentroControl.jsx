import { useEffect, useState } from 'react'
import Informe from './Informe.jsx'

const MS_POR_FASE = 1100
const ALTURA_VUELO_PX = 220

export default function CentroControl({ lanzamiento, onVolverSede, onRedisenar }) {
  const { simulacion } = lanzamiento
  const totalFases = simulacion.eventos.length
  const [fasesVistas, setFasesVistas] = useState(0)
  const terminado = fasesVistas >= totalFases
  const enOrbita = terminado && simulacion.exito

  useEffect(() => {
    const intervalo = setInterval(() => setFasesVistas((vistas) => Math.min(vistas + 1, totalFases)), MS_POR_FASE)
    return () => clearInterval(intervalo)
  }, [totalFases])

  const altura = (fasesVistas / totalFases) * ALTURA_VUELO_PX

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Mission Control</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative flex h-80 items-end justify-center overflow-hidden rounded-2xl border border-slate-400/20 bg-gradient-to-b from-slate-950 via-indigo-950 to-sky-900">
          {enOrbita ? (
            <Orbita />
          ) : (
            <span
              className="mb-4 text-5xl transition-transform duration-1000 ease-in"
              style={{ transform: `translateY(-${altura}px)` }}
            >
              {terminado ? '💥' : '🚀'}
            </span>
          )}
        </div>

        <ol className="space-y-2">
          {simulacion.eventos.slice(0, fasesVistas).map((evento) => (
            <li
              key={evento.texto}
              className={`rounded-lg px-3 py-2 text-sm backdrop-blur-md ${evento.ok ? 'bg-slate-900/70' : 'bg-red-950/80 text-red-200'}`}
            >
              {evento.texto}
            </li>
          ))}
          {!terminado && <li className="animate-pulse px-3 text-sm text-slate-400">Receiving telemetry…</li>}
        </ol>
      </div>

      {terminado && <Informe lanzamiento={lanzamiento} onVolverSede={onVolverSede} onRedisenar={onRedisenar} />}
    </main>
  )
}

function Orbita() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-6xl">🌍</span>
      <div className="absolute h-56 w-56 animate-spin rounded-full border border-dashed border-slate-500 [animation-duration:6s]">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">🛰️</span>
      </div>
    </div>
  )
}
