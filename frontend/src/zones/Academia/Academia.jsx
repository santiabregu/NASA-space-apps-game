import orbitaGeo from '../../assets/academia/orbita-geo.webp'
import orbitaLeo from '../../assets/academia/orbita-leo.webp'
import orbitaSso from '../../assets/academia/orbita-sso.webp'
import { CONCEPTOS } from '../../data/conceptos.js'
import { formatoNumero } from '../../formato.js'
import { LOGOS } from '../../logos.js'

const IMAGEN_ORBITA = { 'leo-400': orbitaLeo, 'sso-700': orbitaSso, geo: orbitaGeo }

export default function Academia({ catalogo }) {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="flex items-center gap-4">
        <img src={LOGOS.academia} alt="" className="h-16 w-auto" />
        <div>
          <h1 className="font-display text-2xl font-bold">Academy</h1>
          <p className="text-slate-400">The game’s concepts, explained simply.</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTOS.map((concepto) => (
          <article
            key={concepto.titulo}
            className={`cristal overflow-hidden ${concepto.destacado ? 'sm:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-[minmax(0,1fr)_2fr] lg:ring-1 lg:ring-cyan-400/40' : ''}`}
          >
            <div className={`relative aspect-video ${concepto.destacado ? 'lg:aspect-auto' : ''}`}>
              <img src={concepto.imagen} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className={concepto.destacado ? 'p-4 lg:self-center lg:p-6' : 'p-4'}>
              <h2 className={`font-display font-semibold ${concepto.destacado ? 'lg:text-xl' : ''}`}>{concepto.titulo}</h2>
              <p className={`mt-1 text-sm text-slate-300 ${concepto.destacado ? 'lg:text-base' : ''}`}>{concepto.texto}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Orbits</h2>
        {catalogo.orbitas.map((orbita) => (
          <article key={orbita.id} className="cristal grid overflow-hidden sm:grid-cols-[16rem_1fr]">
            <div className="relative aspect-video sm:aspect-auto">
              {IMAGEN_ORBITA[orbita.id] && (
                <img src={IMAGEN_ORBITA[orbita.id]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-display font-semibold">{orbita.nombre}</h3>
              <p className="mt-1 text-sm text-slate-300">{orbita.explicacion}</p>
              <p className="mt-2 text-xs text-slate-400">
                Δv needed {formatoNumero(orbita.deltaVRequerido)} m/s · one orbit every {formatoNumero(orbita.periodoMin)} min ·
                {' '}{orbita.minutosContactoDia} min of contact per day · {formatoNumero(orbita.eclipseHoras * 60)} min of shadow per orbit
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
