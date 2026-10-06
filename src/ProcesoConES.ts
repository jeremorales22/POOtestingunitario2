import { ComportamientoProceso } from './ComportamientoProceso';
import { Proceso } from './Proceso';

// Proceso que ademas puede bloquearse por E/S durante N ticks.
// HERENCIA (relacion "es un"): un ProcesoConES es un Proceso, con un comportamiento extra.
// LISKOV: en SimuladorSO, todo lugar que usa un Proceso funciona igual si en realidad
// recibe un ProcesoConES (por ejemplo, en ejecutarCpu() o avanzarBloqueados()).
// Ya cumple ComportamientoProceso por herencia (Proceso lo implementa); se vuelve a
// declarar aca para que quede visible en este archivo tambien.
export class ProcesoConES extends Proceso implements ComportamientoProceso {

    private tiempoBloqueo: number = 0;

    protected getTiempoBloqueo(): number {

        return this.tiempoBloqueo;

    }

    protected setTiempoBloqueo(valor: number): void {

        this.tiempoBloqueo = valor;

    }

    // POLIMORFISMO: estos 4 metodos sobrescriben (override) el comportamiento por defecto
    // de Proceso. SimuladorSO los llama igual que a los de un Proceso comun, sin saber
    // que esta hablando con un ProcesoConES.
    override admiteES(): boolean {

        return true;

    }

    override bloquear(ticks: number): void {

        this.setTiempoBloqueo(ticks);

    }

    override avanzarBloqueo(): void {

        this.setTiempoBloqueo(this.mayorEntre(0, this.getTiempoBloqueo() - 1));

    }

    override estaBloqueado(): boolean {

        return this.getTiempoBloqueo() > 0;

    }
}
