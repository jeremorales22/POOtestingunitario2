"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadisticasCpu = void 0;
// RF09: lleva la cuenta del reloj, los ticks con CPU ocupada y los cambios de contexto.
// RESPONSABILIDAD UNICA: solo lleva contadores. No decide nada sobre que proceso ejecuta.
class EstadisticasCpu {
    // ENCAPSULAMIENTO: los 3 contadores son privados, solo se tocan con los metodos de abajo.
    reloj = 0;
    cambios = 0;
    ocupada = 0;
    avanzarReloj() {
        this.reloj++;
    }
    registrarEjecucion(huboEjecucion) {
        this.ocupada += Number(huboEjecucion);
    }
    registrarCambioDeContexto() {
        this.cambios++;
    }
    tickActual() {
        return this.reloj;
    }
    // RF09: en el tick 0 (this.reloj en 0) da 0%, sin dividir por cero.
    usoCpu() {
        const base = this.reloj > 0 ? this.reloj : 1;
        return (this.ocupada / base) * 100;
    }
    cambiosDeContexto() {
        return this.cambios;
    }
}
exports.EstadisticasCpu = EstadisticasCpu;
