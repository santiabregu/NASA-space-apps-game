package com.spaceapps.game.mision;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface LanzamientoRepository extends JpaRepository<Lanzamiento, Long> {

    List<Lanzamiento> findByJugadorIdOrderByIdDesc(Long jugadorId);
}
