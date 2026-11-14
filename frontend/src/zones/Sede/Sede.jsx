import BarraRecurso from '../../components/BarraRecurso.jsx'
import { formatoDinero } from '../../formato.js'

const ZONAS = [
  { icono: '🛠️', nombre: 'Hangar', descripcion: 'Construye satélites y cohetes' },
  { icono: '🏛️', nombre: 'Centro de Misiones', descripcion: 'Contratos del Gobierno' },
  { icono: '📡', nombre: 'Centro de Control', descripcion: 'Sigue tus lanzamientos' },
  { icono: '👥', nombre: 'Social', descripcion: 'Amigos y misiones de grupo' },
  { icono: '📚', nombre: 'Academia', descripcion: 'Aprende los conceptos' },
]

export default function Sede({ jugador, onSalir }) {
  const { empresa } = jugador

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: empresa.colorPrimario }}>{empresa.nombre}</h1>
          <p className="text-slate-400">Dirigida por {jugador.nombreUsuario}</p>
        </div>
        <button onClick={onSalir} className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800">
          Salir
        </button>
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
        </Tarjeta>
      </section>

      <p className="text-sm text-slate-400">
        Misiones completadas: {jugador.misionesCompletadas} · Fallidas: {jugador.misionesFallidas}
      </p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ZONAS.map((zona) => (
          <div key={zona.nombre} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 opacity-60">
            <p className="text-2xl">{zona.icono}</p>
            <p className="font-semibold">{zona.nombre}</p>
            <p className="text-sm text-slate-400">{zona.descripcion}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Próximamente</p>
          </div>
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
