import { COLOR_ESTADO } from '../colores.js'
import BarraRecurso from './BarraRecurso.jsx'

export default function PanelRecursos({ recursos, criticos }) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="font-semibold">Recursos de la misión</h2>
      {recursos.map((recurso) => {
        const critico = criticos.includes(recurso.id)
        return (
          <details key={recurso.id} className={`rounded-lg p-2 ${critico ? 'bg-slate-800/60 ring-1 ring-cyan-700' : ''}`}>
            <summary className="cursor-pointer list-none">
              <BarraRecurso
                etiqueta={`${critico ? '★ ' : ''}${recurso.nombre}`}
                valor={recurso.valor}
                maximo={recurso.maximo}
                texto={recurso.texto}
                color={COLOR_ESTADO[recurso.estado]}
              />
            </summary>
            <p className="mt-2 text-xs text-slate-400">{recurso.explicacion}</p>
          </details>
        )
      })}
      <p className="text-xs text-slate-500">★ Crítico en esta misión · Toca un recurso para ver qué significa</p>
    </section>
  )
}
