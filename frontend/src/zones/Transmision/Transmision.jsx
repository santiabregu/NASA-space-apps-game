import { useEffect, useRef, useState } from 'react'
import { marcarIntroVista } from '../../api/jugador.js'
import { formatoDinero } from '../../formato.js'
import { BOTON_PIXEL, CAJA_PIXEL } from '../../components/pixel/estilos.js'
import { CieloPixel, RetratoControlador, TierraArdiendo } from '../../components/pixel/pixel.jsx'
import TextoMaquina from '../../components/pixel/TextoMaquina.jsx'
import { fotografiarEscena } from './fotografia.js'


function paginasDelMensaje(jugador) {
  const presupuesto = jugador.dinero === 0 ? '$0' : formatoDinero(jugador.dinero)
  return [
    'Hello? Is this thing on? ... Oh! Hi! This is NASA Mission Control.',
    'We have some bad news. Planet Earth is overheating. Like, A LOT. Soon nobody will be able to live here.',
    'So we need someone to find a new home for humanity. We asked everyone. They all said no. So... we picked YOU!',
    `Your budget: ${presupuesto}. But we found a tiny rocket kit in the garage. It can probably reach the sea. Probably.`,
    'Every time you get further, investors will throw money at you. The sea, space, orbit, the Moon... and beyond!',
    "One more thing: space is lonely. Win team missions with your friends, and they'll be there for you at the end.",
    `You have ${jugador.campana.mesLimite} months. No pressure. (Lots of pressure.) So... are you in?`,
  ]
}

// Primera pantalla de la campaña: la NASA llama, cuenta el problema y el jugador acepta la misión una sola vez.
// onAceptada recibe también una foto de la escena para que App la derrumbe sobre la web.
export default function Transmision({ jugador, onAceptada }) {
  const [contestada, setContestada] = useState(false)
  const cielo = useRef(null)
  const tierra = useRef(null)
  const alAceptar = (jugadorActualizado) => onAceptada(jugadorActualizado, fotografiarEscena([cielo.current, tierra.current]))

  return (
    <main className="relative h-screen overflow-hidden font-pixel text-[#fff1e8]">
      <CieloPixel ref={cielo} />
      <div className="absolute inset-x-0 top-[3vh] flex justify-center">
        <TierraArdiendo ref={tierra} className="h-[50vh] max-h-[440px] w-auto" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-8">
        {contestada ? (
          <Dialogo jugador={jugador} onAceptada={alAceptar} />
        ) : (
          <LlamadaEntrante onContestar={() => setContestada(true)} />
        )}
      </div>
    </main>
  )
}

function LlamadaEntrante({ onContestar }) {
  return (
    <div className={`${CAJA_PIXEL} flex w-full max-w-md items-center gap-4 p-4`}>
      <div className="shrink-0 motion-safe:animate-temblor">
        <RetratoControlador className="h-16 w-16 border-4 border-black" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="animate-parpadeo text-base text-[#ffec27]">RING RING!</p>
        <p className="text-[8px] leading-4 text-[#c2c3c7] sm:text-xs sm:leading-5">Incoming call · NASA Mission Control</p>
        <button autoFocus onClick={onContestar} className={`${BOTON_PIXEL} bg-[#00e436]`}>
          Answer
        </button>
      </div>
    </div>
  )
}

function Dialogo({ jugador, onAceptada }) {
  const paginas = paginasDelMensaje(jugador)
  const [pagina, setPagina] = useState(0)
  const [escrita, setEscrita] = useState(false)
  const [sinOpcion, setSinOpcion] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const ultima = pagina === paginas.length - 1
  const texto = sinOpcion ? 'Nope! Welcome aboard, rookie. Go build that rocket.' : paginas[pagina]
  const eligiendo = escrita && (ultima || sinOpcion)

  // Como en los juegos de rol: el primer toque termina de escribir la frase; el siguiente pasa de página.
  function avanzar() {
    if (!escrita) {
      setEscrita(true)
    } else if (!ultima && !sinOpcion) {
      setPagina(pagina + 1)
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

  async function aceptar() {
    setEnviando(true)
    setError(null)
    try {
      onAceptada(await marcarIntroVista())
    } catch (excepcion) {
      setError(excepcion.message)
      setEnviando(false)
    }
  }

  function preguntarSiHayOpcion() {
    setSinOpcion(true)
    setEscrita(false)
  }

  return (
    <section className={`${CAJA_PIXEL} w-full max-w-3xl`}>
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
            {escrita && !eligiendo && <span className="ml-2 inline-block h-0 w-0 animate-parpadeo border-x-[6px] border-t-[8px] border-x-transparent border-t-[#ffec27]" />}
          </button>

          {eligiendo && (
            <div className="mt-3 flex flex-wrap gap-3">
              <button autoFocus onClick={aceptar} disabled={enviando} className={`${BOTON_PIXEL} bg-[#ffec27]`}>
                {enviando ? 'Saving...' : sinOpcion ? "Let's go!" : 'Accept mission'}
              </button>
              {!sinOpcion && (
                <button onClick={preguntarSiHayOpcion} className={`${BOTON_PIXEL} bg-[#c2c3c7]`}>
                  Do I have a choice?
                </button>
              )}
            </div>
          )}
          {error && <p className="mt-3 text-[8px] leading-5 text-[#ff004d] sm:text-xs">{error}</p>}
          <p className="mt-3 text-[8px] text-[#c2c3c7]">
            {pagina + 1} / {paginas.length} · click or press Enter
          </p>
        </div>
      </div>
    </section>
  )
}
