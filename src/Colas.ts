import { Proceso } from './Proceso';

// Contrato publico de las colas de procesos. ColasProcesos lo implementa.
export interface Colas {
    agregarNuevo(proceso: Proceso): void;
    ingresarNuevos(): void;
    reintentarMemoria(intentarAsignar: (proceso: Proceso) => boolean): void;
    avanzarBloqueados(): void;
    hayListos(): boolean;
    tomarListo(): Proceso | undefined;
    reencolar(proceso: Proceso): void;
    bloquear(proceso: Proceso): void;
    terminar(proceso: Proceso): void;
    pidsListos(): string[];
    pidsEsperandoMemoria(): string[];
    pidsTerminados(): string[];
}
