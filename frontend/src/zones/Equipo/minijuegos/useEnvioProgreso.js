import { useCallback, useEffect, useRef } from 'react'
import { enviarProgreso } from '../../../api/salas.js'

// El progreso no se manda en cada cambio: como mucho uno por intervalo, que es lo que tardan los demás en verlo.
const MS_ENTRE_PROGRESOS = 700

export function useEnvioProgreso(codigo, departamento) {
  const pendiente = useRef(null)

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (pendiente.current === null) return
      enviarProgreso(codigo, departamento, pendiente.current).catch(() => null)
      pendiente.current = null
    }, MS_ENTRE_PROGRESOS)
    return () => clearInterval(intervalo)
  }, [codigo, departamento])

  return useCallback((datos) => {
    pendiente.current = datos
  }, [])
}
