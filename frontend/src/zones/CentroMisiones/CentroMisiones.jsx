import { CircleCheck, Flag, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { obtenerMisionesDisponibles } from '../../api/misiones.js'
import { formatoDinero, formatoNumero } from '../../formato.js'
import { BANNER_MISION } from '../../imagenes.js'

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

  const terminadas = jugador.misionesTerminadas
  const bloqueadasPorNivel = catalogo.misiones.filter(
    (mision) => mision.tipo === 'SOLO' && !disponibles.includes(mision.id) && mision.nivelMinimo > jugador.nivel,
  )
  const terminadasNoRepetibles = catalogo.misiones.filter((mision) => mision.id in terminadas && !disponibles.includes(mision.id))

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
          <TarjetaMision key={mision.id} mision={mision} catalogo={catalogo} mejorPuntuacion={terminadas[mision.id]}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAceptar(mision)}
                className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                {textoBotonAceptar(mision.id === misionActiva?.id, mision.id in terminadas)}
              </button>
              <button disabled className="rounded-lg border border-slate-400/30 px-4 py-2 text-slate-500" title="Coming soon">
                As a team · coming soon
              </button>
            </div>
          </TarjetaMision>
        ))}

      {bloqueadasPorNivel.map((mision) => (
        <TarjetaMision key={mision.id} mision={mision} catalogo={catalogo} bloqueada>
          <p className="flex items-center gap-1.5 text-sm text-slate-400">
            <Lock className="h-4 w-4" /> Requires level {mision.nivelMinimo}
          </p>
        </TarjetaMision>
      ))}

      {terminadasNoRepetibles.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Completed missions</h2>
          {terminadasNoRepetibles.map((mision) => (
            <TarjetaMision key={mision.id} mision={mision} catalogo={catalogo} mejorPuntuacion={terminadas[mision.id]} />
          ))}
        </section>
      )}
    </main>
  )
}

function textoBotonAceptar(enDiseno, terminada) {
  if (enDiseno) return 'Continue design'
  return terminada ? 'Play again' : 'Accept solo'
}

function TarjetaMision({ mision, catalogo, bloqueada = false, mejorPuntuacion, children }) {
  const terminada = mejorPuntuacion !== undefined
  const { requisitos, recompensa } = mision
  const orbitas = mision.orbitasPermitidas.map((id) => catalogo.orbitasPorId[id].nombre).join(' or ')
  const requisitosVisibles = [
    requisitos.valorCientificoMin > 0 && `Science value ≥ ${requisitos.valorCientificoMin}`,
    requisitos.datosMinMB > 0 && `Data ≥ ${formatoNumero(requisitos.datosMinMB)} MB/day`,
    requisitos.vidaUtilMinDias > 0 && `Lifetime ≥ ${formatoNumero(requisitos.vidaUtilMinDias)} days`,
    `Deadline: ${requisitos.plazoMeses} months`,
  ].filter(Boolean)

  const banner = BANNER_MISION[mision.id]

  return (
    <article className={`cristal overflow-hidden ${bloqueada ? 'opacity-50' : ''} ${terminada ? 'ring-1 ring-emerald-400/50' : ''}`}>
      {banner && <img src={banner} alt="" loading="lazy" className="h-40 w-full object-cover" />}
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">{mision.titulo}</h2>
          <p className="text-sm text-emerald-300">
            {recompensa.dinero > 0 ? `up to ${formatoDinero(recompensa.dinero)}` : 'unpaid'} · {recompensa.xp} XP
          </p>
        </div>
        <p className="text-slate-300">{mision.descripcion}</p>
        {terminada && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
            <CircleCheck className="h-4 w-4" /> Completed · best score {mejorPuntuacion} / 100
          </p>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-400">Orbit</dt>
          <dd>{orbitas}</dd>
          <dt className="text-slate-400">Requirements</dt>
          <dd>{requisitosVisibles.join(' · ')}</dd>
          <dt className="text-slate-400">Critical resources</dt>
          <dd className="flex items-center gap-1.5 text-cyan-300">
            <Flag className="h-3.5 w-3.5 shrink-0 fill-current" />
            {mision.recursosCriticos.map((recurso) => NOMBRE_RECURSO[recurso]).join(', ')}</dd>
        </dl>
        {children}
      </div>
    </article>
  )
}
