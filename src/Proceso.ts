import { ComportamientoProceso } from './IComportamientoProceso';

// Los 6 estados del ciclo de vida de un proceso (Tema 2 del apunte).
// El modelo clásico tiene 5 (Nuevo, Listo, En ejecución, Bloqueado, Terminado); el simulador
// agrega ESPERANDO_MEMORIA porque la consigna lo pide: en memoria contigua un proceso puede
// no entrar a la RAM y tiene que esperar.

export enum Estado{ //enum: una lista fija de valores con nombre. Define los seis estados por los que puede pasar un proceso
    NUEVO = "NUEVO",
    ESPERANDO_MEMORIA = "ESPERANDO_MEMORIA",
    LISTO = "LISTO",
    EJECUTANDO = "EJECUTANDO",
    BLOQUEADO = "BLOQUEADO",
    TERMINADO = "TERMINADO",

}

// Teoría (Temas 1 a 3): un proceso es un programa en ejecución, y el PCB (Bloque de Control de
// Proceso) es la ficha donde el sistema operativo guarda sus datos: PID, estado, memoria, CPU
// usada y restante. Esta clase es ese PCB, simplificado a lo que el simulador necesita.
//
// PRINCIPIOS QUE APLICA
// [POO · Abstracción] modela solo lo importante de un proceso (no hay registros ni contador de programa).
// [POO · Encapsulamiento] los campos son privados; se llega a ellos por get/set protegidos y por
//     métodos que respetan las reglas (ejecutarTick, cambiarEstado...).
// [POO · Herencia] es la clase base de ProcesoConES (ver ProcesoConES.ts).
// [SOLID · S] una sola responsabilidad: guardar los datos del proceso y su ciclo de vida. No decide
//     quién usa la CPU (eso es del planificador) ni dónde se ubica en memoria.
// [SOLID · L] cualquier lugar que reciba un Proceso funciona igual si le pasan un ProcesoConES.
// [SOLID · I] implementa IComportamientoProceso, el contrato público de un proceso.

export class Proceso implements ComportamientoProceso {

    // [POO · Encapsulamiento] estos 4 campos son privados: nadie de afuera los lee ni los escribe
    // directo. Se llega a ellos por los get/set protegidos de abajo o por los métodos públicos.
    private tiempoTotal: number;
    private tiempoRestante: number;
    private quantumConsumido: number;
    private estado: Estado;

    // [POO · Doble encapsulamiento] el proceso protege sus propias transiciones: la tabla dice,
    // para cada estado, a cuáles puede pasar. TERMINADO es final (no sale a ninguno).
    private static readonly TRANSICIONES: Record<Estado, Estado[]> = {
        [Estado.NUEVO]: [Estado.ESPERANDO_MEMORIA],
        [Estado.ESPERANDO_MEMORIA]: [Estado.LISTO],
        [Estado.LISTO]: [Estado.EJECUTANDO],
        [Estado.EJECUTANDO]: [Estado.LISTO, Estado.BLOQUEADO, Estado.TERMINADO],
        [Estado.BLOQUEADO]: [Estado.LISTO],
        [Estado.TERMINADO]: [],
    };

    // pid y tamanoMemoria son la identidad del proceso (PID y memoria que pide): no deben cambiar
    // después de creado. `readonly` lo garantiza. [POO · Encapsulamiento por inmutabilidad]: se leen
    // directo pero no se pueden reescribir. (No es «doble encapsulamiento»: para eso tendrían que ser
    // privados y exponerse solo con un getter.)
    constructor(readonly pid: string, readonly tamanoMemoria: number, tiempoCpu: number) {

        this.tiempoTotal = tiempoCpu;
        this.tiempoRestante = tiempoCpu;
        this.quantumConsumido = 0;
        this.estado = Estado.NUEVO;// RF03: todo proceso nace en estado NUEVO

    }
   // [POO · Encapsulamiento] get/set protegidos (estilo UnidadCombate de Batalla Campal). `protected`
   // significa: visibles para esta clase y para sus hijas (ProcesoConES), pero no para el resto del
   // programa. Es lo que permite la herencia sin romper el encapsulamiento.
   protected getTiempoTotal(): number {

        return this.tiempoTotal;

    }
    //
    protected setTiempoTotal(valor: number): void {
        this.tiempoTotal = valor;
    }

    //
    protected getEstado(): Estado{
        return this.estado;
    }

    protected setEstado(valor: Estado): void{
        this.estado = valor;
    }
    //
    protected getTiempoRestante(): number {
        return this.tiempoRestante;
    }
     
    protected setTiempoRestante(valor: number): void {
        this.tiempoRestante = valor;
    }
    //
    protected getQuantumConsumido(): number{
        return this.quantumConsumido;
    }

    protected setQuantumConsumido(valor: number): void{
        this.quantumConsumido = valor;
    }

    // Tema 16: un tick de CPU. Al proceso le falta un tick menos y gasta uno de su turno (quantum).
    ejecutarTick(): void {

        this.setTiempoRestante(this.getTiempoRestante() - 1);
        this.setQuantumConsumido(this.getQuantumConsumido() + 1);

    }
    // Tema 2: pasa el proceso a otro estado, pero solo si la transición existe en la tabla.
    cambiarEstado(nuevo: Estado): void{
        const permitido = Proceso.TRANSICIONES[this.getEstado()].includes(nuevo);

        permitido || Proceso.error(`Transicion invalida: ${this.getEstado()} -> ${nuevo}`);

        this.setEstado(nuevo);
    }

    // Lanza el error desde dentro de una expresión (el proyecto evita `if`).
    // Es protected porque ProcesoConES la reutiliza (RF08).
    protected static error(mensaje: string): never {
        throw new Error(mensaje);
    }
    //
    estaEn(estado: Estado): boolean {

        return this.getEstado() === estado;

    }
    //
    describirEstado(): string {

        return this.getEstado();

    }
    //
    // Usa el tiempo total (que no cambia) y el restante (que baja en cada tick).
    porcentajeCompletado(): number {

        return ((this.getTiempoTotal() - this.getTiempoRestante()) / this.mayorEntre(this.getTiempoTotal(), 1)) * 100;

    }
    //
    // Reemplaza a Math.max: si a es mayor, se queda con a; si no, con b.
    // Protegido para que ProcesoConES tambien lo pueda usar.
    protected mayorEntre(a: number, b: number): number { //método auxiliar que devuelve el mayor de dos números

        return a > b ? a : b;

    }
    // Tema 7: terminó cuando no le queda tiempo de CPU.
    estaTerminado(): boolean {
        // Terminó cuando no le queda tiempo de CPU: el tiempo restante es menor o igual a 0.
        // Se usa <= y no == para que, si bajara de 0, igual se lo considere terminado. 
        return this.getTiempoRestante() <= 0;

    }
    // Temas 7 y 8: ¿consumió todo su turno? El planificador usa esto para decidir si lo rota.
    agotoQuantum(limite: number): boolean {
        // Agotó su turno cuando los ticks que consumió seguidos llegan al quantum (mayor o igual).
        // Se usa >= para cubrir también el caso de haberse pasado del límite.
        return this.getQuantumConsumido() >= limite;

        //porque limite no usa get 
        // El límite viene por parámetro y no con un get porque el quantum es del planificador, 
        // no del proceso: así Proceso no duplica ese dato ni depende de Round-Robin.
    }
    // Empieza un turno nuevo (al volver a la cola o al renovar el quantum).
    reiniciarQuantum(): void {

        this.setQuantumConsumido(0);

    }
    // [POO · Polimorfismo] estos 6 métodos son el comportamiento por defecto: un proceso común NO hace E/S.
    // ProcesoConES los sobrescribe con `override`. Quien los llama (SimuladorSO, ColasProcesos) nunca
    // pregunta de qué tipo es el proceso: llama al método y cada clase responde a su manera.
    admiteES(): boolean {

        return false;

    }
    // RF08: ¿le toca pedir E/S en este tick? Un proceso común nunca la pide.
    debeBloquearse(): boolean {

        return false;

    }
    // RF08: cuántos ticks dura su E/S. Un proceso común no tiene.
    duracionES(): number {

        return 0;

    }
    //
    bloquear(ticks: number): void {

    }
    //
    avanzarBloqueo(): void {

    }
    //
    estaBloqueado(): boolean {

        return false;

    }

}