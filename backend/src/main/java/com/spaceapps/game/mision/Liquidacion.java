package com.spaceapps.game.mision;

import com.spaceapps.game.catalogo.MisionCatalogo;
import com.spaceapps.game.catalogo.TipoMision;

record Liquidacion(long dinero, int xp, int cambioReputacion) {

    private static final int PORCENTAJE_XP_SI_FALLA = 30;
    private static final int REPUTACION_POR_EXITO = 10;
    private static final int REPUTACION_POR_PRUEBA = 15;
    private static final int REPUTACION_POR_FALLO = -15;

    static Liquidacion de(MisionCatalogo mision, boolean exito, int puntuacion) {
        MisionCatalogo.Recompensa recompensa = mision.recompensa();
        if (!exito) {
            int reputacion = mision.tipo() == TipoMision.TUTORIAL ? 0 : REPUTACION_POR_FALLO;
            return new Liquidacion(0, recompensa.xp() * PORCENTAJE_XP_SI_FALLA / 100, reputacion);
        }
        int reputacion = mision.tipo() == TipoMision.PRUEBA ? REPUTACION_POR_PRUEBA : REPUTACION_POR_EXITO;
        return new Liquidacion(recompensa.dinero() * puntuacion / 100, recompensa.xp(), reputacion);
    }
}
