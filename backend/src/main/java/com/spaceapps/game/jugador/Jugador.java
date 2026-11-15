package com.spaceapps.game.jugador;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.hibernate.annotations.ColumnDefault;

import com.spaceapps.game.catalogo.KitInicial;
import com.spaceapps.game.empresa.Empresa;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.OneToOne;

@Entity
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombreUsuario;

    // Nombre y empresa normalizados: es lo que identifica la partida al volver a entrar, y no puede repetirse.
    // Admite null solo para que la columna pueda añadirse a una base que ya tiene jugadores.
    @Column(unique = true)
    private String clave;

    @Column(nullable = false)
    private long dinero;

    @Column(nullable = false)
    private Instant creadoEn;

    // Los valores por defecto permiten añadir estas columnas a una base que ya tiene jugadores.
    @ColumnDefault("false")
    private boolean introVista;

    // Reloj de la campaña en meses de juego: cada lanzamiento real lo avanza.
    @ColumnDefault("0")
    private int mesActual;

    @ColumnDefault("12")
    private int mesLimite;

    // Los fallos en misiones de equipo cuestan días, no meses: aquí se acumulan hasta completar un mes.
    @ColumnDefault("0")
    private int diasPerdidos;

    // Misiones de equipo ganadas con al menos un amigo en la sala: deciden el final junto con el reloj.
    @ColumnDefault("0")
    private int misionesConAmigos;

    // Se fija una sola vez, al llegar al último destino o al agotarse el reloj; después se sigue en modo libre.
    @Enumerated(EnumType.STRING)
    private FinalCampana finalCampana;

    @ColumnDefault("false")
    private boolean finalVisto;

    @Embedded
    private Perfil perfil = new Perfil();

    @Embedded
    private Conocimiento conocimiento = new Conocimiento();

    @OneToOne(cascade = CascadeType.ALL, optional = false)
    private Empresa empresa;

    // EAGER porque /api/jugador/me lo serializa fuera de una transacción.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "mision_terminada", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "mision_id")
    @Column(name = "mejor_puntuacion", nullable = false)
    private Map<String, Integer> mejorPuntuacionPorMision = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "inventario_pieza", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "pieza_id")
    @Column(name = "cantidad", nullable = false)
    private Map<String, Integer> inventario = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "destino_alcanzado", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "destino_id")
    @Column(name = "mes_juego", nullable = false)
    private Map<String, Integer> mesPorDestinoAlcanzado = new HashMap<>();

    protected Jugador() {
    }

    public Jugador(String nombreUsuario, Empresa empresa, KitInicial kit, int mesLimite) {
        this.nombreUsuario = nombreUsuario;
        this.clave = clave(nombreUsuario, empresa.getNombre());
        this.empresa = empresa;
        this.dinero = kit.dinero();
        this.inventario.putAll(kit.piezas());
        this.mesLimite = mesLimite;
        // En milisegundos para que el valor que va en el token coincida exactamente con el guardado en la base.
        this.creadoEn = Instant.now().truncatedTo(ChronoUnit.MILLIS);
    }

    public Long getId() {
        return id;
    }

    // Sin distinguir mayúsculas ni espacios de más: "Ana  " de "orbital corp" es la misma partida que "ana" de "Orbital Corp".
    // El salto de línea no puede quedar dentro de ninguna de las dos partes, así que separa sin ambigüedad.
    public static String clave(String nombreUsuario, String nombreEmpresa) {
        return normalizar(nombreUsuario) + "\n" + normalizar(nombreEmpresa);
    }

    // Para los jugadores creados antes de que existiera la clave.
    void completarClave() {
        clave = clave(nombreUsuario, empresa.getNombre());
    }

    private static String normalizar(String texto) {
        return texto.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public long getDinero() {
        return dinero;
    }

    public boolean isIntroVista() {
        return introVista;
    }

    public int getMesActual() {
        return mesActual;
    }

    public int getMesLimite() {
        return mesLimite;
    }

    public int getDiasPerdidos() {
        return diasPerdidos;
    }

    public int getMisionesConAmigos() {
        return misionesConAmigos;
    }

    public FinalCampana getFinalCampana() {
        return finalCampana;
    }

    public boolean isFinalVisto() {
        return finalVisto;
    }

    public Perfil getPerfil() {
        return perfil;
    }

    public Conocimiento getConocimiento() {
        return conocimiento;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public void pagar(long cantidad) {
        if (cantidad > dinero) {
            throw new IllegalStateException("El jugador " + id + " no puede pagar " + cantidad + " con " + dinero);
        }
        dinero -= cantidad;
    }

    public void cobrar(long cantidad) {
        dinero += cantidad;
    }

    public void marcarIntroVista() {
        introVista = true;
    }

    public void avanzarReloj(int meses) {
        mesActual += meses;
    }

    public void perderDias(int dias, int diasPorMes) {
        diasPerdidos += dias;
        avanzarReloj(diasPerdidos / diasPorMes);
        diasPerdidos %= diasPorMes;
    }

    public void registrarMisionConAmigos() {
        misionesConAmigos++;
    }

    // Llamar tras cada cambio de reloj o de destinos. Llegar al último destino manda sobre el reloj:
    // a tiempo si lo alcanzó en el mes límite o antes; si no llegó y el reloj está en el límite, ya no queda tiempo.
    public void comprobarFinal(String ultimoDestinoId, int misionesConAmigosNecesarias) {
        if (finalCampana != null) {
            return;
        }
        boolean conAmigos = misionesConAmigos >= misionesConAmigosNecesarias;
        Integer mesDeLlegada = mesPorDestinoAlcanzado.get(ultimoDestinoId);
        if (mesDeLlegada != null) {
            finalCampana = FinalCampana.de(mesDeLlegada <= mesLimite, conAmigos);
        } else if (mesActual >= mesLimite) {
            finalCampana = FinalCampana.de(false, conAmigos);
        }
    }

    public void marcarFinalVisto() {
        if (finalCampana == null) {
            throw new IllegalStateException("El jugador " + id + " aún no ha llegado a ningún final");
        }
        finalVisto = true;
    }

    public Map<String, Integer> getMejorPuntuacionPorMision() {
        return Map.copyOf(mejorPuntuacionPorMision);
    }

    public void registrarMisionTerminada(String misionId, int puntuacion) {
        mejorPuntuacionPorMision.merge(misionId, puntuacion, Math::max);
    }

    public Map<String, Integer> getInventario() {
        return Map.copyOf(inventario);
    }

    // Las piezas del diseño que el inventario no cubre, contando las repetidas.
    public List<String> piezasQueFaltan(List<String> piezaIds) {
        Map<String, Integer> disponibles = new HashMap<>(inventario);
        List<String> faltan = new ArrayList<>();
        for (String piezaId : piezaIds) {
            if (disponibles.getOrDefault(piezaId, 0) > 0) {
                disponibles.merge(piezaId, -1, Integer::sum);
            } else {
                faltan.add(piezaId);
            }
        }
        return faltan;
    }

    public void anadirPiezas(List<String> piezaIds) {
        piezaIds.forEach(piezaId -> inventario.merge(piezaId, 1, Integer::sum));
    }

    public void consumirPiezas(List<String> piezaIds) {
        if (!piezasQueFaltan(piezaIds).isEmpty()) {
            throw new IllegalStateException("El jugador " + id + " no tiene en el inventario todas las piezas de " + piezaIds);
        }
        // Las cantidades a cero se borran para que el inventario solo liste lo que hay.
        piezaIds.forEach(piezaId -> inventario.computeIfPresent(piezaId, (clave, cantidad) -> cantidad > 1 ? cantidad - 1 : null));
    }

    public Map<String, Integer> getMesPorDestinoAlcanzado() {
        return Map.copyOf(mesPorDestinoAlcanzado);
    }

    // Un destino null es el punto de partida, que todos tienen.
    public boolean haAlcanzado(String destinoId) {
        return destinoId == null || mesPorDestinoAlcanzado.containsKey(destinoId);
    }

    // Devuelve si es la primera vez: solo entonces hay ronda de financiación.
    public boolean alcanzarDestino(String destinoId) {
        return mesPorDestinoAlcanzado.putIfAbsent(destinoId, mesActual) == null;
    }
}
