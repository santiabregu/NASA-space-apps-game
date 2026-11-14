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
