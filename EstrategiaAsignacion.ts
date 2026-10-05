import { BloqueMemoria } from './BloqueMemoria';
import { Proceso } from './Proceso';

// ABSTRACCION + INTERFACE SEGREGATION (la "I" de SOLID): un contrato chico y especifico,
// con un solo metodo. AdministradorMemoria depende de esta interfaz, no de una politica
// concreta (Dependency Inversion). FirstFit, BestFit y WorstFit la implementan cada una
// a su manera (POLIMORFISMO): AdministradorMemoria las usa sin saber cual es cual.
export interface EstrategiaAsignacion {
    elegirBloque(bloques: BloqueMemoria[], proceso: Proceso): BloqueMemoria | undefined;
}
