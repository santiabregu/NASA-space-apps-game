import { Fragment } from 'react'
import { formatoDinero, formatoNumero } from '../formato.js'
import { IMAGEN_PIEZA } from '../imagenes.js'

const TITULO_ACCION = {
  instalada: { texto: 'Installed', color: 'text-emerald-300' },
  quitada: { texto: 'Removed', color: 'text-red-300' },
}

function especificaciones(pieza, nivel) {
  const filas = [
    ['Mass', `${formatoNumero(pieza.masaKg)} kg`],
    ['Cost', formatoDinero(pieza.coste)],
    ['Build time', `${pieza.mesesDesarrollo} ${pieza.mesesDesarrollo === 1 ? 'month' : 'months'}`],
  ]
  if (pieza.potenciaW > 0) filas.push(['Power', `generates ${formatoNumero(pieza.potenciaW)} W`])
  if (pieza.potenciaW < 0) filas.push(['Power', `uses ${formatoNumero(-pieza.potenciaW)} W`])
  if (pieza.empujeKN) filas.push(['Thrust', `${formatoNumero(pieza.empujeKN)} kN`], ['Efficiency (Isp)', `${pieza.ispS} s`])
  if (pieza.combustibleKg) filas.push(['Propellant', `${formatoNumero(pieza.combustibleKg)} kg`])
  if (pieza.capacidadKg) filas.push(['Max satellite mass', `${formatoNumero(pieza.capacidadKg)} kg`])
  if (pieza.huecos) filas.push(['Component slots', pieza.huecos], ['Lifetime', `${formatoNumero(pieza.vidaUtilDias)} days`])
  if (pieza.capacidadWh) filas.push(['Battery capacity', `${pieza.capacidadWh} Wh`])
  if (pieza.tasaMbps) filas.push(['Data rate', `${formatoNumero(pieza.tasaMbps * 1000)} kbit/s`])
  if (pieza.datosPorDiaMB) filas.push(['Data produced', `${formatoNumero(pieza.datosPorDiaMB)} MB per day`], ['Science value', pieza.valorCientifico])
  if (pieza.requiereApuntado) filas.push(['Pointing', 'needs reaction wheels'])
  if (pieza.nivelRequerido > nivel) filas.push(['Unlocks at', `level ${pieza.nivelRequerido}`])
  return filas
}

export default function FichaPieza({ pieza, accion, efectos = [], nivel }) {
  const titulo = TITULO_ACCION[accion]
  const imagen = IMAGEN_PIEZA[pieza.id]

  return (
    <section className="cristal animate-aparecer space-y-3 p-4" aria-live="polite">
      {imagen && <img src={imagen} alt="" className="mx-auto h-28 object-contain drop-shadow-[0_6px_18px_rgba(34,211,238,.25)]" />}
      <div>
        {titulo && <p className={`text-xs font-semibold uppercase tracking-wide ${titulo.color}`}>{titulo.texto}</p>}
        <h3 className="font-display font-semibold">{pieza.nombre}</h3>
        <p className="mt-1 text-sm text-slate-400">{pieza.explicacion}</p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {especificaciones(pieza, nivel).map(([etiqueta, valor]) => (
          <Fragment key={etiqueta}>
            <dt className="text-slate-400">{etiqueta}</dt>
            <dd className="text-right">{valor}</dd>
          </Fragment>
        ))}
      </dl>

      {efectos.length > 0 && (
        <div className="border-t border-slate-400/20 pt-3">
          <h4 className="mb-1 text-sm font-semibold">Effect on your mission</h4>
          <ul className="space-y-1 text-sm">
            {efectos.map((efecto) => (
              <li key={efecto.texto} className={efecto.bueno ? 'text-emerald-300' : 'text-red-300'}>{efecto.texto}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
