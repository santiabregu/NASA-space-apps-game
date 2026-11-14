import TarjetaPieza from '../../components/TarjetaPieza.jsx'
import { NOMBRE_TIPO } from '../../piezas.js'

export default function Almacen({ catalogo, nivel }) {
  return (
    <section className="space-y-6">
      <p className="text-sm text-slate-400">
        Every part the industry makes. You pay for them at launch; locked parts unlock as you level up.
      </p>
      {Object.entries(NOMBRE_TIPO).map(([tipo, nombre]) => (
        <div key={tipo} className="space-y-2">
          <h2 className="font-display font-semibold">{nombre}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {catalogo.piezas
              .filter((pieza) => pieza.tipo === tipo)
              .map((pieza) => <TarjetaPieza key={pieza.id} pieza={pieza} nivel={nivel} />)}
          </div>
        </div>
      ))}
    </section>
  )
}
