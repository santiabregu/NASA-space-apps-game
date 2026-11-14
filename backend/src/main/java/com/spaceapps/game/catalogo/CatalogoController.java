package com.spaceapps.game.catalogo;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class CatalogoController {

    private final Catalogo catalogo;

    CatalogoController(Catalogo catalogo) {
        this.catalogo = catalogo;
    }

    @GetMapping("/api/catalogo")
    ResponseEntity<byte[]> catalogo() {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(catalogo.json());
    }
}
