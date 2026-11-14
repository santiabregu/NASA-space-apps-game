export const MAX_ETAPAS = 3

export function disenoInicial(mision) {
  return {
    orbitaId: mision.orbitasPermitidas[0],
    satelite: { estructuraId: null, componentes: [] },
    cohete: { cofiaId: null, etapas: [{ motorId: null, tanqueId: null }] },
  }
}

export function resolverDiseno(diseno, { piezasPorId, orbitasPorId }) {
  const pieza = (id) => piezasPorId[id] ?? null
  return {
    orbita: orbitasPorId[diseno.orbitaId],
    estructura: pieza(diseno.satelite.estructuraId),
    componentes: diseno.satelite.componentes.map(pieza),
    cofia: pieza(diseno.cohete.cofiaId),
    etapas: diseno.cohete.etapas.map((etapa) => ({ motor: pieza(etapa.motorId), tanque: pieza(etapa.tanqueId) })),
  }
}

export function piezasDelDiseno(resuelto) {
  return [
    resuelto.estructura,
    ...resuelto.componentes,
    resuelto.cofia,
    ...resuelto.etapas.flatMap((etapa) => [etapa.motor, etapa.tanque]),
  ].filter(Boolean)
}

export const costeTotal = (piezas) => piezas.reduce((total, pieza) => total + pieza.coste, 0)

const MESES_INTEGRACION = 1

export function mesesDesarrollo(piezas) {
  if (piezas.length === 0) return 0
  return Math.max(...piezas.map((pieza) => pieza.mesesDesarrollo)) + MESES_INTEGRACION
}

export function faltasDeDiseno(resuelto) {
  const faltas = []
  if (!resuelto.estructura) faltas.push('Choose the satellite structure in the Lab')
  if (!resuelto.cofia) faltas.push('Choose a fairing in the Workshop')
  if (resuelto.etapas.some((etapa) => !etapa.motor || !etapa.tanque)) {
    faltas.push('Every rocket stage needs an engine and a tank')
  }
  return faltas
}
