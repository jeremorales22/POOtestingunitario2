import { Planificador } from './Planificador';
import { Estado, Proceso } from './Proceso';
import { ResultadoTick } from './ResultadoTick';

// RF07: Round-Robin con una cola FIFO de Listos (que vive en ColasProcesos, no aca) y un
// solo asiento (la CPU). RESPONSABILIDAD UNICA: esta clase solo sabe de la CPU y el
// quantum; no toca la memoria ni las colas directamente, para eso devuelve un ResultadoTick.
export class PlanificadorRoundRobin implements Planificador {

    // ENCAPSULAMIENTO: enCpu es privado. Hacia afuera solo se conoce su pid (procesoEnCpu()),
    // nunca el objeto Proceso completo, para no exponer estado interno mutable.
    private enCpu: Proceso | undefined = undefined;

    constructor(private quantum: number) {

    }

    estaLibre(): boolean {

        return this.enCpu === undefined;

    }

    tomarControl(proceso: Proceso): void {

        this.enCpu = proceso;
        proceso.cambiarEstado(Estado.EJECUTANDO);

    }

    // RF10: solo el pid, nunca el objeto Proceso (vista de solo lectura).
    procesoEnCpu(): string | undefined {

        return this.enCpu?.pid;

    }

    // Para uso interno de SimuladorSO (por ejemplo, para el bloqueo manual por E/S):
    // "mirar" quien esta en CPU sin sacarlo todavia.
    procesoActivo(): Proceso | undefined {

        return this.enCpu;

    }

    liberarCpu(): void {

        this.enCpu = undefined;

    }

    // RF07: descuenta 1 tick. La finalizacion tiene prioridad sobre el vencimiento del
    // quantum. hayOtrosListos decide si el proceso rota (vuelve a la cola) o renueva su
    // quantum y sigue (RF07: "si no hay otros Listos, renovar y continuar sin cambio de
    // contexto").
    ejecutarCpu(hayOtrosListos: boolean): ResultadoTick {

        const proceso = this.enCpu;
        const ocupado = proceso !== undefined;

        proceso?.ejecutarTick();

        const termino = ocupado && (proceso as Proceso).estaTerminado();
        const vencioQuantum = ocupado && !termino && (proceso as Proceso).agotoQuantum(this.quantum);
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

    private finalizar(): void {

        this.enCpu?.cambiarEstado(Estado.TERMINADO);
        this.enCpu = undefined;

    }

    private expulsarPorQuantum(): void {

        this.enCpu?.reiniciarQuantum();
        this.enCpu = undefined;

    }
}
