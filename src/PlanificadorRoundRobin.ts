import { IPlanificador } from './IPlanificador';
import { Estado, Proceso } from './Proceso';
import { IResultadoTick } from './IResultadoTick';

// Teoría (Temas 5 a 8): Round-Robin es un algoritmo apropiativo con turnos. Los procesos listos
// forman una cola FIFO y cada uno usa la CPU como máximo un QUANTUM seguido; si no terminó,
// vuelve al final de la cola. Hay una sola CPU, o sea un solo «asiento».
//
// PRINCIPIOS QUE APLICA
// [SOLID · S] solo sabe de la CPU y el quantum. La cola de listos vive en ColasProcesos y la
//     memoria en AdministradorMemoria: por eso este planificador DEVUELVE un IResultadoTick y deja
//     que SimuladorSO reaccione, en vez de tocar esas cosas.
// [SOLID · O] otro algoritmo (por ejemplo FCFS) sería otra clase que cumpla IPlanificador, sin
//     tocar SimuladorSO.
// [SOLID · D] SimuladorSO depende del contrato IPlanificador, no de esta clase.
// [POO · Encapsulamiento] quién está en la CPU (enCpu) es privado.

export class PlanificadorRoundRobin implements IPlanificador {

    // [POO · Encapsulamiento] enCpu es privado. Hacia afuera se expone solo el PID (procesoEnCpu()),
    // nunca el objeto.
    private enCpu: Proceso | undefined = undefined;

    // El quantum se fija al crear el planificador (RF01: SimuladorSO ya lo validó).
    constructor(private quantum: number) {

    }

    // ¿Hay alguien en la CPU?
    estaLibre(): boolean {

        return this.enCpu === undefined;

    }
    // Dispatcher (Tema 5): entrega la CPU al proceso elegido y lo pasa a EJECUTANDO.
    tomarControl(proceso: Proceso): void {

        this.enCpu = proceso;
        proceso.cambiarEstado(Estado.EJECUTANDO);

    }

    // RF10: solo el PID, para consultas de solo lectura (no se expone el objeto).
    procesoEnCpu(): string | undefined {

        return this.enCpu?.pid;

    }

    // La CPU queda libre (por ejemplo, cuando el proceso se bloquea por E/S).
    liberarCpu(): void {

        this.enCpu = undefined;

    }

    // Un tick de CPU: descuenta 1 tick y responde, EN ESTE ORDEN: ¿terminó? ¿pidió E/S (RF08)? ¿venció el quantum?
    // La finalización tiene prioridad sobre el quantum. Si venció y hay otros listos, ROTA (y cuenta
    // un cambio de contexto); si no hay nadie más, RENUEVA el quantum y sigue (RF07).
    ejecutarCpu(hayOtrosListos: boolean): IResultadoTick {

        const proceso = this.enCpu;
        const ocupado = proceso !== undefined;

        ocupado && proceso.ejecutarTick();

        const termino = ocupado && proceso.estaTerminado();
        const pideES = ocupado && !termino && proceso.debeBloquearse();
        const vencioQuantum = ocupado && !termino && !pideES && proceso.agotoQuantum(this.quantum);
        const rota = vencioQuantum && hayOtrosListos;
        const renueva = vencioQuantum && !hayOtrosListos;

        termino && this.finalizar();
        pideES && this.liberarCpu();
        rota && this.expulsarPorQuantum();
        renueva && proceso.reiniciarQuantum();

        return {
            ocupado,
            terminado: termino ? proceso : undefined,
            rotado: rota ? proceso : undefined,
            bloqueado: pideES ? proceso : undefined
        };

    }

    private finalizar(): void {

        this.enCpu = undefined;

    }

    private expulsarPorQuantum(): void {

        this.enCpu?.reiniciarQuantum();
        this.enCpu = undefined;

    }
}