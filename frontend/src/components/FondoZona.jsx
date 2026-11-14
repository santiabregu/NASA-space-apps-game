export default function FondoZona({ imagen, posicion = 'center', capa }) {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${imagen})`, backgroundPosition: posicion }} />
      <div className="absolute inset-0" style={{ background: capa }} />
    </div>
  )
}
