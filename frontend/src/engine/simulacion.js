import { formatoNumero } from '../formato.js'
import { EMPUJE_PESO_MINIMO } from './cohete.js'

const PERDIDA_DESPEGUE_LENTO = 500
const PUNTOS_OBJETIVO = 50
const PUNTOS_CIENCIA = 20
const PUNTOS_EFICIENCIA = 20
const PUNTOS_EQUIPO = 10
const PENALIZACION_POR_AVISO = 5
const PENALIZACION_RETRASO = 10
const MARGEN_CIENCIA_EXCELENTE = 1.5

export function simular(analisis, mision) {
  const { resuelto, satelite, empujePeso, cargaUtilKg, meses } = analisis
  const { orbita, cofia } = resuelto
  const { requisitos } = mision
  const eventos = []
  const explicaciones = []
  const ocurre = (texto, icono) => eventos.push({ texto, icono, ok: true })
  const fallo = (texto, explicacion) => ({
    exito: false,
    puntuacion: 0,
    desglose: null,
    eventos: [...eventos, { texto, ok: false }],
    explicaciones: [...explicaciones, explicacion],
  })

  if (empujePeso < 1) {
    const empujeKN = resuelto.etapas[0].motor.empujeKN
    const pesoKN = empujeKN / empujePeso
    return fallo(
      'The rocket does not leave the launch pad',
      `The first-stage engine pushes ${formatoNumero(empujeKN)} kN, but the rocket weighs ${formatoNumero(pesoKN)} kN. You need a more powerful engine or less weight: thrust-to-weight must be above ${EMPUJE_PESO_MINIMO}.`,
    )
  }
  ocurre('Liftoff', 'despegue')

  let deltaVConseguido = analisis.deltaV
  if (empujePeso < EMPUJE_PESO_MINIMO) {
    deltaVConseguido -= PERDIDA_DESPEGUE_LENTO
    explicaciones.push(
      `Liftoff was slow (thrust-to-weight ${formatoNumero(empujePeso)}): the rocket spent about ${PERDIDA_DESPEGUE_LENTO} m/s of Δv fighting gravity.`,
    )
  }

  if (satelite.masaKg > cofia.capacidadKg) {
    return fallo(
      'The fairing fails during ascent',
      `The satellite weighs ${formatoNumero(satelite.masaKg)} kg and the ${cofia.nombre} only takes ${formatoNumero(cofia.capacidadKg)} kg. Use a bigger fairing or make the satellite lighter.`,
    )
  }

  resuelto.etapas.slice(0, -1).forEach((_, indice) => ocurre(`Stage ${indice + 1} separation`, 'separacion'))
  ocurre('Fairing separation', 'separacion')

  if (deltaVConseguido < orbita.deltaVRequerido) {
    const faltan = orbita.deltaVRequerido - deltaVConseguido
    return fallo(
      'The rocket runs out of propellant before reaching orbit',
      `It was ${formatoNumero(Math.round(faltan))} m/s of Δv short: the rocket reached ${formatoNumero(Math.round(deltaVConseguido))} m/s and the ${orbita.nombre} needs ${formatoNumero(orbita.deltaVRequerido)} m/s. Add a stage, use higher-Isp engines or lighten the payload (${formatoNumero(cargaUtilKg)} kg).`,
    )
  }
  ocurre(`Satellite deployed in ${orbita.nombre}`, 'orbita')

  if (!satelite.tieneOrdenador) {
    return fallo('The satellite does not respond', 'Without an onboard computer the satellite cannot switch on its equipment or follow commands.')
  }
  if (!satelite.tieneAntena) {
    return fallo('Total silence: no signal arrives', 'Without an antenna there is no way to talk to the satellite. Even if it works, it is lost to us.')
  }
  if (satelite.potenciaGeneradaW === 0) {
    return fallo('The battery dies within hours', 'Without solar panels there is no way to recharge the battery, and the satellite shuts down for good.')
  }
  ocurre('First contact with the ground station', 'contacto')

  const avisos = avisosDeOperacion(satelite, orbita)
  explicaciones.push(...avisos)

  const fallosObjetivo = fallosDeObjetivo(satelite, requisitos)
  if (fallosObjetivo.length > 0) {
    explicaciones.push(...fallosObjetivo.slice(1))
    return fallo('The mission does not meet its objective', fallosObjetivo[0])
  }
  ocurre('Objective achieved', 'objetivo')

  const retraso = meses > requisitos.plazoMeses
  if (retraso) {
    explicaciones.push(
      `Delivered late: development took ${meses} months and the deadline was ${requisitos.plazoMeses}. Advanced parts take longer to build.`,
    )
  }
  if (avisos.length === 0 && !retraso) {
    explicaciones.push('Balanced design: power to spare, all the data gets downloaded and the deadline was met.')
  }

  const desglose = {
    objetivo: PUNTOS_OBJETIVO,
    ciencia: Math.round(puntosCiencia(satelite.valorCientifico, requisitos.valorCientificoMin)),
    eficiencia: Math.max(0, PUNTOS_EFICIENCIA - PENALIZACION_POR_AVISO * avisos.length),
    equipo: PUNTOS_EQUIPO,
    retraso: retraso ? -PENALIZACION_RETRASO : 0,
  }
  const puntuacion = Object.values(desglose).reduce((total, puntos) => total + puntos, 0)
  return { exito: true, puntuacion, desglose, eventos, explicaciones }
}

function puntosCiencia(valor, minimo) {
  if (minimo === 0) return PUNTOS_CIENCIA
  return Math.min(1, valor / (minimo * MARGEN_CIENCIA_EXCELENTE)) * PUNTOS_CIENCIA
}

function avisosDeOperacion(satelite, orbita) {
  const avisos = []
  if (satelite.potenciaConsumidaW > satelite.potenciaGeneradaW) {
    avisos.push(
      `The panels make ${formatoNumero(satelite.potenciaGeneradaW)} W and the equipment uses ${formatoNumero(satelite.potenciaConsumidaW)} W: instruments have to be switched off for part of the day.`,
    )
  }
  if (satelite.bateriaWh < satelite.bateriaNecesariaWh) {
    avisos.push(
      `In the Earth’s shadow the battery (${formatoNumero(satelite.bateriaWh)} Wh) is not enough: it needs ${formatoNumero(satelite.bateriaNecesariaWh)} Wh. The instruments shut down during every eclipse.`,
    )
  }
  if (satelite.datosGeneradosMB > satelite.descargaMB) {
    const perdido = Math.round((1 - satelite.descargaMB / satelite.datosGeneradosMB) * 100)
    avisos.push(
      `${perdido}% of the data is lost: the instruments make ${formatoNumero(satelite.datosGeneradosMB)} MB per day and the antenna only downloads ${formatoNumero(satelite.descargaMB)} MB in ${orbita.minutosContactoDia} minutes of contact. Try a faster antenna or an orbit with more contact time.`,
    )
  }
  if (satelite.instrumentosSinApuntado.length > 0) {
    const nombres = satelite.instrumentosSinApuntado.map((instrumento) => instrumento.nombre).join(', ')
    avisos.push(`${nombres}: without reaction wheels they cannot point at their target, so you only get 30% of their science.`)
  }
  return avisos
}

function fallosDeObjetivo(satelite, requisitos) {
  const fallos = []
  if (satelite.valorCientifico < requisitos.valorCientificoMin) {
    fallos.push(
      `The science value was ${satelite.valorCientifico} and the mission needed ${requisitos.valorCientificoMin}. Add instruments, or make sure they have power, pointing and an antenna fast enough for their data.`,
    )
  }
  if (satelite.datosDescargadosMB < requisitos.datosMinMB) {
    fallos.push(
      `${formatoNumero(satelite.datosDescargadosMB)} MB per day reached the ground and the client needed ${formatoNumero(requisitos.datosMinMB)} MB.`,
    )
  }
  if (satelite.vidaUtilDias < requisitos.vidaUtilMinDias) {
    fallos.push(
      `The satellite worked for ${formatoNumero(satelite.vidaUtilDias)} days and the mission needed ${formatoNumero(requisitos.vidaUtilMinDias)}. A sturdier structure or a higher orbit (less air drag) makes it last longer.`,
    )
  }
  return fallos
}
