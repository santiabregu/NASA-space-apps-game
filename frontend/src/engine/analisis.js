import { deltaV, relacionEmpujePeso } from './cohete.js'
import { costeTotal, faltasDeDiseno, mesesDesarrollo, piezasDelDiseno, resolverDiseno } from './diseno.js'
import { calcularRecursos } from './recursos.js'
import { analizarSatelite } from './satelite.js'

export function analizarDiseno({ diseno, catalogo, mision, dinero }) {
  const resuelto = resolverDiseno(diseno, catalogo)
  const satelite = analizarSatelite(resuelto, resuelto.orbita)
  const piezas = piezasDelDiseno(resuelto)
  const coste = costeTotal(piezas)
  const meses = mesesDesarrollo(piezas)
  const cargaUtilKg = satelite.masaKg + (resuelto.cofia?.masaKg ?? 0)

  return {
    resuelto,
    satelite,
    piezas,
    coste,
    meses,
    cargaUtilKg,
    deltaV: deltaV(resuelto.etapas, cargaUtilKg),
    empujePeso: relacionEmpujePeso(resuelto.etapas, cargaUtilKg),
    faltas: faltasDeDiseno(resuelto),
    recursos: calcularRecursos({ resuelto, satelite, mision, dinero, coste, meses }),
  }
}
