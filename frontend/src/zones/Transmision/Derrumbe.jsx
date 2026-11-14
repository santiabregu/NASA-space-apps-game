import { useMemo } from 'react'

const ANCHO_LADRILLO = 80
const ALTO_LADRILLO = 40
// La rotura empieza donde estaba el botón y tarda MS_ONDA en llegar a las esquinas.
const MS_ONDA = 700
const MS_AZAR = 150
const GIRO_MAXIMO = 40
const DERIVA_MAXIMA = 60

// Parte la ventana en un muro de ladrillos: las filas impares van desplazadas medio ladrillo.
function muroDeLadrillos(ancho, alto) {
  const impacto = { x: ancho / 2, y: alto * 0.85 }
  const distanciaMaxima = Math.hypot(ancho / 2, alto * 0.85)
  const ladrillos = []
  for (let fila = 0; fila * ALTO_LADRILLO < alto; fila++) {
    const desplazamiento = fila % 2 === 0 ? 0 : -ANCHO_LADRILLO / 2
    for (let x = desplazamiento; x < ancho; x += ANCHO_LADRILLO) {
      const y = fila * ALTO_LADRILLO
      const distancia = Math.hypot(x + ANCHO_LADRILLO / 2 - impacto.x, y + ALTO_LADRILLO / 2 - impacto.y)
      ladrillos.push({
        clave: `${fila}-${x}`,
        x,
        y,
        retraso: Math.round((distancia / distanciaMaxima) * MS_ONDA + Math.random() * MS_AZAR),
        giro: Math.round((Math.random() * 2 - 1) * GIRO_MAXIMO),
        deriva: Math.round((Math.random() * 2 - 1) * DERIVA_MAXIMA),
      })
    }
  }
  return ladrillos
}

// La escena pixelada se rompe en ladrillos que caen y dejan ver la web que hay debajo.
export default function Derrumbe({ escena, onTerminado }) {
  const ladrillos = useMemo(() => muroDeLadrillos(innerWidth, innerHeight), [])
  const ultimo = ladrillos.reduce((mayor, ladrillo) => (ladrillo.retraso > mayor.retraso ? ladrillo : mayor))

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {ladrillos.map((ladrillo) => (
        <div
          key={ladrillo.clave}
          className="absolute motion-safe:animate-caer motion-reduce:animate-desvanecer"
          onAnimationEnd={ladrillo === ultimo ? onTerminado : undefined}
          style={{
            left: ladrillo.x,
            top: ladrillo.y,
            width: ANCHO_LADRILLO,
            height: ALTO_LADRILLO,
            backgroundImage: `url(${escena})`,
            backgroundSize: `${innerWidth}px ${innerHeight}px`,
            backgroundPosition: `${-ladrillo.x}px ${-ladrillo.y}px`,
            boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.6)',
            animationDelay: `${ladrillo.retraso}ms`,
            '--giro': `${ladrillo.giro}deg`,
            '--deriva': `${ladrillo.deriva}px`,
          }}
        />
      ))}
    </div>
  )
}
