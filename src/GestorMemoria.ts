import { Metricas } from './Metricas';
import { Proceso } from './Proceso';

// ABSTRACCION + DEPENDENCY INVERSION (la "D" de SOLID): SimuladorSO depende de este
// contrato, no de la clase concreta AdministradorMemoria. Hoy solo hay una implementacion,
// pero SimuladorSO no lo sabe ni le importa: solo necesita poder asignar, liberar y
// consultar memoria.
export interface GestorMemoria {
    asignar(proceso: Proceso): boolean;
    liberar(pid: string): void;
    metricas(): Metricas;
    mapa(): string[];
}
