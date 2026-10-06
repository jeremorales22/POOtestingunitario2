import { Estadisticas } from './Estadisticas';

// RF09: lleva la cuenta del reloj, los ticks con CPU ocupada y los cambios de contexto.
// RESPONSABILIDAD UNICA: solo lleva contadores. No decide nada sobre que proceso ejecuta.
export class EstadisticasCpu implements Estadisticas {

    // ENCAPSULAMIENTO: los 3 contadores son privados, solo se tocan con los metodos de abajo.
    private reloj: number = 0;
    private cambios: number = 0;
    private ocupada: number = 0;

    avanzarReloj(): void {

        this.reloj++;

    }

    registrarEjecucion(huboEjecucion: boolean): void {

        this.ocupada += Number(huboEjecucion);

    }

    registrarCambioDeContexto(): void {

        this.cambios++;

    }

    tickActual(): number {

        return this.reloj;

    }

    // RF09: en el tick 0 (this.reloj en 0) da 0%, sin dividir por cero.
    usoCpu(): number {

        const base = this.reloj > 0 ? this.reloj : 1;

        return (this.ocupada / base) * 100;

    }

    cambiosDeContexto(): number {

        return this.cambios;

    }
}
