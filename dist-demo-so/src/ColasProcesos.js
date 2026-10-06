"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColasProcesos = void 0;
const Proceso_1 = require("./Proceso");
// Las 3 salas de espera del proceso (esperando memoria, listos, bloqueados) mas los dos
// extremos del ciclo de vida (nuevos y terminados). RESPONSABILIDAD UNICA: esta clase solo
// mueve procesos de una cola a otra; no sabe nada de memoria ni de CPU.
class ColasProcesos {
    // ENCAPSULAMIENTO: las 5 listas son privadas. Nadie de afuera empuja o saca procesos
    // directo; todo pasa por los metodos de abajo.
    nuevos = [];
    esperandoMemoria = [];
    listos = [];
    bloqueados = [];
    terminados = [];
    agregarNuevo(proceso) {
        proceso.cambiarEstado(Proceso_1.Estado.NUEVO);
        this.nuevos.push(proceso);
    }
    ingresarNuevos() {
        this.nuevos.forEach(proceso => proceso.cambiarEstado(Proceso_1.Estado.ESPERANDO_MEMORIA));
        this.esperandoMemoria.push(...this.nuevos);
        this.nuevos = [];
    }
    // RF03: reintenta la asignacion en orden de registro. Recibe COMO PARAMETRO la funcion
    // que intenta asignar memoria (se la pasa SimuladorSO), asi esta clase no necesita
    // conocer a AdministradorMemoria (bajo acoplamiento).
    reintentarMemoria(intentarAsignar) {
        const ubicados = this.esperandoMemoria.filter(intentarAsignar);
        this.esperandoMemoria = this.esperandoMemoria.filter(proceso => !ubicados.includes(proceso));
        ubicados.forEach(proceso => proceso.cambiarEstado(Proceso_1.Estado.LISTO));
        this.listos.push(...ubicados);
    }
    avanzarBloqueados() {
        this.bloqueados.forEach(proceso => proceso.avanzarBloqueo());
        const despiertos = this.bloqueados.filter(proceso => !proceso.estaBloqueado());
        this.bloqueados = this.bloqueados.filter(proceso => proceso.estaBloqueado());
        despiertos.forEach(proceso => proceso.cambiarEstado(Proceso_1.Estado.LISTO));
        this.listos.push(...despiertos);
    }
    hayListos() {
        return this.listos.length > 0;
    }
    tomarListo() {
        return this.listos.shift();
    }
    reencolar(proceso) {
        proceso.cambiarEstado(Proceso_1.Estado.LISTO);
        this.listos.push(proceso);
    }
    bloquear(proceso) {
        proceso.cambiarEstado(Proceso_1.Estado.BLOQUEADO);
        this.bloqueados.push(proceso);
    }
    terminar(proceso) {
        proceso.cambiarEstado(Proceso_1.Estado.TERMINADO);
        this.terminados.push(proceso);
    }
    pidsListos() {
        return this.listos.map(proceso => proceso.pid);
    }
    pidsEsperandoMemoria() {
        return this.esperandoMemoria.map(proceso => proceso.pid);
    }
    pidsTerminados() {
        return this.terminados.map(proceso => proceso.pid);
    }
}
exports.ColasProcesos = ColasProcesos;
