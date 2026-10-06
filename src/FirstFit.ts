import { BloqueMemoria } from './BloqueMemoria';
import { IEstrategiaAsignacion } from './IEstrategiaAsignacion';
import { Proceso } from './Proceso';

// Teoría (Tema 11): First-Fit recorre los huecos en orden de dirección y elige el PRIMERO que
// alcanza, sin comparar con los demás. Es rápido; su riesgo es llenar el comienzo de huecos chicos.
//
// PRINCIPIOS QUE APLICA
// [POO · Polimorfismo] implementa IEstrategiaAsignacion; AdministradorMemoria la usa sin saber cuál es.
// [SOLID · O] se pueden sumar otras políticas sin modificar AdministradorMemoria.
// [SOLID · S] solo decide QUÉ hueco usar; no lo ocupa ni lo divide.
export class FirstFit implements IEstrategiaAsignacion {

    // `find` devuelve el primer bloque libre en el que entra el proceso, o undefined si ninguno alcanza.
    // [POO · Encapsulamiento] `readonly`: la estrategia puede MIRAR la lista de bloques pero no modificarla.
    elegirBloque(bloques: readonly BloqueMemoria[], proceso: Proceso): BloqueMemoria | undefined {

        return bloques.find(bloque => bloque.entra(proceso));

    }
}