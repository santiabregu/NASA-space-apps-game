import { useEffect, useState } from 'react'
import { obtenerMisionesDisponibles } from '../../api/misiones.js'
import { formatoDinero, formatoNumero } from '../../formato.js'

const NOMBRE_RECURSO = {
  MASA: 'Mass',
  POTENCIA: 'Power',
  PRESUPUESTO: 'Budget',
  DATOS: 'Data',
  COMUNICACIONES: 'Communications',
  TIEMPO: 'Time',
}

export default function CentroMisiones({ jugador, catalogo, misionActiva, onAceptar }) {
  const [disponibles, setDisponibles] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenerMisionesDisponibles().then(setDisponibles, (excepcion) => setError(excepcion.message))
  }, [jugador])

  if (error) return <p className="p-8 text-center text-red-300">{error}</p>
  if (!disponibles) return <p className="p-8 text-center text-slate-400">Contacting the Government…</p>

  const bloqueadasPorNivel = catalogo.misiones.filter(
    (mision) => mision.tipo === 'SOLO' && !disponibles.includes(mision.id) && mision.nivelMinimo > jugador.nivel,
  )

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold">Mission Center</h1>
        <p className="text-slate-400">
          The Government posts contracts. You pay for the parts; if the mission succeeds, the Government pays you based on your score.
        </p>
      </header>

      {catalogo.misiones
        .filter((mision) => disponibles.includes(mision.id))
        .map((mision) => (
          <TarjetaMision key={mision.id} mision={mision} catalogo={catalogo}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAceptar(mision)}
                className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                {misionActiva?.id === mision.id ? 'Continue design' : 'Accept solo'}
              </button>
              <button disabled className="rounded-lg border border-slate-400/30 px-4 py-2 text-slate-500" title="Coming soon">
                As a team · coming soon
              </button>
            </div>
          </TarjetaMision>
        ))}

      {bloqueadasPorNivel.map((mision) => (
        <TarjetaMision key={mision.id} mision={mision} catalogo={catalogo} bloqueada>
          <p className="text-sm text-slate-400">🔒 Requires level {mision.nivelMinimo}</p>
        </TarjetaMision>
      ))}
    </main>
  )
}

function TarjetaMision({ mision, catalogo, bloqueada = false, children }) {
  const { requisitos, recompensa } = mision
  const orbitas = mision.orbitasPermitidas.map((id) => catalogo.orbitasPorId[id].nombre).join(' or ')
  const requisitosVisibles = [
    requisitos.valorCientificoMin > 0 && `Science value ≥ ${requisitos.valorCientificoMin}`,
    requisitos.datosMinMB > 0 && `Data ≥ ${formatoNumero(requisitos.datosMinMB)} MB/day`,
    requisitos.vidaUtilMinDias > 0 && `Lifetime ≥ ${formatoNumero(requisitos.vidaUtilMinDias)} days`,
    `Deadline: ${requisitos.plazoMeses} months`,
  ].filter(Boolean)

  return (
    <article className={`cristal space-y-3 p-5 ${bloqueada ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{mision.titulo}</h2>
        <p className="text-sm text-emerald-300">
          {recompensa.dinero > 0 ? `up to ${formatoDinero(recompensa.dinero)}` : 'unpaid'} · {recompensa.xp} XP
        </p>
      </div>
      <p className="text-slate-300">{mision.descripcion}</p>
      <p className="text-sm text-slate-400">Orbit: {orbitas}</p>
      <ul className="flex flex-wrap gap-2 text-xs">
        {requisitosVisibles.map((texto) => (
          <li key={texto} className="rounded bg-slate-800/80 px-2 py-1">{texto}</li>
        ))}
        {mision.recursosCriticos.map((recurso) => (
          <li key={recurso} className="rounded bg-cyan-950/80 px-2 py-1 text-cyan-300">★ {NOMBRE_RECURSO[recurso]}</li>
        ))}
      </ul>
      {children}
    </article>
  )
}
