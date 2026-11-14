import {
  ArrowUpToLine,
  Atom,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDollarSign,
  CircleX,
  Clock,
  Database,
  Download,
  Flag,
  Hourglass,
  MoveUp,
  Package,
  RadioTower,
  Rocket,
  Weight,
  Zap,
} from 'lucide-react'
import { COLOR_ESTADO } from '../colores.js'
import { objetivosMision } from '../engine/objetivos.js'
import { formatoNumero } from '../formato.js'

const ICONO_OBJETIVO = { altitud: ArrowUpToLine, orbita: Rocket, despegue: MoveUp, cofia: Package, ciencia: Atom, datos: Download, vida: Hourglass, plazo: CalendarClock }
const ICONO_RECURSO = { MASA: Weight, POTENCIA: Zap, PRESUPUESTO: CircleDollarSign, DATOS: Database, COMUNICACIONES: RadioTower, TIEMPO: Clock }
const ICONO_ESTADO = {
  ok: { Icono: CircleCheck, color: 'text-emerald-400' },
  aviso: { Icono: CircleAlert, color: 'text-amber-400' },
  error: { Icono: CircleX, color: 'text-red-400' },
  pendiente: { Icono: CircleDashed, color: 'text-slate-500' },
}
const COLOR_BARRA = { ...COLOR_ESTADO, pendiente: 'bg-slate-600' }
const RAYADO = {
  bueno: 'repeating-linear-gradient(45deg, rgba(52,211,153,.75) 0 4px, rgba(52,211,153,.25) 4px 8px)',
  malo: 'repeating-linear-gradient(45deg, rgba(248,113,113,.75) 0 4px, rgba(248,113,113,.25) 4px 8px)',
  neutro: 'repeating-linear-gradient(45deg, rgba(34,211,238,.7) 0 4px, rgba(34,211,238,.2) 4px 8px)',
}
const CAMBIO_MINIMO = 0.005

const porcentaje = (valor, maximo) => (maximo > 0 ? Math.min((valor / maximo) * 100, 100) : 0)
const formatoCambio = (cambio) => formatoNumero(Math.abs(cambio) >= 100 ? Math.round(Math.abs(cambio)) : Math.abs(cambio))

// previa = análisis del diseño si se instalara la pieza bajo el ratón.
export default function PanelMision({ analisis, previa, mision }) {
  const objetivos = objetivosMision(analisis, mision)
  const objetivosPrevia = previa && Object.fromEntries(objetivosMision(previa.analisis, mision).map((o) => [o.id, o]))
  const recursosPrevia = previa && Object.fromEntries(previa.analisis.recursos.map((r) => [r.id, r]))
  const sinCumplir = objetivos.filter((objetivo) => objetivo.estado === 'error').length

  return (
    <section className="cristal space-y-4 p-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display font-semibold">Mission goals</h2>
          {previa ? (
            <span className="truncate text-xs text-cyan-300">Preview: {previa.pieza.nombre}</span>
          ) : (
            sinCumplir > 0 && <span className="text-xs text-red-300">{sinCumplir} not met</span>
          )}
        </div>
        <ul className="space-y-1">
          {objetivos.map((objetivo) => (
            <FilaObjetivo key={objetivo.id} objetivo={objetivo} despues={objetivosPrevia?.[objetivo.id]} />
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-400/20 pt-3">
        <h2 className="mb-2 font-display font-semibold">Resources</h2>
        <ul className="space-y-1">
          {analisis.recursos.map((recurso) => (
            <FilaRecurso
              key={recurso.id}
              recurso={recurso}
              despues={recursosPrevia?.[recurso.id]}
              critico={mision.recursosCriticos.includes(recurso.id)}
            />
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Flag className="h-3 w-3 shrink-0 fill-current" /> Critical for this mission · Tap a row to learn what it means
        </p>
      </div>
    </section>
  )
}

function FilaObjetivo({ objetivo, despues }) {
  const Icono = ICONO_OBJETIVO[objetivo.id]
  const cambio = despues ? despues.valor - objetivo.valor : 0
  // Un cambio que redondeado se lee como 0 solo confunde.
  const cambia = Math.abs(cambio) > CAMBIO_MINIMO && formatoCambio(cambio) !== '0'
  const mostrado = cambia ? despues : objetivo
  const estado = ICONO_ESTADO[mostrado.estado]
  const bueno = cambio > 0 === objetivo.mayorEsMejor

  return (
    <li>
      <details className="rounded-lg px-2 py-1.5 open:bg-slate-800/40">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center gap-2 text-sm">
            <Icono className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-medium">{objetivo.nombre}</span>
            <span className="ml-auto text-right text-xs text-slate-300">
              {mostrado.texto}
              {cambia && (
                <span className={`ml-1 font-semibold ${bueno ? 'text-emerald-300' : 'text-red-300'}`}>
                  {cambio > 0 ? '+' : '−'}
                  {formatoCambio(cambio)} {objetivo.unidad}
                </span>
              )}
            </span>
            <estado.Icono className={`h-4 w-4 shrink-0 ${estado.color}`} />
          </div>
          <Barra
            antes={porcentaje(objetivo.valor, objetivo.objetivo)}
            despues={cambia ? porcentaje(despues.valor, despues.objetivo) : null}
            color={COLOR_BARRA[mostrado.estado]}
            rayado={bueno ? RAYADO.bueno : RAYADO.malo}
          />
        </summary>
        <p className="mt-2 text-xs text-slate-400">{objetivo.explicacion}</p>
      </details>
    </li>
  )
}

function FilaRecurso({ recurso, despues, critico }) {
  const Icono = ICONO_RECURSO[recurso.id]
  const cambia = despues && despues.texto !== recurso.texto
  const mostrado = cambia ? despues : recurso

  return (
    <li>
      <details className="rounded-lg px-2 py-1 open:bg-slate-800/40">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center gap-1.5 text-xs">
            <Icono className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{recurso.nombre}</span>
            {critico && <Flag className="h-3 w-3 shrink-0 fill-current text-cyan-300" />}
            <span className={`ml-auto text-right ${cambia ? 'text-cyan-300' : 'text-slate-400'}`}>{mostrado.texto}</span>
          </div>
          <Barra
            antes={porcentaje(recurso.valor, recurso.maximo)}
            despues={cambia ? porcentaje(despues.valor, despues.maximo) : null}
            color={COLOR_ESTADO[mostrado.estado]}
            rayado={RAYADO.neutro}
          />
        </summary>
        <p className="mt-2 text-xs text-slate-400">{recurso.explicacion}</p>
      </details>
    </li>
  )
}

// El tramo rayado es lo que se gana o se pierde con la pieza de la vista previa.
function Barra({ antes, despues, color, rayado }) {
  const base = despues === null ? antes : Math.min(antes, despues)
  const tramo = despues === null ? 0 : Math.abs(despues - antes)
  return (
    <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
      <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`} style={{ width: `${base}%` }} />
      {tramo > 0 && <div className="absolute inset-y-0" style={{ left: `${base}%`, width: `${tramo}%`, background: rayado }} />}
    </div>
  )
}
