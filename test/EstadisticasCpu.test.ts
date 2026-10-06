import { describe, it, expect } from 'vitest';
import { EstadisticasCpu } from '../src/EstadisticasCpu';

describe("EstadisticasCpu", () => {
    it("en el tick 0 el uso de CPU es 0%", () => {
        const est = new EstadisticasCpu();

        expect(est.tickActual()).toBe(0);
        expect(est.usoCpu()).toBe(0);
    });

    it("avanzarReloj suma 1 al tick actual", () => {
        const est = new EstadisticasCpu();

        est.avanzarReloj();
        est.avanzarReloj();

        expect(est.tickActual()).toBe(2);
    });

    it("registrarEjecucion(true) cuenta el tick como ocupado, registrarEjecucion(false) no", () => {
        const est = new EstadisticasCpu();
        est.avanzarReloj();
        est.avanzarReloj();

        est.registrarEjecucion(true);
        est.registrarEjecucion(false);

        expect(est.usoCpu()).toBe(50);
    });

    it("registrarCambioDeContexto acumula los cambios", () => {
        const est = new EstadisticasCpu();

        est.registrarCambioDeContexto();
        est.registrarCambioDeContexto();

        expect(est.cambiosDeContexto()).toBe(2);
    });
});
