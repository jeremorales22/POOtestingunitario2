import { Colas } from './Colas';
import { Estado, Proceso } from './Proceso';

// Las 3 salas de espera del proceso (esperando memoria, listos, bloqueados) mas los dos
// extremos del ciclo de vida (nuevos y terminados). RESPONSABILIDAD UNICA: esta clase solo
// mueve procesos de una cola a otra; no sabe nada de memoria ni de CPU.
export class ColasProcesos implements Colas {

    // ENCAPSULAMIENTO: las 5 listas son privadas. Nadie de afuera empuja o saca procesos
    // directo; todo pasa por los metodos de abajo.
    private nuevos: Proceso[] = [];
    private esperandoMemoria: Proceso[] = [];
    private listos: Proceso[] = [];
    private bloqueados: Proceso[] = [];
    private terminados: Proceso[] = [];

    agregarNuevo(proceso: Proceso): void {

        proceso.cambiarEstado(Estado.NUEVO);
        this.nuevos.push(proceso);

    }

    ingresarNuevos(): void {

        this.nuevos.forEach(proceso => proceso.cambiarEstado(Estado.ESPERANDO_MEMORIA));
        this.esperandoMemoria.push(...this.nuevos);
        this.nuevos = [];

    }

    // RF03: reintenta la asignacion en orden de registro. Recibe COMO PARAMETRO la funcion
    // que intenta asignar memoria (se la pasa SimuladorSO), asi esta clase no necesita
    // conocer a AdministradorMemoria (bajo acoplamiento).
    reintentarMemoria(intentarAsignar: (proceso: Proceso) => boolean): void {

        const ubicados = this.esperandoMemoria.filter(intentarAsignar);

        this.esperandoMemoria = this.esperandoMemoria.filter(proceso => !ubicados.includes(proceso));
        ubicados.forEach(proceso => proceso.cambiarEstado(Estado.LISTO));
        this.listos.push(...ubicados);

    }

    avanzarBloqueados(): void {

        this.bloqueados.forEach(proceso => proceso.avanzarBloqueo());

        const despiertos = this.bloqueados.filter(proceso => !proceso.estaBloqueado());

        this.bloqueados = this.bloqueados.filter(proceso => proceso.estaBloqueado());
        despiertos.forEach(proceso => proceso.cambiarEstado(Estado.LISTO));
        this.listos.push(...despiertos);

    }

    hayListos(): boolean {

        return this.listos.length > 0;

    }

    tomarListo(): Proceso | undefined {

        return this.listos.shift();

    }

    reencolar(proceso: Proceso): void {

        proceso.cambiarEstado(Estado.LISTO);
        this.listos.push(proceso);

    }

    bloquear(proceso: Proceso): void {

        proceso.cambiarEstado(Estado.BLOQUEADO);
        this.bloqueados.push(proceso);

    }

    terminar(proceso: Proceso): void {

        proceso.cambiarEstado(Estado.TERMINADO);
        this.terminados.push(proceso);

    }

    pidsListos(): string[] {

        return this.listos.map(proceso => proceso.pid);

    }

    pidsEsperandoMemoria(): string[] {

        return this.esperandoMemoria.map(proceso => proceso.pid);

    }

    pidsTerminados(): string[] {

        return this.terminados.map(proceso => proceso.pid);

    }
}
