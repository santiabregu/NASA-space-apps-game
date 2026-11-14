import { CONCEPTOS } from '../../data/conceptos.js'
import { formatoNumero } from '../../formato.js'

export default function Academia({ catalogo }) {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold">Academy</h1>
        <p className="text-slate-400">The game’s concepts, explained simply.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {CONCEPTOS.map((concepto) => (
          <article key={concepto.titulo} className="cristal p-4">
            <h2 className="font-display font-semibold">{concepto.titulo}</h2>
            <p className="mt-1 text-sm text-slate-300">{concepto.texto}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Orbits</h2>
        {catalogo.orbitas.map((orbita) => (
          <article key={orbita.id} className="cristal p-4">
            <h3 className="font-semibold">{orbita.nombre}</h3>
            <p className="mt-1 text-sm text-slate-300">{orbita.explicacion}</p>
            <p className="mt-2 text-xs text-slate-400">
              Δv needed {formatoNumero(orbita.deltaVRequerido)} m/s · one orbit every {formatoNumero(orbita.periodoMin)} min ·
              {' '}{orbita.minutosContactoDia} min of contact per day · {formatoNumero(orbita.eclipseHoras * 60)} min of shadow per orbit
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
