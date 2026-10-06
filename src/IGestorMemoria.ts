import { IMetricas } from './IMetricas';
import { Proceso } from './Proceso';

// [POO · Abstracción] + [SOLID · D]: SimuladorSO depende de este contrato, no de la clase concreta
// AdministradorMemoria. Solo necesita poder asignar, liberar y consultar la memoria.
// [SOLID · I] cuatro métodos, todos sobre memoria.
export interface IGestorMemoria {
    asignar(proceso: Proceso): boolean;
    liberar(pid: string): void;
    metricas(): IMetricas;
    mapa(): string[];
}
