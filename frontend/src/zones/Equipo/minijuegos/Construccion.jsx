import { Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import PanelMision from '../../../components/PanelMision.jsx'
import BarraBloques from '../../../components/pixel/BarraBloques.jsx'
import { disenoDelEquipo, jugadorDeEquipo, presupuestoDelEquipo } from '../../../engine/equipo.js'
import { formatoDinero } from '../../../formato.js'
import Laboratorio from '../../Hangar/Laboratorio.jsx'
import Taller from '../../Hangar/Taller.jsx'
import { useBancoDeTrabajo } from '../../Hangar/useBancoDeTrabajo.js'

// Fuera del componente para que el análisis memorizado no se recalcule en cada redibujado.
const SIN_INVENTARIO = {}
const sinCambios = () => {}

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
    <div className="shrink-0 space-y-2 border-4 border-black bg-[#0b1430] p-3 text-[8px] leading-4">
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

// El Lab o el Workshop de siempre a la izquierda y los objetivos a la derecha, cada uno con su scroll:
// la página no se mueve. Lo usan igual el constructor y los que votan.
function BancoDeEquipo({ departamento, banco, mision, empresa, props }) {
  return (
    <div className="grid min-h-0 flex-1 gap-4 font-sans lg:grid-cols-[1fr_20rem]">
      <div className="min-h-0 overflow-y-auto pr-1">
        {departamento === 'SATELITE' ? <Laboratorio {...props} fijo /> : <Taller {...props} empresa={empresa} fijo />}
      </div>
      <aside className="min-h-0 overflow-y-auto">
        <PanelMision analisis={banco.analisis} previa={banco.previa} mision={mision} />
      </aside>
    </div>
  )
}

function propsDelBanco({ catalogo, banco, diseno, jugador, mision, votos }) {
  return {
    catalogo,
    analisis: banco.analisis,
    diseno,
    onCambio: banco.aplicarCambio,
    ficha: banco.ficha,
    jugador,
    recomendadas: mision.piezasRecomendadas,
    onPrevisualizar: banco.previsualizar,
    onFinPrevisualizar: banco.finPrevisualizar,
    votos,
  }
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
  const sobrePresupuesto = banco.analisis.costeCompra > presupuesto
  const votos = contarVotos(sala.fase.votos)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <BarraEquipo sala={sala} gastado={banco.analisis.costeCompra}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-sans text-xs text-slate-300">
            {sobrePresupuesto
              ? 'Over budget: remove parts before delivering.'
              : "The Government pays for every part. Pink hearts are your team's votes: you decide."}
          </p>
          <button
            onClick={() => onEntregar({ diseno: parteDe(departamento, diseno) })}
            disabled={sobrePresupuesto}
            className="flex items-center gap-2 border-4 border-black bg-[#00e436] px-3 py-2 text-[8px] text-black disabled:opacity-50"
          >
            <Send className="h-3 w-3" /> Deliver
          </button>
        </div>
      </BarraEquipo>
      <BancoDeEquipo
        departamento={departamento}
        banco={banco}
        mision={mision}
        empresa={empresa}
        props={propsDelBanco({ catalogo, banco, diseno, jugador, mision, votos })}
      />
    </div>
  )
}

// Los demás ven el mismo banco de trabajo con el diseño en vivo; al pulsar una pieza la votan.
export function MirarConstruccion({ sala, catalogo, mision, empresa, jugadorId, departamento, nombre, onVotar }) {
  const diseno = disenoEnVivo(sala, mision, catalogo)
  const jugador = useMemo(() => jugadorDeEquipo(catalogo, empresa), [catalogo, empresa])
  const presupuesto = presupuestoDelEquipo(sala.resultados)
  const banco = useBancoDeTrabajo({ catalogo, mision, diseno, dinero: presupuesto, inventario: SIN_INVENTARIO, onCambiarDiseno: sinCambios })
  const misVotos = sala.fase.votos?.[jugadorId] ?? []
  const maximo = catalogo.equipo.maximoVotos
  const voto = {
    misVotos,
    maximo,
    onVotar: (pieza) => onVotar(misVotos.includes(pieza.id) ? misVotos.filter((id) => id !== pieza.id) : [...misVotos, pieza.id]),
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <BarraEquipo sala={sala} gastado={banco.analisis.costeCompra}>
        <p className="font-sans text-xs text-slate-300">
          Watching {nombre} build live. Click a part to vote for it ({misVotos.length} / {maximo} votes): {nombre} decides,
          but if time runs out the most voted parts go in.
        </p>
      </BarraEquipo>
      <BancoDeEquipo
        departamento={departamento}
        banco={banco}
        mision={mision}
        empresa={empresa}
        props={{ ...propsDelBanco({ catalogo, banco, diseno, jugador, mision, votos: contarVotos(sala.fase.votos) }), voto }}
      />
    </div>
  )
}
