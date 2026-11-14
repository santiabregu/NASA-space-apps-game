import { CircleCheck, CircleX } from 'lucide-react'

const ESTILO = {
  mal: { caja: 'border-red-400/30 bg-red-950/30', titulo: 'text-red-300', Icono: CircleX, icono: 'text-red-400' },
  bien: { caja: 'border-emerald-400/30 bg-emerald-950/20', titulo: 'text-emerald-300', Icono: CircleCheck, icono: 'text-emerald-400' },
}

function Grupo({ titulo, aspectos, estilo }) {
  if (aspectos.length === 0) return null
  return (
    <div className={`rounded-xl border p-4 ${estilo.caja}`}>
      <h4 className={`mb-2 font-display text-sm font-semibold ${estilo.titulo}`}>
        {titulo} · {aspectos.length}
      </h4>
      <ul className="space-y-2 text-sm">
        {aspectos.map((aspecto) => (
          <li key={aspecto.aspecto} className="flex gap-2">
            <estilo.Icono className={`mt-0.5 h-4 w-4 shrink-0 ${estilo.icono}`} />
            <span>
              <b className="font-semibold">{aspecto.aspecto}.</b> <span className="text-slate-300">{aspecto.texto}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Valoracion({ valoracion, tituloMal = 'What went wrong', tituloBien = 'What went well' }) {
  return (
    <div className="space-y-3">
      <Grupo titulo={tituloMal} aspectos={valoracion.filter((aspecto) => !aspecto.ok)} estilo={ESTILO.mal} />
      <Grupo titulo={tituloBien} aspectos={valoracion.filter((aspecto) => aspecto.ok)} estilo={ESTILO.bien} />
    </div>
  )
}
