package com.spaceapps.game.amigos;

import java.time.Instant;

import com.spaceapps.game.jugador.Jugador;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

// Una solicitud de amistad; al aceptarla pasa a ser una amistad entre los dos jugadores.
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = { "solicitante_id", "destinatario_id" }))
class Amistad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Jugador solicitante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Jugador destinatario;

    private boolean aceptada;

    @Column(nullable = false)
    private Instant creadaEn;

    protected Amistad() {
    }

    Amistad(Jugador solicitante, Jugador destinatario) {
        this.solicitante = solicitante;
        this.destinatario = destinatario;
        this.creadaEn = Instant.now();
    }

    Long getId() {
        return id;
    }

    Jugador getSolicitante() {
        return solicitante;
    }

    Jugador getDestinatario() {
        return destinatario;
    }

    boolean isAceptada() {
        return aceptada;
    }

    void aceptar() {
        aceptada = true;
    }

    boolean participa(long jugadorId) {
        return solicitante.getId() == jugadorId || destinatario.getId() == jugadorId;
    }

    Jugador otro(long jugadorId) {
        return solicitante.getId() == jugadorId ? destinatario : solicitante;
    }
}
