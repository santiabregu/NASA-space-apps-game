import BarraRecurso from '../../components/BarraRecurso.jsx'
import { formatoDinero } from '../../formato.js'

const ZONAS = [
  { id: 'misiones', icono: '🏛️', nombre: 'Centro de Misiones', descripcion: 'Contratos del Gobierno' },
  { id: 'hangar', icono: '🛠️', nombre: 'Hangar', descripcion: 'Construye satélites y cohetes' },
  { id: 'academia', icono: '📚', nombre: 'Academia', descripcion: 'Aprende los conceptos' },
  { id: null, icono: '📡', nombre: 'Centro de Control', descripcion: 'Se abre al lanzar una misión' },
  { id: null, icono: '👥', nombre: 'Social', descripcion: 'Amigos y misiones de grupo · Próximamente' },
]

const TEXTO_CONFIANZA = {
  SOCIO: 'Socio de confianza: el Gobierno te ofrece sus mejores contratos.',
  NORMAL: 'El Gobierno te paga al completar cada misión.',
  EN_OBSERVACION: 'En observación: el Gobierno ha dejado de pagarte. Supera una prueba de confianza.',
}

export default function Sede({ jugador, onIrA }) {
  const { empresa } = jugador

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold" style={{ color: empresa.colorPrimario }}>{empresa.nombre}</h1>
        <p className="text-slate-400">Dirigida por {jugador.nombreUsuario}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Dinero">
          <p className="text-2xl font-semibold">{formatoDinero(jugador.dinero)}</p>
          {empresa.deuda > 0 && <p className="text-sm text-red-300">Deuda: {formatoDinero(empresa.deuda)}</p>}
        </Tarjeta>
        <Tarjeta titulo={`Conocimiento · Nivel ${jugador.nivel}`}>
          <BarraRecurso etiqueta="XP" valor={jugador.xp} maximo={jugador.xpSiguienteNivel} color="bg-violet-400" />
        </Tarjeta>
        <Tarjeta titulo="Confianza del Gobierno">
          <BarraRecurso etiqueta="Reputación" valor={empresa.reputacion} maximo={100} color="bg-emerald-400" />
          <p className="text-xs text-slate-400">{TEXTO_CONFIANZA[empresa.confianza]}</p>
        </Tarjeta>
      </section>

      <p className="text-sm text-slate-400">
        Misiones completadas: {jugador.misionesCompletadas} · Fallidas: {jugador.misionesFallidas}
      </p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ZONAS.map((zona) => (
          <button
            key={zona.nombre}
            disabled={!zona.id}
            onClick={() => onIrA(zona.id)}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition enabled:hover:border-cyan-700 disabled:opacity-50"
          >
            <p className="text-2xl">{zona.icono}</p>
            <p className="font-semibold">{zona.nombre}</p>
            <p className="text-sm text-slate-400">{zona.descripcion}</p>
          </button>
        ))}
      </section>
    </main>
  )
}

function Tarjeta({ titulo, children }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-sm text-slate-400">{titulo}</p>
      {children}
    </div>
  )
}
