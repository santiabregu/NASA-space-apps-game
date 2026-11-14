package com.spaceapps.game.mision;

import java.time.Instant;
import java.util.List;

import org.hibernate.annotations.ColumnDefault;

import com.spaceapps.game.jugador.Jugador;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;

@Entity
class Lanzamiento {

    private static final String SEPARADOR_PIEZAS = ",";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Jugador jugador;

    @Column(nullable = false)
    private String misionId;

    @Column(nullable = false)
    private Instant fecha;

    private boolean exito;
    private int puntuacion;
    private long costePagado;
    private long prestamo;
    private long dineroGanado;
    private long deudaDevuelta;
    private int xpGanada;
    private int cambioReputacion;
    private String destinoAlcanzado;
    // Los valores por defecto permiten añadir estas columnas a una base que ya tiene lanzamientos.
    @ColumnDefault("0")
    private long financiacion;

    @ColumnDefault("0")
    private int mesJuego;

    @Column(nullable = false, length = 2000)
    private String piezas;

    // JSON de InformeLanzamiento.
    @Lob
    @Column(nullable = false)
    private String informe;

    protected Lanzamiento() {
    }

    Lanzamiento(Jugador jugador, String misionId, LanzamientoResponse resultado, boolean exito, int puntuacion,
            List<String> piezas, String informe) {
        this.jugador = jugador;
        this.misionId = misionId;
        this.fecha = Instant.now();
        this.exito = exito;
        this.puntuacion = puntuacion;
        this.costePagado = resultado.costePagado();
        this.prestamo = resultado.prestamo();
        this.dineroGanado = resultado.dineroGanado();
        this.deudaDevuelta = resultado.deudaDevuelta();
        this.xpGanada = resultado.xpGanada();
        this.cambioReputacion = resultado.cambioReputacion();
        this.destinoAlcanzado = resultado.destinoAlcanzado();
        this.financiacion = resultado.financiacion();
        this.mesJuego = resultado.mesJuego();
        this.piezas = String.join(SEPARADOR_PIEZAS, piezas);
        this.informe = informe;
    }

    String getInforme() {
        return informe;
    }

    LanzamientoResumen resumen(InformeLanzamiento informeLeido) {
        return new LanzamientoResumen(id, misionId, fecha, exito, puntuacion, costePagado, prestamo, dineroGanado,
                deudaDevuelta, xpGanada, cambioReputacion, destinoAlcanzado, financiacion, mesJuego, List.of(piezas.split(SEPARADOR_PIEZAS)), informeLeido);
    }
}
