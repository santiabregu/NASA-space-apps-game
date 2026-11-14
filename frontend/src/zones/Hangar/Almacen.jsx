import { useState } from 'react'
import FichaPieza from '../../components/FichaPieza.jsx'
import TarjetaPieza from '../../components/TarjetaPieza.jsx'
import { disponibilidad, NOMBRE_TIPO } from '../../piezas.js'

export default function Almacen({ catalogo, jugador }) {
  const [elegida, setElegida] = useState(null)

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
      <div className="md:sticky md:top-16 md:self-start">
        {elegida ? (
          <FichaPieza key={elegida.id} pieza={elegida} disponibilidad={disponibilidad(elegida, jugador, catalogo)} />
        ) : (
          <p className="cristal p-4 text-sm text-slate-400">Click a part to see its details.</p>
        )}
      </div>

      <div className="min-w-0 space-y-6">
        <p className="text-sm text-slate-400">
          Every part the industry makes. The ones in your Warehouse are already yours; any other part is bought when you
          launch. Locked parts unlock as you reach new destinations.
        </p>
        {Object.entries(NOMBRE_TIPO).map(([tipo, nombre]) => (
          <div key={tipo} className="space-y-2">
            <h2 className="font-display font-semibold">{nombre}</h2>
            <div className="grid gap-2 2xl:grid-cols-2">
              {catalogo.piezas
                .filter((pieza) => pieza.tipo === tipo)
                .map((pieza) => (
                  <TarjetaPieza key={pieza.id} pieza={pieza} disponibilidad={disponibilidad(pieza, jugador, catalogo)} seleccionada={pieza.id === elegida?.id} onElegir={setElegida} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
