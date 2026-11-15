// Viñetas de los finales en un lienzo de 160×90 píxeles, con la paleta de 8 bits de components/pixel.
// Se dibujan con rectángulos de 1 px y el CSS las escala sin suavizar.
export const ANCHO = 160
export const ALTO = 90
export const FUENTE = '8px "Press Start 2P", monospace'

const P = {
  negro: '#000000',
  marino: '#1d2b53',
  morado: '#7e2553',
  verdeOscuro: '#008751',
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
  brillo: '#c2f0ff',
  noche: '#020617',
}

// Colores de los cuatro tripulantes: el primero es el jugador.
const TRIPULACION = [P.rojo, P.verde, P.amarillo, P.rosa]

function aleatorio(semilla) {
  let estado = semilla
  return () => {
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const modulo = (a, n) => ((a % n) + n) % n
const parpadea = (t, hz = 2) => modulo(Math.floor(t * hz), 2) === 0

function pixel(ctx, x, y, ancho, alto, color) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), ancho, alto)
}

// Cada carácter del mapa es un píxel; '.' es transparente y la paleta traduce el resto.
function sprite(ctx, mapa, x, y, paleta, escala = 1) {
  mapa.forEach((fila, j) => {
    for (let i = 0; i < fila.length; i++) {
      const color = paleta[fila[i]]
      if (color) pixel(ctx, x + i * escala, y + j * escala, escala, escala, color)
    }
  })
}

const COHETE = [
  '...w...',
  '..wCw..',
  '..www..',
  '.wwwww.',
  '.wwaww.',
  '.wabaw.',
  '.wwaww.',
  '.wwwww.',
  '.CCCCC.',
  '.wwwww.',
  '.wwwww.',
  '.wwwww.',
  'CwwwwwC',
  'CCwgwCC',
  'C.ggg.C',
]
const paletaCohete = (acento) => ({ w: P.blanco, a: P.azul, b: P.brillo, g: P.gris, C: acento })

const ASTRONAUTA = [
  '.www.',
  'wbbaw',
  'wbaaw',
  '.www.',
  'CwwwC',
  'CwwwC',
  '.w.w.',
  '.w.w.',
]
const paletaAstronauta = (traje) => ({ w: P.blanco, a: P.azul, b: P.brillo, C: traje })
const ASIENTO_VACIO = { w: P.grisOscuro, C: P.grisOscuro, a: P.noche, b: P.noche }

const TELESCOPIO = [
  '....aaaaa....',
  '...aAaAaAa...',
  '..aAaAaAaAa..',
  '...aAaAaAa...',
  '....aaaaa....',
  '......g......',
  '......g......',
  '..sssssssss..',
  '.SSSSSSSSSSS.',
  'sssssssssssss',
  '.SSSSSSSSSSS.',
]
const PALETA_TELESCOPIO = { a: P.amarillo, A: P.naranja, g: P.gris, s: P.rosa, S: P.morado }

function estrellas(ctx, semilla, t, fondo = P.noche) {
  pixel(ctx, 0, 0, ANCHO, ALTO, fondo)
  const azar = aleatorio(semilla)
  const colores = [P.blanco, P.gris, P.amarillo, P.azul]
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(azar() * ANCHO)
    const y = Math.floor(azar() * ALTO)
    const color = colores[Math.floor(azar() * colores.length)]
    const apagada = azar() < 0.3 && Math.sin(t * 3 + i * 1.7) > 0.5
    if (!apagada) pixel(ctx, x, y, 1, 1, color)
  }
}

// Los planetas se pintan una vez por variante en un lienzo aparte y luego solo se copian.
const discosPintados = new Map()
function disco(ctx, cx, cy, radio, clave, colorEn) {
  let lienzo = discosPintados.get(clave)
  if (!lienzo) {
    lienzo = document.createElement('canvas')
    lienzo.width = lienzo.height = radio * 2
    const otro = lienzo.getContext('2d')
    for (let y = -radio; y < radio; y++) {
      for (let x = -radio; x < radio; x++) {
        const dx = x + 0.5
        const dy = y + 0.5
        const distancia = Math.hypot(dx, dy)
        if (distancia > radio) continue
        otro.fillStyle = distancia > radio - 1.2 ? P.negro : colorEn(x, y, (dx + dy) / radio > 0.6)
        otro.fillRect(x + radio, y + radio, 1, 1)
      }
    }
    discosPintados.set(clave, lienzo)
  }
  ctx.drawImage(lienzo, Math.round(cx - radio), Math.round(cy - radio))
}
const esTierraFirme = (x, y) => Math.sin(x * 0.42 + 1) + Math.cos(y * 0.5 + x * 0.15) + Math.sin((x - y) * 0.23) > 0.7

function tierraArdiendo(ctx, cx, cy, radio, t, conCara = true) {
  const fase = modulo(Math.floor(t * 6), 3)
  disco(ctx, cx, cy, radio, `tierra-${radio}-${fase}`, (x, y, sombra) => {
    if (esTierraFirme(x, y)) return modulo(x + y + fase, 3) === 0 ? P.amarillo : sombra ? P.rojo : P.naranja
    return sombra ? P.morado : P.azulOscuro
  })
  for (let grados = -170; grados <= -10; grados += 12) {
    const angulo = (grados * Math.PI) / 180
    const alto = Math.max(2, Math.round(radio / 7)) + modulo(Math.floor(t * 10) + grados / 12, 3)
    for (let k = 0; k <= alto; k++) {
      const color = k < 1 ? P.rojo : k < alto - 1 ? P.naranja : P.amarillo
      pixel(ctx, cx + Math.cos(angulo) * (radio + k), cy + Math.sin(angulo) * (radio + k), 1, 1, color)
    }
  }
  if (!conCara) return
  const mira = Math.sin(t * 2) > 0 ? 1 : 0
  for (const ojo of [-8, 4]) {
    const x = cx + Math.round((ojo * radio) / 24)
    pixel(ctx, x, cy - 5, 4, 4, P.blanco)
    pixel(ctx, x + 1 + mira, cy - 4, 2, 2, P.negro)
  }
  for (let i = -5; i <= 5; i++) pixel(ctx, cx + i, cy + 6 + (modulo(i, 2) ? 1 : 0), 1, 1, P.negro)
  pixel(ctx, cx + radio - 6, cy - 3 + modulo(Math.floor(t * 4), 4), 1, 2, P.azul)
}

function planetaNuevo(ctx, cx, cy, radio) {
  disco(ctx, cx, cy, radio, `hogar-${radio}`, (x, y, sombra) => {
    if (Math.sin(x * 0.3 + y * 0.9) > 0.93) return P.blanco
    if (esTierraFirme(x, y)) return sombra ? P.verdeOscuro : P.verde
    return sombra ? P.azulOscuro : P.azul
  })
}

function llama(ctx, cx, y, t, escala = 1) {
  const largo = 6 + (Math.sin(t * 22 + cx) > 0 ? 1 : 0)
  for (let j = 0; j < largo; j++) {
    const ancho = Math.max(1, 3 - Math.floor(j / 2)) * escala
    const color = j < 2 ? P.amarillo : j < 4 ? P.naranja : P.rojo
    pixel(ctx, cx - Math.floor(ancho / 2), y + j * escala, ancho, escala, color)
  }
}

function cohete(ctx, x, y, acento, t, { escala = 1, encendido = true, mapa = COHETE } = {}) {
  sprite(ctx, mapa, x, y, paletaCohete(acento), escala)
  if (encendido) llama(ctx, x + 3 * escala + Math.floor(escala / 2), y + mapa.length * escala, t, escala)
}

function suelo(ctx, y = 76) {
  pixel(ctx, 0, y, ANCHO, ALTO - y, P.grisOscuro)
  pixel(ctx, 0, y, ANCHO, 1, P.gris)
  for (let x = 3; x < ANCHO; x += 9) pixel(ctx, x, y + 4, 3, 1, P.negro)
}

function torre(ctx, x, arriba, abajo) {
  for (let y = arriba; y < abajo; y++) {
    pixel(ctx, x, y, 1, 1, P.gris)
    pixel(ctx, x + 4, y, 1, 1, P.gris)
    if (modulo(y - arriba, 4) === 0) pixel(ctx, x, y, 5, 1, P.gris)
  }
}

function haz(ctx, x1, y1, x2, y2, t) {
  const pasos = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
  const desfase = Math.floor(t * 14)
  for (let i = 0; i <= pasos; i++) {
    if (modulo(i - desfase, 5) < 2) continue
    pixel(ctx, x1 + ((x2 - x1) * i) / pasos, y1 + ((y2 - y1) * i) / pasos, 1, 1, P.brillo)
  }
}

function texto(ctx, cadena, x, y, color, alineado = 'left') {
  ctx.font = FUENTE
  ctx.textBaseline = 'top'
  ctx.textAlign = alineado
  ctx.fillStyle = color
  ctx.fillText(cadena, x, y)
}

function cartel(ctx, cadena, y, color = P.blanco) {
  const ancho = cadena.length * 8 + 8
  const x = Math.round((ANCHO - ancho) / 2)
  pixel(ctx, x - 1, y - 1, ancho + 2, 14, color)
  pixel(ctx, x, y, ancho, 12, P.negro)
  texto(ctx, cadena, ANCHO / 2, y + 2, color, 'center')
}

function calendario(ctx, llenos, color, y = 26) {
  for (let i = 0; i < 12; i++) {
    const x = 20 + i * 10
    pixel(ctx, x, y, 9, 8, P.grisOscuro)
    pixel(ctx, x + 1, y + 1, 7, 6, i < llenos ? color : P.negro)
  }
}

function hallazgo(ctx, t, mes) {
  estrellas(ctx, 11, t)
  planetaNuevo(ctx, 130, 24, 14)
  sprite(ctx, TELESCOPIO, 10, 46, PALETA_TELESCOPIO)
  haz(ctx, 17, 47, 118, 31, t)
  texto(ctx, `MONTH ${mes}`, 4, 4, P.amarillo)
  cartel(ctx, 'SIGNAL FOUND', 72, P.verde)
}

function arca(ctx, t, tripulantes, color) {
  estrellas(ctx, 23, t)
  suelo(ctx)
  torre(ctx, 50, 24, 76)
  cohete(ctx, 24, 31, P.rojo, t, { escala: 3, encendido: false })
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * 16
    if (i < tripulantes) {
      const salto = modulo(Math.floor(t * 4) + i, 2)
      sprite(ctx, ASTRONAUTA, x, 68 - salto, paletaAstronauta(TRIPULACION[i]))
    } else {
      sprite(ctx, ASTRONAUTA, x, 68, ASIENTO_VACIO)
    }
  }
  texto(ctx, `CREW ${tripulantes}/4`, 100, 8, color, 'center')
}

// datos.mes: mes de juego en que llegó, para las viñetas del hallazgo.
const ESCENAS = {
  nuevoHogar1: (ctx, t, datos) => hallazgo(ctx, t, datos.mes),
  nuevoHogar2: (ctx, t) => arca(ctx, t, 4, P.verde),
  nuevoHogar3(ctx, t) {
    estrellas(ctx, 31, t)
    disco(ctx, 126, 62, 9, 'sol', () => P.amarillo)
    planetaNuevo(ctx, 80, 160, 88)
    ;[36, 72, 108].forEach((x, i) => {
      const vaiven = modulo(Math.floor(t * 3) + i, 2)
      cohete(ctx, x, 26 + i * 6 + vaiven, TRIPULACION[i + 1], t)
    })
    cartel(ctx, 'WELCOME HOME', 4, P.verde)
  },

  pionero1: (ctx, t, datos) => hallazgo(ctx, t, datos.mes),
  pionero2: (ctx, t) => arca(ctx, t, 1, P.rojo),
  pionero3(ctx, t) {
    estrellas(ctx, 41, t)
    planetaNuevo(ctx, 134, 20, 6)
    for (let x = 12; x < 44; x += 4) pixel(ctx, x, 70 - (x - 12) * 0.5, 1, 1, P.grisOscuro)
    cohete(ctx, 46, 38, P.rojo, t)
    cartel(ctx, 'SOLO FLIGHT', 74, P.azul)
  },

  relevo1(ctx, t) {
    estrellas(ctx, 51, t, P.marino)
    texto(ctx, 'MONTH 12/12', ANCHO / 2, 10, parpadea(t) ? P.rojo : P.blanco, 'center')
    calendario(ctx, 12, P.rojo)
    ;[44, 70, 96].forEach((x, i) => sprite(ctx, ASTRONAUTA, x + 6, 50, paletaAstronauta(TRIPULACION[i + 1])))
    texto(ctx, '+3 ONLINE', ANCHO / 2, 66, P.verde, 'center')
  },
  relevo2(ctx, t) {
    estrellas(ctx, 53, t)
    tierraArdiendo(ctx, 140, 14, 9, t, false)
    suelo(ctx, 78)
    ;[[24, 0], [73, 6], [122, 12]].forEach(([x, retraso], i) => {
      cohete(ctx, x, 30 - modulo(t * 6 + retraso, 10), TRIPULACION[i + 1], t, { escala: 2 })
    })
    cartel(ctx, 'CREW TAKES OVER', 4, P.rosa)
  },
  relevo3(ctx, t) {
    estrellas(ctx, 57, t)
    planetaNuevo(ctx, 130, 24, 14)
    sprite(ctx, TELESCOPIO, 10, 40, PALETA_TELESCOPIO)
    haz(ctx, 17, 41, 118, 31, t)
    TRIPULACION.slice(1).forEach((traje, i) => sprite(ctx, ASTRONAUTA, 40 + i * 9, 54, paletaAstronauta(traje)))
    cartel(ctx, 'YOUR CREW FOUND IT', 72, P.rosa)
  },

  senal1(ctx, t) {
    estrellas(ctx, 61, t, P.negro)
    calendario(ctx, 12, P.rojo)
    if (parpadea(t)) texto(ctx, "TIME'S UP", ANCHO / 2, 50, P.rojo, 'center')
  },
  senal2(ctx, t) {
    estrellas(ctx, 63, t)
    tierraArdiendo(ctx, 132, 22, 16, t)
    suelo(ctx)
    torre(ctx, 48, 30, 76)
    cohete(ctx, 60, 76 - 7 * 3, P.grisOscuro, t, { escala: 3, encendido: false, mapa: COHETE.slice(8) })
    sprite(ctx, ASTRONAUTA, 100, 68, paletaAstronauta(P.rojo))
    texto(ctx, 'NO CREW', 6, 6, P.rojo)
  },
  senal3(ctx, t) {
    const azar = aleatorio(Math.floor(t * 10) + 1)
    pixel(ctx, 0, 0, ANCHO, ALTO, P.negro)
    for (let y = 0; y < ALTO; y += 2) {
      for (let x = 0; x < ANCHO; x += 2) {
        const valor = azar()
        if (valor < 0.35) pixel(ctx, x, y, 2, 2, valor < 0.1 ? P.gris : P.grisOscuro)
      }
    }
    cartel(ctx, 'SIGNAL LOST', 28, P.rojo)
    if (parpadea(t, 1.5)) cartel(ctx, '> KEEP EXPLORING', 56, P.blanco)
  },
}

export function dibujarEscena(escena, ctx, t, datos) {
  ESCENAS[escena](ctx, t, datos)
}
