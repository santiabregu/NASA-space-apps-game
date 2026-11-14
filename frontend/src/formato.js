export function formatoDinero(dolares) {
  const millones = (dolares / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 2 })
  return `${millones} M$`
}

export const formatoNumero = (numero) => numero.toLocaleString('es-ES', { maximumFractionDigits: 1 })
