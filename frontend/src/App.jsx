import { useEffect, useState } from 'react'
import { borrarToken, leerToken } from './api/client.js'
import { obtenerJugador } from './api/jugador.js'
import Login from './zones/Login/Login.jsx'
import Sede from './zones/Sede/Sede.jsx'

export default function App() {
  const [jugador, setJugador] = useState(null)
  const [cargando, setCargando] = useState(() => leerToken() !== null)
  const [aviso, setAviso] = useState(null)

  const cargarJugador = () =>
    obtenerJugador()
      .then(setJugador)
      .catch((error) => {
        if (error.estado === 401) borrarToken()
        setAviso(error.message)
      })
      .finally(() => setCargando(false))

  function salir() {
    borrarToken()
    setJugador(null)
  }

  useEffect(() => {
    if (leerToken()) cargarJugador()
  }, [])

  if (cargando) return <p className="p-8 text-center text-slate-400">Conectando con el centro de control…</p>
  if (!jugador) return <Login onEntrar={cargarJugador} aviso={aviso} />
  return <Sede jugador={jugador} onSalir={salir} />
}
