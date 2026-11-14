package com.spaceapps.game.empresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Empresa {

    private static final int REPUTACION_INICIAL = 50;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String colorPrimario = "#22d3ee";

    @Column(nullable = false)
    private String colorSecundario = "#f8fafc";

    @Column(nullable = false)
    private int reputacion = REPUTACION_INICIAL;

    @Column(nullable = false)
    private long deuda;

    protected Empresa() {
    }

    public Empresa(String nombre) {
        this.nombre = nombre;
    }

    public String getNombre() {
        return nombre;
    }

    public String getColorPrimario() {
        return colorPrimario;
    }

    public String getColorSecundario() {
        return colorSecundario;
    }

    public int getReputacion() {
        return reputacion;
    }

    public long getDeuda() {
        return deuda;
    }
}
