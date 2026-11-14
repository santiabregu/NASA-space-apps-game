export const NOMBRE_TIPO = {
  estructura: 'Structures',
  panel: 'Solar panels',
  bateria: 'Batteries',
  ordenador: 'Computers',
  antena: 'Antennas',
  actitud: 'Attitude control',
  instrumento: 'Science instruments',
  escudo: 'Heat shields',
  motor: 'Engines',
  tanque: 'Tanks',
  cofia: 'Fairings',
}

// Una pieza se puede usar si ya se alcanzó su destino o si quedan unidades en el almacén (el kit inicial, por ejemplo).
export function disponibilidad(pieza, jugador, catalogo) {
  const enAlmacen = jugador.inventario[pieza.id] ?? 0
  const destino = pieza.destinoRequerido
  const bloqueada = Boolean(destino) && !(destino in jugador.campana.destinosAlcanzados) && enAlmacen === 0
  return { enAlmacen, bloqueadaHasta: bloqueada ? catalogo.destinosPorId[destino].nombre : null }
}
