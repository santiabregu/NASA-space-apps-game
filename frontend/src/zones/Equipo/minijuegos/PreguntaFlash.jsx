import { useEffect, useRef, useState } from 'react'
import BarraBloques from '../../../components/pixel/BarraBloques.jsx'
import { CAJA_PIXEL } from '../../../components/pixel/estilos.js'

const MS_PARA_RESPONDER = 10000
const MS_VIENDO_SOLUCION = 3000
const SIN_RESPUESTA = -1

function estiloOpcion(indice, pregunta, elegida) {
  if (elegida === null) return 'bg-[#fff1e8] text-black hover:bg-[#ffec27]'
  if (indice === pregunta.correcta) return 'bg-[#00e436] text-black'
  if (indice === elegida) return 'bg-[#ff004d] text-white'
  return 'bg-[#c2c3c7] text-black opacity-60'
}

// 10 segundos para contestar; después se enseña la solución con una explicación corta y se sigue jugando.
export default function PreguntaFlash({ pregunta, numero, total, onRespondida }) {
  const [elegida, setElegida] = useState(null)
  const [restante, setRestante] = useState(1)
  const inicio = useRef(null)
  // La sala se redibuja cada vez que llega una versión nueva: el temporizador no debe reiniciarse por eso.
  const alResponder = useRef(onRespondida)

  useEffect(() => {
    alResponder.current = onRespondida
  })

  useEffect(() => {
    if (elegida !== null) {
      const espera = setTimeout(() => alResponder.current(elegida), MS_VIENDO_SOLUCION)
      return () => clearTimeout(espera)
    }
    inicio.current ??= Date.now()
    const intervalo = setInterval(() => {
      const fraccion = Math.max(0, 1 - (Date.now() - inicio.current) / MS_PARA_RESPONDER)
      setRestante(fraccion)
      if (fraccion === 0) setElegida(SIN_RESPUESTA)
    }, 100)
    return () => clearInterval(intervalo)
  }, [elegida])

  const acierto = elegida === pregunta.correcta

  return (
    <div className={`${CAJA_PIXEL} w-full max-w-xl space-y-4 p-5`}>
      <BarraBloques fraccion={restante} color={restante < 0.3 ? '#ff004d' : '#ffec27'} className="h-4" />
      <p className="text-[8px] text-[#ffec27]">
        Flash question {numero} / {total}
      </p>
      <p className="font-sans text-base font-semibold leading-snug">{pregunta.pregunta}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {pregunta.opciones.map((opcion, indice) => (
          <button
            key={opcion}
            disabled={elegida !== null}
            onClick={() => setElegida(indice)}
            className={`border-4 border-black px-3 py-2 text-left font-sans text-sm font-semibold ${estiloOpcion(indice, pregunta, elegida)}`}
          >
            {opcion}
          </button>
        ))}
      </div>
      {elegida !== null && (
        <p className="font-sans text-sm text-slate-200">
          <span className={acierto ? 'text-[#00e436]' : 'text-[#ff004d]'}>
            {acierto ? 'Right! ' : elegida === SIN_RESPUESTA ? 'Too slow! ' : 'Not quite. '}
          </span>
          {pregunta.explicacion}
        </p>
      )}
    </div>
  )
}
