import { ComportamientoProceso } from './IComportamientoProceso';
import { IEventoES } from './IEventoES';
import { Proceso } from './Proceso';

// Teoría (Tema 2): un proceso puede quedar BLOQUEADO esperando una entrada/salida y, al terminar,
// vuelve a LISTO. No todos los procesos hacen E/S: este es el que sí.
// RF08: trae un evento determinista «después de N ticks de CPU me bloqueo D ticks».
//
// PRINCIPIOS QUE APLICA
// [POO · Herencia] relación «es un»: un ProcesoConES ES un Proceso, con un comportamiento extra.
// [POO · Polimorfismo] sobrescribe (override) 6 métodos de Proceso; el resto del simulador los
//     llama igual que a los de un Proceso común.
// [SOLID · L] se puede usar en cualquier lugar donde se espera un Proceso sin que nada se rompa.
// [SOLID · O] se agregó comportamiento nuevo (la E/S) SIN modificar Proceso ni SimuladorSO.
// [POO · Encapsulamiento] el tiempo de bloqueo es privado, con get/set protegidos.

export class ProcesoConES extends Proceso implements ComportamientoProceso{

    // Cuántos ticks le faltan de espera de E/S. 0 = no está esperando.
    private tiempoBloqueo: number = 0;
    // El evento se usa una sola vez: después de bloquearse no se repite.
    private yaBloqueo: boolean = false;

    // RF08: recibe el evento y valida que ocurra antes de que el proceso termine.
    constructor(pid: string, tamanoMemoria: number, tiempoCpu: number, private readonly evento: IEventoES) {

        super(pid, tamanoMemoria, tiempoCpu);

        evento.despuesDeTicks < tiempoCpu || Proceso.error("El evento de E/S debe ocurrir antes de que el proceso termine");

    }

    protected getTiempoBloqueo(): number{

        return this.tiempoBloqueo;

    }

    protected setTiempoBloqueo(valor: number): void {

        this.tiempoBloqueo = valor;

    }

    // Sí hace E/S (el Proceso común responde false).
    override admiteES(): boolean {
        return true;
    }

    // RF08: le toca bloquearse cuando ya ejecutó exactamente N ticks y todavía no usó su evento.
    override debeBloquearse(): boolean {

        const ejecutados = this.getTiempoTotal() - this.getTiempoRestante();

        return !this.yaBloqueo && ejecutados === this.evento.despuesDeTicks;

    }

    // RF08: cuántos ticks dura la E/S.
    override duracionES(): number {

        return this.evento.duracion;

    }

    // Empieza la espera de E/S: va a esperar `ticks` ticks. Marca el evento como usado.
    override bloquear(ticks: number): void {

        this.yaBloqueo = true;
        this.setTiempoBloqueo(ticks);

    }

    // Pasa un tick de espera. mayorEntre(0, ...) evita que la espera baje de cero.
    override avanzarBloqueo(): void {

        this.setTiempoBloqueo(this.mayorEntre(0, this.getTiempoBloqueo() - 1));
    }

    // Mientras le queden ticks de espera, está bloqueado.
    override estaBloqueado(): boolean {
        return this.getTiempoBloqueo() > 0;
    }
}
//override pisa lo que hacía el padre con algo propio de la hija.