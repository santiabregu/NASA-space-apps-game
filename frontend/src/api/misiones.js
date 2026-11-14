import { pedir } from './client.js'

export const obtenerMisionesDisponibles = () => pedir('/api/misiones/disponibles')

export const registrarLanzamiento = (misionId, lanzamiento) =>
  pedir(`/api/misiones/${misionId}/lanzamientos`, { metodo: 'POST', cuerpo: lanzamiento })
