"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirstFit = void 0;
// RF04: el primer bloque libre, recorriendo la lista en orden de direccion, que alcanza.
class FirstFit {
    elegirBloque(bloques, proceso) {
        return bloques.find(bloque => bloque.entra(proceso));
    }
}
exports.FirstFit = FirstFit;
