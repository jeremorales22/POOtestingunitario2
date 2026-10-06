"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proceso = exports.Estado = void 0;
// Bloque de Control de Proceso (PCB). Equivale a UnidadCombate: guarda el estado privado
// con get/set protegidos; ProcesoConES (hija) cambia el comportamiento como Soldado con su escudo.
// HERENCIA / LISKOV: esta clase es la base de ProcesoConES (ver ProcesoConES.ts). Cualquier
// lugar que reciba un Proceso funciona igual si en realidad le pasan un ProcesoConES.
// Los 6 estados del ciclo de vida que pide la consigna.
var Estado;
(function (Estado) {
    Estado["NUEVO"] = "NUEVO";
    Estado["ESPERANDO_MEMORIA"] = "ESPERANDO_MEMORIA";
    Estado["LISTO"] = "LISTO";
    Estado["EJECUTANDO"] = "EJECUTANDO";
    Estado["BLOQUEADO"] = "BLOQUEADO";
    Estado["TERMINADO"] = "TERMINADO";
})(Estado || (exports.Estado = Estado = {}));
class Proceso {
    pid;
    tamanoMemoria;
    // ENCAPSULAMIENTO: estos 4 campos son privados. Nadie de afuera los lee ni los escribe
    // directo; solo se llega a ellos por los get/set protegidos de mas abajo, o por los
    // metodos publicos (ejecutarTick, cambiarEstado, etc.) que respetan las reglas del dominio.
    tiempoTotal;
    tiempoRestante;
    quantumConsumido;
    estado;
    // pid y tamanoMemoria son la identidad del proceso: no deben poder reasignarse desde afuera
    // (RF02 / doble encapsulamiento). readonly evita esa mutacion externa.
    constructor(pid, tamanoMemoria, tiempoCpu) {
        this.pid = pid;
        this.tamanoMemoria = tamanoMemoria;
        this.tiempoTotal = tiempoCpu;
        this.tiempoRestante = tiempoCpu;
        this.quantumConsumido = 0;
        this.estado = Estado.NUEVO; // RF03: todo proceso nace en estado NUEVO
    }
    getTiempoTotal() {
        return this.tiempoTotal;
    }
    setTiempoTotal(valor) {
        this.tiempoTotal = valor;
    }
    getEstado() {
        return this.estado;
    }
    setEstado(valor) {
        this.estado = valor;
    }
    getTiempoRestante() {
        return this.tiempoRestante;
    }
    setTiempoRestante(valor) {
        this.tiempoRestante = valor;
    }
    getQuantumConsumido() {
        return this.quantumConsumido;
    }
    setQuantumConsumido(valor) {
        this.quantumConsumido = valor;
    }
    ejecutarTick() {
        this.setTiempoRestante(this.getTiempoRestante() - 1);
        this.setQuantumConsumido(this.getQuantumConsumido() + 1);
    }
    cambiarEstado(nuevo) {
        this.setEstado(nuevo);
    }
    estaEn(estado) {
        return this.getEstado() === estado;
    }
    describirEstado() {
        return this.getEstado();
    }
    // Usa el tiempo total (que no cambia) y el restante (que baja en cada tick).
    porcentajeCompletado() {
        return ((this.getTiempoTotal() - this.getTiempoRestante()) / this.mayorEntre(this.getTiempoTotal(), 1)) * 100;
    }
    // Reemplaza a Math.max: si a es mayor, se queda con a; si no, con b.
    // Protegido para que ProcesoConES tambien lo pueda usar.
    mayorEntre(a, b) {
        return a > b ? a : b;
    }
    estaTerminado() {
        return this.getTiempoRestante() <= 0;
    }
    agotoQuantum(limite) {
        return this.getQuantumConsumido() >= limite;
    }
    reiniciarQuantum() {
        this.setQuantumConsumido(0);
    }
    // POLIMORFISMO: estos 4 metodos son el "comportamiento por defecto" (un proceso comun
    // no hace E/S). ProcesoConES los sobrescribe con override (ver ProcesoConES.ts). Quien
    // los llama (SimuladorSO) no pregunta que tipo de proceso es, solo invoca el metodo.
    admiteES() {
        return false;
    }
    bloquear(ticks) {
    }
    avanzarBloqueo() {
    }
    estaBloqueado() {
        return false;
    }
}
exports.Proceso = Proceso;
