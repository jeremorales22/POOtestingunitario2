import { describe, it, expect } from 'vitest';
import { EstadisticasCpu } from '../src/EstadisticasCpu';

// EstadisticasCpu = los contadores del simulador (documento «Métricas y Fórmulas»).
// SRP: solo cuenta; no decide nada sobre qué proceso ejecuta. Sus contadores son privados
// (encapsulamiento): solo se tocan con sus métodos.

// ---------------------------------------------------------------------------
// Fórmula de la cátedra: uso de CPU (%) = ticks con CPU ocupada / ticks totales x 100.
// ---------------------------------------------------------------------------
describe("Reloj y uso de CPU", () => {
    
    // Sin ticks no hay nada que dividir: el uso es 0 %, sin error por división por cero.
    it("en el tick 0 el uso de CPU es 0%", ()=>{
        const est = new EstadisticasCpu();

        expect(est.tickActual()).toBe(0);
        expect(est.usoCpu()).toBe(0);
    })

    // El tiempo del simulador es discreto: cada llamada avanza un tick (Tema 16).
    it("avanzarReloj suma 1 al tick actual", ()=>{
        const est = new EstadisticasCpu();

        est.avanzarReloj();
        est.avanzarReloj();

        expect(est.tickActual()).toBe(2);
    })

    // De 2 ticks, la CPU trabajó en 1 y estuvo ociosa en el otro: 1/2 x 100 = 50 %.
    it("registrarEjecucion(true) cuenta el tick como ocupado, registrarEjecucion(false) no", ()=>{
        const est = new EstadisticasCpu();
        est.avanzarReloj();
        est.avanzarReloj();

        est.registrarEjecucion(true);
        est.registrarEjecucion(false);

        expect(est.usoCpu()).toBe(50);
    })
})

// ---------------------------------------------------------------------------
// Teoría: cambio de contexto = guardar el estado del proceso que sale y cargar el del que entra.
// Es costo administrativo (overhead); por eso se lleva la cuenta.
// ---------------------------------------------------------------------------
describe("Cambios de contexto (Tema 8)", () => {
    // Es un contador entero que solo sube.
    it("registrarCambioDeContexto acumula los cambios", ()=>{
        const est = new EstadisticasCpu();

        est.registrarCambioDeContexto();
        est.registrarCambioDeContexto();

        expect(est.cambiosDeContexto()).toBe(2);
    })
})