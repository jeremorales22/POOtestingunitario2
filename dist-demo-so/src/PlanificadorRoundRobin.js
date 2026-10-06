"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanificadorRoundRobin = void 0;
const Proceso_1 = require("./Proceso");
// RF07: Round-Robin con una cola FIFO de Listos (que vive en ColasProcesos, no aca) y un
// solo asiento (la CPU). RESPONSABILIDAD UNICA: esta clase solo sabe de la CPU y el
// quantum; no toca la memoria ni las colas directamente, para eso devuelve un ResultadoTick.
class PlanificadorRoundRobin {
    quantum;
    // ENCAPSULAMIENTO: enCpu es privado. Hacia afuera solo se conoce su pid (procesoEnCpu()),
    // nunca el objeto Proceso completo, para no exponer estado interno mutable.
    enCpu = undefined;
    constructor(quantum) {
        this.quantum = quantum;
    }
    estaLibre() {
        return this.enCpu === undefined;
    }
    tomarControl(proceso) {
        this.enCpu = proceso;
        proceso.cambiarEstado(Proceso_1.Estado.EJECUTANDO);
    }
    // RF10: solo el pid, nunca el objeto Proceso (vista de solo lectura).
    procesoEnCpu() {
        return this.enCpu?.pid;
    }
    // Para uso interno de SimuladorSO (por ejemplo, para el bloqueo manual por E/S):
    // "mirar" quien esta en CPU sin sacarlo todavia.
    procesoActivo() {
        return this.enCpu;
    }
    liberarCpu() {
        this.enCpu = undefined;
    }
    // RF07: descuenta 1 tick. La finalizacion tiene prioridad sobre el vencimiento del
    // quantum. hayOtrosListos decide si el proceso rota (vuelve a la cola) o renueva su
    // quantum y sigue (RF07: "si no hay otros Listos, renovar y continuar sin cambio de
    // contexto").
    ejecutarCpu(hayOtrosListos) {
        const proceso = this.enCpu;
        const ocupado = proceso !== undefined;
        proceso?.ejecutarTick();
        const termino = ocupado && proceso.estaTerminado();
        const vencioQuantum = ocupado && !termino && proceso.agotoQuantum(this.quantum);
        const rota = vencioQuantum && hayOtrosListos;
        const renueva = vencioQuantum && !hayOtrosListos;
        termino ? this.finalizar() : undefined;
        rota ? this.expulsarPorQuantum() : undefined;
        renueva ? proceso?.reiniciarQuantum() : undefined;
        return {
            ocupado,
            terminado: termino ? proceso : undefined,
            rotado: rota ? proceso : undefined
        };
    }
    finalizar() {
        this.enCpu?.cambiarEstado(Proceso_1.Estado.TERMINADO);
        this.enCpu = undefined;
    }
    expulsarPorQuantum() {
        this.enCpu?.reiniciarQuantum();
        this.enCpu = undefined;
    }
}
exports.PlanificadorRoundRobin = PlanificadorRoundRobin;
