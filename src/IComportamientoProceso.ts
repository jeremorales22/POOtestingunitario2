// "import type" se borra al compilar (no genera ninguna dependencia en tiempo de
// ejecucion), asi que esto no crea un ciclo real con Proceso.ts, aunque Proceso.ts
// tambien importe este archivo para implementarlo.

import type { Estado } from './Proceso';

// Contrato público de un proceso. Proceso lo implementa y ProcesoConES lo hereda.
// [SOLID · I] es el contrato de UN solo tema (el proceso), separado de los de colas, memoria o CPU.
// [SOLID · D] la idea es que quien necesite «un proceso» dependa de este contrato. Hoy las demás
//     clases usan directamente el tipo Proceso; para inversión de dependencias total habría que
//     cambiarlas a IComportamientoProceso.

export interface ComportamientoProceso{
    
    readonly pid: string;
    readonly tamanoMemoria: number;
    ejecutarTick(): void;
    cambiarEstado(nuevo: Estado):void;
    describirEstado(): string;
    porcentajeCompletado(): number;
    estaTerminado(): boolean;
    agotoQuantum(limite: number): boolean;
    reiniciarQuantum():void;
    admiteES(): boolean;
    debeBloquearse(): boolean;
    duracionES(): number;
    bloquear(ticks: number): void;
    avanzarBloqueo(): void;
    estaBloqueado(): boolean;

}