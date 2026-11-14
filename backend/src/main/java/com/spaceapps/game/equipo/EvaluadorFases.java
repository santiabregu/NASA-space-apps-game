package com.spaceapps.game.equipo;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.catalogo.Estrella;
import com.spaceapps.game.catalogo.PiezaCatalogo;
import com.spaceapps.game.catalogo.Pregunta;
import com.spaceapps.game.catalogo.ReglasEquipo;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;

// El navegador juega y manda lo que hizo; aquí se recalculan presupuesto, fiabilidad y coste con las reglas del catálogo,
// para que nadie pueda inventarse el resultado. Las mismas fórmulas están en frontend/src/engine/equipo.js.
@Component
class EvaluadorFases {

    private static final Set<String> TIPOS_SATELITE = Set.of("panel", "bateria", "ordenador", "antena", "actitud", "instrumento", "escudo");
    private static final int MAXIMO_COMPONENTES = 16;
    private static final int MAXIMO_ETAPAS = 3;

    private final Catalogo catalogo;
    private final JsonNodeFactory nodos = JsonNodeFactory.instance;

    EvaluadorFases(Catalogo catalogo) {
        this.catalogo = catalogo;
    }

    EvaluadorFase para(Estrella estrella) {
        return (departamento, datos, caducado, anteriores) -> evaluar(estrella, departamento, datos, caducado, anteriores);
    }

    // Las piezas que se pueden votar en cada fase de construcción.
    void comprobarVoto(Departamento departamento, List<String> piezaIds) {
        piezaIds.forEach(id -> {
            PiezaCatalogo pieza = pieza(id);
            if (esDeSatelite(pieza) != (departamento == Departamento.SATELITE)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, pieza.nombre() + " is not built in this phase");
            }
        });
    }

    private JsonNode evaluar(Estrella estrella, Departamento departamento, JsonNode datos, boolean caducado,
            Map<Departamento, Sala.Resultado> anteriores) {
        JsonNode entrada = datos == null ? nodos.objectNode() : datos;
        return switch (departamento) {
            case FINANCIACION -> finanzas(estrella, entrada);
            case SOFTWARE -> software(entrada);
            case SATELITE -> satelite(entrada, caducado, anteriores);
            case COHETE -> cohete(entrada, caducado, anteriores);
        };
    }

    // presupuesto = (base de la estrella + monedas + grants) × (1 + bonus por acierto)
    private ObjectNode finanzas(Estrella estrella, JsonNode datos) {
        ReglasEquipo reglas = catalogo.reglasEquipo();
        int monedas = entre(datos.path("monedas").intValue(0), 0, reglas.maximoMonedas());
        int grants = entre(datos.path("grants").intValue(0), 0, reglas.maximoGrants());
        Respuestas respuestas = corregir(datos.path("respuestas"), Departamento.FINANCIACION);
        long recaudado = estrella.mision().presupuestoBase() + monedas * reglas.valorMoneda() + grants * reglas.valorGrant();
        long presupuesto = Math.round(recaudado * (1 + reglas.bonusPorAcierto() * respuestas.aciertos()));
        return nodos.objectNode()
                .put("monedas", monedas)
                .put("grants", grants)
                .put("preguntas", respuestas.contestadas())
                .put("aciertos", respuestas.aciertos())
                .put("presupuesto", presupuesto);
    }

    // fiabilidad = cables conectados − chispas + aciertos, entre el mínimo y 100.
    private ObjectNode software(JsonNode datos) {
        ReglasEquipo reglas = catalogo.reglasEquipo();
        int conexiones = entre(datos.path("conexiones").intValue(0), 0, reglas.conexionesCables());
        int chispas = Math.max(0, datos.path("chispas").intValue(0));
        Respuestas respuestas = corregir(datos.path("respuestas"), Departamento.SOFTWARE);
        int cables = Math.max(0, reglas.puntosCables() * conexiones / reglas.conexionesCables() - chispas * reglas.penalizacionChispa());
        int fiabilidad = entre(cables + respuestas.aciertos() * reglas.puntosPorAcierto(), reglas.fiabilidadMinima(), 100);
        return nodos.objectNode()
                .put("conexiones", conexiones)
                .put("chispas", chispas)
                .put("preguntas", respuestas.contestadas())
                .put("aciertos", respuestas.aciertos())
                .put("fiabilidad", fiabilidad);
    }

    private ObjectNode satelite(JsonNode datos, boolean caducado, Map<Departamento, Sala.Resultado> anteriores) {
        JsonNode diseno = datos.path("diseno");
        ObjectNode limpio = nodos.objectNode();
        String estructuraId = diseno.path("estructuraId").stringValue(null);
        long coste = 0;
        if (estructuraId != null) {
            PiezaCatalogo estructura = pieza(estructuraId);
            if (!estructura.tipo().equals("estructura")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, estructura.nombre() + " is not a structure");
            }
            coste += estructura.coste();
        }
        limpio.put("estructuraId", estructuraId);
        ArrayNode componentes = limpio.putArray("componentes");
        List<JsonNode> recibidos = List.copyOf(diseno.path("componentes").values());
        if (recibidos.size() > MAXIMO_COMPONENTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many components");
        }
        for (JsonNode id : recibidos) {
            PiezaCatalogo componente = pieza(id.stringValue(""));
            if (!TIPOS_SATELITE.contains(componente.tipo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, componente.nombre() + " does not go in the satellite");
            }
            componentes.add(componente.id());
            coste += componente.coste();
        }
        return construccion(limpio, coste, presupuesto(anteriores), caducado);
    }

    private ObjectNode cohete(JsonNode datos, boolean caducado, Map<Departamento, Sala.Resultado> anteriores) {
        JsonNode diseno = datos.path("diseno");
        ObjectNode limpio = nodos.objectNode();
        long coste = 0;
        String cofiaId = diseno.path("cofiaId").stringValue(null);
        if (cofiaId != null) {
            coste += piezaDeTipo(cofiaId, "cofia").coste();
        }
        limpio.put("cofiaId", cofiaId);
        ArrayNode etapas = limpio.putArray("etapas");
        List<JsonNode> recibidas = List.copyOf(diseno.path("etapas").values());
        if (recibidas.size() > MAXIMO_ETAPAS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A rocket can have up to " + MAXIMO_ETAPAS + " stages");
        }
        for (JsonNode etapa : recibidas) {
            ObjectNode limpia = etapas.addObject();
            for (String[] campo : new String[][] { { "motorId", "motor" }, { "tanqueId", "tanque" } }) {
                String id = etapa.path(campo[0]).stringValue(null);
                if (id != null) {
                    coste += piezaDeTipo(id, campo[1]).coste();
                }
                limpia.put(campo[0], id);
            }
        }
        long costeSatelite = anteriores.containsKey(Departamento.SATELITE)
                ? anteriores.get(Departamento.SATELITE).datos().path("coste").longValue(0)
                : 0;
        return construccion(limpio, coste, presupuesto(anteriores) - costeSatelite, caducado);
    }

    // Al entregar no se puede gastar más de lo que hay; si se acaba el tiempo, queda marcado y lo decide el lanzamiento.
    private ObjectNode construccion(ObjectNode diseno, long coste, long disponible, boolean caducado) {
        boolean sobrePresupuesto = coste > disponible;
        if (sobrePresupuesto && !caducado) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Over budget: the team can't pay for this design");
        }
        ObjectNode resultado = nodos.objectNode();
        resultado.set("diseno", diseno);
        return resultado.put("coste", coste).put("sobrePresupuesto", sobrePresupuesto);
    }

    private long presupuesto(Map<Departamento, Sala.Resultado> anteriores) {
        Sala.Resultado finanzas = anteriores.get(Departamento.FINANCIACION);
        return finanzas == null ? 0 : finanzas.datos().path("presupuesto").longValue(0);
    }

    private record Respuestas(int contestadas, int aciertos) {
    }

    // Solo cuentan preguntas del departamento, sin repetir y como mucho las de una fase.
    private Respuestas corregir(JsonNode lista, Departamento departamento) {
        Set<String> vistas = new HashSet<>();
        int aciertos = 0;
        for (JsonNode respuesta : lista.values()) {
            if (vistas.size() == catalogo.reglasEquipo().preguntasPorFase()) {
                break;
            }
            String id = respuesta.path("id").stringValue("");
            Pregunta pregunta = catalogo.pregunta(id)
                    .filter(candidata -> candidata.departamento().equals(departamento.name()))
                    .orElse(null);
            if (pregunta == null || !vistas.add(id)) {
                continue;
            }
            if (respuesta.path("opcion").intValue(-1) == pregunta.correcta()) {
                aciertos++;
            }
        }
        return new Respuestas(vistas.size(), aciertos);
    }

    private PiezaCatalogo pieza(String id) {
        return catalogo.pieza(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown part " + id));
    }

    private PiezaCatalogo piezaDeTipo(String id, String tipo) {
        PiezaCatalogo pieza = pieza(id);
        if (!pieza.tipo().equals(tipo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, pieza.nombre() + " is not a " + tipo);
        }
        return pieza;
    }

    private static boolean esDeSatelite(PiezaCatalogo pieza) {
        return pieza.tipo().equals("estructura") || TIPOS_SATELITE.contains(pieza.tipo());
    }

    private static int entre(int valor, int minimo, int maximo) {
        return Math.max(minimo, Math.min(maximo, valor));
    }
}
