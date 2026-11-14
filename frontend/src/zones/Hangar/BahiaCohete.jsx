const ANCHO_VISTA = 220
const CENTRO = ANCHO_VISTA / 2
const MARGEN_SUELO = 30
const TANQUE_VACIO = { ancho: 40, alto: 70 }
const MOTOR_VACIO = { ancho: 26, alto: 24 }

const medidasTanque = (tanque) => ({
  ancho: 30 + Math.sqrt(tanque.combustibleKg) * 0.17,
  alto: 24 + Math.sqrt(tanque.combustibleKg) * 0.75,
})

function medidasMotor(motor) {
  const ancho = 14 + Math.sqrt(motor.empujeKN) * 1.3
  return { ancho, alto: ancho * (motor.ispS >= 350 ? 1.3 : 0.85) }
}

const altoCofia = (cofia) => (cofia.capacidadKg > 500 ? 92 : 64)

function apilar(etapas, cofia) {
  const visibles = etapas.length > 0 ? etapas : [{ motor: null, tanque: null }]
  const piezas = []
  let altura = 0
  let anchoSuperior = TANQUE_VACIO.ancho

  visibles.forEach((etapa, indice) => {
    const motor = etapa.motor ? medidasMotor(etapa.motor) : MOTOR_VACIO
    piezas.push({ clave: `motor-${indice}-${etapa.motor?.id}`, forma: 'motor', pieza: etapa.motor, indice, campo: 'motorId', altura, ...motor })
    altura += motor.alto

    const tanque = etapa.tanque ? medidasTanque(etapa.tanque) : TANQUE_VACIO
    piezas.push({ clave: `tanque-${indice}-${etapa.tanque?.id}`, forma: 'tanque', pieza: etapa.tanque, indice, campo: 'tanqueId', altura, ...tanque })
    altura += tanque.alto
    anchoSuperior = tanque.ancho
  })

  const alto = cofia ? altoCofia(cofia) : 64
  piezas.push({ clave: `cofia-${cofia?.id}`, forma: 'cofia', pieza: cofia, campo: 'cofiaId', altura, ancho: anchoSuperior, alto })
  return { piezas, alturaTotal: altura + alto }
}

export default function BahiaCohete({ etapas, cofia, conSatelite, empresa, onQuitar, onVaciar }) {
  const { piezas, alturaTotal } = apilar(etapas, cofia)
  const altoVista = Math.max(420, alturaTotal + 70)
  const suelo = altoVista - MARGEN_SUELO
  const vacio = etapas.length === 0 && !cofia
  const colores = [empresa.colorPrimario, empresa.colorSecundario]

  return (
    <div className="cristal space-y-2 p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Assembly bay</h3>
        {!vacio && (
          <button onClick={onVaciar} className="text-xs text-slate-400 hover:text-red-300">Clear rocket</button>
        )}
      </div>
      <svg viewBox={`0 0 ${ANCHO_VISTA} ${altoVista}`} className="h-[28rem] w-full" role="img" aria-label="Rocket under construction">
        <defs>
          <pattern id="cohete-rejilla" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56,189,248,.12)" />
          </pattern>
          <linearGradient id="cohete-volumen" x1="0" x2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".38" />
            <stop offset=".35" stopColor="#fff" stopOpacity=".2" />
            <stop offset=".6" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".42" />
          </linearGradient>
        </defs>
        <rect width={ANCHO_VISTA} height={altoVista} fill="url(#cohete-rejilla)" />
        <line x1="0" x2={ANCHO_VISTA} y1={suelo + 8} y2={suelo + 8} stroke="rgba(148,163,184,.3)" />
        <rect x={CENTRO - 50} y={suelo} width="100" height="8" rx="2" fill="#334155" />

        {piezas.map((parte) => {
          const arriba = suelo - parte.altura - parte.alto
          return (
            <g key={parte.clave} style={{ transform: `translate(${CENTRO}px, ${arriba}px)`, transition: 'transform 400ms ease' }}>
              {parte.pieza ? (
                <g
                  className="pieza-montaje animate-encajar cursor-pointer hover:brightness-125 motion-reduce:animate-aparecer"
                  onClick={() => onQuitar(parte.indice, parte.campo)}
                >
                  <title>{`${parte.pieza.nombre} · click to remove`}</title>
                  {parte.forma === 'motor' && <Motor ancho={parte.ancho} alto={parte.alto} />}
                  {parte.forma === 'tanque' && <Tanque ancho={parte.ancho} alto={parte.alto} color={colores[parte.indice % 2]} numero={parte.indice + 1} />}
                  {parte.forma === 'cofia' && <Cofia ancho={parte.ancho} alto={parte.alto} color={empresa.colorSecundario} conSatelite={conSatelite} />}
                </g>
              ) : (
                <Hueco forma={parte.forma} ancho={parte.ancho} alto={parte.alto} />
              )}
            </g>
          )
        })}

        {vacio && (
          <text x={CENTRO} y={suelo - 190} textAnchor="middle" fontSize="11" fill="#94a3b8">
            Click an engine or a tank to start
          </text>
        )}
      </svg>
      <p className="text-xs text-slate-500">Parts stack from the ground up · click a part here to remove it</p>
    </div>
  )
}

function Motor({ ancho, alto }) {
  return (
    <>
      <rect x={-ancho * 0.28} y="0" width={ancho * 0.56} height={alto * 0.22} fill="#475569" />
      <path d={`M ${-ancho * 0.26} ${alto * 0.22} L ${ancho * 0.26} ${alto * 0.22} L ${ancho / 2} ${alto} L ${-ancho / 2} ${alto} Z`} fill="#64748b" />
      <path d={`M ${-ancho * 0.26} ${alto * 0.22} L ${ancho * 0.26} ${alto * 0.22} L ${ancho / 2} ${alto} L ${-ancho / 2} ${alto} Z`} fill="url(#cohete-volumen)" />
      <ellipse cx="0" cy={alto} rx={ancho * 0.42} ry="3" fill="#fb923c" opacity=".85" />
    </>
  )
}

function Tanque({ ancho, alto, color, numero }) {
  return (
    <>
      <rect x={-ancho / 2} y="0" width={ancho} height={alto} rx="5" fill={color} />
      <rect x={-ancho / 2} y="0" width={ancho} height={alto} rx="5" fill="url(#cohete-volumen)" />
      <rect x={-ancho / 2} y="6" width={ancho} height="3" fill="rgba(2,6,23,.35)" />
      <rect x={-ancho / 2} y={alto - 9} width={ancho} height="3" fill="rgba(2,6,23,.35)" />
      <text x="0" y={alto / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#020617">{numero}</text>
    </>
  )
}

const caminoCofia = (ancho, alto) =>
  `M ${-ancho / 2} ${alto} L ${-ancho / 2} ${alto * 0.62} C ${-ancho / 2} ${alto * 0.2}, ${-ancho * 0.15} 0, 0 0 ` +
  `C ${ancho * 0.15} 0, ${ancho / 2} ${alto * 0.2}, ${ancho / 2} ${alto * 0.62} L ${ancho / 2} ${alto} Z`

function Cofia({ ancho, alto, color, conSatelite }) {
  return (
    <>
      <path d={caminoCofia(ancho, alto)} fill={color} opacity=".9" />
      <path d={caminoCofia(ancho, alto)} fill="url(#cohete-volumen)" />
      {conSatelite && (
        <g opacity=".6">
          <rect x="-5" y={alto * 0.55} width="10" height="13" fill="#facc15" />
          <rect x="-15" y={alto * 0.55 + 4} width="8" height="5" fill="#38bdf8" />
          <rect x="7" y={alto * 0.55 + 4} width="8" height="5" fill="#38bdf8" />
        </g>
      )}
    </>
  )
}

function Hueco({ forma, ancho, alto }) {
  const trazo = { fill: 'none', stroke: 'rgba(34,211,238,.45)', strokeDasharray: '4 4' }
  if (forma === 'cofia') return <path d={caminoCofia(ancho, alto)} {...trazo} />
  if (forma === 'motor') {
    return <path d={`M ${-ancho * 0.26} 0 L ${ancho * 0.26} 0 L ${ancho / 2} ${alto} L ${-ancho / 2} ${alto} Z`} {...trazo} />
  }
  return <rect x={-ancho / 2} y="0" width={ancho} height={alto} rx="5" {...trazo} />
}
