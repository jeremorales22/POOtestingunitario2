"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloqueMemoria = void 0;
// Una particion contigua de la RAM, libre u ocupada.
class BloqueMemoria {
    // ENCAPSULAMIENTO: los 3 campos son privados. Se leen y se escriben solo a traves de
    // los get/set protegidos y de los metodos publicos (ocuparCon, liberar, fusionarCon...),
    // nunca accediendo al campo directo desde otra clase.
    inicio;
    tamano;
    ocupante;
    constructor(inicio, tamano) {
        this.inicio = inicio;
        this.tamano = tamano;
        this.ocupante = undefined;
    }
    getInicio() {
        return this.inicio;
    }
    getTamano() {
        return this.tamano;
    }
    setTamano(valor) {
        this.tamano = valor;
    }
    getOcupante() {
        return this.ocupante;
    }
    setOcupante(pid) {
        this.ocupante = pid;
    }
    estaLibre() {
        return this.getOcupante() === undefined;
    }
    esDe(pid) {
        return this.getOcupante() === pid;
    }
    esVacio() {
        return this.getTamano() === 0;
    }
    entra(proceso) {
        return this.estaLibre() && this.getTamano() >= proceso.tamanoMemoria;
    }
    capacidad() {
        return this.getTamano();
    }
    kbLibres() {
        return this.getTamano() * Number(this.estaLibre());
    }
    kbOcupados() {
        return this.capacidad() - this.kbLibres();
    }
    // Se achica al tamano del proceso y devuelve el sobrante como bloque libre (lista de 0 o 1).
    ocuparCon(proceso) {
        const sobrante = new BloqueMemoria(this.getInicio() + proceso.tamanoMemoria, this.getTamano() - proceso.tamanoMemoria);
        this.setTamano(proceso.tamanoMemoria);
        this.setOcupante(proceso.pid);
        return [sobrante].filter(bloque => !bloque.esVacio());
    }
    liberar() {
        this.setOcupante(undefined);
    }
    puedeFusionarCon(otro) {
        return this.estaLibre() && otro.estaLibre();
    }
    fusionarCon(otro) {
        this.setTamano(this.getTamano() + otro.capacidad());
    }
    describir() {
        return `[${this.getInicio()}-${this.getInicio() + this.getTamano()} KB] ${this.getOcupante() ?? "LIBRE"}`;
    }
}
exports.BloqueMemoria = BloqueMemoria;
