import { BloqueMemoria } from './BloqueMemoria';
import { EstrategiaAsignacion } from './EstrategiaAsignacion';
import { Proceso } from './Proceso';

// RF04: el primer bloque libre, recorriendo la lista en orden de direccion, que alcanza.
export class FirstFit implements EstrategiaAsignacion {

    elegirBloque(bloques: BloqueMemoria[], proceso: Proceso): BloqueMemoria | undefined {

        return bloques.find(bloque => bloque.entra(proceso));

    }
}
