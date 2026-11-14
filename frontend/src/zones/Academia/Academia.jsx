import { CONCEPTOS } from '../../data/conceptos.js'
import { formatoNumero } from '../../formato.js'

export default function Academia({ catalogo }) {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">📚 Academia</h1>
        <p className="text-slate-400">Los conceptos del juego explicados en sencillo.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {CONCEPTOS.map((concepto) => (
          <article key={concepto.titulo} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <h2 className="font-semibold">{concepto.titulo}</h2>
            <p className="mt-1 text-sm text-slate-300">{concepto.texto}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Órbitas</h2>
        {catalogo.orbitas.map((orbita) => (
          <article key={orbita.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <h3 className="font-semibold">{orbita.nombre}</h3>
            <p className="mt-1 text-sm text-slate-300">{orbita.explicacion}</p>
            <p className="mt-2 text-xs text-slate-400">
              Δv necesario {formatoNumero(orbita.deltaVRequerido)} m/s · una vuelta cada {formatoNumero(orbita.periodoMin)} min ·
              {' '}{orbita.minutosContactoDia} min de contacto al día · sombra de {formatoNumero(orbita.eclipseHoras * 60)} min por vuelta
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
