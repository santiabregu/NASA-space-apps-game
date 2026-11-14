import { formatoDinero } from '../formato.js'

const ZONAS_NAVEGABLES = [
  { id: 'sede', nombre: '🏢 Sede' },
  { id: 'misiones', nombre: '🏛️ Misiones' },
  { id: 'hangar', nombre: '🛠️ Hangar' },
  { id: 'academia', nombre: '📚 Academia' },
]

export default function Navegacion({ jugador, zona, onIrA, onSalir }) {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
        <span className="mr-2 font-bold" style={{ color: jugador.empresa.colorPrimario }}>{jugador.empresa.nombre}</span>
        {ZONAS_NAVEGABLES.map((destino) => (
          <button
            key={destino.id}
            onClick={() => onIrA(destino.id)}
            className={`rounded-lg px-3 py-1 text-sm transition ${
              zona === destino.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {destino.nombre}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-300">
          {formatoDinero(jugador.dinero)} · Nivel {jugador.nivel}
        </span>
        <button onClick={onSalir} className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800">
          Salir
        </button>
      </div>
    </nav>
  )
}
