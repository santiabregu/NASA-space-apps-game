export const GRAVEDAD = 9.81
export const EMPUJE_PESO_MINIMO = 1.2

const estaCompleta = (etapa) => etapa.motor && etapa.tanque
// Una etapa a medio montar no puede encenderse, pero su masa sí pesa sobre las de abajo.
const masaLlena = ({ motor, tanque }) => (motor?.masaKg ?? 0) + (tanque ? tanque.masaKg + tanque.combustibleKg : 0)
const masaSeca = ({ motor, tanque }) => motor.masaKg + tanque.masaKg

export function masaDespegueKg(etapas, cargaUtilKg) {
  return etapas.reduce((total, etapa) => total + masaLlena(etapa), cargaUtilKg)
}

// Ecuación del cohete de Tsiolkovsky, de la etapa superior a la inferior: cada etapa también empuja a las que lleva encima.
export function deltaV(etapas, cargaUtilKg) {
  let masaEncima = cargaUtilKg
  let total = 0
  for (const etapa of [...etapas].reverse()) {
    const inicial = masaEncima + masaLlena(etapa)
    if (estaCompleta(etapa)) {
      total += etapa.motor.ispS * GRAVEDAD * Math.log(inicial / (masaEncima + masaSeca(etapa)))
    }
    masaEncima = inicial
  }
  return total
}

export function relacionEmpujePeso(etapas, cargaUtilKg) {
  const primera = etapas[0]
  if (!primera || !estaCompleta(primera)) return 0
  return (primera.motor.empujeKN * 1000) / (masaDespegueKg(etapas, cargaUtilKg) * GRAVEDAD)
}

const RADIO_TIERRA_M = 6_371_000
// El rozamiento con el aire durante la subida; en cohetes pequeños pesa mucho.
export const PERDIDA_ARRASTRE = 300

// En vuelo vertical, cada segundo de motor encendido la gravedad le quita g·t de velocidad.
export function perdidaPorGravedad(etapas) {
  return etapas.filter(estaCompleta).reduce((total, { motor, tanque }) => {
    const segundosEncendido = (tanque.combustibleKg * motor.ispS * GRAVEDAD) / (motor.empujeKN * 1000)
    return total + GRAVEDAD * segundosEncendido
  }, 0)
}

// Altura máxima de un vuelo vertical, con la gravedad que se debilita al subir. Infinity si escapa de la Tierra.
export function apogeoKm(etapas, cargaUtilKg) {
  const velocidad = deltaV(etapas, cargaUtilKg) - perdidaPorGravedad(etapas) - PERDIDA_ARRASTRE
  if (velocidad <= 0) return 0
  const escape = 2 * GRAVEDAD * RADIO_TIERRA_M
  if (velocidad ** 2 >= escape) return Infinity
  return (RADIO_TIERRA_M * velocidad ** 2) / (escape - velocidad ** 2) / 1000
}
