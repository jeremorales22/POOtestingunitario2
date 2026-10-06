import { Proceso } from './Proceso';
import { IResultadoTick } from './IResultadoTick';

// Contrato público del planificador de CPU. PlanificadorRoundRobin lo implementa.
// [SOLID · D] SimuladorSO depende de este contrato. [SOLID · O] otro algoritmo (FCFS, SJF...) lo
//     cumpliría sin cambiar el simulador.
export interface IPlanificador {
    estaLibre(): boolean;
    tomarControl(proceso: Proceso): void;
    procesoEnCpu(): string | undefined;
    liberarCpu(): void;
    ejecutarCpu(hayOtrosListos: boolean): IResultadoTick;
    
}