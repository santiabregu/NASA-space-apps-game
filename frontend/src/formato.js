export function formatoDinero(dolares) {
  const millones = (dolares / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 2 })
  return `${millones} M$`
}
