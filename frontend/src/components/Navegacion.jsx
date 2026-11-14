import { formatoDinero } from '../formato.js'
import { LOGOS } from '../logos.js'

const ZONAS_NAVEGABLES = [
  { id: 'sede', nombre: 'HQ' },
  { id: 'misiones', nombre: 'Missions' },
  { id: 'hangar', nombre: 'Hangar' },
  { id: 'registro', nombre: 'Mission Log' },
  { id: 'academia', nombre: 'Academy' },
]

export default function Navegacion({ jugador, zona, onIrA, onSalir }) {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-400/20 bg-slate-950/55 backdrop-blur-md md:h-14">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 md:h-full md:flex-nowrap md:py-0">
        <img src={LOGOS.logoJuego} alt="Stellar Strategy" className="h-9 w-9" />
        <span className="mr-2 font-bold" style={{ color: jugador.empresa.colorPrimario }}>{jugador.empresa.nombre}</span>
        {ZONAS_NAVEGABLES.map((destino) => (
          <button
            key={destino.id}
            onClick={() => onIrA(destino.id)}
            className={`rounded-lg px-3 py-1 text-sm transition ${
              zona === destino.id ? 'bg-slate-400/20 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {destino.nombre}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-200">
          {formatoDinero(jugador.dinero)} · Month {jugador.campana.mesActual} / {jugador.campana.mesLimite} · Level {jugador.nivel}
        </span>
        <button onClick={onSalir} className="rounded-lg border border-slate-400/30 px-3 py-1 text-sm hover:bg-slate-800/60">
          Log out
        </button>
      </div>
    </nav>
  )
}
