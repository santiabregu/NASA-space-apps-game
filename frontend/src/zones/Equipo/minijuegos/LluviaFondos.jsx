import { useEffect, useRef, useState } from 'react'
import BarraBloques from '../../../components/pixel/BarraBloques.jsx'
import { BOTON_PIXEL } from '../../../components/pixel/estilos.js'
import { contarAciertos, elegirPreguntas, presupuestoFinanzas } from '../../../engine/equipo.js'
import { formatoDinero } from '../../../formato.js'
import PreguntaFlash from './PreguntaFlash.jsx'

// Finance: recoger el dinero que cae con una caja fuerte y esquivar la burocracia. Cada 15 s, una pregunta flash.
const ANCHO = 160
const ALTO = 128
const SEGUNDOS_JUEGO = 45
const SEGUNDOS_ENTRE_PREGUNTAS = 15
const SEGUNDOS_ENTRE_OBJETOS = 0.6
const PROBABILIDAD_GRANT = 0.08
const PROBABILIDAD_CINTA = 0.17
const SEGUNDOS_BLOQUEO = 1
const VELOCIDAD_CAJA = 110
const ANCHO_CAJA = 16
const Y_CAJA = 116
const MS_ENTRE_MARCADORES = 100

const PALETA = { Y: '#ffec27', y: '#ffa300', P: '#ff77a8', p: '#7e2553', R: '#ff004d', r: '#7e2553', W: '#fff1e8', G: '#c2c3c7', g: '#5f574f', K: '#000000' }
const SPRITES = {
  moneda: ['..YY..', '.YyyY.', 'YyYYyY', 'YyYYyY', '.YyyY.', '..YY..'],
  grant: ['..PP..', '.PppP.', 'PpWWpP', 'PpWWpP', '.PppP.', '..PP..'],
  cinta: ['RRRRRR', 'RrWWrR', 'RRRRRR'],
  caja: ['GGGGGGGGGGGGGGGG', 'GggggggggggggggG', 'GgKKKKKKKKKKKKgG', 'GgKYYYYYYYYYYKgG', 'GgKKKKKKKKKKKKgG', 'GggggggggggggggG', 'GGGGGGGGGGGGGGGG'],
}
const ESTRELLAS = Array.from({ length: 28 }, () => [Math.floor(Math.random() * ANCHO), Math.floor(Math.random() * (ALTO - 16))])
const TECLAS_IZQUIERDA = ['ArrowLeft', 'a', 'A']
const TECLAS_DERECHA = ['ArrowRight', 'd', 'D']

function pintar(ctx, mapa, x, y) {
  mapa.forEach((fila, j) =>
    [...fila].forEach((color, i) => {
      if (color === '.') return
      ctx.fillStyle = PALETA[color]
      ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1)
    }),
  )
}

function dibujarEscena(ctx, juego) {
  ctx.fillStyle = '#0b1430'
  ctx.fillRect(0, 0, ANCHO, ALTO)
  ctx.fillStyle = '#29adff'
  ESTRELLAS.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1))
  ctx.fillStyle = '#5f574f'
  ctx.fillRect(0, ALTO - 4, ANCHO, 4)
  juego.cosas.forEach((cosa) => pintar(ctx, SPRITES[cosa.tipo], cosa.x, cosa.y))
  pintar(ctx, SPRITES.caja, juego.x, Y_CAJA)
  if (juego.bloqueo > 0) pintar(ctx, SPRITES.cinta, juego.x + 5, Y_CAJA - 4)
}

// Lo que se manda al servidor: el mismo formato vale de progreso y de resultado.
const datos = (j, extra = {}) => ({ monedas: j.monedas, grants: j.grants, respuestas: j.respuestas, evento: j.evento, ...extra })

const nuevoJuego = () => ({ x: 72, objetivo: 72, cosas: [], t: 0, monedas: 0, grants: 0, bloqueo: 0, aparecer: 0, respuestas: [], evento: null })

// Mueve la caja, hace caer las cosas y cuenta lo que se atrapa. Devuelve true si ha pasado algo que los demás deben ver.
function avanzar(juego, dt, teclas) {
  juego.t += dt
  let novedad = false
  if (juego.bloqueo > 0) {
    juego.bloqueo -= dt
  } else {
    if (teclas.izquierda) juego.objetivo = juego.x - 4
    if (teclas.derecha) juego.objetivo = juego.x + 4
    juego.objetivo = Math.max(0, Math.min(ANCHO - ANCHO_CAJA, juego.objetivo))
    const paso = VELOCIDAD_CAJA * dt
    juego.x += Math.max(-paso, Math.min(paso, juego.objetivo - juego.x))
  }
  juego.aparecer -= dt
  if (juego.aparecer <= 0) {
    juego.aparecer = SEGUNDOS_ENTRE_OBJETOS
    const azar = Math.random()
    const tipo = azar < PROBABILIDAD_GRANT ? 'grant' : azar < PROBABILIDAD_GRANT + PROBABILIDAD_CINTA ? 'cinta' : 'moneda'
    juego.cosas.push({ tipo, x: 4 + Math.random() * (ANCHO - 12), y: -6, velocidad: 34 + Math.random() * 30 + juego.t })
  }
  juego.cosas = juego.cosas.filter((cosa) => {
    cosa.y += cosa.velocidad * dt
    const atrapada = cosa.y > Y_CAJA - 4 && cosa.y < Y_CAJA + 6 && cosa.x + 6 > juego.x && cosa.x < juego.x + ANCHO_CAJA
    if (!atrapada) return cosa.y < ALTO
    if (cosa.tipo === 'moneda') juego.monedas += 1
    if (cosa.tipo === 'grant') {
      juego.grants += 1
      juego.evento = 'Caught a grant!'
    }
    if (cosa.tipo === 'cinta') {
      juego.bloqueo = SEGUNDOS_BLOQUEO
      juego.evento = 'Stuck in red tape!'
    }
    novedad = true
    return false
  })
  return novedad
}

export default function LluviaFondos({ catalogo, estrella, onProgreso, onTerminar }) {
  const reglas = catalogo.equipo
  const [preguntas] = useState(() => elegirPreguntas(catalogo, 'FINANCIACION'))
  const [etapa, setEtapa] = useState('intro')
  const [marcador, setMarcador] = useState({ monedas: 0, grants: 0, t: 0, respuestas: [] })
  const lienzo = useRef(null)
  const juego = useRef(nuevoJuego())
  const teclas = useRef({})
  const avisos = useRef({ onProgreso, onTerminar })

  useEffect(() => {
    avisos.current = { onProgreso, onTerminar }
  })

  const recaudado = marcador.monedas * reglas.valorMoneda + marcador.grants * reglas.valorGrant

  useEffect(() => {
    dibujarEscena(lienzo.current.getContext('2d'), juego.current)
  }, [])

  useEffect(() => {
    if (etapa !== 'jugando') return
    const j = juego.current
    const ctx = lienzo.current.getContext('2d')
    let ultimo = performance.now()
    let ultimoMarcador = 0
    let marco

    const pulsar = (evento, abajo) => {
      if (TECLAS_IZQUIERDA.includes(evento.key)) teclas.current.izquierda = abajo
      else if (TECLAS_DERECHA.includes(evento.key)) teclas.current.derecha = abajo
      else return
      evento.preventDefault()
    }
    const bajar = (evento) => pulsar(evento, true)
    const subir = (evento) => pulsar(evento, false)
    addEventListener('keydown', bajar)
    addEventListener('keyup', subir)

    const tic = (ahora) => {
      const dt = Math.min(0.05, (ahora - ultimo) / 1000)
      ultimo = ahora
      const novedad = avanzar(j, dt, teclas.current)
      dibujarEscena(ctx, j)
      if (novedad) avisos.current.onProgreso(datos(j))
      if (ahora - ultimoMarcador > MS_ENTRE_MARCADORES) {
        ultimoMarcador = ahora
        setMarcador({ monedas: j.monedas, grants: j.grants, t: j.t, respuestas: j.respuestas })
      }
      const preguntaToca = j.respuestas.length < preguntas.length && j.t >= (j.respuestas.length + 1) * SEGUNDOS_ENTRE_PREGUNTAS
      if (preguntaToca) {
        avisos.current.onProgreso(datos(j, { respondiendo: true }))
        setEtapa('pregunta')
        return
      }
      if (j.t >= SEGUNDOS_JUEGO) {
        setMarcador({ monedas: j.monedas, grants: j.grants, t: SEGUNDOS_JUEGO, respuestas: j.respuestas })
        setEtapa('fin')
        avisos.current.onTerminar(datos(j))
        return
      }
      marco = requestAnimationFrame(tic)
    }
    marco = requestAnimationFrame(tic)
    return () => {
      cancelAnimationFrame(marco)
      removeEventListener('keydown', bajar)
      removeEventListener('keyup', subir)
      teclas.current = {}
    }
  }, [etapa, preguntas.length])

  function responder(opcion) {
    const j = juego.current
    j.respuestas = [...j.respuestas, { id: preguntas[j.respuestas.length].id, opcion }]
    j.evento = opcion === preguntas[j.respuestas.length - 1].correcta ? 'Right answer!' : 'Wrong answer'
    avisos.current.onProgreso(datos(j))
    setMarcador((anterior) => ({ ...anterior, respuestas: j.respuestas }))
    setEtapa('jugando')
  }

  function apuntar(evento) {
    if (evento.pointerType === 'mouse' && evento.type === 'pointermove' && evento.buttons === 0) return
    const caja = lienzo.current.getBoundingClientRect()
    juego.current.objetivo = ((evento.clientX - caja.left) / caja.width) * ANCHO - ANCHO_CAJA / 2
  }

  const aciertos = contarAciertos(marcador.respuestas, catalogo)
  const presupuesto = presupuestoFinanzas({ ...marcador, aciertos }, estrella, reglas)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap justify-between gap-2 text-[8px] leading-4">
        <span>
          RAISED <span className="text-[#ffec27]">{formatoDinero(recaudado)}</span>
        </span>
        <span>
          QUESTIONS {aciertos} / {marcador.respuestas.length}
        </span>
        <span>{Math.max(0, Math.ceil(SEGUNDOS_JUEGO - marcador.t))} s</span>
      </div>
      <BarraBloques fraccion={1 - marcador.t / SEGUNDOS_JUEGO} color="#ffec27" className="h-4 shrink-0" />

      {etapa === 'pregunta' && (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
          <PreguntaFlash
            key={marcador.respuestas.length}
            pregunta={preguntas[marcador.respuestas.length]}
            numero={marcador.respuestas.length + 1}
            total={preguntas.length}
            onRespondida={responder}
          />
        </div>
      )}
      <div
        className={`flex min-h-0 flex-1 items-center justify-center [container-type:size] max-md:aspect-[5/4] max-md:flex-none ${
          etapa === 'pregunta' ? 'hidden' : ''
        }`}
      >
      <div className="relative aspect-[5/4]" style={{ width: 'min(100cqw, 125cqh)' }}>
        <canvas
          ref={lienzo}
          width={ANCHO}
          height={ALTO}
          onPointerDown={apuntar}
          onPointerMove={apuntar}
          className="block h-full w-full touch-none border-4 border-black bg-[#0b1430] [image-rendering:pixelated]"
        />
        {etapa === 'intro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050816]/85 p-4 text-center">
            <p className="text-xs sm:text-base">Funding rain</p>
            <p className="font-sans text-sm text-slate-200">
              Catch coins ({formatoDinero(reglas.valorMoneda)}) and purple grants ({formatoDinero(reglas.valorGrant)}). Red tape
              freezes you for a second. Every right answer adds {Math.round(reglas.bonusPorAcierto * 100)}% to the budget.
            </p>
            <button onClick={() => setEtapa('jugando')} className={`${BOTON_PIXEL} bg-[#00e436]`}>
              Start
            </button>
          </div>
        )}
        {etapa === 'fin' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#050816]/85 p-4 text-center">
            <p className="text-[8px] text-[#ffec27]">Mission budget</p>
            <p className="text-base sm:text-2xl">{formatoDinero(presupuesto)}</p>
            <p className="font-sans text-sm text-slate-300">Sending it to the team...</p>
          </div>
        )}
      </div>
      </div>
      <p className="shrink-0 text-center font-sans text-xs text-slate-400">Move with the arrow keys or A / D, or drag on the screen.</p>
    </div>
  )
}
