const ANCHO_VISTA = 300
const ALTO_VISTA = 270
const CX = ANCHO_VISTA / 2
const CY = 132
const FILAS = 4
const SEPARACION = 4
const RELLENO = 6

const ESTILO_TIPO = {
  panel: { color: '#38bdf8', icono: '☀️' },
  bateria: { color: '#34d399', icono: '🔋' },
  ordenador: { color: '#a78bfa', icono: '🧠' },
  antena: { color: '#f472b6', icono: '📡' },
  actitud: { color: '#fbbf24', icono: '🌀' },
  instrumento: { color: '#fb923c', icono: '🔭' },
}

function formatoCuerpo(estructura) {
  const columnas = Math.ceil(estructura.huecos / FILAS)
  return { columnas, ancho: 18 + columnas * 36, alto: estructura.huecos > 8 ? 112 : 104 }
}

function medidasAla(panel) {
  if (panel.potenciaW <= 3) return { ancho: 20, alto: 30 }
  if (panel.potenciaW <= 10) return { ancho: 56, alto: 30 }
  return { ancho: 84, alto: 44 }
}

const conIndice = (componentes, tipo) =>
  componentes.map((componente, indice) => ({ componente, indice })).filter(({ componente }) => componente.tipo === tipo)

const repartir = (cantidad, posicion, espacio) => (posicion - (cantidad - 1) / 2) * espacio

function zoom(estructura) {
  const escala = estructura.huecos <= 4 ? 1.5 : estructura.huecos <= 8 ? 1.3 : 1
  return `translate(${CX} ${CY}) scale(${escala}) translate(${-CX} ${-CY})`
}

export default function BahiaSatelite({ estructura, componentes, onQuitar, onVaciar }) {
  return (
    <div className="cristal space-y-2 p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Assembly bay</h3>
        {componentes.length > 0 && (
          <button onClick={onVaciar} className="text-xs text-slate-400 hover:text-red-300">Remove all</button>
        )}
      </div>
      <svg viewBox={`0 0 ${ANCHO_VISTA} ${ALTO_VISTA}`} className="w-full" role="img" aria-label="Satellite under construction">
        <defs>
          <pattern id="satelite-rejilla" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56,189,248,.12)" />
          </pattern>
        </defs>
        <rect width={ANCHO_VISTA} height={ALTO_VISTA} fill="url(#satelite-rejilla)" />
        {estructura ? (
          <g transform={zoom(estructura)}>
            <Satelite estructura={estructura} componentes={componentes} onQuitar={onQuitar} />
          </g>
        ) : (
          <>
            <rect x={CX - 26} y={CY - 52} width="52" height="104" rx="4" fill="none" stroke="rgba(34,211,238,.45)" strokeDasharray="4 4" />
            <text x={CX} y={CY + 76} textAnchor="middle" fontSize="11" fill="#94a3b8">Choose a structure to start</text>
          </>
        )}
      </svg>
      <p className="text-xs text-slate-500">Each component takes one slot · click a part here to remove it</p>
    </div>
  )
}

function Satelite({ estructura, componentes, onQuitar }) {
  const cuerpo = formatoCuerpo(estructura)
  const izquierda = CX - cuerpo.ancho / 2
  const derecha = CX + cuerpo.ancho / 2
  const arriba = CY - cuerpo.alto / 2
  const abajo = CY + cuerpo.alto / 2
  const anchoHueco = (cuerpo.ancho - 2 * RELLENO - (cuerpo.columnas - 1) * SEPARACION) / cuerpo.columnas
  const altoHueco = (cuerpo.alto - 2 * RELLENO - (FILAS - 1) * SEPARACION) / FILAS

  const paneles = conIndice(componentes, 'panel')
  const antenas = conIndice(componentes, 'antena')
  const instrumentos = conIndice(componentes, 'instrumento')
  const apuntados = instrumentos.filter(({ componente }) => componente.requiereApuntado)
  const sinApuntar = instrumentos.filter(({ componente }) => !componente.requiereApuntado)

  return (
    <>
      {paneles.map(({ componente, indice }, posicion) => {
        const ala = medidasAla(componente)
        const aLaIzquierda = posicion % 2 === 0
        const y = CY - 24 + Math.floor(posicion / 2) * 42 - ala.alto / 2
        const x = aLaIzquierda ? izquierda - 6 - ala.ancho : derecha + 6
        return (
          <Pieza key={`ala-${indice}-${componente.id}`} pieza={componente} onQuitar={() => onQuitar(indice)}>
            <line x1={aLaIzquierda ? izquierda : derecha} x2={aLaIzquierda ? x + ala.ancho : x} y1={y + ala.alto / 2} y2={y + ala.alto / 2} stroke="#94a3b8" strokeWidth="2" />
            <rect x={x} y={y} width={ala.ancho} height={ala.alto} fill="#1e3a8a" stroke="#60a5fa" />
            {Array.from({ length: Math.floor(ala.ancho / 10) }, (_, i) => (
              <line key={i} x1={x + (i + 1) * 10} x2={x + (i + 1) * 10} y1={y} y2={y + ala.alto} stroke="#60a5fa" strokeOpacity=".5" />
            ))}
          </Pieza>
        )
      })}

      {antenas.map(({ componente, indice }, posicion) => {
        const x = CX + repartir(antenas.length, posicion, 26)
        const radio = componente.tasaMbps < 0.1 ? 0 : 8 + Math.log10(componente.tasaMbps * 10) * 3
        return (
          <Pieza key={`antena-${indice}-${componente.id}`} pieza={componente} onQuitar={() => onQuitar(indice)}>
            {radio === 0 ? (
              <>
                <line x1={x} x2={x} y1={arriba} y2={arriba - 30} stroke="#e2e8f0" strokeWidth="2" />
                <circle cx={x} cy={arriba - 31} r="2.5" fill="#f472b6" />
              </>
            ) : (
              <>
                <line x1={x} x2={x} y1={arriba} y2={arriba - 10} stroke="#e2e8f0" strokeWidth="2" />
                <path d={`M ${x - radio} ${arriba - 10 - radio * 0.6} Q ${x} ${arriba - 4} ${x + radio} ${arriba - 10 - radio * 0.6} Z`} fill="#e2e8f0" stroke="#f472b6" />
              </>
            )}
          </Pieza>
        )
      })}

      {apuntados.map(({ componente, indice }, posicion) => {
        const x = CX + repartir(apuntados.length, posicion, 28)
        const lente = 4 + Math.sqrt(componente.datosPorDiaMB) / 8
        return (
          <Pieza key={`instrumento-${indice}-${componente.id}`} pieza={componente} onQuitar={() => onQuitar(indice)}>
            <rect x={x - lente - 3} y={abajo} width={2 * lente + 6} height="7" fill="#475569" />
            <circle cx={x} cy={abajo + 7 + lente * 0.6} r={lente} fill="#0f172a" stroke="#fb923c" strokeWidth="2" />
          </Pieza>
        )
      })}

      {sinApuntar.map(({ componente, indice }, posicion) => (
        <Pieza key={`brazo-${indice}-${componente.id}`} pieza={componente} onQuitar={() => onQuitar(indice)}>
          <line x1={derecha} y1={abajo - 6 - posicion * 14} x2={derecha + 30} y2={abajo + 14 - posicion * 14} stroke="#94a3b8" strokeWidth="2" />
          <circle cx={derecha + 32} cy={abajo + 16 - posicion * 14} r="4" fill="#f472b6" />
        </Pieza>
      ))}

      <g key={`cuerpo-${estructura.id}`} className="pieza-montaje animate-encajar motion-reduce:animate-aparecer">
        <rect x={izquierda} y={arriba} width={cuerpo.ancho} height={cuerpo.alto} rx="4" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
        {Array.from({ length: estructura.huecos }, (_, hueco) => {
          const x = izquierda + RELLENO + (hueco % cuerpo.columnas) * (anchoHueco + SEPARACION)
          const y = arriba + RELLENO + Math.floor(hueco / cuerpo.columnas) * (altoHueco + SEPARACION)
          return (
            <rect key={hueco} x={x} y={y} width={anchoHueco} height={altoHueco} rx="2" fill="none" stroke="rgba(148,163,184,.35)" strokeDasharray="3 3" />
          )
        })}
      </g>

      {componentes.map((componente, indice) => {
        const x = izquierda + RELLENO + (indice % cuerpo.columnas) * (anchoHueco + SEPARACION)
        const y = arriba + RELLENO + Math.floor(indice / cuerpo.columnas) * (altoHueco + SEPARACION)
        const estilo = ESTILO_TIPO[componente.tipo]
        return (
          <Pieza key={`hueco-${indice}-${componente.id}`} pieza={componente} onQuitar={() => onQuitar(indice)}>
            <rect x={x} y={y} width={anchoHueco} height={altoHueco} rx="2" fill={estilo.color} fillOpacity=".85" />
            <text x={x + anchoHueco / 2} y={y + altoHueco / 2 + 4} textAnchor="middle" fontSize="11">{estilo.icono}</text>
          </Pieza>
        )
      })}
    </>
  )
}

function Pieza({ pieza, onQuitar, children }) {
  return (
    <g className="pieza-montaje animate-encajar cursor-pointer hover:brightness-125 motion-reduce:animate-aparecer" onClick={onQuitar}>
      <title>{`${pieza.nombre} · click to remove`}</title>
      {children}
    </g>
  )
}
