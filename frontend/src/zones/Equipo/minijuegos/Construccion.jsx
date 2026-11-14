import { CircleCheck, Heart, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import PanelMision from '../../../components/PanelMision.jsx'
import BarraBloques from '../../../components/pixel/BarraBloques.jsx'
import { BOTON_PIXEL } from '../../../components/pixel/estilos.js'
import { analizarDiseno } from '../../../engine/analisis.js'
import { piezasDelDiseno } from '../../../engine/diseno.js'
import { disenoDelEquipo, jugadorDeEquipo, presupuestoDelEquipo, TIPOS_COHETE, TIPOS_SATELITE } from '../../../engine/equipo.js'
import { formatoDinero } from '../../../formato.js'
import BahiaCohete from '../../Hangar/BahiaCohete.jsx'
import BahiaSatelite from '../../Hangar/BahiaSatelite.jsx'
import Laboratorio from '../../Hangar/Laboratorio.jsx'
import Taller from '../../Hangar/Taller.jsx'
import { useBancoDeTrabajo } from '../../Hangar/useBancoDeTrabajo.js'

// Fuera del componente para que el análisis memorizado no se recalcule en cada redibujado.
const SIN_INVENTARIO = {}

// Cada fase de construcción monta su mitad del diseño: el satélite o el cohete.
const parteDe = (departamento, diseno) => (departamento === 'SATELITE' ? diseno.satelite : diseno.cohete)
const conParte = (departamento, diseno, parte) =>
  departamento === 'SATELITE' ? { ...diseno, satelite: parte } : { ...diseno, cohete: parte }

// Lo ya decidido por el equipo más lo que el constructor lleva montado en esta fase.
function disenoEnVivo(sala, mision, catalogo) {
  const base = disenoDelEquipo(sala.resultados, mision, catalogo)
  const parte = sala.fase?.progreso?.diseno
  return parte ? conParte(sala.fase.departamento, base, parte) : base
}

function contarVotos(votosPorJugador) {
  const conteo = {}
  Object.values(votosPorJugador ?? {})
    .flat()
    .forEach((id) => {
      conteo[id] = (conteo[id] ?? 0) + 1
    })
  return conteo
}

function BarraEquipo({ sala, gastado, children }) {
  const presupuesto = presupuestoDelEquipo(sala.resultados)
  const pasado = gastado > presupuesto
  return (
    <div className="space-y-2 border-4 border-black bg-[#0b1430] p-3 text-[8px] leading-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          TEAM BUDGET{' '}
          <span className={pasado ? 'text-[#ff004d]' : 'text-[#ffec27]'}>
            {formatoDinero(gastado)} / {formatoDinero(presupuesto)}
          </span>
        </span>
        <span>
          RELIABILITY <span className="text-[#00e436]">{sala.resultados.SOFTWARE?.datos?.fiabilidad ?? 0}%</span>
        </span>
      </div>
      <BarraBloques fraccion={presupuesto > 0 ? gastado / presupuesto : 1} color={pasado ? '#ff004d' : '#29adff'} className="h-4" />
      {children}
    </div>
  )
}

export function Construccion({ sala, catalogo, mision, empresa, departamento, onProgreso, onEntregar }) {
  const [diseno, setDiseno] = useState(() => disenoEnVivo(sala, mision, catalogo))
  const jugador = useMemo(() => jugadorDeEquipo(catalogo, empresa), [catalogo, empresa])
  const presupuesto = presupuestoDelEquipo(sala.resultados)

  function cambiar(nuevo) {
    setDiseno(nuevo)
    onProgreso({ diseno: parteDe(departamento, nuevo) })
  }

  const banco = useBancoDeTrabajo({ catalogo, mision, diseno, dinero: presupuesto, inventario: SIN_INVENTARIO, onCambiarDiseno: cambiar })
  const { analisis } = banco
  const votos = contarVotos(sala.fase.votos)
  const sobrePresupuesto = analisis.costeCompra > presupuesto
  const props = {
    catalogo,
    analisis,
    diseno,
    onCambio: banco.aplicarCambio,
    ficha: banco.ficha,
    jugador,
    recomendadas: mision.piezasRecomendadas,
    onPrevisualizar: banco.previsualizar,
    onFinPrevisualizar: banco.finPrevisualizar,
    votos,
  }

  return (
    <div className="space-y-4">
      <BarraEquipo sala={sala} gastado={analisis.costeCompra}>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="font-sans text-xs text-slate-300">
            The Government pays for every part. Pink hearts are your team's votes: you decide.
          </p>
          <button
            onClick={() => onEntregar({ diseno: parteDe(departamento, diseno) })}
            disabled={sobrePresupuesto}
            className={`${BOTON_PIXEL} flex items-center gap-2 bg-[#00e436]`}
          >
            <Send className="h-4 w-4" /> Deliver
          </button>
        </div>
        {sobrePresupuesto && <p className="text-[#ff004d]">Over budget: remove parts before delivering.</p>}
      </BarraEquipo>
      <div className="grid gap-6 font-sans lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">{departamento === 'SATELITE' ? <Laboratorio {...props} /> : <Taller {...props} empresa={empresa} />}</div>
        <aside className="lg:sticky lg:top-16 lg:self-start">
          <PanelMision analisis={analisis} previa={banco.previa} mision={mision} />
        </aside>
      </div>
    </div>
  )
}

// Los demás ven el diseño en vivo y proponen piezas; el voto es consultivo.
export function MirarConstruccion({ sala, catalogo, mision, empresa, jugadorId, departamento, nombre, onVotar }) {
  const diseno = disenoEnVivo(sala, mision, catalogo)
  const presupuesto = presupuestoDelEquipo(sala.resultados)
  const analisis = analizarDiseno({ diseno, catalogo, mision, dinero: presupuesto, inventario: SIN_INVENTARIO })
  const misVotos = sala.fase.votos?.[jugadorId] ?? []
  const votos = contarVotos(sala.fase.votos)
  const maximo = catalogo.equipo.maximoVotos
  const tipos = departamento === 'SATELITE' ? TIPOS_SATELITE : TIPOS_COHETE
  const instaladas = new Set(piezasDelDiseno(analisis.resuelto).map((pieza) => pieza.id))
  const { resuelto } = analisis

  function alternar(id) {
    onVotar(misVotos.includes(id) ? misVotos.filter((voto) => voto !== id) : [...misVotos, id])
  }

  return (
    <div className="space-y-4">
      <BarraEquipo sala={sala} gastado={analisis.costeCompra}>
        <p className="font-sans text-xs text-slate-300">
          Watching {nombre}. Vote for the parts you would install: {nombre} decides, but if time runs out the most voted parts
          go in.
        </p>
      </BarraEquipo>
      <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="space-y-4 font-sans">
          {departamento === 'SATELITE' ? (
            <BahiaSatelite estructura={resuelto.estructura} componentes={resuelto.componentes} />
          ) : (
            <BahiaCohete etapas={resuelto.etapas} cofia={resuelto.cofia} conSatelite={Boolean(resuelto.estructura)} empresa={empresa} />
          )}
          <PanelMision analisis={analisis} mision={mision} />
        </div>
        <div className="space-y-2">
          <p className="text-[8px] leading-4 text-[#ff77a8]">
            YOUR VOTES {misVotos.length} / {maximo}
          </p>
          {catalogo.piezas
            .filter((pieza) => tipos.includes(pieza.tipo))
            .map((pieza) => {
              const votada = misVotos.includes(pieza.id)
              return (
                <div key={pieza.id} className="flex items-center gap-3 border-4 border-black bg-[#0b1430] p-2">
                  <div className="min-w-0 flex-1 font-sans">
                    <p className="truncate text-sm font-semibold">{pieza.nombre}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {formatoDinero(pieza.coste)}
                      {instaladas.has(pieza.id) && (
                        <span className="flex items-center gap-1 text-emerald-300">
                          <CircleCheck className="h-3 w-3" /> Installed
                        </span>
                      )}
                      {votos[pieza.id] > 0 && (
                        <span className="flex items-center gap-1 text-pink-300">
                          <Heart className="h-3 w-3 fill-current" /> {votos[pieza.id]}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => alternar(pieza.id)}
                    disabled={!votada && misVotos.length >= maximo}
                    className={`shrink-0 border-4 border-black px-2 py-1 text-[8px] text-black disabled:opacity-40 ${votada ? 'bg-[#ff77a8]' : 'bg-[#29adff]'}`}
                  >
                    {votada ? 'Voted' : 'Vote'}
                  </button>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
