import { ChevronRight, Clock, Coins, Gift, LogOut, Rocket, Star, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { lanzarMision } from '../../api/salas.js'
import { BOTON_PIXEL, CAJA_PIXEL } from '../../components/pixel/estilos.js'
import { RetratoControlador } from '../../components/pixel/pixel.jsx'
import TextoMaquina from '../../components/pixel/TextoMaquina.jsx'
import { simularMisionEquipo } from '../../engine/lanzamientoEquipo.js'
import { formatoDinero } from '../../formato.js'
import { DEPARTAMENTOS, responsableDe } from './departamentos.js'
import { ResumenFases } from './Fases.jsx'

const MS_POR_EVENTO = 1100
const PASO_SUBIDA_PX = 34
const SUBIDA_MAXIMA_PX = 200
const COLOR_VEREDICTO = { OK: '#00e436', WARN: '#ffa300', FAILED: '#ff004d' }
const lista = (valor) => (Array.isArray(valor) ? valor : [])

// Con las cuatro fases resueltas, el anfitrión lanza. Su navegador simula el vuelo y el servidor reparte las recompensas.
export function PlataformaEquipo({ sala, jugador, catalogo, onAccion }) {
  const soyAnfitrion = sala.anfitrionId === jugador.id
  const anfitrion = sala.miembros.find((miembro) => miembro.jugadorId === sala.anfitrionId)
  const estrella = catalogo.estrellas.find((candidata) => candidata.id === sala.estrellaId)

  function lanzar() {
    const { exito, informe } = simularMisionEquipo(sala.resultados, estrella, catalogo)
    onAccion(() => lanzarMision(sala.codigo, exito, informe))
  }

  return (
    <ResumenFases sala={sala}>
      <div className="flex flex-wrap items-center gap-3">
        {soyAnfitrion ? (
          <button onClick={lanzar} className={`${BOTON_PIXEL} flex items-center gap-2 bg-[#00e436]`}>
            <Rocket className="h-4 w-4" /> Launch
          </button>
        ) : (
          <p className="text-[8px] leading-5 text-[#ffec27]">Waiting for {anfitrion?.nombreUsuario} to launch...</p>
        )}
      </div>
    </ResumenFases>
  )
}

// Todos ven el mismo vuelo, después el informe de Mission Control y al final lo que gana cada uno.
export function LanzamientoEquipo({ sala, jugador, catalogo, onSalir }) {
  const [etapa, setEtapa] = useState('vuelo')
  const { lanzamiento } = sala
  const estrella = catalogo.estrellas.find((candidata) => candidata.id === sala.estrellaId)

  if (etapa === 'vuelo') {
    return <Vuelo eventos={lista(lanzamiento.informe?.eventos)} exito={lanzamiento.exito} estrella={estrella} onTerminado={() => setEtapa('informe')} />
  }
  if (etapa === 'informe') {
    return <InformeControl sala={sala} estrella={estrella} onTerminado={() => setEtapa('premios')} />
  }
  return <Premios sala={sala} jugador={jugador} catalogo={catalogo} onSalir={onSalir} />
}

function CohetePixel() {
  return (
    <svg viewBox="0 0 12 28" className="h-14 w-6" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="4" y="0" width="4" height="2" fill="#fff1e8" />
      <rect x="3" y="2" width="6" height="2" fill="#fff1e8" />
      <rect x="2" y="4" width="8" height="16" fill="#c2c3c7" />
      <rect x="2" y="10" width="8" height="2" fill="#ff77a8" />
      <rect x="0" y="16" width="2" height="6" fill="#ff004d" />
      <rect x="10" y="16" width="2" height="6" fill="#ff004d" />
      <rect x="3" y="20" width="6" height="4" fill="#5f574f" />
      <rect x="4" y="24" width="4" height="4" fill="#ffec27" className="motion-safe:animate-parpadeo" />
    </svg>
  )
}

function ExplosionPixel() {
  return (
    <svg viewBox="0 0 12 12" className="h-12 w-12" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="4" y="0" width="4" height="12" fill="#ff004d" />
      <rect x="0" y="4" width="12" height="4" fill="#ff004d" />
      <rect x="2" y="2" width="8" height="8" fill="#ffa300" />
      <rect x="4" y="4" width="4" height="4" fill="#ffec27" />
    </svg>
  )
}

function Vuelo({ eventos, exito, estrella, onTerminado }) {
  const [vistos, setVistos] = useState(0)
  const terminado = vistos >= eventos.length

  useEffect(() => {
    if (terminado) return
    const espera = setTimeout(() => setVistos((cantidad) => cantidad + 1), MS_POR_EVENTO)
    return () => clearTimeout(espera)
  }, [vistos, terminado])

  const subida = Math.min(SUBIDA_MAXIMA_PX, vistos * PASO_SUBIDA_PX)

  return (
    <section className={`${CAJA_PIXEL} grid gap-5 p-4 sm:p-5 md:grid-cols-2`}>
      <div className="relative h-72 overflow-hidden border-4 border-black bg-gradient-to-b from-[#050816] via-[#1d2b53] to-[#29adff]">
        <div className="absolute bottom-6 left-[calc(50%-3rem)] h-32 w-3 border-2 border-black bg-[repeating-linear-gradient(#c2c3c7_0_8px,#5f574f_8px_12px)]" />
        <div
          className="absolute bottom-6 left-[calc(50%-0.75rem)] motion-safe:transition-transform motion-safe:duration-700"
          style={{ transform: `translateY(-${subida}px)` }}
        >
          {terminado && !exito ? <ExplosionPixel /> : <CohetePixel />}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-6 border-t-4 border-black bg-[#5f574f]" />
      </div>
      <div className="space-y-3">
        <p className="text-[8px] leading-4 text-[#ffec27]">MISSION TO {estrella.nombre.toUpperCase()} · LIVE</p>
        <ol className="space-y-2">
          {eventos.slice(0, vistos).map((evento) => (
            <li
              key={evento.texto}
              className={`flex items-center gap-2 border-4 border-black p-2 text-[8px] leading-4 ${evento.ok ? 'bg-[#0b1430]' : 'bg-[#3a0712] text-[#ffb3c4]'}`}
            >
              {evento.ok ? <ChevronRight className="h-3 w-3 shrink-0 text-[#29adff]" /> : <X className="h-3 w-3 shrink-0" />}
              {evento.texto}
            </li>
          ))}
        </ol>
        {terminado ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className={`border-4 border-black px-3 py-2 text-xs text-black sm:text-base ${exito ? 'bg-[#00e436]' : 'bg-[#ff004d]'}`}>
              {exito ? 'SUCCESS' : 'FAILED'}
            </span>
            <button onClick={onTerminado} className={`${BOTON_PIXEL} bg-[#ffec27]`}>
              Mission report
            </button>
          </div>
        ) : (
          <button onClick={() => setVistos(eventos.length)} className="text-[8px] text-[#c2c3c7] underline">
            Skip
          </button>
        )}
      </div>
    </section>
  )
}

function paginasDelInforme(sala, estrella) {
  const { lanzamiento } = sala
  const dias = lanzamiento.recompensas[0]?.diasPerdidos ?? 0
  const intro = lanzamiento.exito
    ? `Great news, team! Your probe made it and is already sending data from ${estrella.nombre}. Let me go through every department.`
    : `Team... the mission to ${estrella.nombre} failed. Let me tell you what happened, department by department.`
  const cierre = lanzamiento.exito
    ? 'Every crew member gets a key part for their own campaign. Well done!'
    : `No parts this time, and everybody loses ${dias} ${dias === 1 ? 'day' : 'days'} on their campaign clock. Now you know what to fix.`
  const lineas = lista(lanzamiento.informe?.lineas).map((linea) => {
    const departamento = DEPARTAMENTOS.find((candidato) => candidato.id === linea.departamento)
    return {
      departamento,
      veredicto: linea.veredicto,
      texto: `${departamento?.nombre ?? linea.departamento} (${responsableDe(sala, linea.departamento)?.nombreUsuario ?? 'nobody'}): ${linea.texto}`,
    }
  })
  return [{ texto: intro }, ...lineas, { texto: cierre }]
}

// El controlador de la intro cuenta el informe como un diálogo: un departamento por página.
function InformeControl({ sala, estrella, onTerminado }) {
  const [paginas] = useState(() => paginasDelInforme(sala, estrella))
  const [pagina, setPagina] = useState(0)
  const [escrita, setEscrita] = useState(false)
  const actual = paginas[pagina]

  function avanzar() {
    if (!escrita) {
      setEscrita(true)
      return
    }
    if (pagina === paginas.length - 1) {
      onTerminado()
      return
    }
    setPagina(pagina + 1)
    setEscrita(false)
  }

  useEffect(() => {
    function alPulsarTecla(evento) {
      if (evento.key !== 'Enter' && evento.key !== ' ') return
      evento.preventDefault()
      avanzar()
    }
    addEventListener('keydown', alPulsarTecla)
    return () => removeEventListener('keydown', alPulsarTecla)
  })

  return (
    <section className={`${CAJA_PIXEL} w-full`}>
      <p className="-mt-4 ml-4 inline-block -translate-y-1/2 border-4 border-black bg-[#ffec27] px-2 py-1 text-[8px] text-black">
        NASA Mission Control
      </p>
      <div className="flex gap-4 px-4 pb-4">
        <RetratoControlador className="h-16 w-16 shrink-0 border-4 border-black sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 space-y-3">
          {actual.departamento && (
            <p className="flex flex-wrap items-center gap-2 text-[8px]">
              <actual.departamento.Icono className="h-4 w-4" style={{ color: actual.departamento.color }} />
              <span style={{ color: actual.departamento.color }}>{actual.departamento.nombre}</span>
              <span className="border-2 border-black px-1 text-black" style={{ background: COLOR_VEREDICTO[actual.veredicto] ?? '#c2c3c7' }}>
                {actual.veredicto}
              </span>
            </p>
          )}
          <button type="button" onClick={avanzar} className="block min-h-24 w-full cursor-pointer text-left text-xs leading-6 sm:text-base sm:leading-8">
            <TextoMaquina key={pagina} texto={actual.texto} completo={escrita} onTerminado={() => setEscrita(true)} />
          </button>
          <p className="text-[8px] text-[#c2c3c7]">
            {pagina + 1} / {paginas.length} · click or press Enter
          </p>
        </div>
      </div>
    </section>
  )
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-slate-600 py-2 font-sans text-sm">
      <span className="text-slate-300">{etiqueta}</span>
      <b>{valor}</b>
    </div>
  )
}

function Premio({ recompensa, esMio, catalogo }) {
  const quien = esMio ? 'You' : recompensa.nombreUsuario
  if (recompensa.piezaId) {
    const pieza = catalogo.piezasPorId[recompensa.piezaId]
    const destino = catalogo.destinosPorId[recompensa.destinoId]
    return (
      <div className="flex items-center gap-3 border-4 border-black bg-[#0b1430] p-3">
        <Gift className="h-8 w-8 shrink-0 text-[#ffa300]" />
        <div className="min-w-0 font-sans">
          <p className="font-pixel text-[8px] text-[#ffec27]">{quien}</p>
          <p className="font-semibold">{pieza?.nombre ?? recompensa.piezaId}</p>
          <p className="text-xs text-slate-400">Key part for {destino?.nombre ?? 'the next destination'}: it is waiting in the Warehouse.</p>
        </div>
      </div>
    )
  }
  if (recompensa.dinero > 0) {
    return (
      <div className="flex items-center gap-3 border-4 border-black bg-[#0b1430] p-3">
        <Coins className="h-8 w-8 shrink-0 text-[#ffec27]" />
        <div className="min-w-0 font-sans">
          <p className="font-pixel text-[8px] text-[#ffec27]">{quien}</p>
          <p className="font-semibold">{formatoDinero(recompensa.dinero)}</p>
          <p className="text-xs text-slate-400">No destination with a key part left: the Government pays you instead.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 border-4 border-black bg-[#3a0712] p-3">
      <Clock className="h-8 w-8 shrink-0 text-[#ff004d]" />
      <div className="min-w-0 font-sans">
        <p className="font-pixel text-[8px] text-[#ffb3c4]">{quien}</p>
        <p className="font-semibold">
          −{recompensa.diasPerdidos} {recompensa.diasPerdidos === 1 ? 'day' : 'days'} on the campaign clock
        </p>
        <p className="text-xs text-red-200">The Government spent that time investigating the failure.</p>
      </div>
    </div>
  )
}

function Premios({ sala, jugador, catalogo, onSalir }) {
  const { teamwork, recompensas } = sala.lanzamiento

  return (
    <section className={`${CAJA_PIXEL} space-y-5 p-5`}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 border-4 border-black bg-[#0b1430] p-4">
          <p className="text-[8px] text-[#ffec27]">TEAMWORK</p>
          <div className="flex items-center gap-4">
            <span className="text-2xl">{teamwork.total}</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((indice) => (
                <Star key={indice} className={`h-6 w-6 ${indice < teamwork.estrellas ? 'fill-[#ffec27] text-[#ffec27]' : 'text-[#5f574f]'}`} />
              ))}
            </span>
          </div>
          <Fila etiqueta="Phases delivered on time" valor={`${teamwork.entregadas} / 4 · ${teamwork.puntosEntrega}`} />
          <Fila etiqueta="Speed (time left when delivering)" valor={`${teamwork.porcentajeRapidez}% · ${teamwork.puntosRapidez}`} />
          <Fila
            etiqueta="Builders listened to the votes"
            valor={teamwork.votosTotales === 0 ? `no votes · ${teamwork.puntosVotos}` : `${teamwork.votosSeguidos} of ${teamwork.votosTotales} · ${teamwork.puntosVotos}`}
          />
          <Fila etiqueta="Budget left over" valor={`${formatoDinero(teamwork.sobrante)} · ${teamwork.puntosPresupuesto}`} />
        </div>
        <div className="space-y-3">
          {recompensas.map((recompensa) => (
            <Premio key={recompensa.jugadorId} recompensa={recompensa} esMio={recompensa.jugadorId === jugador.id} catalogo={catalogo} />
          ))}
        </div>
      </div>
      <button onClick={onSalir} className={`${BOTON_PIXEL} flex items-center gap-2 bg-[#c2c3c7]`}>
        <LogOut className="h-4 w-4" /> Back to Friends
      </button>
    </section>
  )
}
