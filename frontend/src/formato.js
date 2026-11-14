export function formatoDinero(dolares) {
  const millones = (dolares / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })
  return `$${millones}M`
}

export const formatoNumero = (numero) => numero.toLocaleString('en-US', { maximumFractionDigits: 1 })
