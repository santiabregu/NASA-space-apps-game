package com.spaceapps.game.jugador;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import com.spaceapps.game.empresa.Empresa;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.OneToOne;

@Entity
public class Jugador {

    private static final long DINERO_INICIAL = 10_000_000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, unique = true)
    private String nombreUsuario;

    @Column(nullable = false)
    private long dinero;

    @Column(nullable = false)
    private Instant creadoEn;

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

    protected Jugador() {
    }

    public Jugador(String email, String passwordHash, String nombreUsuario, Empresa empresa) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nombreUsuario = nombreUsuario;
        this.empresa = empresa;
        this.dinero = DINERO_INICIAL;
        this.creadoEn = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public long getDinero() {
        return dinero;
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

    public Map<String, Integer> getMejorPuntuacionPorMision() {
        return Map.copyOf(mejorPuntuacionPorMision);
    }

    public void registrarMisionTerminada(String misionId, int puntuacion) {
        mejorPuntuacionPorMision.merge(misionId, puntuacion, Math::max);
    }
}
