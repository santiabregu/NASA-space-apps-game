export const NOMBRE_TIPO = {
  estructura: 'Estructuras',
  panel: 'Paneles solares',
  bateria: 'Baterías',
  ordenador: 'Ordenadores',
  antena: 'Antenas',
  actitud: 'Control de orientación',
  instrumento: 'Instrumentos científicos',
  motor: 'Motores',
  tanque: 'Tanques',
  cofia: 'Cofias',
}

export const estaBloqueada = (pieza, nivel) => pieza.nivelRequerido > nivel
