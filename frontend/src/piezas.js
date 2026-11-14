export const NOMBRE_TIPO = {
  estructura: 'Structures',
  panel: 'Solar panels',
  bateria: 'Batteries',
  ordenador: 'Computers',
  antena: 'Antennas',
  actitud: 'Attitude control',
  instrumento: 'Science instruments',
  motor: 'Engines',
  tanque: 'Tanks',
  cofia: 'Fairings',
}

export const estaBloqueada = (pieza, nivel) => pieza.nivelRequerido > nivel
