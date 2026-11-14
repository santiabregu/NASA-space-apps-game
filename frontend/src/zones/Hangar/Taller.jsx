import { COLOR_ESTADO } from '../../colores.js'
import BarraRecurso from '../../components/BarraRecurso.jsx'
import { EMPUJE_PESO_MINIMO } from '../../engine/cohete.js'
import { MAX_ETAPAS } from '../../engine/diseno.js'
import { formatoDinero, formatoNumero } from '../../formato.js'
import { estaBloqueada } from '../../piezas.js'

export default function Taller({ catalogo, analisis, diseno, onCambiarDiseno, nivel, empresa }) {
  const { cohete } = diseno
  const deTipo = (tipo) => catalogo.piezas.filter((pieza) => pieza.tipo === tipo)
  const cambiarCohete = (cambios) => onCambiarDiseno({ ...diseno, cohete: { ...cohete, ...cambios } })
  const cambiarEtapa = (indice, cambios) =>
    cambiarCohete({ etapas: cohete.etapas.map((etapa, i) => (i === indice ? { ...etapa, ...cambios } : etapa)) })

  const deltaVRequerido = analisis.resuelto.orbita.deltaVRequerido
  const etapasDeArribaAAbajo = cohete.etapas.map((etapa, indice) => ({ etapa, indice })).reverse()

  return (
    <section className="grid gap-6 md:grid-cols-[10rem_1fr]">
      <DibujoCohete etapas={cohete.etapas.length} tieneCofia={Boolean(cohete.cofiaId)} empresa={empresa} />

      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <BarraRecurso
            etiqueta="Δv (capacidad para cambiar de velocidad)"
            valor={analisis.deltaV}
            maximo={deltaVRequerido}
            texto={`${formatoNumero(Math.round(analisis.deltaV))} / ${formatoNumero(deltaVRequerido)} m/s`}
            color={COLOR_ESTADO[analisis.deltaV >= deltaVRequerido ? 'ok' : 'error']}
          />
          <BarraRecurso
            etiqueta="Empuje / peso al despegar"
            valor={analisis.empujePeso}
            maximo={EMPUJE_PESO_MINIMO}
            texto={`${formatoNumero(analisis.empujePeso)} (mínimo ${EMPUJE_PESO_MINIMO})`}
            color={COLOR_ESTADO[analisis.empujePeso >= EMPUJE_PESO_MINIMO ? 'ok' : 'error']}
          />
          <p className="text-xs text-slate-400">
            Para quedarse en órbita hay que ir a unos 28 000 km/h. El Δv mide cuánta velocidad puede ganar tu cohete:
            más combustible ayuda, pero también pesa. Por eso los cohetes van por etapas que se sueltan al vaciarse.
          </p>
        </div>

        <SelectorPieza
          titulo="Cofia (punta del cohete)"
          piezas={deTipo('cofia')}
          valor={cohete.cofiaId}
          nivel={nivel}
          onCambiar={(cofiaId) => cambiarCohete({ cofiaId })}
        />

        {etapasDeArribaAAbajo.map(({ etapa, indice }) => (
          <div key={indice} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Etapa {indice + 1} {indice === 0 ? '(despega desde el suelo)' : ''}
              </h3>
              {cohete.etapas.length > 1 && (
                <button
                  onClick={() => cambiarCohete({ etapas: cohete.etapas.filter((_, i) => i !== indice) })}
                  className="text-sm text-slate-400 hover:text-red-300"
                >
                  Quitar etapa
                </button>
              )}
            </div>
            <SelectorPieza titulo="Motor" piezas={deTipo('motor')} valor={etapa.motorId} nivel={nivel} onCambiar={(motorId) => cambiarEtapa(indice, { motorId })} />
            <SelectorPieza titulo="Tanque" piezas={deTipo('tanque')} valor={etapa.tanqueId} nivel={nivel} onCambiar={(tanqueId) => cambiarEtapa(indice, { tanqueId })} />
          </div>
        ))}

        {cohete.etapas.length < MAX_ETAPAS && (
          <button
            onClick={() => cambiarCohete({ etapas: [...cohete.etapas, { motorId: null, tanqueId: null }] })}
            className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-300 hover:border-cyan-600"
          >
            + Añadir etapa superior
          </button>
        )}
      </div>
    </section>
  )
}

function SelectorPieza({ titulo, piezas, valor, nivel, onCambiar }) {
  const elegida = piezas.find((pieza) => pieza.id === valor)

  return (
    <label className="block space-y-1 text-sm">
      <span className="text-slate-300">{titulo}</span>
      <select
        value={valor ?? ''}
        onChange={(evento) => onCambiar(evento.target.value || null)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
      >
        <option value="">— Elegir —</option>
        {piezas.map((pieza) => (
          <option key={pieza.id} value={pieza.id} disabled={estaBloqueada(pieza, nivel)}>
            {pieza.nombre} · {formatoNumero(pieza.masaKg)} kg · {formatoDinero(pieza.coste)}
            {estaBloqueada(pieza, nivel) ? ` · 🔒 nivel ${pieza.nivelRequerido}` : ''}
          </option>
        ))}
      </select>
      {elegida && <span className="block text-xs text-slate-400">{elegida.explicacion}</span>}
    </label>
  )
}

function DibujoCohete({ etapas, tieneCofia, empresa }) {
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <div
        className={`h-0 w-0 border-x-[1.75rem] border-b-[3rem] border-x-transparent transition-opacity ${tieneCofia ? '' : 'opacity-20'}`}
        style={{ borderBottomColor: empresa.colorSecundario }}
      />
      {Array.from({ length: etapas }, (_, indice) => etapas - indice).map((numero) => (
        <div
          key={numero}
          className="flex h-20 w-14 items-center justify-center border-y border-slate-950 text-xs font-bold text-slate-950"
          style={{ backgroundColor: numero % 2 ? empresa.colorPrimario : empresa.colorSecundario }}
        >
          {numero}
        </div>
      ))}
      <div className="h-4 w-10 rounded-b-lg bg-slate-600" />
      <p className="mt-2 text-center text-xs text-slate-500">Pintado con los colores de tu empresa</p>
    </div>
  )
}
