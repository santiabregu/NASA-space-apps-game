import { useEffect, useRef, useState } from 'react'
import { marcarFinalVisto } from '../../api/jugador.js'
import { BOTON_PIXEL, CAJA_PIXEL } from '../../components/pixel/estilos.js'
import { RetratoControlador } from '../../components/pixel/pixel.jsx'
import TextoMaquina from '../../components/pixel/TextoMaquina.jsx'
import { ALTO, ANCHO, FUENTE, dibujarEscena } from './escenas.js'

// Cada página del diálogo va con su viñeta. Las claves son los valores de FinalCampana en el servidor.
const FINALES = {
  NEW_HOME: {
    titulo: 'New Home',
    color: '#00e436',
    paginas: [
      ['nuevoHogar1', 'Mission Control here. Our telescope just confirmed it: a planet with oceans, air and the right temperature. You found it!'],
      ['nuevoHogar2', "And look who's lining up for the ark: everyone you flew with. Seats: 4 of 4. Nobody gets left behind."],
      ['nuevoHogar3', "You made it in time, and you didn't do it alone. Humanity has a new home, and a crew to build it. Welcome home!"],
    ],
  },
  LONE_PIONEER: {
    titulo: 'Lone Pioneer',
    color: '#29adff',
    paginas: [
      ['pionero1', 'Mission Control here. Our telescope just confirmed it: a planet with oceans and air. And you made it in time!'],
      ['pionero2', 'Small problem. The ark has four seats... and only one pilot. Where are your friends?'],
      ['pionero3', 'You found our new home, but a new world needs more than one pioneer. Next time, bring a crew.'],
    ],
  },
  RELAY: {
    titulo: 'The Relay',
    color: '#ff77a8',
    paginas: [
      ['relevo1', "Mission Control here. Bad news: the clock hit zero before you got there. Time's up."],
      ['relevo2', 'But wait... your friends are launching! Everyone you flew with is taking over the mission.'],
      ['relevo3', "They found it, and they're sending you the signal. The clock ran out on you, but not on your crew."],
    ],
  },
  LAST_SIGNAL: {
    titulo: 'Last Signal',
    color: '#ff004d',
    paginas: [
      ['senal1', "Mission Control here. The clock hit zero. We're out of time."],
      ['senal2', "The rocket is still on the pad, and there's no one left to fly it with you."],
      ['senal3', 'Signal lost... Your work still matters, though. The sky is open. Keep exploring?'],
    ],
  },
}

// Cierre de la campaña: se enseña una vez, al volver a la base después del lanzamiento que lo decidió.
export default function Final({ jugador, catalogo, onTerminado }) {
  const final = FINALES[jugador.campana.finalCampana]
  const ultimoDestino = catalogo.destinos.filter((destino) => !destino.proximamente).at(-1)
  const mesLlegada = jugador.campana.destinosAlcanzados[ultimoDestino.id]
  const mes = mesLlegada ?? jugador.campana.mesActual
  const [pagina, setPagina] = useState(0)
  const [escena] = final.paginas[pagina]

  return (
    <main className="relative flex h-screen flex-col items-center justify-between gap-4 overflow-hidden bg-[#020617] p-4 font-pixel text-[#fff1e8] sm:p-8">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3">
        <p className="text-[10px] sm:text-sm" style={{ color: final.color }}>
          Ending · {final.titulo}
        </p>
        <EscenaPixel escena={escena} datos={{ mes }} className="max-h-full max-w-full border-4 border-[#fff1e8] shadow-[0_0_0_4px_#000]" />
      </div>
      <Dialogo
        key={jugador.campana.finalCampana}
        final={final}
        pagina={pagina}
        onPagina={setPagina}
        resumen={{
          mes,
          mesLimite: jugador.campana.mesLimite,
          destino: ultimoDestino.nombre,
          alcanzado: mesLlegada !== undefined,
          conAmigos: jugador.campana.misionesConAmigos,
          necesarias: catalogo.misionesConAmigos,
        }}
        onTerminado={onTerminado}
      />
    </main>
  )
}

function EscenaPixel({ escena, datos, className }) {
  const lienzo = useRef(null)
  const { mes } = datos

  useEffect(() => {
    const ctx = lienzo.current.getContext('2d')
    const dibujar = (t) => dibujarEscena(escena, ctx, t, { mes })
    dibujar(0)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.fonts.load(FUENTE).then(() => dibujar(0), () => null)
      return
    }
    let ultimo = 0
    let peticion = requestAnimationFrame(function bucle(ahora) {
      // A unos 9 fotogramas por segundo, como una consola antigua.
      if (ahora - ultimo > 110) {
        ultimo = ahora
        dibujar(ahora / 1000)
      }
      peticion = requestAnimationFrame(bucle)
    })
    return () => cancelAnimationFrame(peticion)
  }, [escena, mes])

  return (
    <canvas
      ref={lienzo}
      width={ANCHO}
      height={ALTO}
      className={`aspect-video h-[50vh] max-h-[440px] w-auto [image-rendering:pixelated] ${className}`}
    />
  )
}

function Dialogo({ final, pagina, onPagina, resumen, onTerminado }) {
  const [escrita, setEscrita] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const ultima = pagina === final.paginas.length - 1
  const [, texto] = final.paginas[pagina]
  const eligiendo = escrita && ultima

  // Como en la transmisión inicial: el primer toque termina de escribir la frase; el siguiente pasa de página.
  function avanzar() {
    if (!escrita) {
      setEscrita(true)
    } else if (!ultima) {
      onPagina(pagina + 1)
      setEscrita(false)
    }
  }

  useEffect(() => {
    function alPulsarTecla(evento) {
      if (evento.key !== 'Enter' && evento.key !== ' ') return
      if (evento.target instanceof HTMLButtonElement) return
      evento.preventDefault()
      avanzar()
    }
    window.addEventListener('keydown', alPulsarTecla)
    return () => window.removeEventListener('keydown', alPulsarTecla)
  })

  function verOtraVez() {
    onPagina(0)
    setEscrita(false)
  }

  async function seguirExplorando() {
    setEnviando(true)
    setError(null)
    try {
      onTerminado(await marcarFinalVisto())
    } catch (excepcion) {
      setError(excepcion.message)
      setEnviando(false)
    }
  }

  return (
    <section className={`${CAJA_PIXEL} w-full max-w-3xl shrink-0`}>
      <p className="-mt-4 ml-4 inline-block -translate-y-1/2 border-4 border-black bg-[#ffec27] px-2 py-1 text-[8px] text-black sm:text-xs">
        NASA Mission Control
      </p>
      <div className="flex gap-4 px-4 pb-4">
        <RetratoControlador className="h-16 w-16 shrink-0 border-4 border-black sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={avanzar}
            disabled={eligiendo}
            className="block min-h-24 w-full cursor-pointer text-left text-xs leading-6 disabled:cursor-default sm:text-base sm:leading-8"
          >
            <TextoMaquina key={texto} texto={texto} completo={escrita} onTerminado={() => setEscrita(true)} />
            {escrita && !eligiendo && (
              <span className="ml-2 inline-block h-0 w-0 animate-parpadeo border-x-[6px] border-t-[8px] border-x-transparent border-t-[#ffec27]" />
            )}
          </button>

          {eligiendo && (
            <>
              <p className="mt-3 text-[8px] leading-5 text-[#c2c3c7] sm:text-xs sm:leading-6">
                {resumen.alcanzado ? `${resumen.destino} reached in month ${resumen.mes} of ${resumen.mesLimite}` : `Out of time: month ${resumen.mes} of ${resumen.mesLimite}`}
                {' · '}Team wins with friends: {resumen.conAmigos}/{resumen.necesarias}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button autoFocus onClick={seguirExplorando} disabled={enviando} className={`${BOTON_PIXEL} bg-[#ffec27]`}>
                  {enviando ? 'Saving...' : 'Keep exploring'}
                </button>
                <button onClick={verOtraVez} className={`${BOTON_PIXEL} bg-[#c2c3c7]`}>
                  Watch again
                </button>
              </div>
            </>
          )}
          {error && <p className="mt-3 text-[8px] leading-5 text-[#ff004d] sm:text-xs">{error}</p>}
          <p className="mt-3 text-[8px] text-[#c2c3c7]">
            {pagina + 1} / {final.paginas.length} · click or press Enter
          </p>
        </div>
      </div>
    </section>
  )
}
