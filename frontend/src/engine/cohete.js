export const GRAVEDAD = 9.81
export const EMPUJE_PESO_MINIMO = 1.2

const etapasCompletas = (etapas) => etapas.filter((etapa) => etapa.motor && etapa.tanque)
const masaSeca = ({ motor, tanque }) => motor.masaKg + tanque.masaKg
const masaLlena = (etapa) => masaSeca(etapa) + etapa.tanque.combustibleKg

export function masaDespegueKg(etapas, cargaUtilKg) {
  return etapasCompletas(etapas).reduce((total, etapa) => total + masaLlena(etapa), cargaUtilKg)
}

// Ecuación del cohete de Tsiolkovsky, de la etapa superior a la inferior: cada etapa también empuja a las que lleva encima.
export function deltaV(etapas, cargaUtilKg) {
  let masaEncima = cargaUtilKg
  let total = 0
  for (const etapa of etapasCompletas(etapas).reverse()) {
    const inicial = masaEncima + masaLlena(etapa)
    const final = masaEncima + masaSeca(etapa)
    total += etapa.motor.ispS * GRAVEDAD * Math.log(inicial / final)
    masaEncima = inicial
  }
  return total
}

export function relacionEmpujePeso(etapas, cargaUtilKg) {
  const primera = etapas[0]
  if (!primera?.motor || !primera?.tanque) return 0
  return (primera.motor.empujeKN * 1000) / (masaDespegueKg(etapas, cargaUtilKg) * GRAVEDAD)
}
