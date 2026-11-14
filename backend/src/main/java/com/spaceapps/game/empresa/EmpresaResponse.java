package com.spaceapps.game.empresa;

public record EmpresaResponse(
        String nombre,
        String colorPrimario,
        String colorSecundario,
        int reputacion,
        NivelConfianza confianza,
        long deuda) {

    public static EmpresaResponse de(Empresa empresa) {
        return new EmpresaResponse(
                empresa.getNombre(),
                empresa.getColorPrimario(),
                empresa.getColorSecundario(),
                empresa.getReputacion(),
                empresa.nivelConfianza(),
                empresa.getDeuda());
    }
}
