import hangarCabina from './assets/fondos/hangar-cabina.webp'
import loginCohete from './assets/fondos/login-cohete.webp'
import sedeTierra from './assets/fondos/sede-tierra.webp'

const OSCURO_IZQUIERDA = 'linear-gradient(90deg, rgba(2,6,23,.92) 0%, rgba(2,6,23,.55) 38%, rgba(2,6,23,0) 60%)'
const TIERRA_A_LA_DERECHA = 'linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.4) 55%, rgba(0,0,0,.12) 100%)'

export const FONDOS = {
  login: { imagen: loginCohete, capa: OSCURO_IZQUIERDA },
  sede: { imagen: sedeTierra, posicion: 'right center', capa: TIERRA_A_LA_DERECHA },
  misiones: { imagen: sedeTierra, posicion: 'right center', capa: 'rgba(2,6,23,.72)' },
  academia: { imagen: sedeTierra, posicion: 'right center', capa: 'rgba(2,6,23,.8)' },
  social: { imagen: sedeTierra, posicion: 'right center', capa: 'rgba(2,6,23,.8)' },
  registro: { imagen: hangarCabina, capa: 'rgba(2,6,23,.86)' },
  hangar: { imagen: hangarCabina, capa: 'rgba(2,6,23,.8)' },
  control: { imagen: hangarCabina, capa: 'rgba(2,6,23,.86)' },
}
