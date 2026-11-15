import { Landmark, Play, Rocket, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { registrarLanzamiento } from '../../api/misiones.js'
import Valoracion from '../../components/Valoracion.jsx'
import { objetivosMision } from '../../engine/objetivos.js'
import { simular } from '../../engine/simulacion.js'
import { valorarDiseno } from '../../engine/valoracion.js'
import { formatoDinero } from '../../formato.js'

export default function Plataforma({ analisis, mision, dinero, deuda, onLanzado }) {
  const [lanzando, setLanzando] = useState(false)
  const [error, setError] = useState(null)
  const [prueba, setPrueba] = useState(null)

  const prestamo = Math.max(0, analisis.costeCompra - dinero)
  const deAlmacen = analisis.piezas.length - analisis.aComprar.length
  const bloqueado = analisis.faltas.length > 0
  const hayRiesgos = [...objetivosMision(analisis, mision), ...analisis.recursos].some((fila) => fila.estado === 'error')

  // Un resultado de prueba solo vale para el diseño con el que se hizo.
  const pruebaVigente = prueba?.analisis === analisis ? prueba : null
  const probar = () =>
    setPrueba({ analisis, simulacion: simular(analisis, mision), valoracion: valorarDiseno(analisis, mision, dinero) })

  async function lanzar() {
    setLanzando(true)
    setError(null)
    const simulacion = simular(analisis, mision)
    const valoracion = valorarDiseno(analisis, mision, dinero)
    try {
      const respuesta = await registrarLanzamiento(mision.id, {
        piezas: analisis.piezas.map((pieza) => pieza.id),
        exito: simulacion.exito,
        puntuacion: simulacion.puntuacion,
        aceptaPrestamo: prestamo > 0,
        informe: {
          orbitaId: analisis.resuelto.orbita?.id ?? null,
          eventos: simulacion.eventos,
          explicaciones: simulacion.explicaciones,
          valoracion,
          desglose: simulacion.desglose,
        },
      })
      onLanzado({ mision, simulacion, valoracion, respuesta, resuelto: analisis.resuelto })
    } catch (excepcion) {
      setError(excepcion.message)
      setLanzando(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Launch pad</h2>

      {analisis.faltas.length > 0 && (
        <ul className="space-y-1 rounded-xl bg-amber-950/70 p-4 text-sm text-amber-200">
          {analisis.faltas.map((falta) => (
            <li key={falta} className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 shrink-0" /> {falta}
            </li>
          ))}
        </ul>
      )}

      <div className="cristal p-4 text-sm">
        <p>
          From your Warehouse: <strong>{deAlmacen} of {analisis.piezas.length} parts</strong> · To buy:{' '}
          <strong>{formatoDinero(analisis.costeCompra)}</strong> (you have {formatoDinero(dinero)})
        </p>
        <p className="text-slate-400">
          Development: {analisis.meses} months · Deadline: {mision.requisitos.plazoMeses} months · A real launch uses{' '}
          {mision.mesesConsumidos} {mision.mesesConsumidos === 1 ? 'month' : 'months'} of your campaign
        </p>
      </div>

      {hayRiesgos && !bloqueado && (
        <p className="text-sm text-amber-300">
          Some mission goals or resources are red (see the panel). Run a free test to see what would happen, or launch
          anyway: if it fails you lose the parts and the time, but the report will explain why.
        </p>
      )}
      {prestamo > 0 && (
        <p className="rounded-lg bg-amber-950/70 p-3 text-sm text-amber-200">
          You are {formatoDinero(prestamo)} short. The Government can lend you the difference (rescue loan):
          it will be deducted from your next payments{deuda > 0 ? `, together with the ${formatoDinero(deuda)} you already owe` : ''}.
        </p>
      )}
      <div className="cristal space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold">Test run</h3>
            <p className="text-sm text-slate-400">
              Simulate the whole mission for free, as many times as you like. Only a real launch uses up parts and time.
            </p>
          </div>
          <button
            disabled={bloqueado}
            onClick={probar}
            className="flex items-center gap-2 rounded-lg border border-cyan-400/60 px-4 py-2 font-semibold text-cyan-200 transition hover:bg-cyan-950/60 disabled:opacity-40"
          >
            <Play className="h-4 w-4" /> Run test
          </button>
        </div>
        {pruebaVigente && <ResultadoPrueba {...pruebaVigente} mision={mision} />}
      </div>

      {error && <p className="rounded-lg bg-red-950/80 p-3 text-sm text-red-300">{error}</p>}

      <button
        disabled={bloqueado || lanzando}
        onClick={lanzar}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-lg font-bold text-slate-950 shadow-[0_0_24px_rgba(52,211,153,.35)] transition hover:bg-emerald-300 disabled:opacity-40"
      >
        {lanzando && 'Launching…'}
        {!lanzando && prestamo > 0 && (
          <>
            <Landmark className="h-5 w-5" /> Borrow {formatoDinero(prestamo)} and launch
          </>
        )}
        {!lanzando && prestamo === 0 && (
          <>
            <Rocket className="h-5 w-5" /> {hayRiesgos ? 'Launch anyway' : 'LAUNCH'}
          </>
        )}
      </button>
    </section>
  )
}

function ResultadoPrueba({ simulacion, valoracion, mision }) {
  const pago = (mision.recompensa.dinero * simulacion.puntuacion) / 100
  return (
    <div className="space-y-3 border-t border-slate-400/20 pt-3">
      {simulacion.exito ? (
        <p className="font-semibold text-emerald-300">
          It would succeed with {simulacion.puntuacion} / 100
          {mision.recompensa.dinero > 0 && `: the Government would pay you ${formatoDinero(pago)}`}.
        </p>
      ) : (
        <p className="font-semibold text-red-300">It would fail. Fix the problems below and test again.</p>
      )}
      <Valoracion valoracion={valoracion} tituloMal="Problems found" tituloBien="Working well" />
    </div>
  )
}
