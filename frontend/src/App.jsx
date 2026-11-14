import { useEffect, useState } from 'react'
import { obtenerCatalogo } from './api/catalogo.js'
import { borrarToken, leerToken } from './api/client.js'
import { obtenerJugador } from './api/jugador.js'
import FondoZona from './components/FondoZona.jsx'
import Navegacion from './components/Navegacion.jsx'
import { disenoInicial } from './engine/diseno.js'
import { FONDOS } from './fondos.js'
import Academia from './zones/Academia/Academia.jsx'
import CentroControl from './zones/CentroControl/CentroControl.jsx'
import CentroMisiones from './zones/CentroMisiones/CentroMisiones.jsx'
import Hangar from './zones/Hangar/Hangar.jsx'
import Login from './zones/Login/Login.jsx'
import RegistroMisiones from './zones/RegistroMisiones/RegistroMisiones.jsx'
import Sede from './zones/Sede/Sede.jsx'
import SalaEquipo from './zones/Equipo/SalaEquipo.jsx'
import Social from './zones/Social/Social.jsx'
import Derrumbe from './zones/Transmision/Derrumbe.jsx'
import Transmision from './zones/Transmision/Transmision.jsx'

export default function App() {
  const [jugador, setJugador] = useState(null)
  const [catalogo, setCatalogo] = useState(null)
  const [cargando, setCargando] = useState(() => leerToken() !== null)
  const [aviso, setAviso] = useState(null)
  const [zona, setZona] = useState('sede')
  const [misionActiva, setMisionActiva] = useState(null)
  const [diseno, setDiseno] = useState(null)
  const [lanzamiento, setLanzamiento] = useState(null)
  // Foto de la transmisión inicial que se rompe en ladrillos al aceptar la misión.
  const [escenaRota, setEscenaRota] = useState(null)
  const [salaCodigo, setSalaCodigo] = useState(null)

  const cargarPartida = () =>
    Promise.all([obtenerJugador(), obtenerCatalogo()])
      .then(([datosJugador, datosCatalogo]) => {
        setJugador(datosJugador)
        setCatalogo(datosCatalogo)
      })
      .catch((error) => {
        if (error.estado === 401) {
          borrarToken()
          setAviso('Your session has expired. Please log in again.')
        } else {
          setAviso(error.message)
        }
      })
      .finally(() => setCargando(false))

  useEffect(() => {
    if (leerToken()) cargarPartida()
  }, [])

  function salir() {
    borrarToken()
    setJugador(null)
    setZona('sede')
    setMisionActiva(null)
    setDiseno(null)
    setLanzamiento(null)
  }

  function aceptarMision(mision) {
    if (misionActiva?.id !== mision.id) {
      setMisionActiva(mision)
      setDiseno(disenoInicial(mision))
    }
    setZona('hangar')
  }

  function cargarDiseno(mision, disenoGuardado) {
    setMisionActiva(mision)
    setDiseno(disenoGuardado)
    setZona('hangar')
  }

  function alLanzar(nuevoLanzamiento) {
    setJugador(nuevoLanzamiento.respuesta.jugador)
    const destino = catalogo.destinosPorId[nuevoLanzamiento.respuesta.destinoAlcanzado] ?? null
    setLanzamiento({ ...nuevoLanzamiento, destino })
    setZona('control')
  }

  function volverASede() {
    if (lanzamiento?.simulacion.exito) {
      setMisionActiva(null)
      setDiseno(null)
    }
    setLanzamiento(null)
    setZona('sede')
  }

  if (cargando) return <p className="p-8 text-center text-slate-400">Connecting to mission control…</p>
  if (!jugador) {
    return (
      <>
        <FondoZona {...FONDOS.login} />
        <Login onEntrar={cargarPartida} aviso={aviso} />
      </>
    )
  }

  if (!jugador.campana.introVista) {
    return (
      <Transmision
        jugador={jugador}
        onAceptada={(jugadorActualizado, escena) => {
          setJugador(jugadorActualizado)
          setZona('misiones')
          setEscenaRota(escena)
        }}
      />
    )
  }

  return (
    <>
      {FONDOS[zona] && <FondoZona {...FONDOS[zona]} />}
      {escenaRota && (
        <Derrumbe
          escena={escenaRota}
          onTerminado={() => {
            URL.revokeObjectURL(escenaRota)
            setEscenaRota(null)
          }}
        />
      )}
      {zona !== 'control' && <Navegacion jugador={jugador} zona={zona} onIrA={setZona} onSalir={salir} />}
      {zona === 'sede' && <Sede jugador={jugador} onIrA={setZona} />}
      {zona === 'misiones' && (
        <CentroMisiones jugador={jugador} catalogo={catalogo} misionActiva={misionActiva} onAceptar={aceptarMision} />
      )}
      {zona === 'hangar' && (
        <Hangar
          jugador={jugador}
          catalogo={catalogo}
          mision={misionActiva}
          diseno={diseno}
          onCambiarDiseno={setDiseno}
          onLanzado={alLanzar}
          onIrA={setZona}
        />
      )}
      {zona === 'academia' && <Academia catalogo={catalogo} />}
      {zona === 'social' && (
        <Social
          catalogo={catalogo}
          onAbrirSala={(codigo) => {
            setSalaCodigo(codigo)
            setZona('sala')
          }}
        />
      )}
      {zona === 'sala' && (
        <SalaEquipo
          codigo={salaCodigo}
          jugador={jugador}
          catalogo={catalogo}
          onJugadorActualizado={setJugador}
          onSalir={() => {
            setSalaCodigo(null)
            setZona('social')
          }}
        />
      )}
      {zona === 'registro' && <RegistroMisiones jugador={jugador} catalogo={catalogo} onCargarDiseno={cargarDiseno} />}
      {zona === 'control' && (
        <CentroControl
          lanzamiento={lanzamiento}
          onVolverSede={volverASede}
          onRedisenar={() => {
            setLanzamiento(null)
            setZona('hangar')
          }}
        />
      )}
    </>
  )
}
