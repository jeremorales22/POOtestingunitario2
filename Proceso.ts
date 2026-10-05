import { ComportamientoProceso } from './ComportamientoProceso';

// Bloque de Control de Proceso (PCB). Equivale a UnidadCombate: guarda el estado privado
// con get/set protegidos; ProcesoConES (hija) cambia el comportamiento como Soldado con su escudo.
// HERENCIA / LISKOV: esta clase es la base de ProcesoConES (ver ProcesoConES.ts). Cualquier
// lugar que reciba un Proceso funciona igual si en realidad le pasan un ProcesoConES.
// Los 6 estados del ciclo de vida que pide la consigna.
export enum Estado {
    NUEVO = "NUEVO",
    ESPERANDO_MEMORIA = "ESPERANDO_MEMORIA",
    LISTO = "LISTO",
    EJECUTANDO = "EJECUTANDO",
    BLOQUEADO = "BLOQUEADO",
    TERMINADO = "TERMINADO",
}

export class Proceso implements ComportamientoProceso {

    // ENCAPSULAMIENTO: estos 4 campos son privados. Nadie de afuera los lee ni los escribe
    // directo; solo se llega a ellos por los get/set protegidos de mas abajo, o por los
    // metodos publicos (ejecutarTick, cambiarEstado, etc.) que respetan las reglas del dominio.
    private tiempoTotal: number;
    private tiempoRestante: number;
    private quantumConsumido: number;
    private estado: Estado;

    // pid y tamanoMemoria son la identidad del proceso: no deben poder reasignarse desde afuera
    // (RF02 / doble encapsulamiento). readonly evita esa mutacion externa.
    constructor(readonly pid: string, readonly tamanoMemoria: number, tiempoCpu: number) {

        this.tiempoTotal = tiempoCpu;
        this.tiempoRestante = tiempoCpu;
        this.quantumConsumido = 0;
        this.estado = Estado.NUEVO; // RF03: todo proceso nace en estado NUEVO

    }

    protected getTiempoTotal(): number {

        return this.tiempoTotal;

    }

    protected setTiempoTotal(valor: number): void {

        this.tiempoTotal = valor;

    }

    protected getEstado(): Estado {

        return this.estado;

    }

    protected setEstado(valor: Estado): void {

        this.estado = valor;

    }

    protected getTiempoRestante(): number {

        return this.tiempoRestante;

    }

    protected setTiempoRestante(valor: number): void {

        this.tiempoRestante = valor;

    }

    protected getQuantumConsumido(): number {

        return this.quantumConsumido;

    }

    protected setQuantumConsumido(valor: number): void {

        this.quantumConsumido = valor;

    }

    ejecutarTick(): void {

        this.setTiempoRestante(this.getTiempoRestante() - 1);
        this.setQuantumConsumido(this.getQuantumConsumido() + 1);

    }

    cambiarEstado(nuevo: Estado): void {

        this.setEstado(nuevo);

    }

    estaEn(estado: Estado): boolean {

        return this.getEstado() === estado;

    }

    describirEstado(): string {

        return this.getEstado();

    }

    // Usa el tiempo total (que no cambia) y el restante (que baja en cada tick).
    porcentajeCompletado(): number {

        return ((this.getTiempoTotal() - this.getTiempoRestante()) / this.mayorEntre(this.getTiempoTotal(), 1)) * 100;

    }

    // Reemplaza a Math.max: si a es mayor, se queda con a; si no, con b.
    // Protegido para que ProcesoConES tambien lo pueda usar.
    protected mayorEntre(a: number, b: number): number {

        return a > b ? a : b;

    }

    estaTerminado(): boolean {

        return this.getTiempoRestante() <= 0;

    }

    agotoQuantum(limite: number): boolean {

        return this.getQuantumConsumido() >= limite;

    }

    reiniciarQuantum(): void {

        this.setQuantumConsumido(0);

    }

    // POLIMORFISMO: estos 4 metodos son el "comportamiento por defecto" (un proceso comun
    // no hace E/S). ProcesoConES los sobrescribe con override (ver ProcesoConES.ts). Quien
    // los llama (SimuladorSO) no pregunta que tipo de proceso es, solo invoca el metodo.
    admiteES(): boolean {

        return false;

    }

    bloquear(ticks: number): void {

    }

    avanzarBloqueo(): void {

    }

    estaBloqueado(): boolean {

        return false;

    }
}
