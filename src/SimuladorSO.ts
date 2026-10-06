import { AdministradorMemoria } from './AdministradorMemoria';
import { Colas } from './Colas';
import { ColasProcesos } from './ColasProcesos';
import { Estadisticas } from './Estadisticas';
import { EstadisticasCpu } from './EstadisticasCpu';
import { EstrategiaAsignacion } from './EstrategiaAsignacion';
import { FirstFit } from './FirstFit';
import { GestorMemoria } from './GestorMemoria';
import { Metricas } from './Metricas';
import { Planificador } from './Planificador';
import { PlanificadorRoundRobin } from './PlanificadorRoundRobin';
import { Proceso } from './Proceso';
import { ResultadoTick } from './ResultadoTick';
import { Simulador } from './Simulador';

// El coordinador: cada tick repite siempre los mismos pasos, en orden.
// COMPOSICION ("tiene un"): esta clase tiene un GestorMemoria, una Colas, un
// Planificador y una Estadisticas. No es ninguna de esas cosas: las orquesta.
// Ya NO junta la logica de Round-Robin ni de las colas (antes estaban aca fusionadas por
// el limite de 5 clases); ahora cada una vive en su propia clase, asi que se resolvio el
// problema de SOLID-S que estaba anotado antes.
// SOLID (ya no falta la D): los 4 campos de abajo son de tipo INTERFAZ (GestorMemoria,
// Colas, Planificador, Estadisticas), no de la clase concreta. Esta clase depende de
// abstracciones, no de implementaciones, en los 4 colaboradores.
export class SimuladorSO implements Simulador {

    private memoria: GestorMemoria;
    private colas: Colas = new ColasProcesos();
    private planificador: Planificador;
    private estadisticas: Estadisticas = new EstadisticasCpu();
    private todos: Proceso[] = [];

    constructor(quantum: number = 2, tamanoMemoria: number = 1024, estrategia: EstrategiaAsignacion = new FirstFit()) {

        this.planificador = new PlanificadorRoundRobin(SimuladorSO.enteroPositivo(quantum, "El quantum"));
        this.memoria = new AdministradorMemoria(tamanoMemoria, estrategia);

    }

    // RF01: rechaza configuraciones invalidas antes de crear ningun estado (sin estados parciales).
    private static enteroPositivo(valor: number, nombre: string): number {

        const esValido = Number.isInteger(valor) && valor > 0;

        return esValido ? valor : SimuladorSO.error(`${nombre} debe ser un entero positivo`);

    }

    // Metodo de apoyo solo para poder "lanzar el error" desde dentro de un ternario
    // (throw no se puede usar como expresion). Nunca devuelve nada: siempre corta la ejecucion.
    private static error(mensaje: string): never {

        throw new Error(mensaje);

    }

    // RF02: rechaza PID duplicados y procesos que piden mas memoria que el total, sin registrar nada.
    agregarProceso(proceso: Proceso): void {

        SimuladorSO.validarRegistro(proceso, this.todos, this.memoria.metricas().total);

        this.todos.push(proceso);
        this.colas.agregarNuevo(proceso);

    }

    private static validarRegistro(proceso: Proceso, existentes: Proceso[], memoriaTotal: number): void {

        const reglas: Array<[boolean, string]> = [
            [existentes.some(p => p.pid === proceso.pid), `Ya existe un proceso con PID ${proceso.pid}`],
            [proceso.tamanoMemoria > memoriaTotal,
                `El proceso ${proceso.pid} pide ${proceso.tamanoMemoria} KB, mas que el total (${memoriaTotal} KB)`]
        ];
        const incumplida = reglas.find(([condicion]) => condicion);

        incumplida ? SimuladorSO.error(incumplida[1]) : undefined;

    }

    // RF08: fuerza el paso del proceso en CPU a BLOQUEADO (solo si admite E/S).
    bloquearProcesoActual(ticks: number = 2): void {

        const proceso = this.planificador.procesoActivo();
        const bloqueable = proceso !== undefined && proceso.admiteES();

        bloqueable ? this.ejecutarBloqueo(proceso as Proceso, ticks) : undefined;

    }

    private ejecutarBloqueo(proceso: Proceso, ticks: number): void {

        this.planificador.liberarCpu();
        proceso.reiniciarQuantum();
        proceso.bloquear(ticks);
        this.colas.bloquear(proceso);
        this.estadisticas.registrarCambioDeContexto();

    }

    // RF06: 1 tick determinista, siempre con el mismo orden de fases.
    avanzarTick(): void {

        this.estadisticas.avanzarReloj();

        this.colas.ingresarNuevos();                                    // A: nuevos -> esperando memoria
        this.colas.reintentarMemoria(proceso => this.memoria.asignar(proceso)); // A: esperando memoria -> listos
        this.colas.avanzarBloqueados();                                 // B: E/S
        this.despachar();                                               // C: la CPU toma a alguien si esta libre
        this.reaccionarAlTick(this.planificador.ejecutarCpu(this.colas.hayListos())); // D: 1 tick de Round-Robin

    }

    private despachar(): void {

        const candidato = this.planificador.estaLibre() ? this.colas.tomarListo() : undefined;

        candidato ? this.planificador.tomarControl(candidato) : undefined;

    }

    // POLIMORFISMO / LISKOV: el resto de esta clase nunca pregunta si un Proceso es un
    // ProcesoConES; llama a sus metodos (ejecutarTick, admiteES...) y listo.
    private reaccionarAlTick(resultado: ResultadoTick): void {

        this.estadisticas.registrarEjecucion(resultado.ocupado);

        resultado.terminado ? this.finalizarProceso(resultado.terminado) : undefined;
        resultado.rotado ? this.rotarProceso(resultado.rotado) : undefined;

    }

    private finalizarProceso(proceso: Proceso): void {

        this.memoria.liberar(proceso.pid);
        this.colas.terminar(proceso);

    }

    private rotarProceso(proceso: Proceso): void {

        this.colas.reencolar(proceso);
        this.estadisticas.registrarCambioDeContexto();

    }

    usoCpu(): number {

        return this.estadisticas.usoCpu();

    }

    cambiosDeContexto(): number {

        return this.estadisticas.cambiosDeContexto();

    }

    // RF10: estado del sistema consultable, sin exponer los objetos internos.
    tickActual(): number {

        return this.estadisticas.tickActual();

    }

    procesoEnCpu(): string | undefined {

        return this.planificador.procesoEnCpu();

    }

    metricasMemoria(): Metricas {

        return this.memoria.metricas();

    }

    mapaMemoria(): string[] {

        return this.memoria.mapa();

    }

    // Estado de cada proceso, en el orden en que se agregaron. Ej: "P1: EJECUTANDO".
    estados(): string[] {

        return this.todos.map(proceso => `${proceso.pid}: ${proceso.describirEstado()}`);

    }

    pidsListos(): string[] {

        return this.colas.pidsListos();

    }

    pidsEsperandoMemoria(): string[] {

        return this.colas.pidsEsperandoMemoria();

    }

    pidsTerminados(): string[] {

        return this.colas.pidsTerminados();

    }
}
