import { Proceso } from './Proceso';

// Contrato publico de una particion de memoria. BloqueMemoria lo implementa.
export interface Bloque {
    estaLibre(): boolean;
    esDe(pid: string): boolean;
    esVacio(): boolean;
    entra(proceso: Proceso): boolean;
    capacidad(): number;
    kbLibres(): number;
    kbOcupados(): number;
    ocuparCon(proceso: Proceso): Bloque[];
    liberar(): void;
    puedeFusionarCon(otro: Bloque): boolean;
    fusionarCon(otro: Bloque): void;
    describir(): string;
}
