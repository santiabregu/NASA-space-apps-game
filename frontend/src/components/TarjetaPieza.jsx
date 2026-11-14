import { formatoDinero, formatoNumero } from '../formato.js'
import { estaBloqueada } from '../piezas.js'

function caracteristicas(pieza) {
  const lista = [`${formatoNumero(pieza.masaKg)} kg`, formatoDinero(pieza.coste), `${pieza.mesesDesarrollo} mo`]
  if (pieza.potenciaW) lista.push(`${pieza.potenciaW > 0 ? '+' : ''}${formatoNumero(pieza.potenciaW)} W`)
  if (pieza.empujeKN) lista.push(`${pieza.empujeKN} kN · Isp ${pieza.ispS} s`)
  if (pieza.combustibleKg) lista.push(`${formatoNumero(pieza.combustibleKg)} kg propellant`)
  if (pieza.capacidadKg) lista.push(`payload up to ${formatoNumero(pieza.capacidadKg)} kg`)
  if (pieza.huecos) lista.push(`${pieza.huecos} slots · ${formatoNumero(pieza.vidaUtilDias)} days of life`)
  if (pieza.capacidadWh) lista.push(`${pieza.capacidadWh} Wh`)
  if (pieza.tasaMbps) lista.push(`${formatoNumero(pieza.tasaMbps * 1000)} kbit/s`)
  if (pieza.datosPorDiaMB) lista.push(`${formatoNumero(pieza.datosPorDiaMB)} MB/day · science ${pieza.valorCientifico}`)
  if (pieza.requiereApuntado) lista.push('needs pointing')
  return lista
}

export default function TarjetaPieza({ pieza, nivel, seleccionada = false, children }) {
  const bloqueada = estaBloqueada(pieza, nivel)

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 backdrop-blur-md transition ${
        seleccionada ? 'border-cyan-400 bg-cyan-950/50' : 'border-slate-400/20 bg-slate-900/60'
      } ${bloqueada ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{pieza.nombre}</p>
        {bloqueada && <span className="shrink-0 text-xs text-slate-400">🔒 Level {pieza.nivelRequerido}</span>}
      </div>
      <p className="text-xs text-slate-400">{pieza.explicacion}</p>
      <ul className="flex flex-wrap gap-1 text-xs">
        {caracteristicas(pieza).map((texto) => (
          <li key={texto} className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">{texto}</li>
        ))}
      </ul>
      {!bloqueada && children}
    </div>
  )
}
