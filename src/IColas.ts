import { Proceso } from './Proceso';

// Contrato público de las colas de procesos. ColasProcesos lo implementa.
// [SOLID · D] SimuladorSO depende de este contrato, no de la clase concreta. [SOLID · I] solo
//     contiene lo relacionado con mover procesos entre colas.
export interface IColas {
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