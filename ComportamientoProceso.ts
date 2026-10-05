// "import type" se borra al compilar (no genera ninguna dependencia en tiempo de
// ejecucion), asi que esto no crea un ciclo real con Proceso.ts, aunque Proceso.ts
// tambien importe este archivo para implementarlo.
import type { Estado } from './Proceso';

// Contrato publico de un proceso. Proceso lo implementa, y ProcesoConES lo hereda
// (y lo vuelve a declarar) al extender de Proceso.
export interface ComportamientoProceso {
    readonly pid: string;
    readonly tamanoMemoria: number;
    ejecutarTick(): void;
    cambiarEstado(nuevo: Estado): void;
    estaEn(estado: Estado): boolean;
    describirEstado(): string;
    porcentajeCompletado(): number;
    estaTerminado(): boolean;
    agotoQuantum(limite: number): boolean;
    reiniciarQuantum(): void;
    admiteES(): boolean;
    bloquear(ticks: number): void;
    avanzarBloqueo(): void;
    estaBloqueado(): boolean;
}
