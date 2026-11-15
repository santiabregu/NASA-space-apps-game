import { ArrowUpToLine, CircleCheck, CircleX, Earth, Flame, Layers, Radio, Rocket, Satellite, Waves } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { esSuborbital } from '../../engine/analisis.js'
import Informe from './Informe.jsx'

const ICONO_EVENTO = { despegue: Rocket, separacion: Layers, orbita: Satellite, contacto: Radio, objetivo: CircleCheck, apogeo: ArrowUpToLine, amerizaje: Waves }

const MS_POR_FASE = 1100
// El 3D va en un trozo aparte del paquete: Three.js solo se descarga al llegar aquí.
const Vuelo3D = lazy(() => import('./Vuelo3D.jsx'))
const ALTURA_VUELO_PX = 220

export default function CentroControl({ lanzamiento, onVolverSede, onRedisenar }) {
  const { simulacion } = lanzamiento
  const totalFases = simulacion.eventos.length
  const [fasesVistas, setFasesVistas] = useState(0)
  // Sin WebGL (o sin el diseño del cohete) se queda la animación 2D de siempre.
  const [sin3D, setSin3D] = useState(!lanzamiento.resuelto)
  const usar2D = useCallback(() => setSin3D(true), [])
  const terminado = fasesVistas >= totalFases
  const suborbital = esSuborbital(lanzamiento.mision)
  const enOrbita = terminado && simulacion.exito && !suborbital
  // Un vuelo suborbital que sale bien termina de vuelta abajo, en el mar.
  const enElMar = terminado && simulacion.exito && suborbital

  useEffect(() => {
    const intervalo = setInterval(() => setFasesVistas((vistas) => Math.min(vistas + 1, totalFases)), MS_POR_FASE)
    return () => clearInterval(intervalo)
  }, [totalFases])

  const altura = (fasesVistas / totalFases) * ALTURA_VUELO_PX

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Mission Control</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {!sin3D && (
          <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-400/20 bg-slate-950 md:h-96">
            <Suspense fallback={<p className="p-4 text-sm text-slate-400">Preparing the launch pad…</p>}>
              <Vuelo3D
                resuelto={lanzamiento.resuelto}
                empresa={lanzamiento.respuesta.jugador.empresa}
                suborbital={suborbital}
                eventos={simulacion.eventos}
                vistos={fasesVistas}
                onSinWebGL={usar2D}
              />
            </Suspense>
          </div>
        )}
        {sin3D && (
        <div className="relative flex h-80 items-end justify-center overflow-hidden rounded-2xl border border-slate-400/20 bg-gradient-to-b from-slate-950 via-indigo-950 to-sky-900">
          {enOrbita ? (
            <Orbita />
          ) : (
            <span
              className="mb-4 transition-transform duration-1000 ease-in"
              style={{ transform: `translateY(-${enElMar ? 0 : altura}px)` }}
            >
              {enElMar && <Waves className="h-12 w-12 text-sky-300" strokeWidth={1.5} />}
              {terminado && !enElMar && <Flame className="h-12 w-12 text-orange-400" strokeWidth={1.5} />}
              {!terminado && (
                <Rocket className="h-12 w-12 -rotate-45 text-slate-100" strokeWidth={1.5} />
              )}
            </span>
          )}
        </div>
        )}

        <ol className="space-y-2">
          {simulacion.eventos.slice(0, fasesVistas).map((evento) => {
            const Icono = evento.ok ? ICONO_EVENTO[evento.icono] : CircleX
            return (
              <li
                key={evento.texto}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm backdrop-blur-md ${evento.ok ? 'bg-slate-900/70' : 'bg-red-950/80 text-red-200'}`}
              >
                <Icono className={`h-4 w-4 shrink-0 ${evento.ok ? 'text-cyan-300' : 'text-red-300'}`} />
                {evento.texto}
              </li>
            )
          })}
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
      <Earth className="h-16 w-16 text-sky-300" strokeWidth={1.25} />
      <div className="absolute h-56 w-56 animate-spin rounded-full border border-dashed border-slate-500 [animation-duration:6s]">
        <Satellite className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 text-cyan-300" />
      </div>
    </div>
  )
}
