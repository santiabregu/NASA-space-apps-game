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
  const ocurre = (texto) => eventos.push({ texto, ok: true })
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
      'El cohete no se levanta de la plataforma',
      `El motor de la primera etapa empuja ${formatoNumero(empujeKN)} kN, pero el cohete pesa ${formatoNumero(pesoKN)} kN. Necesitas un motor más potente o menos peso: la relación empuje/peso debe superar ${EMPUJE_PESO_MINIMO}.`,
    )
  }
  ocurre('🔥 Despegue')

  let deltaVConseguido = analisis.deltaV
  if (empujePeso < EMPUJE_PESO_MINIMO) {
    deltaVConseguido -= PERDIDA_DESPEGUE_LENTO
    explicaciones.push(
      `El despegue fue lento (empuje/peso ${formatoNumero(empujePeso)}): el cohete gastó unos ${PERDIDA_DESPEGUE_LENTO} m/s de Δv luchando contra la gravedad.`,
    )
  }

  if (satelite.masaKg > cofia.capacidadKg) {
    return fallo(
      '💥 La cofia cede durante el ascenso',
      `El satélite pesa ${formatoNumero(satelite.masaKg)} kg y la ${cofia.nombre} solo admite ${formatoNumero(cofia.capacidadKg)} kg. Usa una cofia más grande o aligera el satélite.`,
    )
  }

  resuelto.etapas.slice(0, -1).forEach((_, indice) => ocurre(`Separación de la etapa ${indice + 1}`))
  ocurre('Separación de la cofia')

  if (deltaVConseguido < orbita.deltaVRequerido) {
    const faltan = orbita.deltaVRequerido - deltaVConseguido
    return fallo(
      'El cohete se queda sin combustible antes de llegar a la órbita',
      `Faltaron ${formatoNumero(Math.round(faltan))} m/s de Δv: el cohete consiguió ${formatoNumero(Math.round(deltaVConseguido))} m/s y la ${orbita.nombre} necesita ${formatoNumero(orbita.deltaVRequerido)} m/s. Añade una etapa, usa motores con más Isp o aligera la carga (${formatoNumero(cargaUtilKg)} kg).`,
    )
  }
  ocurre(`🛰️ Satélite desplegado en ${orbita.nombre}`)

  if (!satelite.tieneOrdenador) {
    return fallo('El satélite no responde', 'Sin ordenador de a bordo el satélite no puede encender sus equipos ni obedecer órdenes.')
  }
  if (!satelite.tieneAntena) {
    return fallo('Silencio total: no llega ninguna señal', 'Sin antena no hay forma de hablar con el satélite. Aunque funcione, para nosotros está perdido.')
  }
  if (satelite.potenciaGeneradaW === 0) {
    return fallo('La batería se agota a las pocas horas', 'Sin paneles solares no hay forma de recargar la batería y el satélite se apaga para siempre.')
  }
  ocurre('📡 Primer contacto con la estación de tierra')

  const avisos = avisosDeOperacion(satelite, orbita)
  explicaciones.push(...avisos)

  const fallosObjetivo = fallosDeObjetivo(satelite, requisitos)
  if (fallosObjetivo.length > 0) {
    explicaciones.push(...fallosObjetivo.slice(1))
    return fallo('❌ La misión no cumple su objetivo', fallosObjetivo[0])
  }
  ocurre('✅ Objetivo cumplido')

  const retraso = meses > requisitos.plazoMeses
  if (retraso) {
    explicaciones.push(
      `Entregaste con retraso: el desarrollo duró ${meses} meses y el plazo era de ${requisitos.plazoMeses}. Las piezas avanzadas tardan más en fabricarse.`,
    )
  }
  if (avisos.length === 0 && !retraso) {
    explicaciones.push('Diseño equilibrado: sobra energía, se descargan todos los datos y se cumplieron los plazos.')
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
      `Los paneles generan ${formatoNumero(satelite.potenciaGeneradaW)} W y los equipos consumen ${formatoNumero(satelite.potenciaConsumidaW)} W: parte del día hay que apagar instrumentos.`,
    )
  }
  if (satelite.bateriaWh < satelite.bateriaNecesariaWh) {
    avisos.push(
      `En la sombra de la Tierra la batería (${formatoNumero(satelite.bateriaWh)} Wh) no alcanza: hacen falta ${formatoNumero(satelite.bateriaNecesariaWh)} Wh. Los instrumentos se apagan en cada eclipse.`,
    )
  }
  if (satelite.datosGeneradosMB > satelite.descargaMB) {
    const perdido = Math.round((1 - satelite.descargaMB / satelite.datosGeneradosMB) * 100)
    avisos.push(
      `Se pierde el ${perdido} % de los datos: los instrumentos generan ${formatoNumero(satelite.datosGeneradosMB)} MB al día y la antena solo descarga ${formatoNumero(satelite.descargaMB)} MB en ${orbita.minutosContactoDia} minutos de contacto. Prueba una antena más rápida o una órbita con más contacto.`,
    )
  }
  if (satelite.instrumentosSinApuntado.length > 0) {
    const nombres = satelite.instrumentosSinApuntado.map((instrumento) => instrumento.nombre).join(', ')
    avisos.push(`${nombres}: sin ruedas de reacción no pueden apuntar a su objetivo y solo aprovechas el 30 % de su ciencia.`)
  }
  return avisos
}

function fallosDeObjetivo(satelite, requisitos) {
  const fallos = []
  if (satelite.valorCientifico < requisitos.valorCientificoMin) {
    fallos.push(
      `El valor científico fue ${satelite.valorCientifico} y la misión necesitaba ${requisitos.valorCientificoMin}. Añade instrumentos o asegúrate de que tienen energía, apuntado y una antena capaz de bajar sus datos.`,
    )
  }
  if (satelite.datosDescargadosMB < requisitos.datosMinMB) {
    fallos.push(
      `Llegaron ${formatoNumero(satelite.datosDescargadosMB)} MB al día y el cliente necesitaba ${formatoNumero(requisitos.datosMinMB)} MB.`,
    )
  }
  if (satelite.vidaUtilDias < requisitos.vidaUtilMinDias) {
    fallos.push(
      `El satélite funcionó ${formatoNumero(satelite.vidaUtilDias)} días y la misión necesitaba ${formatoNumero(requisitos.vidaUtilMinDias)}. Una estructura más robusta o una órbita más alta (menos rozamiento con el aire) lo hacen durar más.`,
    )
  }
  return fallos
}
