import { Proceso } from './Proceso';

// Contrato público de un bloque de memoria. BloqueMemoria lo implementa.
// [SOLID · I] describe solo lo que se le pide a un bloque. [SOLID · D] hoy AdministradorMemoria usa
//     la clase BloqueMemoria directamente; apuntar a este contrato permitiría cambiar el bloque sin tocarla.
export interface IBloque {
    estaLibre(): boolean;
    esDe(pid: string): boolean;
    esVacio(): boolean;
    entra(proceso: Proceso): boolean;
    capacidad(): number;
    kbLibres(): number;
    kbOcupados(): number;
    ocuparCon(proceso: Proceso): IBloque[];
    liberar(): void;
    puedeFusionarCon(otro: IBloque): boolean;
    fusionarCon(otro: IBloque): void;
    describir(): string;

}