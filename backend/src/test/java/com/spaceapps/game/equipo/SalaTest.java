package com.spaceapps.game.equipo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;

class SalaTest {

    private static final Instant INICIO = Instant.parse("2026-11-14T10:00:00Z");
    private static final long ANA = 1;
    private static final long BRUNO = 2;

    private Sala sala;

    @BeforeEach
    void empezarPartida() {
        sala = new Sala("ABC234", "sol", new Sala.Miembro(ANA, "ana", "Ana Corp"), SalaTest::evaluarTalCual);
        sala.unir(new Sala.Miembro(BRUNO, "bruno", "Bruno Corp"));
        sala.empezar(ANA, new Random(7), INICIO);
    }

    @Test
    void laPrimeraFaseEsperaAQueTodosLeanElReparto() {
        SalaResponse.FaseResponse fase = foto(INICIO).fase();

        assertThat(fase.departamento()).isEqualTo(Departamento.FINANCIACION);
        assertThat(fase.empiezaEn()).isEqualTo(INICIO.plus(Sala.REPARTO).toEpochMilli());
        assertThat(fase.terminaEn()).isEqualTo(INICIO.plus(Sala.REPARTO).plusSeconds(90).toEpochMilli());
        assertThatThrownBy(() -> sala.enviarProgreso(responsable(Departamento.FINANCIACION), Departamento.FINANCIACION,
                datos(1), INICIO))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void soloElResponsableJuegaYSoloLaFaseActual() {
        Instant enJuego = INICIO.plus(Sala.REPARTO);
        long financiero = responsable(Departamento.FINANCIACION);
        long otro = financiero == ANA ? BRUNO : ANA;

        assertThatThrownBy(() -> sala.enviarProgreso(otro, Departamento.FINANCIACION, datos(1), enJuego))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> sala.enviarResultado(otro, Departamento.SOFTWARE, datos(1), enJuego))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.CONFLICT));

        sala.enviarProgreso(financiero, Departamento.FINANCIACION, datos(3), enJuego);
        assertThat(foto(enJuego).fase().progreso().get("monedas").asInt()).isEqualTo(3);
    }

    @Test
    void entregarCierraLaFaseYLaSiguienteEmpiezaTrasUnaPausa() {
        Instant entrega = INICIO.plus(Sala.REPARTO).plusSeconds(30);

        sala.enviarResultado(responsable(Departamento.FINANCIACION), Departamento.FINANCIACION, datos(8), entrega);

        SalaResponse respuesta = foto(entrega);
        assertThat(respuesta.resultados().get(Departamento.FINANCIACION)).satisfies(resultado -> {
            assertThat(resultado.caducado()).isFalse();
            assertThat(resultado.datos().get("monedas").asInt()).isEqualTo(8);
        });
        assertThat(respuesta.fase().departamento()).isEqualTo(Departamento.SOFTWARE);
        assertThat(respuesta.fase().empiezaEn()).isEqualTo(entrega.plus(Sala.PAUSA_ENTRE_FASES).toEpochMilli());
        assertThat(respuesta.fase().progreso()).isNull();
    }

    @Test
    void siNadiePreguntaCaducanVariasFasesSeguidasYGuardanElUltimoProgreso() {
        Instant enJuego = INICIO.plus(Sala.REPARTO);
        sala.enviarProgreso(responsable(Departamento.FINANCIACION), Departamento.FINANCIACION, datos(5), enJuego);
        Instant finSoftware = enJuego.plusSeconds(90).plus(Sala.PAUSA_ENTRE_FASES).plusSeconds(90);

        SalaResponse respuesta = foto(finSoftware.plusSeconds(1));

        assertThat(respuesta.fase().departamento()).isEqualTo(Departamento.SATELITE);
        assertThat(respuesta.fase().empiezaEn()).isEqualTo(finSoftware.plus(Sala.PAUSA_ENTRE_FASES).toEpochMilli());
        assertThat(respuesta.resultados().get(Departamento.FINANCIACION)).satisfies(resultado -> {
            assertThat(resultado.caducado()).isTrue();
            assertThat(resultado.datos().get("monedas").asInt()).isEqualTo(5);
        });
        assertThat(respuesta.resultados().get(Departamento.SOFTWARE).datos()).isNull();
    }

    @Test
    void trasLaUltimaFaseLaSalaQuedaTerminadaYCadaCaducidadSubeLaVersion() {
        long versionAntes = sala.version(INICIO);

        SalaResponse respuesta = foto(INICIO.plusSeconds(3600));

        assertThat(respuesta.estado()).isEqualTo(Sala.Estado.TERMINADA);
        assertThat(respuesta.fase()).isNull();
        assertThat(respuesta.resultados()).containsOnlyKeys(Departamento.values());
        assertThat(respuesta.version()).isEqualTo(versionAntes + Departamento.values().length);
        assertThatThrownBy(() -> sala.enviarResultado(ANA, Departamento.COHETE, datos(1), INICIO.plusSeconds(3600)))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void losDatosDebenSerUnObjetoPequeno() {
        Instant enJuego = INICIO.plus(Sala.REPARTO);
        long financiero = responsable(Departamento.FINANCIACION);
        JsonNode enorme = JsonNodeFactory.instance.objectNode().put("texto", "x".repeat(Sala.MAXIMO_CARACTERES_DATOS));

        assertThatThrownBy(() -> sala.enviarProgreso(financiero, Departamento.FINANCIACION, enorme, enJuego))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> sala.enviarProgreso(financiero, Departamento.FINANCIACION,
                JsonNodeFactory.instance.numberNode(3), enJuego))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void siElEvaluadorRechazaLaEntregaLaFaseSigueAbierta() {
        Instant enJuego = INICIO.plus(Sala.REPARTO);
        long financiero = responsable(Departamento.FINANCIACION);

        assertThatThrownBy(() -> sala.enviarResultado(financiero, Departamento.FINANCIACION, datos(-1), enJuego))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(foto(enJuego).fase().departamento()).isEqualTo(Departamento.FINANCIACION);
    }

    @Test
    void enConstruccionVotanLosDemasYAlCerrarSeCuentanLosVotos() {
        Instant enSatelite = INICIO.plus(Sala.REPARTO).plusSeconds(90 + 5 + 90 + 5);
        long constructor = responsable(Departamento.SATELITE);
        long otro = constructor == ANA ? BRUNO : ANA;

        assertThatThrownBy(() -> sala.votar(otro, Departamento.FINANCIACION, List.of("panel-fijo"), 3, INICIO.plus(Sala.REPARTO)))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.CONFLICT));
        assertThatThrownBy(() -> sala.votar(constructor, Departamento.SATELITE, List.of("panel-fijo"), 3, enSatelite))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> sala.votar(otro, Departamento.SATELITE, List.of("a", "b", "c", "d"), 3, enSatelite))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.BAD_REQUEST));

        sala.votar(otro, Departamento.SATELITE, List.of("panel-fijo", "antena-uhf"), 3, enSatelite);
        sala.votar(otro, Departamento.SATELITE, List.of("antena-uhf", "antena-uhf"), 3, enSatelite);
        assertThat(foto(enSatelite).fase().votos()).containsEntry(otro, List.of("antena-uhf"));

        sala.enviarResultado(constructor, Departamento.SATELITE, datos(0), enSatelite);
        SalaResponse respuesta = foto(enSatelite);
        assertThat(respuesta.resultados().get(Departamento.SATELITE).votos()).containsExactly(Map.entry("antena-uhf", 1));
        assertThat(respuesta.fase().votos()).isEmpty();
    }

    @Test
    void cadaFaseGuardaElTiempoQueSobroAlEntregar() {
        Instant entrega = INICIO.plus(Sala.REPARTO).plusSeconds(30);

        sala.enviarResultado(responsable(Departamento.FINANCIACION), Departamento.FINANCIACION, datos(1), entrega);

        assertThat(foto(entrega).resultados().get(Departamento.FINANCIACION).tiempoRestante()).isCloseTo(2.0 / 3, within(0.001));
    }

    @Test
    void soloElAnfitrionLanzaYSoloCuandoTodoEstaResuelto() {
        assertThatThrownBy(() -> sala.comprobarLanzamiento(ANA, INICIO))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.CONFLICT));
        Instant alFinal = INICIO.plusSeconds(3600);
        assertThatThrownBy(() -> sala.comprobarLanzamiento(BRUNO, alFinal))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.FORBIDDEN));

        sala.comprobarLanzamiento(ANA, alFinal);
        sala.registrarLanzamiento(true, datos(0), Teamwork.de(sala.resultados()), List.of());

        assertThat(foto(alFinal).estado()).isEqualTo(Sala.Estado.LANZADA);
        assertThat(foto(alFinal).lanzamiento().exito()).isTrue();
        assertThatThrownBy(() -> sala.comprobarLanzamiento(ANA, alFinal))
                .satisfies(error -> assertThat(estado(error)).isEqualTo(HttpStatus.CONFLICT));
    }

    // Deja pasar los datos tal cual, salvo monedas negativas, para probar que una entrega rechazada no cierra la fase.
    private static JsonNode evaluarTalCual(Departamento departamento, JsonNode datos, boolean caducado,
            Map<Departamento, Sala.Resultado> anteriores) {
        if (datos != null && datos.path("monedas").intValue(0) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Negative coins");
        }
        return datos;
    }

    private SalaResponse foto(Instant ahora) {
        return sala.foto("The Sun", ahora);
    }

    private long responsable(Departamento departamento) {
        return foto(INICIO).miembros().stream()
                .filter(miembro -> miembro.departamentos().contains(departamento))
                .findFirst().orElseThrow().jugadorId();
    }

    private static JsonNode datos(int monedas) {
        return JsonNodeFactory.instance.objectNode().put("monedas", monedas);
    }

    private static HttpStatus estado(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }
}
