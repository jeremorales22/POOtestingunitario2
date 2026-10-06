import { IEstadisticas } from './IEstadisticas';

// Documento «Métricas y Fórmulas»: lleva el reloj, los ticks con CPU ocupada y los cambios de contexto.
//
// PRINCIPIOS QUE APLICA
// [SOLID · S] solo cuenta. No decide nada sobre qué proceso ejecuta.
// [POO · Encapsulamiento] los 3 contadores son privados: solo se tocan con los métodos de abajo.
// [SOLID · I/D] implementa IEstadisticas; SimuladorSO depende de ese contrato.

export class EstadisticasCpu implements IEstadisticas {

    // [POO · Encapsulamiento] contadores privados.
    private reloj: number = 0;
    private cambios: number = 0;
    private ocupada: number = 0;

    // Tema 16: el tiempo es discreto. Cada llamada es un tick.
    avanzarReloj(): void {

        this.reloj++;

    }

    // Cuenta el tick como «CPU ocupada» si hubo un proceso ejecutando; si no, la CPU estuvo ociosa.
    registrarEjecucion(huboEjecucion: boolean): void {

        this.ocupada += Number(huboEjecucion);

    }

    // Tema 8: cambio de contexto. Se cuenta cuando un proceso sale de la CPU por quantum (con otro
    // esperando) o por E/S. Es costo administrativo (overhead).
    registrarCambioDeContexto(): void {

        this.cambios++;

    }

    // Tick actual del simulador (RF10).
    tickActual(): number {

        return this.reloj;

    }

    // Uso de CPU (%) = ticks con CPU ocupada / ticks totales x 100. En el tick 0 da 0 % (no divide por cero).
    usoCpu(): number {

        const base = this.reloj > 0 ? this.reloj : 1;

        return (this.ocupada / base) * 100;

    }
    
    // Cantidad acumulada de cambios de contexto.
    cambiosDeContexto(): number {

        return this.cambios;

    }
}