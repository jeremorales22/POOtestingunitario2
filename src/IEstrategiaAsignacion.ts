import { BloqueMemoria } from './BloqueMemoria';
import { Proceso } from './Proceso';

// [POO · Abstracción] + [SOLID · I]: un contrato chico, de un solo método: elegir un hueco.
// [SOLID · D] AdministradorMemoria depende de esta interfaz, no de una política concreta.
// [POO · Polimorfismo] FirstFit la implementa hoy; Best-Fit o Worst-Fit podrían sumarse sin tocar
//     AdministradorMemoria ([SOLID · O]).
export interface IEstrategiaAsignacion {
    elegirBloque(bloques: readonly BloqueMemoria[], proceso: Proceso): BloqueMemoria | undefined;
}
