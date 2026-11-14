import { useEffect, useState } from 'react'

const MS_POR_LETRA = 32

// Escribe la frase letra a letra. El resto queda reservado pero invisible para que las palabras no salten de línea.
// Va con un contador y no con una animación CSS por letra: Chromium no siempre repinta bien cientos de letras animadas.
export default function TextoMaquina({ texto, completo, onTerminado }) {
  const [mostradas, setMostradas] = useState(0)
  const terminado = completo || mostradas >= texto.length

  useEffect(() => {
    if (terminado) return
    const intervalo = setInterval(() => setMostradas((cantidad) => cantidad + 1), MS_POR_LETRA)
    return () => clearInterval(intervalo)
  }, [terminado])

  useEffect(() => {
    if (terminado && !completo) onTerminado()
  }, [terminado, completo, onTerminado])

  if (terminado) return <span>{texto}</span>
  return (
    <span aria-label={texto}>
      <span aria-hidden="true">{texto.slice(0, mostradas)}</span>
      <span aria-hidden="true" className="invisible">
        {texto.slice(mostradas)}
      </span>
    </span>
  )
}
