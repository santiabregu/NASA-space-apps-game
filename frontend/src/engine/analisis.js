import { apogeoKm, deltaV, relacionEmpujePeso } from './cohete.js'
import { costeTotal, faltasDeDiseno, mesesDesarrollo, piezasDelDiseno, piezasQueFaltan, resolverDiseno } from './diseno.js'
import { calcularRecursos } from './recursos.js'
import { analizarSatelite } from './satelite.js'

// Vuelos de la campaña que suben y caen al mar, sin satélite ni órbita.
export const esSuborbital = (mision) => mision.objetivo === 'SUBORBITAL'

export function analizarDiseno({ diseno, catalogo, mision, dinero, inventario }) {
  const suborbital = esSuborbital(mision)
  const resuelto = resolverDiseno(diseno, catalogo)
  const satelite = analizarSatelite(resuelto, resuelto.orbita)
  const piezas = piezasDelDiseno(resuelto)
  const aComprar = piezasQueFaltan(piezas, inventario)
  const costeCompra = costeTotal(aComprar)
  const meses = mesesDesarrollo(piezas)
  const cargaUtilKg = satelite.masaKg + (resuelto.cofia?.masaKg ?? 0)

  return {
    suborbital,
    resuelto,
    satelite,
    piezas,
    aComprar,
    costeCompra,
    meses,
    cargaUtilKg,
    deltaV: deltaV(resuelto.etapas, cargaUtilKg),
    empujePeso: relacionEmpujePeso(resuelto.etapas, cargaUtilKg),
    apogeoKm: apogeoKm(resuelto.etapas, cargaUtilKg),
    faltas: faltasDeDiseno(resuelto, suborbital),
    recursos: calcularRecursos({ resuelto, satelite, mision, dinero, costeCompra, meses, suborbital }),
  }
}
