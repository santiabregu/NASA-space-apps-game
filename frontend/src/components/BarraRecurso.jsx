export default function BarraRecurso({ etiqueta, valor, maximo, color = 'bg-cyan-400' }) {
  const porcentaje = Math.min((valor / maximo) * 100, 100)

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-slate-300">
        <span>{etiqueta}</span>
        <span>{valor} / {maximo}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
