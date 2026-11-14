import BarraRecurso from '../../components/BarraRecurso.jsx'
import { formatoDinero } from '../../formato.js'
import { LOGOS } from '../../logos.js'

const ZONAS = [
  { id: 'misiones', logo: LOGOS.centroMisiones, nombre: 'Mission Center', descripcion: 'Government contracts' },
  { id: 'hangar', logo: LOGOS.hangar, nombre: 'Hangar', descripcion: 'Build satellites and rockets' },
  { id: 'academia', logo: LOGOS.academia, nombre: 'Academy', descripcion: 'Learn the concepts' },
  { id: 'registro', logo: LOGOS.centroControl, nombre: 'Mission Log', descripcion: 'Your launches: what worked and why' },
  { id: 'social', logo: LOGOS.social, nombre: 'Social', descripcion: 'Friends and team missions' },
]

const TEXTO_CONFIANZA = {
  SOCIO: 'Trusted partner: the Government offers you its best contracts.',
  NORMAL: 'The Government pays you when you complete each mission.',
  EN_OBSERVACION: 'On probation: the Government has stopped paying you. Pass a trust test.',
}

export default function Sede({ jugador, onIrA }) {
  const { empresa } = jugador

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:h-[calc(100dvh-3.5rem)] md:justify-center-safe md:gap-[3vh] md:px-8 md:py-[3vh]">
      <header>
        <h1
          className="font-display text-3xl font-extrabold md:text-[clamp(1.75rem,5.5vh,2.75rem)]"
          style={{ color: empresa.colorPrimario, textShadow: '0 0 24px rgba(34,211,238,.35)' }}
        >
          {empresa.nombre}
        </h1>
        <p className="text-slate-400">Run by {jugador.nombreUsuario}</p>
      </header>

      <section className="grid max-w-4xl gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Money">
          <p className="text-2xl font-semibold">{formatoDinero(jugador.dinero)}</p>
          {empresa.deuda > 0 && <p className="text-sm text-red-300">Debt: {formatoDinero(empresa.deuda)}</p>}
        </Tarjeta>
        <Tarjeta titulo={`Knowledge · Level ${jugador.nivel}`}>
          <BarraRecurso etiqueta="XP" valor={jugador.xp} maximo={jugador.xpSiguienteNivel} color="bg-violet-400" />
        </Tarjeta>
        <Tarjeta titulo="Government trust">
          <BarraRecurso etiqueta="Reputation" valor={empresa.reputacion} maximo={100} color="bg-emerald-400" />
          <p className="text-xs text-slate-400">{TEXTO_CONFIANZA[empresa.confianza]}</p>
        </Tarjeta>
      </section>

      <p className="text-sm text-slate-400">
        Missions completed: {jugador.misionesCompletadas} · Failed: {jugador.misionesFallidas}
      </p>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ZONAS.map((zona) => (
          <button
            key={zona.nombre}
            disabled={!zona.id}
            onClick={() => onIrA(zona.id)}
            className="cristal p-4 text-center transition enabled:hover:-translate-y-1 enabled:hover:border-cyan-400/60 disabled:opacity-55 md:p-[min(1rem,2vh)]"
          >
            <img
              src={zona.logo}
              alt=""
              className="mx-auto h-24 object-contain drop-shadow-[0_6px_18px_rgba(34,211,238,.35)] md:h-[min(7rem,14vh)]"
            />
            <p className="mt-2 font-display font-semibold">{zona.nombre}</p>
            <p className="mt-1 text-sm text-slate-400">{zona.descripcion}</p>
          </button>
        ))}
      </section>
    </main>
  )
}

function Tarjeta({ titulo, children }) {
  return (
    <div className="cristal space-y-2 p-4 md:p-[min(1rem,2vh)]">
      <p className="text-sm text-slate-400">{titulo}</p>
      {children}
    </div>
  )
}
