import { AdministradorMemoria } from './AdministradorMemoria';
import { IColas } from './IColas';
import { ColasProcesos } from './ColasProcesos';
import { IEstadisticas } from './IEstadisticas';
import { EstadisticasCpu } from './EstadisticasCpu';
import { IEstrategiaAsignacion } from './IEstrategiaAsignacion';
import { FirstFit } from './FirstFit';
import { IGestorMemoria } from './IGestorMemoria';
import { IMetricas } from './IMetricas';
import { IPlanificador } from './IPlanificador';
import { PlanificadorRoundRobin } from './PlanificadorRoundRobin';
import { Proceso } from './Proceso';
import { IResultadoTick } from './IResultadoTick';
import { ISimulador } from './ISimulador';

// Teoría (Tema 16): un simulador avanza por ticks y en cada uno repite los mismos pasos, en el mismo
// orden (A admisión, B entrada/salida, C despacho, D un tick de CPU). Eso lo hace determinista.
//
// PRINCIPIOS QUE APLICA
// [POO · Composición] «tiene» una memoria, unas colas, un planificador y unas estadísticas, y los
//     crea él mismo en el constructor. No es ninguna de esas cosas: las ORQUESTA.
// [SOLID · S] solo coordina. Cada colaboradora tiene su única responsabilidad (colas, CPU, RAM, contadores).
// [SOLID · D] los 4 campos son de tipo INTERFAZ (IGestorMemoria, IColas, IPlanificador,
//     IEstadisticas): depende de abstracciones, no de clases concretas.
// [SOLID · O] se puede cambiar la política de memoria (parámetro `estrategia`) sin modificar esta clase.
// [POO · Polimorfismo] / [SOLID · L] nunca pregunta si un proceso es común o con E/S: llama a sus
//     métodos y listo.
// [POO · Encapsulamiento] todo el estado es privado; el estado se consulta con métodos que devuelven
//     valores simples (PIDs, textos, números), sin exponer objetos internos (RF10).
// [SOLID · I] implementa ISimulador, el contrato hacia afuera. Es amplio (órdenes y consultas); se
//     podría separar en dos interfaces más chicas si creciera.

export class SimuladorSO implements ISimulador {
    // Los 4 colaboradores, tipados con su INTERFAZ (inversión de dependencias).
    // `todos` guarda el orden de registro para poder informar el estado de cada proceso.
    private memoria: IGestorMemoria;
    private colas: IColas = new ColasProcesos();
    private planificador: IPlanificador;
    private estadisticas: IEstadisticas = new EstadisticasCpu();
    private todos: Proceso[] = [];

    // Quantum, tamaño de RAM y política de memoria se eligen al crear el simulador y no se cambian
    // después (RF01). Valores por defecto: quantum 2, 1024 KB, First-Fit. [POO · Inyección de
    // dependencias]: la estrategia llega por parámetro y se la pasa a AdministradorMemoria.
    constructor(quantum: number = 2, tamanoMemoria: number = 1024, estrategia: IEstrategiaAsignacion = new FirstFit()){

        this.planificador = new PlanificadorRoundRobin(SimuladorSO.enteroPositivo(quantum, "El quantum"));
        this.memoria = new AdministradorMemoria(tamanoMemoria, estrategia);

    }

    // RF01: rechaza un quantum inválido antes de crear ningún estado (sin estados a medias).
    private static enteroPositivo(valor: number, nombre: string): number {

        const esValido = Number.isInteger(valor) && valor > 0;

        esValido || SimuladorSO.error(`${nombre} debe ser un entero positivo`);

        return valor;

    }

    // Auxiliar para lanzar un error desde dentro de un ternario (el proyecto evita `if`). Devuelve
    // `never`: nunca retorna.
    private static error(mensaje: string): never {

        throw new Error(mensaje);

    }

    // RF02: rechaza PID duplicados y procesos que piden más memoria que toda la RAM, sin registrar nada.
    agregarProceso(proceso: Proceso): void {

        SimuladorSO.validarRegistro(proceso, this.todos, this.memoria.metricas().total);

        this.todos.push(proceso);
        this.colas.agregarNuevo(proceso);

    }

   private static validarRegistro(proceso: Proceso, existentes: Proceso[], memoriaTotal: number): void{

        existentes.some(p => p.pid === proceso.pid) && SimuladorSO.error(`Ya existe un proceso con PID ${proceso.pid}`);

        proceso.tamanoMemoria > memoriaTotal
            && SimuladorSO.error(`El proceso ${proceso.pid} pide ${proceso.tamanoMemoria} KB, mas que el total (${memoriaTotal} KB)`);

    }
    
    // RF08: el planificador detectó que el proceso cumplió los N ticks de su evento; acá se lo manda a
    // BLOQUEADOS: empieza la espera y cuenta un cambio de contexto. El proceso bloqueado CONSERVA su
    // memoria: solo se libera cuando termina. [POO · Polimorfismo]: no pregunta de qué clase es.
    private bloquearPorES(proceso: Proceso): void {
        proceso.reiniciarQuantum();
        proceso.bloquear(proceso.duracionES());
        this.colas.bloquear(proceso);
        this.estadisticas.registrarCambioDeContexto();
    }

    // RF06 / Tema 16: UN tick, siempre con el mismo orden de fases:
    //   A) nuevos -> esperando memoria, y se reintenta la RAM  B) bloqueados  C) despacho  D) un tick de CPU.
    avanzarTick(): void {
        this.estadisticas.avanzarReloj();

        this.colas.ingresarNuevos();                                    // A: nuevos -> esperando memoria
        this.colas.reintentarMemoria(proceso => this.memoria.asignar(proceso)); // A: esperando memoria -> listos
        this.colas.avanzarBloqueados();                                 // B: E/S
        this.despachar();                                               // C: la CPU toma a alguien si esta libre
        this.reaccionarAlTick(this.planificador.ejecutarCpu(this.colas.hayListos())); // D: 1 tick de Round-Robin
    }

    // Dispatcher (Tema 5): si la CPU está libre, entra el primero de listos (cola FIFO).
    private despachar(): void {

        const candidato = this.planificador.estaLibre() ? this.colas.tomarListo() : undefined;

        candidato ? this.planificador.tomarControl(candidato) : undefined;

    }

    // El planificador solo INFORMA qué pasó (IResultadoTick); acá se reacciona: si terminó, se libera su
    // memoria (con coalescencia); si rotó, vuelve a la cola y se cuenta un cambio de contexto.
    // [SOLID · S]: cada colaboradora hace lo suyo y SimuladorSO las conecta.
    private reaccionarAlTick(resultado: IResultadoTick): void {

        this.estadisticas.registrarEjecucion(resultado.ocupado);

        resultado.terminado && this.finalizarProceso(resultado.terminado);
        resultado.rotado && this.rotarProceso(resultado.rotado);
        resultado.bloqueado && this.bloquearPorES(resultado.bloqueado);

    }

    private finalizarProceso(proceso: Proceso): void {

        this.memoria.liberar(proceso.pid);
        this.colas.terminar(proceso);

    }

    private rotarProceso(proceso: Proceso): void {

        this.colas.reencolar(proceso);
        this.estadisticas.registrarCambioDeContexto();

    }

    // Métricas de CPU: se piden a EstadisticasCpu (delegación).
    usoCpu(): number {

        return this.estadisticas.usoCpu();

    }

    cambiosDeContexto(): number {

        return this.estadisticas.cambiosDeContexto();

    }

    // RF10: el estado del sistema se consulta sin exponer los objetos internos.
    tickActual(): number {

        return this.estadisticas.tickActual();

    }

    procesoEnCpu(): string | undefined {

        return this.planificador.procesoEnCpu();

    }

    metricasMemoria(): IMetricas {

        return this.memoria.metricas();

    }

    mapaMemoria(): string[] {

        return this.memoria.mapa();

    }

    // Estado de cada proceso, en el orden de registro. Ej: «P1: EJECUTANDO».
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
