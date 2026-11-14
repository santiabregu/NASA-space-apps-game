import { Award } from 'lucide-react'
import { formatoDinero } from '../../formato.js'

const NOMBRE_PUNTOS = {
  objetivo: 'Objective achieved',
  ciencia: 'Science value',
  eficiencia: 'Efficient use of resources',
  equipo: 'Teamwork',
  retraso: 'Delay',
}

export default function Informe({ lanzamiento, onVolverSede, onRedisenar }) {
  const { mision, simulacion, respuesta } = lanzamiento

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

      <div className="space-y-2">
        <h3 className="font-semibold">{simulacion.exito ? 'What happened' : 'Why it failed'}</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {simulacion.explicaciones.map((explicacion) => (
            <li key={explicacion} className="rounded-lg bg-slate-950/60 p-3">{explicacion}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <Dato etiqueta="Parts paid" valor={`−${formatoDinero(respuesta.costePagado)}`} />
        <Dato etiqueta="Government payment" valor={`+${formatoDinero(respuesta.dineroGanado)}`} />
        {respuesta.prestamo > 0 && <Dato etiqueta="Rescue loan" valor={`+${formatoDinero(respuesta.prestamo)}`} />}
        {respuesta.deudaDevuelta > 0 && <Dato etiqueta="Debt repaid" valor={`−${formatoDinero(respuesta.deudaDevuelta)}`} />}
        <Dato etiqueta="Knowledge" valor={`+${respuesta.xpGanada} XP`} />
        <Dato
          etiqueta="Reputation"
          valor={respuesta.cambioReputacion >= 0 ? `+${respuesta.cambioReputacion}` : respuesta.cambioReputacion}
        />
      </div>
      {respuesta.nivelesSubidos > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-violet-950/80 p-3 text-violet-200">
          <Award className="h-5 w-5 shrink-0" />
          You reached level {respuesta.jugador.nivel}! New parts are available in the Warehouse.
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
