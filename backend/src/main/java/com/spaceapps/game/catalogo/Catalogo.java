package com.spaceapps.game.catalogo;

import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

@Component
public class Catalogo {

    private final byte[] json;
    private final Map<String, PiezaCatalogo> piezas;
    private final List<MisionCatalogo> misiones;

    Catalogo(JsonMapper jsonMapper, @Value("classpath:catalogo.json") Resource fichero) throws IOException {
        this.json = fichero.getContentAsByteArray();
        Contenido contenido = jsonMapper.readValue(json, Contenido.class);
        this.piezas = contenido.piezas().stream().collect(toMap(PiezaCatalogo::id, identity()));
        this.misiones = contenido.misiones();
    }

    public byte[] json() {
        return json;
    }

    public Optional<PiezaCatalogo> pieza(String id) {
        return Optional.ofNullable(piezas.get(id));
    }

    public Optional<MisionCatalogo> mision(String id) {
        return misiones.stream().filter(mision -> mision.id().equals(id)).findFirst();
    }

    public List<MisionCatalogo> misiones() {
        return misiones;
    }

    private record Contenido(List<PiezaCatalogo> piezas, List<MisionCatalogo> misiones) {
    }
}
