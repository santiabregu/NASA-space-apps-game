package com.spaceapps.game.equipo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.EnumMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class TeamworkTest {

    private final JsonMapper json = JsonMapper.builder().build();
    private final Map<Departamento, Sala.Resultado> resultados = new EnumMap<>(Departamento.class);

    private JsonNode leer(String texto) {
        return json.readTree(texto.replace('\'', '"'));
    }

    private void fase(Departamento departamento, String datos, boolean caducado, double tiempoRestante, Map<String, Integer> votos) {
        resultados.put(departamento, new Sala.Resultado(leer(datos), caducado, tiempoRestante, votos));
    }

    @Test
    void unEquipoRapidoQueEscuchaYAhorraSacaTresEstrellas() {
        fase(Departamento.FINANCIACION, "{'presupuesto': 40000000}", false, 0.5, Map.of());
        fase(Departamento.SOFTWARE, "{'fiabilidad': 90}", false, 0.5, Map.of());
        fase(Departamento.SATELITE, "{'coste': 10000000, 'diseno': {'estructuraId': 'bus-pequeno', 'componentes': ['panel-grande']}}",
                false, 0.5, Map.of("panel-grande", 1));
        fase(Departamento.COHETE, "{'coste': 20000000, 'diseno': {'cofiaId': 'cofia-pequena', 'etapas': []}}", false, 0.5, Map.of());

        Teamwork teamwork = Teamwork.de(resultados);

        assertThat(teamwork.puntosEntrega()).isEqualTo(40);
        assertThat(teamwork.puntosRapidez()).isEqualTo(15);
        assertThat(teamwork.puntosVotos()).isEqualTo(20);
        assertThat(teamwork.sobrante()).isEqualTo(10_000_000);
        assertThat(teamwork.puntosPresupuesto()).isEqualTo(10);
        assertThat(teamwork.total()).isEqualTo(85);
        assertThat(teamwork.estrellas()).isEqualTo(3);
    }

    @Test
    void lasFasesCaducadasYLosVotosIgnoradosRestan() {
        fase(Departamento.FINANCIACION, "{'presupuesto': 30000000}", false, 0.2, Map.of());
        fase(Departamento.SOFTWARE, "{'fiabilidad': 10}", true, 0, Map.of());
        fase(Departamento.SATELITE, "{'coste': 9000000, 'diseno': {'estructuraId': 'bus-pequeno', 'componentes': []}}",
                false, 0.2, Map.of("panel-grande", 2, "antena-banda-x", 1));
        fase(Departamento.COHETE, "{'coste': 21000000, 'diseno': {'etapas': []}}", true, 0, Map.of("motor-trueno", 1));

        Teamwork teamwork = Teamwork.de(resultados);

        assertThat(teamwork.entregadas()).isEqualTo(2);
        assertThat(teamwork.puntosEntrega()).isEqualTo(20);
        assertThat(teamwork.votosTotales()).isEqualTo(3);
        assertThat(teamwork.votosSeguidos()).isEqualTo(1);
        assertThat(teamwork.puntosPresupuesto()).isZero();
        assertThat(teamwork.estrellas()).isEqualTo(1);
    }
}
