import { formatoDinero, formatoNumero } from '../formato.js'
import { analizarDiseno } from './analisis.js'
import { EMPUJE_PESO_MINIMO } from './cohete.js'
import { disenoDelEquipo, misionDeEquipo, presupuestoDelEquipo } from './equipo.js'
import { causaDelFallo, simular } from './simulacion.js'

// El vuelo de una misión de equipo: el motor de siempre más lo que solo existe en equipo (presupuesto común,
// piezas obligatorias de la estrella y la fiabilidad de Software). Es determinista: todos los navegadores
// sacarían lo mismo, pero lo calcula el anfitrión y el servidor lo guarda para que nadie vea otra cosa.

const SIN_INVENTARIO = {}
const MARGEN_JUSTO = 0.03
const SOBRANTE_JUSTO = 0.1
// Los fallos del motor que son culpa del cohete; los demás vienen del satélite.
const FALLOS_DEL_COHETE = ['The rocket does not leave the launch pad', 'The fairing fails during ascent', 'The rocket runs out of propellant before reaching orbit']

function fallo(eventos, texto, departamento, explicacion) {
  return { exito: false, eventos: [...eventos, { texto, ok: false }], culpable: { departamento, explicacion } }
}

function volar({ analisis, mision, estrella, presupuesto, fiabilidad, reglas }) {
  if (analisis.costeCompra > presupuesto) {
    return fallo([], 'The Government refuses to pay for the parts', 'FINANCIACION',
      `The parts cost ${formatoDinero(analisis.costeCompra)} and the team only raised ${formatoDinero(presupuesto)}.`)
  }
  if (!analisis.resuelto.estructura) {
    return fallo([], 'There is no satellite to launch', 'SATELITE', 'Nobody chose a structure, so the telescope was never built.')
  }
  if (analisis.faltas.length > 0) {
    return fallo([], 'The rocket is not finished', 'COHETE', `${analisis.faltas.join('. ')}.`)
  }

  const simulacion = simular(analisis, mision)
  const eventos = simulacion.eventos.filter((evento) => evento.icono !== 'objetivo')
  if (!simulacion.exito) {
    const ultimo = simulacion.eventos.at(-1).texto
    return {
      exito: false,
      eventos: simulacion.eventos,
      culpable: { departamento: FALLOS_DEL_COHETE.includes(ultimo) ? 'COHETE' : 'SATELITE', explicacion: causaDelFallo(simulacion) },
    }
  }

  const faltan = mision.obligatorias.filter((pieza) => !analisis.piezas.some((instalada) => instalada.id === pieza.id))
  if (faltan.length > 0) {
    return fallo(eventos, 'The probe is missing its key part', 'SATELITE',
      `It needed ${faltan.map((pieza) => pieza.nombre).join(' and ')}. ${estrella.reto}`)
  }
  if (fiabilidad < reglas.fiabilidadDespliegue) {
    return fallo(eventos, 'The software crashes while deploying', 'SOFTWARE',
      `Reliability was ${fiabilidad}%: below ${reglas.fiabilidadDespliegue}% the probe cannot unfold its antenna and panels.`)
  }
  const ciencia = Math.round((analisis.satelite.valorCientifico * fiabilidad) / 100)
  if (ciencia < mision.requisitos.valorCientificoMin) {
    return fallo(eventos, 'Software glitches spoil the science', 'SOFTWARE',
      `Glitches cut the science value from ${analisis.satelite.valorCientifico} to ${ciencia}, and the mission needed ${mision.requisitos.valorCientificoMin}.`)
  }
  return {
    exito: true,
    eventos: [...eventos, { texto: `Probe deployed · reliability ${fiabilidad}%`, ok: true }, { texto: `First data from ${estrella.nombre}!`, ok: true }],
    culpable: null,
  }
}

// Una línea por departamento: OK, WARN o FAILED, con la decisión que lo explica.
function lineasDelInforme({ vuelo, analisis, mision, presupuesto, fiabilidad }) {
  const culpa = (departamento) => vuelo.culpable?.departamento === departamento && vuelo.culpable.explicacion
  const sobrante = presupuesto - analisis.costeCompra
  const requerido = analisis.resuelto.orbita.deltaVRequerido
  const margen = analisis.deltaV / requerido - 1
  const { satelite } = analisis

  const finanzas = culpa('FINANCIACION')
    ? { veredicto: 'FAILED', texto: culpa('FINANCIACION') }
    : {
        veredicto: sobrante < presupuesto * SOBRANTE_JUSTO ? 'WARN' : 'OK',
        texto: `Raised ${formatoDinero(presupuesto)}: ${formatoDinero(Math.max(0, sobrante))} left after buying every part.`,
      }
  const software = culpa('SOFTWARE')
    ? { veredicto: 'FAILED', texto: culpa('SOFTWARE') }
    : fiabilidad < 100
      ? { veredicto: 'WARN', texto: `${fiabilidad}% reliability: glitches cost ${100 - fiabilidad}% of the science.` }
      : { veredicto: 'OK', texto: '100% reliability: not a single glitch.' }
  const sateliteLinea = culpa('SATELITE')
    ? { veredicto: 'FAILED', texto: culpa('SATELITE') }
    : {
        veredicto: 'OK',
        texto: `Science ${satelite.valorCientifico} / ${mision.requisitos.valorCientificoMin}, ${formatoNumero(Math.round(satelite.datosDescargadosMB))} MB of data per day, ${formatoNumero(satelite.masaKg)} kg.`,
      }
  const cohete = culpa('COHETE')
    ? { veredicto: 'FAILED', texto: culpa('COHETE') }
    : {
        veredicto: margen < MARGEN_JUSTO || analisis.empujePeso < EMPUJE_PESO_MINIMO ? 'WARN' : 'OK',
        texto: `${formatoNumero(Math.round(analisis.deltaV))} m/s for the ${formatoNumero(requerido)} needed (${Math.round(margen * 100)}% to spare).`,
      }

  return [
    { departamento: 'FINANCIACION', ...finanzas },
    { departamento: 'SOFTWARE', ...software },
    { departamento: 'SATELITE', ...sateliteLinea },
    { departamento: 'COHETE', ...cohete },
  ]
}

export function simularMisionEquipo(resultados, estrella, catalogo) {
  const mision = misionDeEquipo(estrella, catalogo)
  const presupuesto = presupuestoDelEquipo(resultados)
  const fiabilidad = resultados.SOFTWARE?.datos?.fiabilidad ?? catalogo.equipo.fiabilidadMinima
  const diseno = disenoDelEquipo(resultados, mision, catalogo)
  const analisis = analizarDiseno({ diseno, catalogo, mision, dinero: presupuesto, inventario: SIN_INVENTARIO })
  const vuelo = volar({ analisis, mision, estrella, presupuesto, fiabilidad, reglas: catalogo.equipo })
  return {
    exito: vuelo.exito,
    informe: { eventos: vuelo.eventos, lineas: lineasDelInforme({ vuelo, analisis, mision, presupuesto, fiabilidad }) },
  }
}
