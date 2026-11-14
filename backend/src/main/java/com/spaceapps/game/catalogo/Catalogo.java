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
    private final List<Destino> destinos;
    private final KitInicial kitInicial;
    private final int mesLimite;

    Catalogo(JsonMapper jsonMapper, @Value("classpath:catalogo.json") Resource fichero) throws IOException {
        this.json = fichero.getContentAsByteArray();
        Contenido contenido = jsonMapper.readValue(json, Contenido.class);
        this.piezas = contenido.piezas().stream().collect(toMap(PiezaCatalogo::id, identity()));
        this.misiones = contenido.misiones();
        this.destinos = contenido.destinos();
        this.kitInicial = contenido.kitInicial();
        this.mesLimite = contenido.mesLimite();
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

    public Optional<Destino> destino(String id) {
        return destinos.stream().filter(destino -> destino.id().equals(id)).findFirst();
    }

    public Optional<Destino> destinoQueAlcanza(String misionId) {
        return destinos.stream().filter(destino -> misionId.equals(destino.misionId())).findFirst();
    }

    public KitInicial kitInicial() {
        return kitInicial;
    }

    public int mesLimite() {
        return mesLimite;
    }

    private record Contenido(List<PiezaCatalogo> piezas, List<MisionCatalogo> misiones, List<Destino> destinos,
            KitInicial kitInicial, int mesLimite) {
    }
}
