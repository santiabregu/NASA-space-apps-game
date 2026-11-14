import { Award, Milestone } from 'lucide-react'
import Valoracion from '../../components/Valoracion.jsx'
import { formatoDinero } from '../../formato.js'

const NOMBRE_PUNTOS = {
  objetivo: 'Objective achieved',
  ciencia: 'Science value',
  altitud: 'Altitude margin',
  eficiencia: 'Efficient use of resources',
  equipo: 'Teamwork',
  retraso: 'Delay',
}

export default function Informe({ lanzamiento, onVolverSede, onRedisenar }) {
  const { mision, simulacion, valoracion, respuesta, destino } = lanzamiento

  return (
    <section className="cristal space-y-5 p-5">
      <header>
        <p className="text-sm text-slate-400">Mission report · {mision.titulo}</p>
        <h2 className={`font-display text-2xl font-bold ${simulacion.exito ? 'text-emerald-300' : 'text-red-300'}`}>
          {simulacion.exito ? `Mission accomplished · ${simulacion.puntuacion} / 100` : 'Mission failed'}
        </h2>
      </header>

      {simulacion.desglose && (
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(simulacion.desglose)
            .filter(([, puntos]) => puntos !== 0)
            .map(([clave, puntos]) => (
              <li key={clave} className="flex justify-between rounded-lg bg-slate-800/80 px-3 py-1">
                <span>{NOMBRE_PUNTOS[clave]}</span>
                <span>{puntos > 0 ? `+${puntos}` : puntos}</span>
              </li>
            ))}
        </ul>
      )}

      {destino && (
        <div className="flex gap-3 rounded-xl border border-amber-300/40 bg-amber-950/60 p-4 text-amber-100">
          <Milestone className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div className="space-y-1">
            <p className="font-display font-semibold text-amber-300">Destination reached: {destino.nombre}!</p>
            <p>New parts and missions are unlocked. {destino.referenciaReal}</p>
            {respuesta.financiacion > 0 && (
              <p>Investors are impressed: a {formatoDinero(respuesta.financiacion)} funding round has closed.</p>
            )}
          </div>
        </div>
      )}

      <Valoracion valoracion={valoracion} />

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <Dato etiqueta="Parts bought" valor={`−${formatoDinero(respuesta.costePagado)}`} />
        <Dato etiqueta="Government payment" valor={`+${formatoDinero(respuesta.dineroGanado)}`} />
        {respuesta.financiacion > 0 && <Dato etiqueta="Investors" valor={`+${formatoDinero(respuesta.financiacion)}`} />}
        {respuesta.prestamo > 0 && <Dato etiqueta="Rescue loan" valor={`+${formatoDinero(respuesta.prestamo)}`} />}
        {respuesta.deudaDevuelta > 0 && <Dato etiqueta="Debt repaid" valor={`−${formatoDinero(respuesta.deudaDevuelta)}`} />}
        <Dato etiqueta="Knowledge" valor={`+${respuesta.xpGanada} XP`} />
        <Dato etiqueta="Campaign time" valor={`month ${respuesta.mesJuego} of ${respuesta.jugador.campana.mesLimite}`} />
        <Dato
          etiqueta="Reputation"
          valor={respuesta.cambioReputacion >= 0 ? `+${respuesta.cambioReputacion}` : respuesta.cambioReputacion}
        />
      </div>
      {respuesta.nivelesSubidos > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-violet-950/80 p-3 text-violet-200">
          <Award className="h-5 w-5 shrink-0" />
          You reached level {respuesta.jugador.nivel}!
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={onVolverSede} className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300">
          Back to HQ
        </button>
        {!simulacion.exito && (
          <button onClick={onRedisenar} className="rounded-lg border border-slate-400/40 px-4 py-2 hover:bg-slate-800/60">
            Redesign and try again
          </button>
        )}
      </div>
    </section>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="flex justify-between rounded-lg bg-slate-800/80 px-3 py-2">
      <span className="text-slate-400">{etiqueta}</span>
      <span className="font-semibold">{valor}</span>
    </div>
  )
}
