// Pixel art dibujado con rectángulos SVG: cada carácter de un mapa es un píxel y la paleta dice su color.
// Paleta inspirada en las consolas de 8 bits.
const COLOR = {
  negro: '#000000',
  marino: '#1d2b53',
  morado: '#7e2553',
  verdeOscuro: '#008751',
  marron: '#ab5236',
  grisOscuro: '#5f574f',
  gris: '#c2c3c7',
  blanco: '#fff1e8',
  rojo: '#ff004d',
  naranja: '#ffa300',
  amarillo: '#ffec27',
  verde: '#00e436',
  azul: '#29adff',
  azulOscuro: '#1d74c4',
  rosa: '#ff77a8',
  piel: '#ffccaa',
  brillo: '#c2f0ff',
}

// Junta los píxeles seguidos del mismo color en un solo rectángulo para no pintar miles.
export function Sprite({ mapa, paleta, x = 0, y = 0, ...resto }) {
  const rectangulos = []
  mapa.forEach((fila, fy) => {
    let inicio = 0
    for (let fx = 1; fx <= fila.length; fx++) {
      if (fx < fila.length && fila[fx] === fila[inicio]) continue
      const color = paleta[fila[inicio]]
      if (color) {
        rectangulos.push(<rect key={`${fy}-${inicio}`} x={x + inicio} y={y + fy} width={fx - inicio} height={1} fill={color} />)
      }
      inicio = fx
    }
  })
  return <g {...resto}>{rectangulos}</g>
}

// Generador pseudoaleatorio con semilla: las estrellas salen siempre en el mismo sitio.
function aleatorio(semilla) {
  let estado = semilla
  return () => {
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Una bola de píxeles con borde, sombra abajo a la derecha y un brillo arriba a la izquierda.
function mapaBola(radio, colorear) {
  return Array.from({ length: radio * 2 }, (_, y) =>
    Array.from({ length: radio * 2 }, (_, x) => {
      const dx = x + 0.5 - radio
      const dy = y + 0.5 - radio
      const distancia = Math.hypot(dx, dy)
      if (distancia > radio) return '.'
      if (distancia > radio - 1.2) return 'k'
      if (Math.hypot(dx + radio * 0.45, dy + radio * 0.5) < radio * 0.12) return 'w'
      return colorear(x, y, (dx + dy) / radio > 0.55)
    }).join(''),
  )
}

const ANCHO_CIELO = 320
const ALTO_CIELO = 180
const COLORES_ESTRELLA = [COLOR.blanco, COLOR.gris, COLOR.amarillo, COLOR.azul]

const ESTRELLAS = (() => {
  const azar = aleatorio(7)
  return Array.from({ length: 170 }, (_, indice) => ({
    indice,
    x: Math.floor(azar() * ANCHO_CIELO),
    y: Math.floor(azar() * ALTO_CIELO),
    color: COLORES_ESTRELLA[Math.floor(azar() * COLORES_ESTRELLA.length)],
    titila: azar() < 0.3,
    grande: azar() < 0.08,
    retraso: Math.round(azar() * 1800),
  }))
})()

const PLANETA_LEJANO = mapaBola(6, (x, y, sombra) => {
  if (sombra) return 'P'
  return y % 4 < 2 ? 'p' : 'q'
})

export function CieloPixel({ ref }) {
  return (
    <svg
      ref={ref}
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${ANCHO_CIELO} ${ALTO_CIELO}`}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width={ANCHO_CIELO} height={ALTO_CIELO} fill="#020617" />
      {ESTRELLAS.map((estrella) => (
        <g
          key={estrella.indice}
          fill={estrella.color}
          className={estrella.titila ? 'animate-titilar' : undefined}
          style={estrella.titila ? { animationDelay: `${estrella.retraso}ms` } : undefined}
        >
          <rect x={estrella.x} y={estrella.y} width="1" height="1" />
          {estrella.grande && (
            <>
              <rect x={estrella.x - 1} y={estrella.y} width="3" height="1" />
              <rect x={estrella.x} y={estrella.y - 1} width="1" height="3" />
            </>
          )}
        </g>
      ))}
      <g transform="translate(262 22)">
        <Sprite mapa={PLANETA_LEJANO} paleta={{ k: COLOR.marino, p: COLOR.rosa, q: COLOR.morado, P: COLOR.morado, w: COLOR.blanco }} />
        <rect x="-4" y="6" width="20" height="1" fill={COLOR.amarillo} />
        <rect x="-2" y="7" width="16" height="1" fill={COLOR.naranja} />
      </g>
    </svg>
  )
}

// La Tierra: [x, y, radio, ¿quemado?] de cada continente, en píxeles dentro de la bola.
const RADIO_TIERRA = 28
const CONTINENTES = [
  [13, 15, 7, false],
  [19, 22, 5, true],
  [37, 12, 6, true],
  [43, 21, 5, false],
  [33, 39, 8, true],
  [15, 40, 5, false],
  [47, 35, 4, true],
  [27, 7, 3, false],
]

const TIERRA = mapaBola(RADIO_TIERRA, (x, y, sombra) => {
  // Un poco de ruido en el borde de los continentes para que no sean círculos perfectos.
  const ruido = (((x * 7 + y * 13) % 3) - 1) * 0.7
  const continente = CONTINENTES.find(([cx, cy, radio]) => Math.hypot(x - cx, y - cy) < radio + ruido)
  if (!continente) return sombra ? 'O' : 'o'
  if (continente[3]) return sombra ? 'Q' : 'q'
  return sombra ? 'G' : 'g'
})

const PALETA_TIERRA = {
  k: COLOR.marino,
  o: COLOR.azul,
  O: COLOR.azulOscuro,
  g: COLOR.verde,
  G: COLOR.verdeOscuro,
  q: COLOR.naranja,
  Q: COLOR.marron,
  w: COLOR.brillo,
}

// Cara de agobio: cejas preocupadas, ojos mirando hacia el fuego y una boca que tiembla.
const CARA = [
  '....k..........k....',
  '..kk............kk..',
  '....................',
  '..wwwww......wwwww..',
  '..wppww......wppww..',
  '..wppww......wppww..',
  '..wwwww......wwwww..',
  '....................',
  '......k...k...k.....',
  '.......k.k.k.k......',
]

const GOTA_SUDOR = ['..k..', '.kdk.', 'kdddk', 'kdwdk', '.kkk.']

const LLAMA_A = ['...r...', '..rr...', '..ror..', '.rooor.', '.royor.', 'rooyyor', 'royyyor', 'royyyor', '.rooor.']
const LLAMA_B = ['....r..', '...rr..', '..ror..', '.roor..', '.royyr.', 'rooyyor', 'royyyor', 'royyyor', '.rooor.']
const PALETA_LLAMA = { r: COLOR.rojo, o: COLOR.naranja, y: COLOR.amarillo }

// Ángulo sobre la superficie (0° a la derecha, -90° arriba) y retraso para que no parpadeen a la vez.
const LLAMAS = [
  { angulo: -158, retraso: 0 },
  { angulo: -128, retraso: 120 },
  { angulo: -98, retraso: 60 },
  { angulo: -70, retraso: 200 },
  { angulo: -40, retraso: 90 },
  { angulo: -12, retraso: 160 },
]

const HUMO = [
  { x: 6, y: -6, tamano: 3, retraso: 0 },
  { x: 20, y: -12, tamano: 2, retraso: 500 },
  { x: 33, y: -13, tamano: 3, retraso: 1000 },
  { x: 47, y: -8, tamano: 2, retraso: 300 },
  { x: 55, y: 4, tamano: 3, retraso: 800 },
]

function posicionLlama(angulo) {
  const radianes = (angulo * Math.PI) / 180
  // La base de la llama queda un poco hundida en la superficie.
  const x = RADIO_TIERRA + Math.cos(radianes) * (RADIO_TIERRA - 2)
  const y = RADIO_TIERRA + Math.sin(radianes) * (RADIO_TIERRA - 2)
  return { x: Math.round(x - 3.5), y: Math.round(y - 8) }
}

export function TierraArdiendo({ className, ref }) {
  return (
    <svg ref={ref} className={className} viewBox="-10 -30 76 90" shapeRendering="crispEdges" aria-hidden="true">
      {HUMO.map((bocanada) => (
        <rect
          key={bocanada.x}
          x={bocanada.x}
          y={bocanada.y}
          width={bocanada.tamano}
          height={bocanada.tamano}
          fill={COLOR.grisOscuro}
          className="animate-humo"
          style={{ animationDelay: `${bocanada.retraso}ms` }}
        />
      ))}
      <Sprite mapa={TIERRA} paleta={PALETA_TIERRA} />
      <Sprite mapa={CARA} paleta={{ k: COLOR.negro, w: COLOR.blanco, p: COLOR.negro }} x={18} y={21} />
      <Sprite mapa={GOTA_SUDOR} paleta={{ k: COLOR.marino, d: COLOR.brillo, w: COLOR.blanco }} x={38} y={19} className="animate-parpadeo" />
      {LLAMAS.map(({ angulo, retraso }) => {
        const { x, y } = posicionLlama(angulo)
        const ritmo = { animationDelay: `${retraso}ms` }
        const contrarritmo = { animationDelay: `${retraso - 180}ms` }
        return (
          <g key={angulo}>
            <Sprite mapa={LLAMA_A} paleta={PALETA_LLAMA} x={x} y={y} className="animate-fotograma" style={ritmo} />
            <Sprite mapa={LLAMA_B} paleta={PALETA_LLAMA} x={x} y={y} className="animate-fotograma" style={contrarritmo} />
          </g>
        )
      })}
    </svg>
  )
}

// El de control de misión: pelo, cascos con micro y corbata.
const CONTROLADOR = [
  '....kkkkkkkk....',
  '...khhhhhhhhk...',
  '..khhhhhhhhhhk..',
  '.gkhsssssssshkg.',
  '.gkssessssesskg.',
  '.gksssssssssskg.',
  '.gksssmmmmssskg.',
  '..kccssssssk....',
  '...kkssssskk....',
  '....kttbbttk....',
  '..kttttbbttttk..',
  '.ktttttbbtttttk.',
  '.ktttttbbtttttk.',
  '.ktttttbbtttttk.',
  '.kttttttttttttk.',
  '.kkkkkkkkkkkkkk.',
]

const PALETA_CONTROLADOR = {
  k: COLOR.negro,
  h: COLOR.grisOscuro,
  s: COLOR.piel,
  e: COLOR.negro,
  m: COLOR.morado,
  g: COLOR.gris,
  c: COLOR.grisOscuro,
  t: COLOR.blanco,
  b: COLOR.azul,
}

export function RetratoControlador({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="16" height="16" fill={COLOR.azulOscuro} />
      <Sprite mapa={CONTROLADOR} paleta={PALETA_CONTROLADOR} />
    </svg>
  )
}

// Las estrellas de las misiones de equipo, a escala: las enanas rojas son pequeñas y Betelgeuse no cabe.
const ESTRELLAS_MISION = {
  'proxima-centauri': { radio: 6, luz: COLOR.rojo, sombra: COLOR.morado },
  'trappist-1': { radio: 5, luz: COLOR.marron, sombra: COLOR.morado },
  betelgeuse: { radio: 15, luz: COLOR.naranja, sombra: COLOR.rojo },
  sol: { radio: 10, luz: COLOR.amarillo, sombra: COLOR.naranja },
}
const LADO_ESTRELLA = 32

const MAPAS_ESTRELLA = Object.fromEntries(
  Object.entries(ESTRELLAS_MISION).map(([id, { radio }]) => [id, mapaBola(radio, (x, y, enSombra) => (enSombra ? 'S' : 'L'))]),
)

export function EstrellaPixel({ id, className }) {
  const { radio, luz, sombra } = ESTRELLAS_MISION[id]
  const borde = LADO_ESTRELLA / 2 - radio
  return (
    <svg className={className} viewBox={`0 0 ${LADO_ESTRELLA} ${LADO_ESTRELLA}`} shapeRendering="crispEdges" aria-hidden="true">
      <Sprite mapa={MAPAS_ESTRELLA[id]} paleta={{ k: sombra, L: luz, S: sombra, w: COLOR.blanco }} x={borde} y={borde} />
    </svg>
  )
}
