import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { contarAciertos, elegirPreguntas, fiabilidadSoftware } from '../../../engine/equipo.js'
import PreguntaFlash from './PreguntaFlash.jsx'

// Software: cada sensor va a la entrada del ordenador con su mismo símbolo y el ordenador va a la radio.
// Después, preguntas flash. Un cable mal puesto echa chispas y resta fiabilidad.
const SIMBOLOS = [
  { id: 'circulo', color: '#ffec27' },
  { id: 'triangulo', color: '#ff77a8' },
  { id: 'cuadrado', color: '#29adff' },
]
const SALIDA = 'o-salida'
const RADIO = 'r-entrada'
const COLOR_BUS = '#00e436'
const MS_ANTES_DE_PREGUNTAS = 1200
const SENSORES_FIJOS = ['Star tracker', 'Thermometer']

const esPareja = (a, b) => {
  const [x, y] = [a, b].sort()
  if (x === SALIDA && y === RADIO) return true
  return x.startsWith('o-') && y.startsWith('s-') && x.slice(2) === y.slice(2)
}

function Simbolo({ id, color }) {
  return (
    <svg viewBox="0 0 12 12" className="h-4 w-4 shrink-0" shapeRendering="crispEdges">
      <rect width="12" height="12" fill="#000" />
      {id === 'circulo' && <path d="M4 2h4v1h1v1h1v4h-1v1h-1v1h-4v-1h-1v-1h-1v-4h1v-1h1z" fill={color} />}
      {id === 'triangulo' && <path d="M5 2h2v2h1v2h1v2h1v2h-8v-2h1v-2h1v-2h1z" fill={color} />}
      {id === 'cuadrado' && <rect x="2" y="2" width="8" height="8" fill={color} />}
      {id === 'bus' && <rect x="1" y="4" width="10" height="4" fill={color} />}
    </svg>
  )
}

function Puerto({ id, texto, simbolo, color, lado, estado, onTocar }) {
  const etiqueta = <span className="min-w-0 truncate">{texto}</span>
  return (
    <button
      onClick={() => onTocar(id)}
      disabled={estado === 'hecho'}
      className={`flex w-full items-center gap-2 border-2 p-1 text-left ${
        estado === 'elegido' ? 'border-[#fff1e8] bg-[#1d2b53]' : 'border-transparent'
      } ${estado === 'hecho' ? 'opacity-60' : 'hover:border-[#5f574f]'} ${lado === 'derecha' ? 'justify-between' : ''}`}
    >
      {lado === 'derecha' && etiqueta}
      <span data-puerto={id}>
        <Simbolo id={simbolo} color={color} />
      </span>
      {lado === 'izquierda' && etiqueta}
    </button>
  )
}

function Modulo({ titulo, color, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-4 border-black bg-[#0b1430] p-2 text-[8px] leading-4">
      <span style={{ color }}>{titulo}</span>
      {children}
    </div>
  )
}

export default function ConectarBus({ catalogo, estrella, onProgreso, onTerminar }) {
  const reglas = catalogo.equipo
  const [preguntas] = useState(() => elegirPreguntas(catalogo, 'SOFTWARE'))
  const [entradas] = useState(() => [...SIMBOLOS].sort(() => Math.random() - 0.5))
  const [elegido, setElegido] = useState(null)
  const [hechos, setHechos] = useState([])
  const [chispas, setChispas] = useState(0)
  const [mensaje, setMensaje] = useState(null)
  const [respuestas, setRespuestas] = useState([])
  const [etapa, setEtapa] = useState('cables')
  const [lineas, setLineas] = useState([])
  const contenedor = useRef(null)

  const instrumento = estrella.mision.piezasObligatorias
    .map((id) => catalogo.piezasPorId[id])
    .find((pieza) => pieza.tipo === 'instrumento')
  const sensores = [instrumento?.nombre ?? 'Magnetometer', ...SENSORES_FIJOS]
  const conexiones = hechos.length
  const aciertos = contarAciertos(respuestas, catalogo)
  const fiabilidad = fiabilidadSoftware({ conexiones, chispas, aciertos }, reglas)
  const conectado = (id) => hechos.some((pareja) => pareja.includes(id))
  const estadoDe = (id) => (conectado(id) ? 'hecho' : elegido === id ? 'elegido' : null)

  useLayoutEffect(() => {
    function medir() {
      const base = contenedor.current?.getBoundingClientRect()
      if (!base) return
      const centro = (id) => {
        const caja = contenedor.current.querySelector(`[data-puerto="${id}"]`).getBoundingClientRect()
        return [caja.left - base.left + caja.width / 2, caja.top - base.top + caja.height / 2]
      }
      setLineas(
        hechos.map(([a, b]) => {
          const [x1, y1] = centro(a)
          const [x2, y2] = centro(b)
          const medio = (x1 + x2) / 2
          const simbolo = SIMBOLOS.find((s) => a.endsWith(s.id) || b.endsWith(s.id))
          return { clave: `${a}-${b}`, puntos: `${x1},${y1} ${medio},${y1} ${medio},${y2} ${x2},${y2}`, color: simbolo?.color ?? COLOR_BUS }
        }),
      )
    }
    medir()
    addEventListener('resize', medir)
    return () => removeEventListener('resize', medir)
  }, [hechos, etapa])

  useEffect(() => {
    if (conexiones < reglas.conexionesCables) return
    const espera = setTimeout(() => setEtapa('preguntas'), MS_ANTES_DE_PREGUNTAS)
    return () => clearTimeout(espera)
  }, [conexiones, reglas.conexionesCables])

  function tocar(id) {
    if (!elegido) {
      setElegido(id)
      return
    }
    setElegido(null)
    if (elegido === id) return
    if (esPareja(elegido, id)) {
      const nuevos = [...hechos, [elegido, id]]
      setHechos(nuevos)
      setMensaje({ texto: nuevos.length === reglas.conexionesCables ? 'Bus online!' : 'Connected', bien: true })
      onProgreso({ conexiones: nuevos.length, chispas, respuestas, evento: 'Cable connected' })
    } else {
      setChispas(chispas + 1)
      setMensaje({ texto: 'Spark! Wrong port', bien: false })
      onProgreso({ conexiones, chispas: chispas + 1, respuestas, evento: 'Spark!' })
    }
  }

  function responder(opcion) {
    const nuevas = [...respuestas, { id: preguntas[respuestas.length].id, opcion }]
    setRespuestas(nuevas)
    onProgreso({ conexiones, chispas, respuestas: nuevas, evento: opcion === preguntas[respuestas.length].correcta ? 'Right answer!' : 'Wrong answer' })
    if (nuevas.length === preguntas.length) {
      setEtapa('fin')
      onTerminar({ conexiones, chispas, respuestas: nuevas })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex flex-wrap justify-between gap-2 text-[8px] leading-4">
        <span>
          RELIABILITY <span className="text-[#00e436]">{fiabilidad}%</span>
        </span>
        <span>
          CABLES {conexiones} / {reglas.conexionesCables}
        </span>
        <span>SPARKS {chispas}</span>
      </div>

      {etapa === 'cables' && (
        <>
          <p className="font-sans text-sm text-slate-300">
            Tap a port, then its partner: every sensor goes to the computer input with the same symbol, and the computer
            output goes to the radio.
          </p>
          <div ref={contenedor} className="relative grid grid-cols-3 gap-3 py-2 sm:gap-8">
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {lineas.map((linea) => (
                <g key={linea.clave}>
                  <polyline points={linea.puntos} fill="none" stroke="#000" strokeWidth="8" />
                  <polyline points={linea.puntos} fill="none" stroke={linea.color} strokeWidth="4" />
                </g>
              ))}
            </svg>
            <Modulo titulo="SENSORS" color="#ffec27">
              {SIMBOLOS.map((simbolo, indice) => (
                <Puerto key={simbolo.id} id={`s-${simbolo.id}`} texto={sensores[indice]} simbolo={simbolo.id} color={simbolo.color}
                  lado="derecha" estado={estadoDe(`s-${simbolo.id}`)} onTocar={tocar} />
              ))}
            </Modulo>
            <Modulo titulo="COMPUTER" color="#00e436">
              {entradas.map((simbolo) => (
                <Puerto key={simbolo.id} id={`o-${simbolo.id}`} texto="IN" simbolo={simbolo.id} color={simbolo.color}
                  lado="izquierda" estado={estadoDe(`o-${simbolo.id}`)} onTocar={tocar} />
              ))}
              <Puerto id={SALIDA} texto="OUT" simbolo="bus" color={COLOR_BUS} lado="derecha" estado={estadoDe(SALIDA)} onTocar={tocar} />
            </Modulo>
            <Modulo titulo="RADIO" color="#29adff">
              <Puerto id={RADIO} texto="IN" simbolo="bus" color={COLOR_BUS} lado="izquierda" estado={estadoDe(RADIO)} onTocar={tocar} />
            </Modulo>
          </div>
          <p className={`min-h-4 text-[8px] leading-4 ${mensaje?.bien ? 'text-[#00e436]' : 'text-[#ff004d]'}`}>{mensaje?.texto}</p>
        </>
      )}

      {etapa === 'preguntas' && (
        <div className="flex justify-center">
          <PreguntaFlash
            key={respuestas.length}
            pregunta={preguntas[respuestas.length]}
            numero={respuestas.length + 1}
            total={preguntas.length}
            onRespondida={responder}
          />
        </div>
      )}

      {etapa === 'fin' && (
        <div className="space-y-3 border-4 border-black bg-[#0b1430] p-5 text-center">
          <p className="text-[8px] text-[#ffec27]">Telescope reliability</p>
          <p className="text-base text-[#00e436] sm:text-2xl">{fiabilidad}%</p>
          <p className="font-sans text-sm text-slate-300">Sending it to the team...</p>
        </div>
      )}
    </div>
  )
}
