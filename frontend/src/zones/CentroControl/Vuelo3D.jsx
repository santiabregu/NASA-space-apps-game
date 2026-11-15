import { useEffect, useRef } from 'react'
import { crearVuelo } from './vuelo3d/escena.js'

// Se carga aparte con React.lazy: Three.js solo se descarga al entrar en Mission Control.
// vistos = cuántos eventos de la bitácora se han enseñado ya; la escena reproduce cada uno al aparecer.
export default function Vuelo3D({ resuelto, empresa, suborbital, eventos, vistos, onSinWebGL }) {
  const lienzo = useRef(null)
  const vuelo = useRef(null)
  const reproducidos = useRef(0)

  useEffect(() => {
    try {
      const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches
      vuelo.current = crearVuelo(lienzo.current, { resuelto, empresa, suborbital, reducido })
    } catch {
      onSinWebGL()
      return undefined
    }
    return () => {
      vuelo.current?.destruir()
      vuelo.current = null
      reproducidos.current = 0
    }
  }, [resuelto, empresa, suborbital, onSinWebGL])

  useEffect(() => {
    while (vuelo.current && reproducidos.current < vistos) {
      vuelo.current.avanzar(eventos[reproducidos.current])
      reproducidos.current++
    }
  }, [eventos, vistos])

  return <canvas ref={lienzo} className="block h-full w-full" aria-label="3D view of the launch" />
}
