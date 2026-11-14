package com.spaceapps.game.equipo;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.MissingNode;

// Nota de equipo de 0 a 100: fases entregadas a tiempo (40), rapidez al entregar (30),
// si los constructores hicieron caso a los votos (20) y presupuesto sobrante (10).
public record Teamwork(
        int total,
        int estrellas,
        int entregadas,
        int puntosEntrega,
        int porcentajeRapidez,
        int puntosRapidez,
        int votosSeguidos,
        int votosTotales,
        int puntosVotos,
        long sobrante,
        int puntosPresupuesto) {

    private static final int PUNTOS_ENTREGA = 40;
    private static final int PUNTOS_RAPIDEZ = 30;
    private static final int PUNTOS_VOTOS = 20;
    private static final int PUNTOS_PRESUPUESTO = 10;
    // Con un 25 % del presupuesto sin gastar ya se consiguen todos los puntos de ahorro.
    private static final double SOBRANTE_IDEAL = 0.25;

    static Teamwork de(Map<Departamento, Sala.Resultado> resultados) {
        int fases = Departamento.values().length;
        int entregadas = (int) resultados.values().stream().filter(resultado -> !resultado.caducado()).count();
        double rapidez = resultados.values().stream().mapToDouble(Sala.Resultado::tiempoRestante).sum() / fases;

        int votosTotales = 0;
        int votosSeguidos = 0;
        for (Departamento departamento : new Departamento[] { Departamento.SATELITE, Departamento.COHETE }) {
            Sala.Resultado resultado = resultados.get(departamento);
            if (resultado == null) {
                continue;
            }
            Set<String> instaladas = piezasInstaladas(datos(resultados, departamento).path("diseno"));
            votosTotales += resultado.votos().size();
            // Si la fase caducó, la regla ya instala las más votadas: cuentan como seguidas.
            votosSeguidos += resultado.caducado()
                    ? resultado.votos().size()
                    : (int) resultado.votos().keySet().stream().filter(instaladas::contains).count();
        }
        double votos = votosTotales == 0 ? 1 : (double) votosSeguidos / votosTotales;

        long presupuesto = datos(resultados, Departamento.FINANCIACION).path("presupuesto").longValue(0);
        long gastado = datos(resultados, Departamento.SATELITE).path("coste").longValue(0)
                + datos(resultados, Departamento.COHETE).path("coste").longValue(0);
        long sobrante = Math.max(0, presupuesto - gastado);
        double ahorro = presupuesto == 0 ? 0 : Math.min(1, sobrante / (presupuesto * SOBRANTE_IDEAL));

        int puntosEntrega = Math.round((float) PUNTOS_ENTREGA * entregadas / fases);
        int puntosRapidez = (int) Math.round(PUNTOS_RAPIDEZ * rapidez);
        int puntosVotos = (int) Math.round(PUNTOS_VOTOS * votos);
        int puntosPresupuesto = (int) Math.round(PUNTOS_PRESUPUESTO * ahorro);
        int total = puntosEntrega + puntosRapidez + puntosVotos + puntosPresupuesto;
        return new Teamwork(total, estrellas(total), entregadas, puntosEntrega, (int) Math.round(rapidez * 100), puntosRapidez,
                votosSeguidos, votosTotales, puntosVotos, sobrante, puntosPresupuesto);
    }

    private static int estrellas(int total) {
        if (total >= 80) {
            return 3;
        }
        if (total >= 60) {
            return 2;
        }
        return total >= 30 ? 1 : 0;
    }

    private static JsonNode datos(Map<Departamento, Sala.Resultado> resultados, Departamento departamento) {
        Sala.Resultado resultado = resultados.get(departamento);
        return resultado == null || resultado.datos() == null ? MissingNode.getInstance() : resultado.datos();
    }

    private static Set<String> piezasInstaladas(JsonNode diseno) {
        Set<String> piezas = new HashSet<>();
        for (String campo : new String[] { "estructuraId", "cofiaId" }) {
            String id = diseno.path(campo).stringValue(null);
            if (id != null) {
                piezas.add(id);
            }
        }
        diseno.path("componentes").values().forEach(id -> piezas.add(id.stringValue("")));
        diseno.path("etapas").values().forEach(etapa -> {
            piezas.add(etapa.path("motorId").stringValue(""));
            piezas.add(etapa.path("tanqueId").stringValue(""));
        });
        return piezas;
    }
}
