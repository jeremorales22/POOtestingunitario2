import { Proceso } from './Proceso';

// Resultado de ejecutar 1 tick de CPU: le dice a SimuladorSO que paso, para que reaccione
// (liberar memoria del terminado, reencolar al rotado, sumar un cambio de contexto...).
export interface ResultadoTick {
    ocupado: boolean;
    terminado?: Proceso;
    rotado?: Proceso;
}
