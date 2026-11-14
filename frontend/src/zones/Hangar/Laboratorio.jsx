import FichaPieza from '../../components/FichaPieza.jsx'
import TarjetaPieza from '../../components/TarjetaPieza.jsx'
import { estaBloqueada, NOMBRE_TIPO } from '../../piezas.js'
import BahiaSatelite from './BahiaSatelite.jsx'

const TIPOS_COMPONENTE = ['panel', 'bateria', 'ordenador', 'antena', 'actitud', 'instrumento']

export default function Laboratorio({ catalogo, analisis, diseno, onCambio, ficha, nivel, recomendadas, onPrevisualizar, onFinPrevisualizar }) {
  const { satelite } = diseno
  const { huecos, huecosUsados } = analisis.satelite
  const lleno = huecosUsados >= huecos

  const conSatelite = (cambios) => ({ ...diseno, satelite: { ...satelite, ...cambios } })
  const conComponente = (pieza) => conSatelite({ componentes: [...satelite.componentes, pieza.id] })
  const conEstructura = (estructura) => conSatelite({ estructuraId: estructura.id })
  const anadir = (pieza) => onCambio(conComponente(pieza), pieza, 'instalada')
  const quitar = (indice) =>
    onCambio(conSatelite({ componentes: satelite.componentes.filter((_, i) => i !== indice) }), analisis.resuelto.componentes[indice], 'quitada')
  const elegirEstructura = (estructura) => onCambio(conEstructura(estructura), estructura, 'instalada')

  function avisoComponente() {
    if (!satelite.estructuraId) return 'Choose a structure first'
    return lleno ? 'No free slots' : null
  }

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
      <div className="space-y-3 md:sticky md:top-16 md:max-h-[calc(100vh-5rem)] md:self-start md:overflow-y-auto">
        <BahiaSatelite
          estructura={analisis.resuelto.estructura}
          componentes={analisis.resuelto.componentes}
          onQuitar={quitar}
          onVaciar={() => onCambio(conSatelite({ componentes: [] }))}
        />
        {satelite.estructuraId && <p className="text-center text-sm text-slate-400">{huecosUsados} / {huecos} slots used</p>}
        {ficha ? (
          <FichaPieza key={`${ficha.pieza.id}-${ficha.accion}-${huecosUsados}`} {...ficha} nivel={nivel} />
        ) : (
          <p className="cristal p-4 text-sm text-slate-400">Click a part to install it. Its details and its effect on your mission will appear here.</p>
        )}
      </div>

      <div className="min-w-0 space-y-6">
        <div className="space-y-2">
          <h2 className="font-display font-semibold">1 · Structure</h2>
          <p className="text-sm text-slate-400">The satellite’s skeleton: it sets how many components fit and how long it lasts.</p>
          <div className="grid gap-2 2xl:grid-cols-2">
            {catalogo.piezas
              .filter((pieza) => pieza.tipo === 'estructura')
              .map((estructura) => {
                const noCaben = satelite.componentes.length > estructura.huecos
                return (
                  <TarjetaPieza
                    key={estructura.id}
                    pieza={estructura}
                    recomendada={recomendadas.includes(estructura.id)}
                    nivel={nivel}
                    instaladas={estructura.id === satelite.estructuraId ? 1 : 0}
                    onElegir={elegirEstructura}
                    onPrevisualizar={(estructura) => onPrevisualizar(conEstructura(estructura), estructura)}
                    onFinPrevisualizar={onFinPrevisualizar}
                    deshabilitada={estaBloqueada(estructura, nivel) || noCaben}
                    aviso={noCaben ? `Your ${satelite.componentes.length} components don’t fit` : null}
                  />
                )
              })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display font-semibold">2 · Components</h2>
          <p className="text-sm text-slate-400">Click a part to install it. A satellite needs at least power, a computer and an antenna.</p>
          {TIPOS_COMPONENTE.map((tipo) => (
            <div key={tipo} className="space-y-2">
              <h3 className="text-sm text-slate-300">{NOMBRE_TIPO[tipo]}</h3>
              <div className="grid gap-2 2xl:grid-cols-2">
                {catalogo.piezas
                  .filter((pieza) => pieza.tipo === tipo)
                  .map((pieza) => (
                    <TarjetaPieza
                      key={pieza.id}
                      pieza={pieza}
                      recomendada={recomendadas.includes(pieza.id)}
                      nivel={nivel}
                      instaladas={satelite.componentes.filter((id) => id === pieza.id).length}
                      onElegir={anadir}
                      onPrevisualizar={(pieza) => onPrevisualizar(conComponente(pieza), pieza)}
                      onFinPrevisualizar={onFinPrevisualizar}
                      deshabilitada={estaBloqueada(pieza, nivel) || !satelite.estructuraId || lleno}
                      aviso={avisoComponente()}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
