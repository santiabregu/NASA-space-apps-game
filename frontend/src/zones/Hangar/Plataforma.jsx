import { CircleCheck, CircleX, Landmark, Rocket, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { registrarLanzamiento } from '../../api/misiones.js'
import { EMPUJE_PESO_MINIMO } from '../../engine/cohete.js'
import { simular } from '../../engine/simulacion.js'
import { formatoDinero, formatoNumero } from '../../formato.js'

export default function Plataforma({ analisis, mision, dinero, deuda, onLanzado }) {
  const [lanzando, setLanzando] = useState(false)
  const [error, setError] = useState(null)

  const deltaVRequerido = analisis.resuelto.orbita.deltaVRequerido
  const prestamo = Math.max(0, analisis.coste - dinero)
  const bloqueado = analisis.faltas.length > 0
  const cienciaMinima = mision.requisitos.valorCientificoMin
  const comprobaciones = [
    {
      texto: `Δv ${formatoNumero(Math.round(analisis.deltaV))} of ${formatoNumero(deltaVRequerido)} m/s`,
      ok: analisis.deltaV >= deltaVRequerido,
    },
    { texto: `Thrust-to-weight ${formatoNumero(analisis.empujePeso)} (minimum ${EMPUJE_PESO_MINIMO})`, ok: analisis.empujePeso >= EMPUJE_PESO_MINIMO },
    cienciaMinima > 0 && {
      texto: `Science value ${analisis.satelite.valorCientifico} of ${cienciaMinima}`,
      ok: analisis.satelite.valorCientifico >= cienciaMinima,
    },
    ...analisis.recursos.map((recurso) => ({ texto: `${recurso.nombre}: ${recurso.texto}`, ok: recurso.estado !== 'error' })),
  ].filter(Boolean)
  const hayRiesgos = comprobaciones.some((comprobacion) => !comprobacion.ok)

  async function lanzar() {
    setLanzando(true)
    setError(null)
    const simulacion = simular(analisis, mision)
    try {
      const respuesta = await registrarLanzamiento(mision.id, {
        piezas: analisis.piezas.map((pieza) => pieza.id),
        exito: simulacion.exito,
        puntuacion: simulacion.puntuacion,
        aceptaPrestamo: prestamo > 0,
      })
      onLanzado({ mision, simulacion, respuesta })
    } catch (excepcion) {
      setError(excepcion.message)
      setLanzando(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Launch checklist</h2>

      {analisis.faltas.length > 0 && (
        <ul className="space-y-1 rounded-xl bg-amber-950/70 p-4 text-sm text-amber-200">
          {analisis.faltas.map((falta) => (
            <li key={falta} className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 shrink-0" /> {falta}
            </li>
          ))}
        </ul>
      )}

      <ul className="space-y-2">
        {comprobaciones.map((comprobacion) => (
          <li key={comprobacion.texto} className="flex items-center gap-2 rounded-lg bg-slate-900/70 px-3 py-2 text-sm backdrop-blur-md">
            {comprobacion.ok ? (
              <CircleCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <CircleX className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{comprobacion.texto}</span>
          </li>
        ))}
      </ul>

      <div className="cristal p-4 text-sm">
        <p>Parts cost: <strong>{formatoDinero(analisis.coste)}</strong> (you have {formatoDinero(dinero)})</p>
        <p className="text-slate-400">Development: {analisis.meses} months · Deadline: {mision.requisitos.plazoMeses} months</p>
      </div>

      {hayRiesgos && !bloqueado && (
        <p className="text-sm text-amber-300">
          Some checks are red. You can launch anyway: if it fails you lose the money spent on parts,
          but the report will explain what happened.
        </p>
      )}
      {prestamo > 0 && (
        <p className="rounded-lg bg-amber-950/70 p-3 text-sm text-amber-200">
          You are {formatoDinero(prestamo)} short. The Government can lend you the difference (rescue loan):
          it will be deducted from your next payments{deuda > 0 ? `, together with the ${formatoDinero(deuda)} you already owe` : ''}.
        </p>
      )}
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
