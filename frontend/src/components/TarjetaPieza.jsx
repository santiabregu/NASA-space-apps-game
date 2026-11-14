import { formatoDinero, formatoNumero } from '../formato.js'
import { estaBloqueada } from '../piezas.js'

function caracteristicas(pieza) {
  const lista = [`${formatoNumero(pieza.masaKg)} kg`, formatoDinero(pieza.coste), `${pieza.mesesDesarrollo} meses`]
  if (pieza.potenciaW) lista.push(`${pieza.potenciaW > 0 ? '+' : ''}${formatoNumero(pieza.potenciaW)} W`)
  if (pieza.empujeKN) lista.push(`${pieza.empujeKN} kN · Isp ${pieza.ispS} s`)
  if (pieza.combustibleKg) lista.push(`${formatoNumero(pieza.combustibleKg)} kg de combustible`)
  if (pieza.capacidadKg) lista.push(`carga hasta ${formatoNumero(pieza.capacidadKg)} kg`)
  if (pieza.huecos) lista.push(`${pieza.huecos} huecos · ${formatoNumero(pieza.vidaUtilDias)} días de vida`)
  if (pieza.capacidadWh) lista.push(`${pieza.capacidadWh} Wh`)
  if (pieza.tasaMbps) lista.push(`${formatoNumero(pieza.tasaMbps * 1000)} kbit/s`)
  if (pieza.datosPorDiaMB) lista.push(`${formatoNumero(pieza.datosPorDiaMB)} MB/día · ciencia ${pieza.valorCientifico}`)
  if (pieza.requiereApuntado) lista.push('necesita apuntar')
  return lista
}

export default function TarjetaPieza({ pieza, nivel, seleccionada = false, children }) {
  const bloqueada = estaBloqueada(pieza, nivel)

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 transition ${
        seleccionada ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-800 bg-slate-900/60'
      } ${bloqueada ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{pieza.nombre}</p>
        {bloqueada && <span className="shrink-0 text-xs text-slate-400">🔒 Nivel {pieza.nivelRequerido}</span>}
      </div>
      <p className="text-xs text-slate-400">{pieza.explicacion}</p>
      <ul className="flex flex-wrap gap-1 text-xs">
        {caracteristicas(pieza).map((texto) => (
          <li key={texto} className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{texto}</li>
        ))}
      </ul>
      {!bloqueada && children}
    </div>
  )
}
