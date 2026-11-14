package com.spaceapps.game.equipo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.catalogo.ReglasEquipo;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:salas",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class EvaluadorFasesTest {

    @Autowired
    private EvaluadorFases evaluadores;

    @Autowired
    private Catalogo catalogo;

    @Autowired
    private JsonMapper json;

    private final Map<Departamento, Sala.Resultado> anteriores = new EnumMap<>(Departamento.class);

    private EvaluadorFase evaluador() {
        return evaluadores.para(catalogo.estrella("proxima-centauri").orElseThrow());
    }

    private JsonNode leer(String texto) {
        return json.readTree(texto.replace('\'', '"'));
    }

    private void conPresupuesto(long presupuesto) {
        anteriores.put(Departamento.FINANCIACION,
                new Sala.Resultado(leer("{'presupuesto': " + presupuesto + "}"), false, 0, Map.of()));
    }

    @Test
    void elPresupuestoSumaLaBaseMonedasYGrantsYRecortaLasTrampas() {
        ReglasEquipo reglas = catalogo.reglasEquipo();
        long base = catalogo.estrella("proxima-centauri").orElseThrow().mision().presupuestoBase();

        JsonNode resultado = evaluador().evaluar(Departamento.FINANCIACION, leer("{'monedas': 10, 'grants': 2}"), false, anteriores);
        JsonNode tramposo = evaluador().evaluar(Departamento.FINANCIACION, leer("{'monedas': 99999, 'grants': -4}"), false, anteriores);

        assertThat(resultado.path("presupuesto").longValue()).isEqualTo(base + 10 * reglas.valorMoneda() + 2 * reglas.valorGrant());
        assertThat(tramposo.path("monedas").intValue()).isEqualTo(reglas.maximoMonedas());
        assertThat(tramposo.path("grants").intValue()).isZero();
    }

    @Test
    void soloCuentanLasRespuestasCorrectasDelDepartamentoSinRepetir() {
        ReglasEquipo reglas = catalogo.reglasEquipo();
        long base = catalogo.estrella("proxima-centauri").orElseThrow().mision().presupuestoBase();
        int correcta = catalogo.pregunta("fin-jwst-coste").orElseThrow().correcta();
        int correctaSoftware = catalogo.pregunta("sw-bit-flip").orElseThrow().correcta();
        JsonNode datos = leer("{'respuestas': [{'id': 'fin-jwst-coste', 'opcion': " + correcta + "},"
                + "{'id': 'fin-jwst-coste', 'opcion': " + correcta + "},"
                + "{'id': 'sw-bit-flip', 'opcion': " + correctaSoftware + "},"
                + "{'id': 'fin-quien-paga', 'opcion': 3}]}");

        JsonNode resultado = evaluador().evaluar(Departamento.FINANCIACION, datos, false, anteriores);

        assertThat(resultado.path("preguntas").intValue()).isEqualTo(2);
        assertThat(resultado.path("aciertos").intValue()).isEqualTo(1);
        assertThat(resultado.path("presupuesto").longValue()).isEqualTo(Math.round(base * (1 + reglas.bonusPorAcierto())));
    }

    @Test
    void sinDatosLaFaseCaducadaDaElMinimo() {
        JsonNode finanzas = evaluador().evaluar(Departamento.FINANCIACION, null, true, anteriores);
        JsonNode software = evaluador().evaluar(Departamento.SOFTWARE, null, true, anteriores);

        assertThat(finanzas.path("presupuesto").longValue())
                .isEqualTo(catalogo.estrella("proxima-centauri").orElseThrow().mision().presupuestoBase());
        assertThat(software.path("fiabilidad").intValue()).isEqualTo(catalogo.reglasEquipo().fiabilidadMinima());
    }

    @Test
    void laFiabilidadPremiaLosCablesYCastigaLasChispas() {
        ReglasEquipo reglas = catalogo.reglasEquipo();

        JsonNode limpio = evaluador().evaluar(Departamento.SOFTWARE, leer("{'conexiones': 4, 'chispas': 0}"), false, anteriores);
        JsonNode chapucero = evaluador().evaluar(Departamento.SOFTWARE, leer("{'conexiones': 4, 'chispas': 3}"), false, anteriores);

        assertThat(limpio.path("fiabilidad").intValue()).isEqualTo(reglas.puntosCables());
        assertThat(chapucero.path("fiabilidad").intValue()).isEqualTo(reglas.puntosCables() - 3 * reglas.penalizacionChispa());
    }

    @Test
    void elSateliteNoPuedePasarseDelPresupuestoAlEntregar() {
        conPresupuesto(120_000);
        JsonNode diseno = leer("{'diseno': {'estructuraId': 'estructura-3u', 'componentes': ['panel-fijo']}}");

        assertThatThrownBy(() -> evaluador().evaluar(Departamento.SATELITE, diseno, false, anteriores))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Over budget");
        JsonNode caducado = evaluador().evaluar(Departamento.SATELITE, diseno, true, anteriores);
        assertThat(caducado.path("coste").longValue()).isEqualTo(150_000);
        assertThat(caducado.path("sobrePresupuesto").booleanValue()).isTrue();
    }

    @Test
    void elCoheteSePagaConLoQueDejaElSatelite() {
        conPresupuesto(13_200_000);
        anteriores.put(Departamento.SATELITE, new Sala.Resultado(leer("{'coste': 150000}"), false, 0, Map.of()));
        JsonNode cohete = leer("{'diseno': {'cofiaId': 'cofia-cono', 'etapas': [{'motorId': 'motor-trueno', 'tanqueId': 'tanque-grande'}]}}");

        JsonNode resultado = evaluador().evaluar(Departamento.COHETE, cohete, false, anteriores);

        assertThat(resultado.path("coste").longValue()).isEqualTo(13_020_000);
        assertThatThrownBy(() -> evaluador().evaluar(Departamento.COHETE,
                leer("{'diseno': {'etapas': [{'motorId': 'tanque-grande'}]}}"), false, anteriores))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void soloSeVotanPiezasDeLaFaseQueSeConstruye() {
        evaluadores.comprobarVoto(Departamento.SATELITE, List.of("estructura-3u", "panel-fijo"));

        assertThatThrownBy(() -> evaluadores.comprobarVoto(Departamento.SATELITE, List.of("motor-trueno")))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> evaluadores.comprobarVoto(Departamento.COHETE, List.of("no-existe")))
                .isInstanceOf(ResponseStatusException.class);
    }
}
