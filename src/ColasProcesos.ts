import { IColas } from './IColas';
import { Estado, Proceso } from './Proceso';

// Teoría (Temas 2 y 5): el estado de un proceso cambia a medida que se mueve entre colas.
// Acá están las «salas de espera»: nuevos, esperando memoria, listos, bloqueados y terminados.
//
// PRINCIPIOS QUE APLICA
// [SOLID · S] solo mueve procesos de una cola a otra. No sabe de memoria ni de CPU.
// [POO · Encapsulamiento] las 5 listas son privadas; todo pasa por los métodos de abajo.
// [SOLID · D] bajo acoplamiento: para reintentar la memoria recibe una FUNCIÓN por parámetro,
//     así no necesita conocer a AdministradorMemoria.
// [SOLID · I] implementa IColas, el contrato de las colas; SimuladorSO depende de ese contrato.

export class ColasProcesos implements IColas {
    // [POO · Encapsulamiento] listas privadas: nadie de afuera empuja o saca procesos directo.
    private nuevos: Proceso [] = []; //clase que guarda las cinco filas de procesos del simulador.
    private esperaMemoria: Proceso[] = [];
    private listos: Proceso[] = [];
    private bloqueados: Proceso[] = [];
    private terminados: Proceso[] = [];

    // Todo proceso entra al sistema en estado NUEVO (Tema 2). El constructor de Proceso ya lo deja
    // en NUEVO, por eso acá no hace falta cambiar el estado.
    agregarNuevo(proceso: Proceso): void{

        this.nuevos.push(proceso);
    }

    // Admisión: los NUEVOS pasan a esperar memoria (planificación de largo plazo, Tema 5).
    ingresarNuevos(): void{

        this.nuevos.forEach(proceso => proceso.cambiarEstado(Estado.ESPERANDO_MEMORIA));
        this.esperaMemoria.push(...this.nuevos);
        this.nuevos = [];

    }

    // Cada tick se reintenta alojar en RAM, EN ORDEN DE LLEGADA, a los que esperan memoria. Los que
    // consiguen lugar pasan a LISTO. La función `intentarAsignar` la pasa SimuladorSO (inyección de
    // dependencia): esta clase no conoce a AdministradorMemoria.

    reintentarMemoria(intentarAsignar: (proceso: Proceso) => boolean): void {
        const ubicados = this.esperaMemoria.filter(intentarAsignar);

        this.esperaMemoria = this.esperaMemoria.filter(proceso => !ubicados.includes(proceso));

        ubicados.forEach(proceso => proceso.cambiarEstado(Estado.LISTO));
        //a cada proceso que consiguió memoria, lo pasa al estado LISTO.

        this.listos.push(...ubicados);
    }

    // Entrada/salida: a cada BLOQUEADO le baja la espera; el que termina vuelve a LISTO, NO a ejecución
    // (Tema 2). Polimorfismo: llama a avanzarBloqueo() sin saber de qué clase es el proceso.
    avanzarBloqueados(): void{
        this.bloqueados.forEach(proceso => proceso.avanzarBloqueo());

        const despiertos = this.bloqueados.filter(proceso => !proceso.estaBloqueado());

        this.bloqueados = this.bloqueados.filter(proceso => proceso.estaBloqueado());
        despiertos.forEach(proceso => proceso.cambiarEstado(Estado.LISTO));
        //es la lista de procesos bloqueados cuya espera ya terminó (se calculó dos líneas más arriba).
        this.listos.push(...despiertos);
        //desparraman» la lista y agregan los procesos de a uno. 
        //Quedan detrás de los que ya estaban esperando, porque la fila es FIFO.
    }

    // El planificador lo usa para decidir si un proceso que agotó su quantum rota o renueva.
    hayListos(): boolean {

        return this.listos.length > 0;

    }

    // Cola FIFO (Round-Robin, Tema 7): sale el que lleva más tiempo esperando.
    tomarListo(): Proceso | undefined {// | El método puede devolver dos cosas distintas
                                       // Proceso, si la fila tenía alguien o undefined, que es «no hay nada», si la fila estaba vacía.
        return this.listos.shift();

    }
    // Un proceso que agotó su quantum vuelve al FINAL de la cola de listos.
    reencolar(proceso: Proceso): void {

        proceso.cambiarEstado(Estado.LISTO);
        this.listos.push(proceso);

    }

    // EJECUTANDO -> BLOQUEADO: queda esperando su E/S.
    bloquear(proceso: Proceso): void {

        proceso.cambiarEstado(Estado.BLOQUEADO);
        this.bloqueados.push(proceso);

    }
    
    // Fin del ciclo de vida: el proceso queda TERMINADO y registrado, en orden de finalización.
    terminar(proceso: Proceso): void {

        proceso.cambiarEstado(Estado.TERMINADO);
        this.terminados.push(proceso);

    }

    // [POO · Encapsulamiento] las consultas devuelven solo los PIDs (texto), nunca las listas internas.
    pidsListos(): string[] {

        return this.listos.map(proceso => proceso.pid);
        //map recorre una lista y crea otra nueva, transformando cada elemento
    }

    pidsEsperandoMemoria(): string[] {

        return this.esperaMemoria.map(proceso => proceso.pid);
        //map recorre una lista y crea otra nueva, transformando cada elemento
    }

    pidsTerminados(): string[] {

        return this.terminados.map(proceso => proceso.pid);
        //map recorre una lista y crea otra nueva, transformando cada elemento
    }
}