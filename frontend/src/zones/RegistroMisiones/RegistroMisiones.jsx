import { CircleCheck, CircleX, RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { obtenerHistorial, obtenerMisionesDisponibles } from '../../api/misiones.js'
import Valoracion from '../../components/Valoracion.jsx'
import { disenoDesdePiezas } from '../../engine/diseno.js'
import { causaDelFallo } from '../../engine/simulacion.js'
import { formatoDinero } from '../../formato.js'

const NOMBRE_PUNTOS = { objetivo: 'Objective', ciencia: 'Science', eficiencia: 'Efficiency', equipo: 'Teamwork', retraso: 'Delay' }

const formatoFecha = (fecha) =>
  new Date(fecha).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const neto = (lanzamiento) => lanzamiento.dineroGanado + lanzamiento.financiacion - lanzamiento.costePagado
const conSigno = (dinero) => `${dinero >= 0 ? '+' : '−'}${formatoDinero(Math.abs(dinero))}`

// El historial llega del más reciente al más antiguo; los grupos conservan ese orden.
function agruparPorMision(historial) {
  const grupos = new Map()
  for (const lanzamiento of historial) {
    if (!grupos.has(lanzamiento.misionId)) grupos.set(lanzamiento.misionId, [])
    grupos.get(lanzamiento.misionId).push(lanzamiento)
  }
  return [...grupos.entries()]
}

export default function RegistroMisiones({ jugador, catalogo, onCargarDiseno }) {
  const [historial, setHistorial] = useState(null)
  const [disponibles, setDisponibles] = useState([])
  const [elegidoId, setElegidoId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([obtenerHistorial(), obtenerMisionesDisponibles()])
      .then(([lanzamientos, misiones]) => {
        setHistorial(lanzamientos)
        setDisponibles(misiones)
      })
      .catch((excepcion) => setError(excepcion.message))
  }, [jugador])

  if (error) return <p className="p-8 text-center text-red-300">{error}</p>
  if (!historial) return <p className="p-8 text-center text-slate-400">Loading your launches…</p>

  const misionPorId = Object.fromEntries(catalogo.misiones.map((mision) => [mision.id, mision]))
  const elegido = historial.find((lanzamiento) => lanzamiento.id === elegidoId) ?? historial[0]

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold">Mission Log</h1>
        <p className="text-slate-400">Every launch you made: what worked, what did not, and why.</p>
      </header>

      {historial.length === 0 ? (
        <p className="cristal p-5 text-slate-300">No launches yet. Accept a contract in the Mission Center, build it in the Hangar and launch it.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
          <div className="space-y-3">
            <Resumen historial={historial} completadas={Object.keys(jugador.misionesTerminadas).length} />
            {agruparPorMision(historial).map(([misionId, intentos]) => (
              <GrupoMision
                key={misionId}
                titulo={misionPorId[misionId]?.titulo ?? misionId}
                intentos={intentos}
                elegidoId={elegido.id}
                onElegir={setElegidoId}
              />
            ))}
          </div>
          <Detalle
            key={elegido.id}
            lanzamiento={elegido}
            mision={misionPorId[elegido.misionId]}
            catalogo={catalogo}
            disponible={disponibles.includes(elegido.misionId)}
            onCargarDiseno={onCargarDiseno}
          />
        </div>
      )}
    </main>
  )
}

function Resumen({ historial, completadas }) {
  const exitos = historial.filter((lanzamiento) => lanzamiento.exito).length
  const total = historial.reduce((suma, lanzamiento) => suma + neto(lanzamiento), 0)
  return (
    <div className="cristal grid grid-cols-3 gap-2 p-3 text-center text-xs">
      <Cifra valor={completadas} etiqueta="completed" />
      <Cifra valor={`${Math.round((exitos / historial.length) * 100)}%`} etiqueta="success" />
      <Cifra valor={conSigno(total)} etiqueta="net money" color={total >= 0 ? 'text-emerald-300' : 'text-red-300'} />
    </div>
  )
}

function Cifra({ valor, etiqueta, color = '' }) {
  return (
    <div>
      <p className={`text-lg font-semibold ${color}`}>{valor}</p>
      <p className="text-slate-400">{etiqueta}</p>
    </div>
  )
}

function GrupoMision({ titulo, intentos, elegidoId, onElegir }) {
  const mejor = Math.max(...intentos.filter((l) => l.exito).map((l) => l.puntuacion), -1)
  return (
    <section className={`cristal space-y-2 p-3 ${mejor >= 0 ? 'ring-1 ring-emerald-400/50' : ''}`}>
      <div>
        <h2 className="font-display text-sm font-semibold">{titulo}</h2>
        <p className={`text-xs ${mejor >= 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
          {mejor >= 0 ? `Best score ${mejor} / 100` : 'Not completed yet'} · {intentos.length} {intentos.length === 1 ? 'attempt' : 'attempts'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
        {[...intentos].reverse().map((lanzamiento) => (
          <span
            key={lanzamiento.id}
            className={`flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 text-xs font-semibold ${
              lanzamiento.exito ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300' : 'border-red-400 bg-red-950/60 text-red-300'
            }`}
          >
            {lanzamiento.exito ? lanzamiento.puntuacion : <X className="h-3.5 w-3.5" />}
          </span>
        ))}
      </div>
      <ul className="space-y-1.5">
        {intentos.map((lanzamiento) => (
          <li key={lanzamiento.id}>
            <button
              onClick={() => onElegir(lanzamiento.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                lanzamiento.id === elegidoId ? 'border-cyan-400 bg-cyan-950/50' : 'border-slate-400/20 bg-slate-900/60 hover:border-cyan-400/60'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-slate-300">{formatoFecha(lanzamiento.fecha)}</span>
                <Resultado lanzamiento={lanzamiento} />
              </span>
              <span className="text-xs text-slate-400">{conSigno(neto(lanzamiento))}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Resultado({ lanzamiento }) {
  return lanzamiento.exito ? (
    <span className="flex items-center gap-1 text-emerald-300">
      <CircleCheck className="h-4 w-4" /> {lanzamiento.puntuacion}/100
    </span>
  ) : (
    <span className="flex items-center gap-1 text-red-300">
      <CircleX className="h-4 w-4" /> Failed
    </span>
  )
}

function Detalle({ lanzamiento, mision, catalogo, disponible, onCargarDiseno }) {
  const { informe } = lanzamiento
  const orbita = catalogo.orbitasPorId[informe.orbitaId]
  const causa = causaDelFallo({ exito: lanzamiento.exito, explicaciones: informe.explicaciones })
  const nombresPiezas = lanzamiento.piezas.map((id) => catalogo.piezasPorId[id]?.nombre ?? id)

  return (
    <section className="cristal space-y-4 self-start p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">
            {formatoFecha(lanzamiento.fecha)} · {orbita?.nombre ?? 'Suborbital flight'} · month {lanzamiento.mesJuego}
          </p>
          <h2 className={`font-display text-xl font-bold ${lanzamiento.exito ? 'text-emerald-300' : 'text-red-300'}`}>
            {mision?.titulo ?? lanzamiento.misionId} · {lanzamiento.exito ? `${lanzamiento.puntuacion} / 100` : 'Mission failed'}
          </h2>
          {causa && <p className="mt-1 text-slate-300">{causa}</p>}
        </div>
        {disponible && mision && (
          <button
            onClick={() => onCargarDiseno(mision, disenoDesdePiezas(lanzamiento.piezas, informe.orbitaId, catalogo))}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <RotateCcw className="h-4 w-4" /> Load this design
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <Dato etiqueta="Money" valor={conSigno(neto(lanzamiento))} />
        <Dato etiqueta="Knowledge" valor={`+${lanzamiento.xpGanada} XP`} />
        <Dato etiqueta="Reputation" valor={lanzamiento.cambioReputacion > 0 ? `+${lanzamiento.cambioReputacion}` : lanzamiento.cambioReputacion} />
      </div>
      {lanzamiento.destinoAlcanzado && (
        <p className="text-sm text-amber-300">
          Reached the destination {catalogo.destinosPorId[lanzamiento.destinoAlcanzado]?.nombre}: investors added{' '}
          {formatoDinero(lanzamiento.financiacion)}.
        </p>
      )}
      {lanzamiento.prestamo > 0 && (
        <p className="text-sm text-amber-300">Needed a rescue loan of {formatoDinero(lanzamiento.prestamo)}.</p>
      )}

      {informe.desglose && (
        <p className="text-sm text-slate-300">
          Score:{' '}
          {Object.entries(informe.desglose)
            .filter(([, puntos]) => puntos !== 0)
            .map(([clave, puntos]) => `${NOMBRE_PUNTOS[clave] ?? clave} ${puntos > 0 ? '+' : ''}${puntos}`)
            .join(' · ')}
        </p>
      )}

      <Valoracion valoracion={informe.valoracion} />

      <p className="text-xs text-slate-400">
        <b className="text-slate-300">Design:</b> {nombresPiezas.join(' · ')}
      </p>
    </section>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="rounded-lg bg-slate-800/80 px-3 py-2">
      <p className="text-xs text-slate-400">{etiqueta}</p>
      <p className="font-semibold">{valor}</p>
    </div>
  )
}
