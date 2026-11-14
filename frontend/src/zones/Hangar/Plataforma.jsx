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
  const comprobaciones = [
    {
      texto: `Δv ${formatoNumero(Math.round(analisis.deltaV))} de ${formatoNumero(deltaVRequerido)} m/s`,
      ok: analisis.deltaV >= deltaVRequerido,
    },
    { texto: `Empuje/peso ${formatoNumero(analisis.empujePeso)} (mínimo ${EMPUJE_PESO_MINIMO})`, ok: analisis.empujePeso >= EMPUJE_PESO_MINIMO },
    ...analisis.recursos.map((recurso) => ({ texto: `${recurso.nombre}: ${recurso.texto}`, ok: recurso.estado !== 'error' })),
  ]
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
      <h2 className="text-lg font-semibold">Checklist de lanzamiento</h2>

      {analisis.faltas.length > 0 && (
        <ul className="space-y-1 rounded-xl bg-amber-950/60 p-4 text-sm text-amber-200">
          {analisis.faltas.map((falta) => <li key={falta}>⚠️ {falta}</li>)}
        </ul>
      )}

      <ul className="space-y-2">
        {comprobaciones.map((comprobacion) => (
          <li key={comprobacion.texto} className="flex gap-2 rounded-lg bg-slate-900/80 px-3 py-2 text-sm">
            <span>{comprobacion.ok ? '✅' : '❌'}</span>
            <span>{comprobacion.texto}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm">
        <p>Coste de las piezas: <strong>{formatoDinero(analisis.coste)}</strong> (tienes {formatoDinero(dinero)})</p>
        <p className="text-slate-400">Desarrollo: {analisis.meses} meses · Plazo: {mision.requisitos.plazoMeses} meses</p>
      </div>

      {hayRiesgos && !bloqueado && (
        <p className="text-sm text-amber-300">
          Hay comprobaciones en rojo. Puedes lanzar igualmente: si falla, perderás el dinero de las piezas,
          pero el informe te explicará qué pasó.
        </p>
      )}
      {prestamo > 0 && (
        <p className="rounded-lg bg-amber-950/60 p-3 text-sm text-amber-200">
          Te faltan {formatoDinero(prestamo)}. El Gobierno puede prestarte la diferencia (préstamo de rescate):
          se descontará de tus próximos pagos{deuda > 0 ? `, junto con los ${formatoDinero(deuda)} que ya debes` : ''}.
        </p>
      )}
      {error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>}

      <button
        disabled={bloqueado || lanzando}
        onClick={lanzar}
        className="w-full rounded-xl bg-emerald-500 py-3 text-lg font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
      >
        {lanzando && 'Lanzando…'}
        {!lanzando && prestamo > 0 && `🏦 Pedir ${formatoDinero(prestamo)} y lanzar`}
        {!lanzando && prestamo === 0 && (hayRiesgos ? '🚀 Lanzar de todos modos' : '🚀 LANZAR')}
      </button>
    </section>
  )
}
