import * as THREE from 'three'

// El cohete 3D se construye con piezas geométricas a partir del diseño del jugador: no hay modelos que descargar.
// Medidas en metros, a ojo de las piezas reales en las que se inspira cada una del catálogo.
const MOTORES = {
  'motor-sonda': { garganta: 0.08, salida: 0.22, largo: 0.5 },
  'motor-chispa': { garganta: 0.12, salida: 0.42, largo: 0.8 },
  'motor-rayo': { garganta: 0.22, salida: 0.7, largo: 1.3 },
  'motor-vacio': { garganta: 0.16, salida: 0.95, largo: 2.2 },
  'motor-trueno': { garganta: 0.32, salida: 1.05, largo: 1.9 },
}
const TANQUES = {
  'tanque-sonda': { alto: 2.2, radio: 0.35 },
  'tanque-pequeno': { alto: 4.2, radio: 1.1 },
  'tanque-mediano': { alto: 8, radio: 1.4 },
  'tanque-grande': { alto: 15, radio: 1.8 },
}
const COFIAS = {
  'cofia-cono': { alto: 1.2, radio: 0.35 },
  'cofia-pequena': { alto: 4.4, radio: 1.1 },
  'cofia-mediana': { alto: 7, radio: 1.8 },
}
const LARGO_FALDON = 1.2

// Por si el catálogo gana piezas nuevas: medidas aproximadas a partir de sus datos.
const medidasMotor = (pieza) => MOTORES[pieza.id] ?? { garganta: 0.15, salida: 0.2 + Math.log10(pieza.empujeKN + 1) * 0.3, largo: 1.2 }
const medidasTanque = (pieza) => TANQUES[pieza.id] ?? { alto: 2 + Math.log10(pieza.combustibleKg + 1) * 3, radio: 0.4 + Math.log10(pieza.combustibleKg + 1) * 0.3 }
const medidasCofia = (pieza) => COFIAS[pieza.id] ?? { alto: 3, radio: 1 }

function texturaCanvas(ancho, alto, pintar) {
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  pintar(lienzo.getContext('2d'), ancho, alto)
  const textura = new THREE.CanvasTexture(lienzo)
  textura.colorSpace = THREE.SRGBColorSpace
  return textura
}

export const texturaLlama = () =>
  texturaCanvas(32, 128, (g, ancho, alto) => {
    const degradado = g.createLinearGradient(0, 0, 0, alto)
    degradado.addColorStop(0, 'rgba(255,255,240,1)')
    degradado.addColorStop(0.15, 'rgba(255,220,120,1)')
    degradado.addColorStop(0.5, 'rgba(255,120,30,0.75)')
    degradado.addColorStop(1, 'rgba(255,60,0,0)')
    g.fillStyle = degradado
    g.fillRect(0, 0, ancho, alto)
  })

export const texturaHumo = () =>
  texturaCanvas(128, 128, (g, lado) => {
    for (let i = 0; i < 14; i++) {
      const x = lado / 2 + (Math.random() - 0.5) * lado * 0.35
      const y = lado / 2 + (Math.random() - 0.5) * lado * 0.35
      const radio = lado * (0.18 + Math.random() * 0.2)
      const degradado = g.createRadialGradient(x, y, 0, x, y, radio)
      degradado.addColorStop(0, 'rgba(255,255,255,0.55)')
      degradado.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = degradado
      g.fillRect(0, 0, lado, lado)
    }
  })

// El tanque de la primera etapa lleva los colores y el nombre de la empresa.
const texturaEmpresa = (empresa) =>
  texturaCanvas(512, 1024, (g, ancho, alto) => {
    g.fillStyle = '#e2e8f0'
    g.fillRect(0, 0, ancho, alto)
    g.fillStyle = empresa.colorPrimario
    g.fillRect(0, alto * 0.08, ancho, alto * 0.03)
    g.fillRect(0, alto * 0.88, ancho, alto * 0.05)
    g.save()
    g.translate(ancho * 0.27, alto * 0.5)
    g.rotate(-Math.PI / 2)
    g.fillStyle = '#0f172a'
    g.font = 'bold 54px Orbitron, sans-serif'
    g.textAlign = 'center'
    g.fillText(empresa.nombre.toUpperCase().slice(0, 18), 0, 18)
    g.restore()
  })

function tobera(motor) {
  const perfil = []
  for (let i = 0; i <= 16; i++) {
    const f = i / 16
    perfil.push(new THREE.Vector2(motor.garganta + (motor.salida - motor.garganta) * Math.pow(f, 0.65), -f * motor.largo))
  }
  return new THREE.Mesh(
    new THREE.LatheGeometry(perfil, 40),
    new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 1, roughness: 0.25, side: THREE.DoubleSide }),
  )
}

function llama(motor, textura) {
  const grupo = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({
    map: textura,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  })
  const exterior = new THREE.Mesh(
    new THREE.CylinderGeometry(motor.salida * 0.95, motor.salida * 0.35, motor.salida * 9, 24, 1, true),
    Object.assign(material.clone(), { color: new THREE.Color(0xff9a40), opacity: 0.85 }),
  )
  exterior.position.y = -motor.salida * 4.5
  const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(motor.salida * 0.55, motor.salida * 0.12, motor.salida * 4, 16, 1, true), material)
  nucleo.position.y = -motor.salida * 2
  grupo.add(exterior, nucleo)
  grupo.visible = false
  return grupo
}

function satelite(resuelto, radio) {
  const grupo = new THREE.Group()
  const lado = Math.min(radio * 0.9, 0.25 + (resuelto.estructura?.huecos ?? 4) * 0.06)
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(lado, lado * 1.3, lado), new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 1, roughness: 0.3 }))
  cuerpo.position.y = lado
  grupo.add(cuerpo)
  if (resuelto.componentes.some((pieza) => pieza?.tipo === 'panel')) {
    const ancho = lado * 3.2
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, 0.04, lado * 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.25 }),
    )
    panel.position.y = lado
    // Plegados, los paneles caben en la cofia con margen; al desplegarse vuelven a su ancho real.
    panel.scale.x = Math.min(1, (radio * 1.4) / ancho)
    grupo.add(panel)
    grupo.userData.panel = panel
  }
  return grupo
}

// Devuelve el grupo del cohete con sus etapas (de abajo arriba), la cofia en dos mitades y la carga.
export function construirCohete({ resuelto, empresa, texturas }) {
  const cohete = new THREE.Group()
  const carbono = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.3, roughness: 0.6, side: THREE.DoubleSide })
  const completas = resuelto.etapas.filter((etapa) => etapa.motor && etapa.tanque)
  const datosCofia = resuelto.cofia ? medidasCofia(resuelto.cofia) : { alto: 1, radio: 0.4 }
  const etapas = []
  let y = 0

  completas.forEach((etapa, indice) => {
    const motor = medidasMotor(etapa.motor)
    const tanque = medidasTanque(etapa.tanque)
    const grupo = new THREE.Group()
    grupo.position.y = y
    const boquilla = tobera(motor)
    boquilla.position.y = motor.largo
    const fuego = llama(motor, texturas.llama)
    const faldon = new THREE.Mesh(new THREE.CylinderGeometry(tanque.radio, tanque.radio * 1.02, LARGO_FALDON, 48), carbono)
    faldon.position.y = motor.largo + LARGO_FALDON / 2
    const cuerpo = new THREE.Mesh(
      new THREE.CylinderGeometry(tanque.radio, tanque.radio, tanque.alto, 64),
      indice === 0
        ? new THREE.MeshStandardMaterial({ map: texturaEmpresa(empresa), metalness: 0.35, roughness: 0.35 })
        : new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.35, roughness: 0.35 }),
    )
    cuerpo.position.y = motor.largo + LARGO_FALDON + tanque.alto / 2
    const banda = new THREE.Mesh(
      new THREE.CylinderGeometry(tanque.radio * 1.005, tanque.radio * 1.005, Math.min(0.5, tanque.alto * 0.08), 64),
      new THREE.MeshStandardMaterial({ color: empresa.colorSecundario, metalness: 0.2, roughness: 0.4 }),
    )
    banda.position.y = motor.largo + LARGO_FALDON + tanque.alto * 0.92
    grupo.add(boquilla, fuego, faldon, cuerpo, banda)

    let alto = motor.largo + LARGO_FALDON + tanque.alto
    // Interetapa: tapa la tobera de la etapa de arriba y cae con esta al separarse.
    const siguiente = completas[indice + 1]
    const radioArriba = siguiente
      ? Math.max(medidasTanque(siguiente.tanque).radio, medidasMotor(siguiente.motor).salida * 1.08)
      : datosCofia.radio
    const altoInteretapa = siguiente ? medidasMotor(siguiente.motor).largo + LARGO_FALDON : Math.max(0.3, datosCofia.radio * 0.6)
    const interetapa = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.max(radioArriba, tanque.radio * 0.8), tanque.radio, altoInteretapa, 48, 1, true),
      carbono,
    )
    interetapa.position.y = alto + altoInteretapa / 2
    grupo.add(interetapa)
    if (!siguiente) alto += altoInteretapa

    grupo.traverse((objeto) => {
      if (objeto.isMesh) objeto.castShadow = objeto.parent !== fuego
    })
    cohete.add(grupo)
    etapas.push({ grupo, fuego, motor, alto })
    y += alto
  })

  const carga = resuelto.estructura ? satelite(resuelto, datosCofia.radio) : new THREE.Group()
  carga.position.y = y
  cohete.add(carga)

  const perfil = []
  for (let i = 0; i <= 20; i++) {
    const f = i / 20
    perfil.push(new THREE.Vector2(datosCofia.radio * Math.sqrt(Math.max(0, 1 - f * f * 0.92)) * (1 - f * 0.05), f * datosCofia.alto))
  }
  const materialCofia = new THREE.MeshStandardMaterial({ color: empresa.colorSecundario, metalness: 0.3, roughness: 0.35, side: THREE.DoubleSide })
  const mitades = resuelto.cofia
    ? [0, Math.PI].map((inicio) => {
        const mitad = new THREE.Mesh(new THREE.LatheGeometry(perfil, 32, inicio, Math.PI), materialCofia)
        mitad.position.y = y
        mitad.castShadow = true
        cohete.add(mitad)
        return mitad
      })
    : []

  return { cohete, etapas, mitades, carga, altoTotal: y + datosCofia.alto }
}
