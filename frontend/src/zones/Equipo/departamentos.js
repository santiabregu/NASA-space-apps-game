import { Coins, Cpu, Rocket, Satellite } from 'lucide-react'
import { formatoDinero } from '../../formato.js'

// En el orden fijo en que juegan, igual que el enum Departamento del servidor.
export const DEPARTAMENTOS = [
  {
    id: 'FINANCIACION',
    nombre: 'Finance',
    Icono: Coins,
    color: '#ffec27',
    descripcion: 'Raise the money: catch coins and answer flash questions. Your budget decides what the others can buy.',
  },
  {
    id: 'SOFTWARE',
    nombre: 'Software',
    Icono: Cpu,
    color: '#00e436',
    descripcion: 'Wire the telescope: connect sensors, computer and antenna, then answer flash questions.',
  },
  {
    id: 'SATELITE',
    nombre: 'Satellite build',
    Icono: Satellite,
    color: '#29adff',
    descripcion: 'Build the space telescope with the parts the Government gives you. The rest of the team votes.',
  },
  {
    id: 'COHETE',
    nombre: 'Rocket build',
    Icono: Rocket,
    color: '#ff77a8',
    descripcion: 'Build a rocket that can carry the telescope all the way to its orbit. The rest of the team votes.',
  },
]

export const responsableDe = (sala, departamentoId) =>
  sala.miembros.find((miembro) => miembro.departamentos.includes(departamentoId))

// Una línea con lo que consiguió cada departamento, tal como lo evaluó el servidor.
export function resumenResultado(departamentoId, resultado) {
  const datos = resultado?.datos ?? {}
  if (departamentoId === 'FINANCIACION') return `Budget ${formatoDinero(datos.presupuesto ?? 0)}`
  if (departamentoId === 'SOFTWARE') return `Reliability ${datos.fiabilidad ?? 0}%`
  return `Parts ${formatoDinero(datos.coste ?? 0)}${datos.sobrePresupuesto ? ' · over budget' : ''}`
}
