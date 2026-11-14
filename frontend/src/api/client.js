const CLAVE_TOKEN = 'token'

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje)
    this.estado = estado
  }
}

export const leerToken = () => localStorage.getItem(CLAVE_TOKEN)
export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token)
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN)

export async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  const cabeceras = { 'Accept-Language': 'en' }
  const token = leerToken()
  if (token) cabeceras.Authorization = `Bearer ${token}`
  if (cuerpo) cabeceras['Content-Type'] = 'application/json'

  const respuesta = await fetch(ruta, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo && JSON.stringify(cuerpo),
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new ErrorApi(datos?.detail ?? `${metodo} ${ruta} returned ${respuesta.status}`, respuesta.status)
  }
  return datos
}
