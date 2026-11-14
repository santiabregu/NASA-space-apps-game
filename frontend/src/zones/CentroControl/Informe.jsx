import { formatoDinero } from '../../formato.js'

const NOMBRE_PUNTOS = {
  objetivo: 'Objetivo cumplido',
  ciencia: 'Valor científico',
  eficiencia: 'Uso eficiente de recursos',
  equipo: 'Trabajo en equipo',
  retraso: 'Retraso',
}

export default function Informe({ lanzamiento, onVolverSede, onRedisenar }) {
  const { mision, simulacion, respuesta } = lanzamiento

  return (
    <section className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/80 p-5">
      <header>
        <p className="text-sm text-slate-400">Informe de la misión · {mision.titulo}</p>
        <h2 className={`text-2xl font-bold ${simulacion.exito ? 'text-emerald-300' : 'text-red-300'}`}>
          {simulacion.exito ? `Misión cumplida · ${simulacion.puntuacion} / 100` : 'Misión fallida'}
        </h2>
      </header>

      {simulacion.desglose && (
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(simulacion.desglose)
            .filter(([, puntos]) => puntos !== 0)
            .map(([clave, puntos]) => (
              <li key={clave} className="flex justify-between rounded-lg bg-slate-800 px-3 py-1">
                <span>{NOMBRE_PUNTOS[clave]}</span>
                <span>{puntos > 0 ? `+${puntos}` : puntos}</span>
              </li>
            ))}
        </ul>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">{simulacion.exito ? 'Qué ha pasado' : 'Por qué ha fallado'}</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {simulacion.explicaciones.map((explicacion) => (
            <li key={explicacion} className="rounded-lg bg-slate-950/60 p-3">{explicacion}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <Dato etiqueta="Piezas pagadas" valor={`−${formatoDinero(respuesta.costePagado)}`} />
        <Dato etiqueta="Pago del Gobierno" valor={`+${formatoDinero(respuesta.dineroGanado)}`} />
        {respuesta.prestamo > 0 && <Dato etiqueta="Préstamo de rescate" valor={`+${formatoDinero(respuesta.prestamo)}`} />}
        {respuesta.deudaDevuelta > 0 && <Dato etiqueta="Deuda devuelta" valor={`−${formatoDinero(respuesta.deudaDevuelta)}`} />}
        <Dato etiqueta="Conocimiento" valor={`+${respuesta.xpGanada} XP`} />
        <Dato
          etiqueta="Reputación"
          valor={respuesta.cambioReputacion >= 0 ? `+${respuesta.cambioReputacion}` : respuesta.cambioReputacion}
        />
      </div>
      {respuesta.nivelesSubidos > 0 && (
        <p className="rounded-lg bg-violet-950 p-3 text-violet-200">
          ⭐ ¡Subes a nivel {respuesta.jugador.nivel}! Hay piezas nuevas en el Almacén.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={onVolverSede} className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400">
          Volver a la Sede
        </button>
        {!simulacion.exito && (
          <button onClick={onRedisenar} className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800">
            Rediseñar y volver a intentarlo
          </button>
        )}
      </div>
    </section>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="flex justify-between rounded-lg bg-slate-800 px-3 py-2">
      <span className="text-slate-400">{etiqueta}</span>
      <span className="font-semibold">{valor}</span>
    </div>
  )
}
