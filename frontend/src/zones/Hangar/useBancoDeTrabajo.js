import { useMemo, useState } from 'react'
import { analizarDiseno } from '../../engine/analisis.js'
import { efectosDelCambio } from '../../engine/efectos.js'

// Lo que comparten el Hangar y la construcción en equipo: el análisis del diseño, la ficha de la última pieza
// tocada y la vista previa al pasar por encima de una pieza.
export function useBancoDeTrabajo({ catalogo, mision, diseno, dinero, inventario, onCambiarDiseno }) {
  const [ficha, setFicha] = useState(null)
  const [previa, setPrevia] = useState(null)
  const analisis = useMemo(
    () => mision && analizarDiseno({ diseno, catalogo, mision, dinero, inventario }),
    [diseno, catalogo, mision, dinero, inventario],
  )

  const analizar = (otroDiseno) => analizarDiseno({ diseno: otroDiseno, catalogo, mision, dinero, inventario })

  function aplicarCambio(nuevoDiseno, pieza, accion) {
    setPrevia(null)
    setFicha(pieza ? { pieza, accion, efectos: efectosDelCambio(analisis, analizar(nuevoDiseno)) } : null)
    onCambiarDiseno(nuevoDiseno)
  }

  function limpiar() {
    setFicha(null)
    setPrevia(null)
  }

  return {
    analisis,
    ficha,
    previa,
    limpiar,
    aplicarCambio,
    previsualizar: (disenoPosible, pieza) => setPrevia({ pieza, analisis: analizar(disenoPosible) }),
    finPrevisualizar: () => setPrevia(null),
  }
}
