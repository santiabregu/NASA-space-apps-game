import { pedir } from './client.js'

const indexarPorId = (lista) => Object.fromEntries(lista.map((elemento) => [elemento.id, elemento]))

export async function obtenerCatalogo() {
  const catalogo = await pedir('/api/catalogo')
  return {
    ...catalogo,
    piezasPorId: indexarPorId(catalogo.piezas),
    orbitasPorId: indexarPorId(catalogo.orbitas),
  }
}
