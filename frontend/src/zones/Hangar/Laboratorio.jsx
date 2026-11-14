import TarjetaPieza from '../../components/TarjetaPieza.jsx'
import { NOMBRE_TIPO } from '../../piezas.js'

const TIPOS_COMPONENTE = ['panel', 'bateria', 'ordenador', 'antena', 'actitud', 'instrumento']

export default function Laboratorio({ catalogo, analisis, diseno, onCambiarDiseno, nivel }) {
  const { satelite } = diseno
  const { huecos, huecosUsados } = analisis.satelite
  const lleno = huecosUsados >= huecos

  const cambiarSatelite = (cambios) => onCambiarDiseno({ ...diseno, satelite: { ...satelite, ...cambios } })
  const anadir = (piezaId) => cambiarSatelite({ componentes: [...satelite.componentes, piezaId] })
  const quitar = (indice) => cambiarSatelite({ componentes: satelite.componentes.filter((_, i) => i !== indice) })

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display font-semibold">1 · Structure</h2>
        <p className="text-sm text-slate-400">The satellite’s skeleton: it sets how many components fit and how long it lasts.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {catalogo.piezas
            .filter((pieza) => pieza.tipo === 'estructura')
            .map((estructura) => {
              const noCaben = satelite.componentes.length > estructura.huecos
              return (
                <TarjetaPieza key={estructura.id} pieza={estructura} nivel={nivel} seleccionada={estructura.id === satelite.estructuraId}>
                  <button
                    disabled={noCaben}
                    onClick={() => cambiarSatelite({ estructuraId: estructura.id })}
                    className="rounded-lg bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700 disabled:opacity-40"
                  >
                    {noCaben ? `Your ${satelite.componentes.length} components don’t fit` : 'Use this structure'}
                  </button>
                </TarjetaPieza>
              )
            })}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-display font-semibold">2 · Installed components ({huecosUsados} / {huecos} slots)</h2>
        {satelite.componentes.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing yet. A satellite needs at least power, a computer and an antenna.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {analisis.resuelto.componentes.map((componente, indice) => (
              <li key={indice} className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1 text-sm">
                {componente.nombre}
                <button onClick={() => quitar(indice)} className="text-slate-400 hover:text-red-300" aria-label={`Remove ${componente.nombre}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-display font-semibold">3 · Add components</h2>
        {!satelite.estructuraId && <p className="text-sm text-amber-300">Choose a structure first.</p>}
        {TIPOS_COMPONENTE.map((tipo) => (
          <div key={tipo} className="space-y-2">
            <h3 className="text-sm text-slate-300">{NOMBRE_TIPO[tipo]}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalogo.piezas
                .filter((pieza) => pieza.tipo === tipo)
                .map((pieza) => (
                  <TarjetaPieza key={pieza.id} pieza={pieza} nivel={nivel}>
                    <button
                      disabled={!satelite.estructuraId || lleno}
                      onClick={() => anadir(pieza.id)}
                      className="rounded-lg bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700 disabled:opacity-40"
                    >
                      {lleno ? 'No free slots' : '+ Add'}
                    </button>
                  </TarjetaPieza>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
