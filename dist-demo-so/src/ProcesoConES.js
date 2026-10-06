"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcesoConES = void 0;
const Proceso_1 = require("./Proceso");
// Proceso que ademas puede bloquearse por E/S durante N ticks.
// HERENCIA (relacion "es un"): un ProcesoConES es un Proceso, con un comportamiento extra.
// LISKOV: en SimuladorSO, todo lugar que usa un Proceso funciona igual si en realidad
// recibe un ProcesoConES (por ejemplo, en ejecutarCpu() o avanzarBloqueados()).
// Ya cumple ComportamientoProceso por herencia (Proceso lo implementa); se vuelve a
// declarar aca para que quede visible en este archivo tambien.
class ProcesoConES extends Proceso_1.Proceso {
    tiempoBloqueo = 0;
    getTiempoBloqueo() {
        return this.tiempoBloqueo;
    }
    setTiempoBloqueo(valor) {
        this.tiempoBloqueo = valor;
    }
    // POLIMORFISMO: estos 4 metodos sobrescriben (override) el comportamiento por defecto
    // de Proceso. SimuladorSO los llama igual que a los de un Proceso comun, sin saber
    // que esta hablando con un ProcesoConES.
    admiteES() {
        return true;
    }
    bloquear(ticks) {
        this.setTiempoBloqueo(ticks);
    }
    avanzarBloqueo() {
        this.setTiempoBloqueo(this.mayorEntre(0, this.getTiempoBloqueo() - 1));
    }
    estaBloqueado() {
        return this.getTiempoBloqueo() > 0;
    }
}
exports.ProcesoConES = ProcesoConES;
