package com.spaceapps.game.jugador;

import java.time.Instant;

import com.spaceapps.game.empresa.Empresa;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
}
