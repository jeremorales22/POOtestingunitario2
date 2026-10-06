import { IMetricas } from './IMetricas';
import { Proceso } from './Proceso';

// Contrato público del simulador. SimuladorSO lo implementa. Quien quiera mostrar o consultar el
// estado (un reporte, una demo) debería depender de esta interfaz y no de la clase concreta
// ([SOLID · D]).
export interface ISimulador {
    
    agregarProceso(proceso: Proceso): void;
    avanzarTick(): void;
    usoCpu(): number;
    cambiosDeContexto(): number;
    tickActual(): number;
    procesoEnCpu(): string | undefined;
    metricasMemoria(): IMetricas;
    mapaMemoria(): string[];
    estados(): string[];
    pidsListos(): string[];
    pidsEsperandoMemoria(): string[];
    pidsTerminados(): string[];

}