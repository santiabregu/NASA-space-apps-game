package com.spaceapps.game.mision;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.spaceapps.game.catalogo.MisionCatalogo;
import com.spaceapps.game.catalogo.TipoMision;

class LiquidacionTest {

    private static MisionCatalogo mision(TipoMision tipo) {
        return new MisionCatalogo("m", "Misión", tipo, 1, new MisionCatalogo.Recompensa(10_000_000, 200));
    }

    @Test
    void exitoPagaSegunPuntuacionYSubeReputacion() {
        assertThat(Liquidacion.de(mision(TipoMision.SOLO), true, 80))
                .isEqualTo(new Liquidacion(8_000_000, 200, 10));
    }

    @Test
    void falloNoPagaDaParteDeLaXpYBajaReputacion() {
        assertThat(Liquidacion.de(mision(TipoMision.SOLO), false, 0))
                .isEqualTo(new Liquidacion(0, 60, -15));
    }

    @Test
    void fallarElTutorialNoQuitaReputacion() {
        assertThat(Liquidacion.de(mision(TipoMision.TUTORIAL), false, 0).cambioReputacion()).isZero();
    }

    @Test
    void laPruebaDeConfianzaRecuperaMasReputacion() {
        assertThat(Liquidacion.de(mision(TipoMision.PRUEBA), true, 100).cambioReputacion()).isEqualTo(15);
    }
}
