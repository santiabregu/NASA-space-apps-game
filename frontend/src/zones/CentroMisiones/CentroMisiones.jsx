import { useEffect, useState } from 'react'
import { obtenerMisionesDisponibles } from '../../api/misiones.js'
import { formatoDinero, formatoNumero } from '../../formato.js'

const NOMBRE_RECURSO = {
  MASA: 'Masa',
  POTENCIA: 'Potencia',
  PRESUPUESTO: 'Presupuesto',
  DATOS: 'Datos',
  COMUNICACIONES: 'Comunicaciones',
  TIEMPO: 'Tiempo',
}

export default function CentroMisiones({ jugador, catalogo, misionActiva, onAceptar }) {
  const [disponibles, setDisponibles] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenerMisionesDisponibles().then(setDisponibles, (excepcion) => setError(excepcion.message))
  }, [jugador])

  if (error) return <p className="p-8 text-center text-red-300">{error}</p>
  if (!disponibles) return <p className="p-8 text-center text-slate-400">Consultando al Gobierno…</p>

  const bloqueadasPorNivel = catalogo.misiones.filter(
    (mision) => mision.tipo === 'SOLO' && !disponibles.includes(mision.id) && mision.nivelMinimo > jugador.nivel,
  )

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">🏛️ Centro de Misiones</h1>
        <p className="text-slate-400">
          El Gobierno publica contratos. Tú pagas las piezas; si la misión sale bien, el Gobierno te paga según tu puntuación.
        </p>
      </header>

      {catalogo.misiones
        .filter((mision) => disponibles.includes(mision.id))
        .map((mision) => (
          <TarjetaMision key={mision.id} mision={mision} catalogo={catalogo}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAceptar(mision)}
                className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                {misionActiva?.id === mision.id ? 'Continuar diseño' : 'Aceptar en solitario'}
              </button>
              <button disabled className="rounded-lg border border-slate-700 px-4 py-2 text-slate-500" title="Próximamente">
                En grupo · próximamente
              </button>
            </div>
          </TarjetaMision>
        ))}

      {bloqueadasPorNivel.map((mision) => (
        <TarjetaMision key={mision.id} mision={mision} catalogo={catalogo} bloqueada>
          <p className="text-sm text-slate-400">🔒 Necesitas nivel {mision.nivelMinimo}</p>
        </TarjetaMision>
      ))}
    </main>
  )
}

function TarjetaMision({ mision, catalogo, bloqueada = false, children }) {
  const { requisitos, recompensa } = mision
  const orbitas = mision.orbitasPermitidas.map((id) => catalogo.orbitasPorId[id].nombre).join(' o ')
  const requisitosVisibles = [
    requisitos.valorCientificoMin > 0 && `Valor científico ≥ ${requisitos.valorCientificoMin}`,
    requisitos.datosMinMB > 0 && `Datos ≥ ${formatoNumero(requisitos.datosMinMB)} MB/día`,
    requisitos.vidaUtilMinDias > 0 && `Vida útil ≥ ${formatoNumero(requisitos.vidaUtilMinDias)} días`,
    `Plazo: ${requisitos.plazoMeses} meses`,
  ].filter(Boolean)

  return (
    <article className={`space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-5 ${bloqueada ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{mision.titulo}</h2>
        <p className="text-sm text-emerald-300">
          {recompensa.dinero > 0 ? `hasta ${formatoDinero(recompensa.dinero)}` : 'sin pago'} · {recompensa.xp} XP
        </p>
      </div>
      <p className="text-slate-300">{mision.descripcion}</p>
      <p className="text-sm text-slate-400">Órbita: {orbitas}</p>
      <ul className="flex flex-wrap gap-2 text-xs">
        {requisitosVisibles.map((texto) => (
          <li key={texto} className="rounded bg-slate-800 px-2 py-1">{texto}</li>
        ))}
        {mision.recursosCriticos.map((recurso) => (
          <li key={recurso} className="rounded bg-cyan-950 px-2 py-1 text-cyan-300">★ {NOMBRE_RECURSO[recurso]}</li>
        ))}
      </ul>
      {children}
    </article>
  )
}
