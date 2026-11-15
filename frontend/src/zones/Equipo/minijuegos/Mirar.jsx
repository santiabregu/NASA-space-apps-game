import { contarAciertos, fiabilidadSoftware, presupuestoFinanzas } from '../../../engine/equipo.js'
import { formatoDinero } from '../../../formato.js'

// Lo que ven los compañeros mientras otro juega Finance o Software. El progreso lo manda otro navegador:
// se lee con cuidado por si llega incompleto.
const numero = (valor) => (Number.isFinite(valor) ? valor : 0)
const lista = (valor) => (Array.isArray(valor) ? valor : [])

function Dato({ etiqueta, valor }) {
  return (
    <div className="space-y-2 border-4 border-black bg-[#1d2b53] p-2">
      <p className="text-[8px] text-[#c2c3c7]">{etiqueta}</p>
      <p className="text-xs sm:text-base">{valor}</p>
    </div>
  )
}

function Vivo({ nombre, grande, color, subtitulo, datos, aviso }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto border-4 border-black bg-[#0b1430] p-5 text-center">
      <p className="text-[8px] leading-4 text-[#c2c3c7]">Watching {nombre}</p>
      <p className="text-base sm:text-2xl" style={{ color }}>
        {grande}
      </p>
      <p className="text-[8px] text-[#c2c3c7]">{subtitulo}</p>
      <div className="grid grid-cols-3 gap-2">{datos}</div>
      <p className="min-h-5 font-sans text-sm text-slate-200">{aviso}</p>
    </div>
  )
}

export function MirarFinanzas({ progreso, nombre, catalogo, estrella }) {
  const respuestas = lista(progreso?.respuestas)
  const aciertos = contarAciertos(respuestas, catalogo)
  const monedas = numero(progreso?.monedas)
  const grants = numero(progreso?.grants)
  const presupuesto = presupuestoFinanzas({ monedas, grants, aciertos }, estrella, catalogo.equipo)
  const aviso = progreso?.respondiendo ? `${nombre} is answering a flash question...` : (progreso?.evento ?? 'Waiting for the first coin...')

  return (
    <Vivo
      nombre={nombre}
      grande={formatoDinero(presupuesto)}
      color="#ffec27"
      subtitulo="mission budget so far"
      aviso={aviso}
      datos={
        <>
          <Dato etiqueta="COINS" valor={monedas} />
          <Dato etiqueta="GRANTS" valor={grants} />
          <Dato etiqueta="ANSWERS" valor={`${aciertos} / ${respuestas.length}`} />
        </>
      }
    />
  )
}

export function MirarSoftware({ progreso, nombre, catalogo }) {
  const respuestas = lista(progreso?.respuestas)
  const aciertos = contarAciertos(respuestas, catalogo)
  const conexiones = numero(progreso?.conexiones)
  const chispas = numero(progreso?.chispas)
  const fiabilidad = fiabilidadSoftware({ conexiones, chispas, aciertos }, catalogo.equipo)

  return (
    <Vivo
      nombre={nombre}
      grande={`${fiabilidad}%`}
      color="#00e436"
      subtitulo="telescope reliability so far"
      aviso={progreso?.evento ?? 'Waiting for the first cable...'}
      datos={
        <>
          <Dato etiqueta="CABLES" valor={`${conexiones} / ${catalogo.equipo.conexionesCables}`} />
          <Dato etiqueta="SPARKS" valor={chispas} />
          <Dato etiqueta="ANSWERS" valor={`${aciertos} / ${respuestas.length}`} />
        </>
      }
    />
  )
}
