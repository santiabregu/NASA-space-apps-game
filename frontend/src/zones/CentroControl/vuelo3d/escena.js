import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { construirCohete, texturaHumo, texturaLlama } from './cohete.js'

// Escena 3D del lanzamiento en solitario. No simula nada: reproduce los eventos que ya calculó simulacion.js
// (despegue, separaciones, órbita, fallos) para que lo que se ve cuadre con el informe.

const GRAVEDAD_VISUAL = 30
const HUMOS = 360
const ALTURA_ESPACIO = { orbital: 3500, suborbital: 1200 }
const POSICION_MAR = new THREE.Vector3(160, 0, -40)
const FALLOS_EN_VUELO = ['The fairing fails during ascent']
const FALLOS_DE_CAIDA = ['The rocket runs out of propellant before reaching orbit', 'The rocket falls back too soon']

function cielo() {
  const uniforms = { arriba: { value: new THREE.Color(0x2f7fd8) }, abajo: { value: new THREE.Color(0xbfdcf5) } }
  const malla = new THREE.Mesh(
    new THREE.SphereGeometry(3000, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms,
      vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'uniform vec3 arriba; uniform vec3 abajo; varying vec3 p; void main(){ float h = clamp(p.y * 1.6 + 0.15, 0.0, 1.0); gl_FragColor = vec4(mix(abajo, arriba, h), 1.0); }',
    }),
  )
  return { malla, uniforms }
}

function estrellas() {
  const posiciones = new Float32Array(1500 * 3)
  for (let i = 0; i < 1500; i++) {
    const punto = new THREE.Vector3().randomDirection().multiplyScalar(2500)
    punto.y = Math.abs(punto.y) + 200
    posiciones.set([punto.x, punto.y, punto.z], i * 3)
  }
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3))
  return new THREE.Points(geometria, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }))
}

// Plataforma y torre a escala del cohete: un cohete sonda de 4 m no puede tener una torre de 40.
function plataforma(altoCohete) {
  const grupo = new THREE.Group()
  const lado = THREE.MathUtils.clamp(altoCohete * 0.7, 8, 26)
  const hormigon = new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.9 })
  const losa = new THREE.Mesh(new THREE.BoxGeometry(lado, 2, lado), hormigon)
  losa.position.y = 1
  losa.receiveShadow = losa.castShadow = true
  const foso = new THREE.Mesh(new THREE.BoxGeometry(lado * 0.25, 2.2, lado * 1.15), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 1 }))
  foso.position.y = 1.05
  grupo.add(losa, foso)

  const acero = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.6, roughness: 0.45 })
  const altoTorre = Math.max(6, altoCohete * 0.9)
  const ancho = THREE.MathUtils.clamp(altoCohete * 0.06, 0.6, 1.2)
  const torre = new THREE.Group()
  for (let y = 0; y < altoTorre; y += ancho * 1.6) {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const poste = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.2, ancho * 1.6, ancho * 0.2), acero)
      poste.position.set(x * ancho, y + ancho * 0.8, z * ancho)
      torre.add(poste)
    }
    const travesano = new THREE.Mesh(new THREE.BoxGeometry(ancho * 2.2, ancho * 0.14, ancho * 0.14), acero)
    travesano.position.set(0, y + ancho * 1.6, -ancho)
    travesano.rotation.z = Math.round(y / ancho) % 2 ? 0.6 : -0.6
    torre.add(travesano)
  }
  torre.position.set(lado * 0.4, 2, 0)
  torre.traverse((objeto) => {
    objeto.castShadow = true
  })
  grupo.add(torre)
  return grupo
}

export function crearVuelo(lienzo, { resuelto, empresa, suborbital, reducido }) {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const escena = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  escena.fog = new THREE.Fog(0x9cc7ee, 150, 1000)
  const camara = new THREE.PerspectiveCamera(42, 1, 0.1, 6000)

  const fondo = cielo()
  const firmamento = estrellas()
  escena.add(fondo.malla, firmamento)

  const sol = new THREE.DirectionalLight(0xfff1dc, 3.2)
  sol.position.set(-60, 90, 50)
  sol.castShadow = true
  sol.shadow.mapSize.set(2048, 2048)
  Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 60, bottom: -10, near: 1, far: 300 })
  escena.add(sol, new THREE.HemisphereLight(0xbfdcf5, 0x5b6b4a, 0.6))

  const suelo = new THREE.Mesh(new THREE.CircleGeometry(suborbital ? 110 : 1500, 64), new THREE.MeshStandardMaterial({ color: 0x6f7d5c, roughness: 1 }))
  suelo.rotation.x = -Math.PI / 2
  suelo.receiveShadow = true
  escena.add(suelo)
  if (suborbital) {
    // Los vuelos suborbitales caen al mar: la costa queda a un lado de la plataforma.
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: 0x1d4e89, metalness: 0.4, roughness: 0.25 }))
    mar.rotation.x = -Math.PI / 2
    mar.position.y = -0.2
    escena.add(mar)
  }

  const texturas = { llama: texturaLlama(), humo: texturaHumo() }
  const modelo = construirCohete({ resuelto, empresa, texturas })
  modelo.cohete.position.y = 2
  escena.add(modelo.cohete, plataforma(modelo.altoTotal))
  const luzMotor = new THREE.PointLight(0xff9a3c, 0, 120, 1.6)
  escena.add(luzMotor)

  // Humo y explosiones: sprites que crecen y se disuelven; cerca del suelo se extienden hacia los lados.
  const humos = Array.from({ length: HUMOS }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturas.humo, color: 0xe5e7eb, transparent: true, depthWrite: false, opacity: 0 }))
    sprite.visible = false
    escena.add(sprite)
    return { sprite, vida: 0, maximo: 1, inicial: 2, velocidad: new THREE.Vector3() }
  })
  let siguienteHumo = 0
  function soltarHumo(posicion, { enSuelo = false, color = 0xe5e7eb, rapidez = 1, tamano = 1, vida = null } = {}) {
    const humo = humos[siguienteHumo]
    siguienteHumo = (siguienteHumo + 1) % humos.length
    humo.sprite.visible = true
    humo.sprite.position.copy(posicion)
    humo.sprite.material.color.set(color)
    humo.sprite.material.rotation = Math.random() * Math.PI * 2
    humo.vida = 0
    humo.maximo = vida ?? (enSuelo ? 5 + Math.random() * 3 : 2.5 + Math.random() * 1.5)
    humo.inicial = (enSuelo ? 4 : 2) * tamano
    const angulo = Math.random() * Math.PI * 2
    const horizontal = (enSuelo ? 6 + Math.random() * 8 : 1 + Math.random() * 2) * rapidez
    humo.velocidad.set(Math.cos(angulo) * horizontal, enSuelo ? Math.random() * 1.5 : (-6 - Math.random() * 4) * rapidez, Math.sin(angulo) * horizontal)
  }

  const vuelo = {
    t: 0,
    encendido: false,
    despegado: false,
    velocidad: 0,
    altura: 0,
    etapa: 0,
    inclinacion: 0,
    sueltos: [],
    cayendo: false,
    amerizando: false,
    flotando: false,
    desplegando: false,
    // Solo en los fallos de caída el cohete vuelve al suelo y se estrella.
    choque: false,
    destello: 0,
    deriva: null,
    // Lo que sigue la cámara: el cohete y, tras el despliegue, el satélite.
    foco: null,
  }

  function soltar(objeto, velocidad, giro) {
    escena.attach(objeto)
    vuelo.sueltos.push({ objeto, velocidad, giro })
  }

  function separarEtapa() {
    const etapa = modelo.etapas[vuelo.etapa]
    if (!etapa || vuelo.etapa >= modelo.etapas.length - 1) return
    // Gira despacio: un giro rápido barrería la tobera de la etapa de arriba, que aún está dentro de la interetapa.
    soltar(etapa.grupo, new THREE.Vector3(1.5, vuelo.velocidad * 0.6, 0), (Math.random() - 0.5) * 0.3)
    // Lo que queda baja dentro del grupo para que su base siga en el origen: en el mundo no se mueve.
    modelo.cohete.children.forEach((hijo) => {
      hijo.position.y -= etapa.alto
    })
    vuelo.altura += etapa.alto
    vuelo.etapa++
  }

  function explotar() {
    const centro = new THREE.Vector3()
    modelo.cohete.getWorldPosition(centro)
    centro.y += modelo.altoTotal * 0.5
    for (let i = 0; i < 120; i++) {
      soltarHumo(centro.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(modelo.altoTotal * 0.15)), {
        color: i % 3 ? 0x6b7280 : 0xff7a1a,
        rapidez: 2,
        tamano: Math.max(2, modelo.altoTotal * 0.12),
        vida: 4 + Math.random() * 2,
      })
    }
    vuelo.destello = 1
    // El cohete se queda donde estalló para que la cámara no deje atrás la explosión.
    vuelo.encendido = false
    vuelo.despegado = false
    vuelo.velocidad = 0
    modelo.cohete.visible = false
  }

  // Cada evento de la bitácora cambia el estado del vuelo.
  function avanzar({ texto, icono, ok }) {
    if (!ok) {
      if (texto === 'The rocket does not leave the launch pad') {
        vuelo.encendido = true
        setTimeout(() => {
          vuelo.encendido = false
        }, 1600)
      } else if (FALLOS_EN_VUELO.includes(texto)) {
        explotar()
      } else if (FALLOS_DE_CAIDA.includes(texto)) {
        vuelo.encendido = false
        vuelo.cayendo = true
        vuelo.choque = true
      } else {
        // El satélite llegó pero falla: se queda girando a la deriva.
        vuelo.deriva = vuelo.deriva ?? 0.6
      }
      return
    }
    if (icono === 'despegue') {
      vuelo.encendido = true
      setTimeout(() => {
        vuelo.despegado = true
      }, 500)
    } else if (icono === 'separacion' && texto.startsWith('Stage')) {
      separarEtapa()
    } else if (icono === 'separacion') {
      modelo.mitades.forEach((mitad, indice) => soltar(mitad, new THREE.Vector3(indice ? -8 : 8, vuelo.velocidad, 0), indice ? 0.9 : -0.9))
    } else if (icono === 'orbita') {
      vuelo.encendido = false
      soltar(modelo.carga, new THREE.Vector3(0, vuelo.velocidad * 1.02, 0), 0.15)
      vuelo.foco = modelo.carga
      vuelo.desplegando = true
    } else if (icono === 'apogeo') {
      vuelo.encendido = false
      vuelo.cayendo = true
    } else if (icono === 'amerizaje') {
      // Salto de tiempo: el cohete aparece ya cayendo sobre el mar, cerca de la costa.
      vuelo.cayendo = true
      vuelo.amerizando = true
      modelo.cohete.position.set(POSICION_MAR.x, 70, POSICION_MAR.z)
      modelo.cohete.rotation.z = Math.PI * 0.9
      vuelo.altura = 68
      vuelo.velocidad = -35
    }
  }

  function actualizar(dt) {
    vuelo.t += dt
    const fuego = modelo.etapas[vuelo.etapa]?.fuego
    modelo.etapas.forEach((etapa) => {
      etapa.fuego.visible = vuelo.encendido && etapa.fuego === fuego
    })
    // Los eventos llegan cada segundo y poco: el cohete acelera fuerte para que se le vea subir, más cuanto más grande es.
    if (vuelo.encendido && vuelo.despegado) vuelo.velocidad += (18 + vuelo.t * 10) * Math.max(1, modelo.altoTotal / 15) * dt
    if (vuelo.cayendo) vuelo.velocidad -= GRAVEDAD_VISUAL * dt
    vuelo.altura = Math.max(0, vuelo.altura + vuelo.velocidad * dt)
    if (!vuelo.amerizando) {
      modelo.cohete.position.y = 2 + vuelo.altura
      vuelo.inclinacion = vuelo.cayendo ? vuelo.inclinacion + dt * 0.4 : Math.min(0.5, Math.max(0, (vuelo.altura - 200) / 3000))
      modelo.cohete.rotation.z = -vuelo.inclinacion
    } else if (!vuelo.flotando) {
      modelo.cohete.position.y = vuelo.altura
      if (vuelo.altura === 0) {
        // Salpicadura y el cohete se queda flotando tumbado, medio hundido.
        for (let i = 0; i < 40; i++) soltarHumo(modelo.cohete.position.clone().add(new THREE.Vector3(0, 1, 0)), { enSuelo: true, color: 0xffffff, tamano: 1.5 })
        vuelo.flotando = true
        vuelo.cayendo = false
        vuelo.velocidad = 0
        modelo.cohete.rotation.z = Math.PI / 2
        modelo.cohete.position.y = -modelo.altoTotal * 0.04
      }
    } else {
      modelo.cohete.position.y = -modelo.altoTotal * 0.04 + Math.sin(vuelo.t * 1.5) * (reducido ? 0 : 0.15)
    }
    if (vuelo.choque && vuelo.altura === 0 && modelo.cohete.visible) explotar()
    if (vuelo.deriva) modelo.carga.rotation.x += vuelo.deriva * dt
    const panel = modelo.carga.userData.panel
    if (vuelo.desplegando && panel && panel.scale.x < 1) panel.scale.x = reducido ? 1 : Math.min(1, panel.scale.x + dt * 0.8)

    for (const suelto of vuelo.sueltos) {
      suelto.velocidad.y -= GRAVEDAD_VISUAL * 0.3 * dt
      suelto.objeto.position.addScaledVector(suelto.velocidad, dt)
      suelto.objeto.rotation.z += suelto.giro * dt
    }

    if (vuelo.encendido && fuego) {
      const base = new THREE.Vector3()
      fuego.getWorldPosition(base)
      const cerca = vuelo.altura < 60
      for (let i = 0; i < (cerca ? 6 : 2); i++) {
        soltarHumo(base.clone().add(new THREE.Vector3(Math.random() - 0.5, -2 - Math.random() * 3, Math.random() - 0.5)), { enSuelo: cerca && base.y < 25 })
      }
      luzMotor.position.copy(base)
      luzMotor.intensity = reducido ? 120 : 100 + Math.random() * 60
      if (!reducido) fuego.scale.set(1, 0.85 + Math.random() * 0.3, 1)
    } else {
      luzMotor.intensity = vuelo.destello * 400
      vuelo.destello = Math.max(0, vuelo.destello - dt * 1.5)
    }

    for (const humo of humos) {
      if (!humo.sprite.visible) continue
      humo.vida += dt
      const f = humo.vida / humo.maximo
      if (f >= 1) {
        humo.sprite.visible = false
        continue
      }
      humo.sprite.position.addScaledVector(humo.velocidad, dt)
      humo.velocidad.multiplyScalar(1 - dt * 0.6)
      if (humo.sprite.position.y < 2) {
        humo.sprite.position.y = 2
        humo.velocidad.y = Math.abs(humo.velocidad.y) * 0.2
      }
      const tamano = humo.inicial + f * 14
      humo.sprite.scale.set(tamano, tamano, 1)
      humo.sprite.material.opacity = Math.sin(Math.PI * Math.min(1, f * 1.4)) * 0.55
    }

    const espacio = vuelo.amerizando ? 0 : Math.min(1, vuelo.altura / (suborbital ? ALTURA_ESPACIO.suborbital : ALTURA_ESPACIO.orbital))
    fondo.uniforms.arriba.value.setRGB(0.18 * (1 - espacio), 0.5 * (1 - espacio), 0.85 * (1 - espacio) + 0.02)
    fondo.uniforms.abajo.value.setRGB(0.75 * (1 - espacio) + 0.02, 0.86 * (1 - espacio) + 0.03, 0.96 * (1 - espacio) + 0.08)
    firmamento.material.opacity = Math.max(0, (espacio - 0.35) * 1.6)
    escena.fog.near = 150 + vuelo.altura * 0.5
    escena.fog.far = 1000 + vuelo.altura * 2
  }

  // La cámara sigue al cohete desde un lado y se aleja un poco al subir; tras el despliegue, se acerca al satélite.
  // La cámara viaja pegada al foco (el cohete va muy rápido y con retraso se quedaría atrás); solo el zoom se suaviza.
  const mirada = new THREE.Vector3()
  const centro = new THREE.Vector3()
  const separacion = new THREE.Vector3()
  function encuadrar(dt, instantaneo) {
    const foco = vuelo.foco ?? modelo.cohete
    foco.getWorldPosition(centro)
    const tamano = vuelo.foco ? 3 : modelo.altoTotal
    const distancia = vuelo.foco ? 9 : Math.max(14, tamano * 1.4) + Math.min(25, vuelo.altura * 0.01)
    const deseada = new THREE.Vector3(distancia * 0.75, tamano * 0.3, distancia)
    if (instantaneo || vuelo.amerizando) separacion.copy(deseada)
    else separacion.lerp(deseada, Math.min(1, dt * 2.5))
    camara.position.copy(centro).add(separacion)
    mirada.set(centro.x, centro.y + tamano * 0.45, centro.z)
    camara.lookAt(mirada)
    if (!reducido && vuelo.encendido && vuelo.t < 6 && vuelo.altura < 80) {
      camara.position.x += (Math.random() - 0.5) * 0.2
      camara.position.y += (Math.random() - 0.5) * 0.2
    }
  }

  function ajustar() {
    const { clientWidth: ancho, clientHeight: alto } = lienzo.parentElement
    renderer.setSize(ancho, alto, false)
    camara.aspect = ancho / Math.max(1, alto)
    camara.updateProjectionMatrix()
  }
  const observador = new ResizeObserver(ajustar)
  observador.observe(lienzo.parentElement)
  ajustar()
  encuadrar(0, true)

  let ultimo = performance.now()
  let marco = requestAnimationFrame(function bucle(ahora) {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000)
    ultimo = ahora
    actualizar(dt)
    encuadrar(dt, false)
    renderer.render(escena, camara)
    marco = requestAnimationFrame(bucle)
  })

  return {
    avanzar,
    destruir() {
      cancelAnimationFrame(marco)
      observador.disconnect()
      escena.traverse((objeto) => {
        objeto.geometry?.dispose()
        const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material]
        materiales.forEach((material) => {
          material?.map?.dispose()
          material?.dispose()
        })
      })
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
