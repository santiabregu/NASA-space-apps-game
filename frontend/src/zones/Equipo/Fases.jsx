import { Check, Hourglass } from 'lucide-react'
import { useMemo } from 'react'
import { enviarResultado, votarPiezas } from '../../api/salas.js'
import BarraBloques from '../../components/pixel/BarraBloques.jsx'
import { CAJA_PIXEL } from '../../components/pixel/estilos.js'
import { misionDeEquipo } from '../../engine/equipo.js'
import { formatoDinero } from '../../formato.js'
import { DEPARTAMENTOS, responsableDe, resumenResultado } from './departamentos.js'
import ConectarBus from './minijuegos/ConectarBus.jsx'
import { Construccion, MirarConstruccion } from './minijuegos/Construccion.jsx'
import LluviaFondos from './minijuegos/LluviaFondos.jsx'
import { MirarFinanzas, MirarSoftware } from './minijuegos/Mirar.jsx'
import { useEnvioProgreso } from './minijuegos/useEnvioProgreso.js'

const SEGUNDOS_DE_PRISA = 10

const segundosHasta = (instante, ahora) => Math.max(0, Math.ceil((instante - ahora) / 1000))

function reloj(segundos) {
  const minutos = Math.floor(segundos / 60)
  return `${minutos}:${String(segundos % 60).padStart(2, '0')}`
}

export function FaseEnCurso({ sala, jugador, catalogo, ahora, onAccion }) {
  const { fase } = sala
  const indice = DEPARTAMENTOS.findIndex((departamento) => departamento.id === fase.departamento)
  const departamento = DEPARTAMENTOS[indice]
  const responsable = responsableDe(sala, departamento.id)
  const miTurno = responsable?.jugadorId === jugador.id
  const nombre = miTurno ? 'You' : (responsable?.nombreUsuario ?? 'Nobody')
  const preparando = ahora < fase.empiezaEn

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <PlanDeFases sala={sala} />
      <section className={`${CAJA_PIXEL} flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4`}>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black"
            style={{ background: departamento.color }}
          >
            <departamento.Icono className="h-5 w-5 text-black" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-xs sm:text-base" style={{ color: departamento.color }}>
              {departamento.nombre}
              <span className="ml-2 text-[8px] text-[#c2c3c7]">
                Phase {indice + 1} / {DEPARTAMENTOS.length}
              </span>
            </h2>
            <p className="truncate font-sans text-sm text-slate-300">{miTurno ? 'Your turn' : `${nombre} at work`}</p>
          </div>
          {!preparando && (
            <BarraDeTiempo
              restante={segundosHasta(fase.terminaEn, ahora)}
              total={Math.round((fase.terminaEn - fase.empiezaEn) / 1000)}
              color={departamento.color}
            />
          )}
        </div>

        {preparando ? (
          <Preparacion sala={sala} indice={indice} miTurno={miTurno} nombre={nombre} segundos={segundosHasta(fase.empiezaEn, ahora)} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <Minijuego
              key={departamento.id}
              sala={sala}
              catalogo={catalogo}
              jugador={jugador}
              departamento={departamento}
              miTurno={miTurno}
              nombre={nombre}
              onAccion={onAccion}
            />
          </div>
        )}
      </section>
    </div>
  )
}

// La pausa entre fases: quién juega ahora y qué consiguió el departamento anterior.
function Preparacion({ sala, indice, miTurno, nombre, segundos }) {
  const anterior = DEPARTAMENTOS[indice - 1]
  const resultado = anterior && sala.resultados[anterior.id]

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 border-4 border-black bg-[#0b1430] p-5 text-center">
      {resultado && (
        <p className="font-sans text-sm text-slate-300">
          {anterior.nombre}: {resumenResultado(anterior.id, resultado)}
          {resultado.caducado && ' (time ran out)'}
        </p>
      )}
      <p className="text-xs sm:text-base">{miTurno ? 'Get ready!' : `${nombre} starts soon`}</p>
      <p className="text-2xl text-[#ffec27]">{segundos}</p>
    </div>
  )
}

function BarraDeTiempo({ restante, total, color }) {
  const prisa = restante <= SEGUNDOS_DE_PRISA
  const colorActual = prisa ? '#ff004d' : color

  return (
    <div className="flex min-w-48 flex-1 items-center gap-3">
      <BarraBloques fraccion={restante / total} color={colorActual} className="h-5 flex-1" />
      <span
        className={`w-14 text-right text-xs sm:text-base ${prisa ? 'motion-safe:animate-parpadeo' : ''}`}
        style={{ color: colorActual }}
      >
        {reloj(restante)}
      </span>
    </div>
  )
}

// El que tiene el turno juega su minijuego; los demás lo ven en vivo (y en construcción, votan).
function Minijuego({ sala, catalogo, jugador, departamento, miTurno, nombre, onAccion }) {
  const estrella = catalogo.estrellas.find((candidata) => candidata.id === sala.estrellaId)
  const mision = useMemo(() => misionDeEquipo(estrella, catalogo), [estrella, catalogo])
  const publicar = useEnvioProgreso(sala.codigo, departamento.id)
  const entregar = (datos) => onAccion(() => enviarResultado(sala.codigo, departamento.id, datos))
  const votar = (piezaIds) => onAccion(() => votarPiezas(sala.codigo, departamento.id, piezaIds))
  const progreso = sala.fase.progreso

  if (departamento.id === 'FINANCIACION') {
    return miTurno ? (
      <LluviaFondos catalogo={catalogo} estrella={estrella} onProgreso={publicar} onTerminar={entregar} />
    ) : (
      <MirarFinanzas progreso={progreso} nombre={nombre} catalogo={catalogo} estrella={estrella} />
    )
  }
  if (departamento.id === 'SOFTWARE') {
    return miTurno ? (
      <ConectarBus catalogo={catalogo} estrella={estrella} onProgreso={publicar} onTerminar={entregar} />
    ) : (
      <MirarSoftware progreso={progreso} nombre={nombre} catalogo={catalogo} />
    )
  }
  return miTurno ? (
    <Construccion
      sala={sala}
      catalogo={catalogo}
      mision={mision}
      empresa={jugador.empresa}
      departamento={departamento.id}
      onProgreso={publicar}
      onEntregar={entregar}
    />
  ) : (
    <MirarConstruccion
      sala={sala}
      catalogo={catalogo}
      mision={mision}
      empresa={jugador.empresa}
      jugadorId={jugador.id}
      departamento={departamento.id}
      nombre={nombre}
      onVotar={votar}
    />
  )
}

// Fila con las cuatro fases: hechas, la que se juega y las que faltan.
function PlanDeFases({ sala }) {
  return (
    <ol className="grid shrink-0 grid-cols-4 gap-2">
      {DEPARTAMENTOS.map((departamento) => {
        const resultado = sala.resultados[departamento.id]
        const actual = sala.fase?.departamento === departamento.id
        const EstadoIcono = resultado?.caducado ? Hourglass : Check
        return (
          <li
            key={departamento.id}
            className={`flex items-center justify-center gap-2 border-4 p-1 sm:p-2 ${actual ? 'bg-[#1d2b53]' : 'border-black bg-[#0b1430]'}`}
            style={actual ? { borderColor: departamento.color } : undefined}
          >
            <departamento.Icono
              className={`h-5 w-5 ${resultado || actual ? '' : 'opacity-40'}`}
              style={{ color: departamento.color }}
            />
            <span className="hidden text-[8px] sm:block">{departamento.nombre}</span>
            {resultado && <EstadoIcono className="h-4 w-4 text-[#fff1e8]" />}
          </li>
        )
      })}
    </ol>
  )
}

// children: lo que se puede hacer con la misión ya montada (lanzarla o esperar al anfitrión).
export function ResumenFases({ sala, children }) {
  const presupuesto = sala.resultados.FINANCIACION?.datos?.presupuesto ?? 0
  const gastado = ['SATELITE', 'COHETE'].reduce((total, id) => total + (sala.resultados[id]?.datos?.coste ?? 0), 0)

  return (
    <section className={`${CAJA_PIXEL} min-h-0 space-y-4 overflow-y-auto p-5`}>
      <h2 className="text-xs sm:text-base">All departments are done</h2>
      <ul className="space-y-3">
        {DEPARTAMENTOS.map((departamento) => {
          const resultado = sala.resultados[departamento.id]
          return (
            <li key={departamento.id} className="flex items-center gap-3 border-4 border-black bg-[#0b1430] p-3">
              <departamento.Icono className="h-5 w-5 shrink-0" style={{ color: departamento.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-base">{departamento.nombre}</p>
                <p className="truncate font-sans text-xs text-slate-400">
                  {responsableDe(sala, departamento.id)?.nombreUsuario ?? 'Nobody'} · {resumenResultado(departamento.id, resultado)}
                </p>
              </div>
              {resultado?.caducado ? (
                <span className="flex items-center gap-1 text-[8px] text-[#ffa300]">
                  <Hourglass className="h-4 w-4" /> Time ran out
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[8px] text-[#00e436]">
                  <Check className="h-4 w-4" /> Delivered
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="font-sans text-sm text-slate-300">
        The team spent {formatoDinero(gastado)} of a {formatoDinero(presupuesto)} budget.
      </p>
      {children}
    </section>
  )
}
