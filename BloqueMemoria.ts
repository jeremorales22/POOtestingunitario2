import { Bloque } from './Bloque';
import { Proceso } from './Proceso';

// Una particion contigua de la RAM, libre u ocupada.
export class BloqueMemoria implements Bloque {

    // ENCAPSULAMIENTO: los 3 campos son privados. Se leen y se escriben solo a traves de
    // los get/set protegidos y de los metodos publicos (ocuparCon, liberar, fusionarCon...),
    // nunca accediendo al campo directo desde otra clase.
    private inicio: number;
    private tamano: number;
    private ocupante: string | undefined;

    constructor(inicio: number, tamano: number) {

        this.inicio = inicio;
        this.tamano = tamano;
        this.ocupante = undefined;

    }

    protected getInicio(): number {

        return this.inicio;

    }

    protected getTamano(): number {

        return this.tamano;

    }

    protected setTamano(valor: number): void {

        this.tamano = valor;

    }

    protected getOcupante(): string | undefined {

        return this.ocupante;

    }

    protected setOcupante(pid: string | undefined): void {

        this.ocupante = pid;

    }

    estaLibre(): boolean {

        return this.getOcupante() === undefined;

    }

    esDe(pid: string): boolean {

        return this.getOcupante() === pid;

    }

    esVacio(): boolean {

        return this.getTamano() === 0;

    }

    entra(proceso: Proceso): boolean {

        return this.estaLibre() && this.getTamano() >= proceso.tamanoMemoria;

    }

    capacidad(): number {

        return this.getTamano();

    }

    kbLibres(): number {

        return this.getTamano() * Number(this.estaLibre());

    }

    kbOcupados(): number {

        return this.capacidad() - this.kbLibres();

    }

    // Se achica al tamano del proceso y devuelve el sobrante como bloque libre (lista de 0 o 1).
    ocuparCon(proceso: Proceso): BloqueMemoria[] {

        const sobrante = new BloqueMemoria(
            this.getInicio() + proceso.tamanoMemoria,
            this.getTamano() - proceso.tamanoMemoria
        );

        this.setTamano(proceso.tamanoMemoria);
        this.setOcupante(proceso.pid);

        return [sobrante].filter(bloque => !bloque.esVacio());

    }

    liberar(): void {

        this.setOcupante(undefined);

    }

    puedeFusionarCon(otro: BloqueMemoria): boolean {

        return this.estaLibre() && otro.estaLibre();

    }

    fusionarCon(otro: BloqueMemoria): void {

        this.setTamano(this.getTamano() + otro.capacidad());

    }

    describir(): string {

        return `[${this.getInicio()}-${this.getInicio() + this.getTamano()} KB] ${this.getOcupante() ?? "LIBRE"}`;

    }
}
