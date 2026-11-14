package com.spaceapps.game.mision;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/misiones")
class MisionController {

    private final MisionService misionService;

    MisionController(MisionService misionService) {
        this.misionService = misionService;
    }

    @GetMapping("/disponibles")
    List<String> disponibles(@AuthenticationPrincipal Jwt token) {
        return misionService.disponibles(Long.parseLong(token.getSubject()));
    }

    @PostMapping("/{misionId}/lanzamientos")
    LanzamientoResponse lanzar(@AuthenticationPrincipal Jwt token, @PathVariable String misionId,
            @Valid @RequestBody LanzamientoRequest lanzamiento) {
        return misionService.lanzar(Long.parseLong(token.getSubject()), misionId, lanzamiento);
    }
}
