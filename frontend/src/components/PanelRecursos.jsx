import { Flag } from 'lucide-react'
import { COLOR_ESTADO } from '../colores.js'
import BarraRecurso from './BarraRecurso.jsx'

export default function PanelRecursos({ recursos, criticos }) {
  return (
    <section className="cristal space-y-3 p-4">
      <h2 className="font-display font-semibold">Mission resources</h2>
      {recursos.map((recurso) => {
        const critico = criticos.includes(recurso.id)
        return (
          <details key={recurso.id} className={`rounded-lg p-2 ${critico ? 'bg-slate-800/60 ring-1 ring-cyan-700' : ''}`}>
            <summary className="cursor-pointer list-none">
              <BarraRecurso
                etiqueta={
                  <span className="flex items-center gap-1.5">
                    {critico && <Flag className="h-3.5 w-3.5 fill-current text-cyan-300" />}
                    {recurso.nombre}
                  </span>
                }
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
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Flag className="h-3 w-3 shrink-0 fill-current" /> Critical for this mission · Tap a resource to learn what it means
      </p>
    </section>
  )
}
