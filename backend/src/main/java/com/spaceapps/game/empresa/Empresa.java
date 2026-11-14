package com.spaceapps.game.empresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Empresa {

    private static final int REPUTACION_INICIAL = 50;
    private static final int REPUTACION_SOCIO = 70;
    private static final int REPUTACION_NORMAL = 30;

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

    public NivelConfianza nivelConfianza() {
        if (reputacion >= REPUTACION_SOCIO) {
            return NivelConfianza.SOCIO;
        }
        return reputacion >= REPUTACION_NORMAL ? NivelConfianza.NORMAL : NivelConfianza.EN_OBSERVACION;
    }

    public void cambiarReputacion(int cambio) {
        reputacion = Math.clamp(reputacion + cambio, 0, 100);
    }

    public void pedirPrestamo(long cantidad) {
        deuda += cantidad;
    }

    public void devolverDeuda(long cantidad) {
        if (cantidad > deuda) {
            throw new IllegalStateException("La empresa " + id + " intenta devolver " + cantidad + " de una deuda de " + deuda);
        }
        deuda -= cantidad;
    }
}
