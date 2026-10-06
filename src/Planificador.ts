import { Proceso } from './Proceso';
import { ResultadoTick } from './ResultadoTick';

// Contrato publico del planificador de CPU. PlanificadorRoundRobin lo implementa.
export interface Planificador {
    estaLibre(): boolean;
    tomarControl(proceso: Proceso): void;
    procesoEnCpu(): string | undefined;
    procesoActivo(): Proceso | undefined;
    liberarCpu(): void;
    ejecutarCpu(hayOtrosListos: boolean): ResultadoTick;
}
