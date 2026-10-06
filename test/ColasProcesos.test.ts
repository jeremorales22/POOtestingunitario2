import { describe, it, expect } from 'vitest';
import { ColasProcesos } from '../src/ColasProcesos';
import { Estado, Proceso } from '../src/Proceso';
import { ProcesoConES } from '../src/ProcesoConES';
import { EventoES } from '../src/EventoES';

// Proceso valida sus transiciones: para llegar a EJECUTANDO hay que pasar por LISTO.
function aEjecutando<T extends Proceso>(proceso: T): T {
    proceso.cambiarEstado(Estado.ESPERANDO_MEMORIA);
    proceso.cambiarEstado(Estado.LISTO);
    proceso.cambiarEstado(Estado.EJECUTANDO);
    return proceso;
}

// ColasProcesos = las «salas de espera» por las que pasa un proceso (Temas 2 y 5).
// Teoría: el estado de un proceso cambia al moverse entre colas. Esta clase solo mueve procesos
// (SRP): no sabe de memoria ni de CPU. Para reintentar la memoria recibe una función por
// parámetro, así no depende de AdministradorMemoria (bajo acoplamiento, inversión de dependencias).

// ---------------------------------------------------------------------------
// Teoría: el planificador de largo plazo decide qué procesos se admiten. Acá, un proceso
// entra al sistema cuando consigue memoria.
// ---------------------------------------------------------------------------
describe("Admisión: NUEVO → ESPERANDO_MEMORIA → LISTO (planificación de largo plazo)", () => {
    // Todo proceso entra al sistema en estado NUEVO.
    it("un proceso recien agregado queda en NUEVO",()=>{
        const colas = new ColasProcesos();
        const p = new Proceso("P1", 100, 1);

        colas.agregarNuevo(p);

        expect(p.estaEn(Estado.NUEVO)).toBe(true);
    })

    // En el siguiente tick, los NUEVOS pasan a esperar memoria.
    it("ingresarNuevos pasa a ESPERANDO_MEMORIA y vacia la cola de nuevos",()=>{
        const colas = new ColasProcesos();
        const p = new Proceso("P1", 100, 1);
        colas.agregarNuevo(p);

        colas.ingresarNuevos();
        
        expect(p.estaEn(Estado.ESPERANDO_MEMORIA)).toBe(true);
        expect(colas.pidsEsperandoMemoria()).toEqual(["P1"]);
    })

    // La función recibida decide quién consigue RAM (acá, solo P1). P1 pasa a LISTO; P2 sigue esperando.
    // Se reintenta en el orden en que llegaron los procesos.
    it("reintentarMemoria solo mueve a listos los que consiguen asignarse",()=>{
        const colas = new ColasProcesos();
        const p1 = new Proceso("P1", 100, 1);
        const p2 = new Proceso("P2", 100, 1);

        colas.agregarNuevo(p1);
        colas.agregarNuevo(p2);
         colas.ingresarNuevos();

         colas.reintentarMemoria(proceso => proceso.pid === "P1");

        expect(colas.pidsListos()).toEqual(["P1"]);
        expect(colas.pidsEsperandoMemoria()).toEqual(["P2"]);
    })
})

// ---------------------------------------------------------------------------
// Teoría: en Round-Robin los procesos listos forman una cola FIFO: el primero en entrar es el primero en salir.
// ---------------------------------------------------------------------------
describe("Cola de listos FIFO (Round-Robin, Tema 7)", () => {
    // Se atiende primero al que lleva más tiempo esperando.
    it("tomarListo saca al primero en orden FIFO", () => {
        const colas = new ColasProcesos();
        colas.reencolar(aEjecutando(new Proceso("P1", 100, 1)));
        colas.reencolar(aEjecutando(new Proceso("P2", 100, 1)));

        expect(colas.tomarListo()?.pid).toBe("P1");
        expect(colas.pidsListos()).toEqual(["P2"]);
    });

    // Un proceso que agotó su quantum vuelve al FINAL de la cola y queda LISTO.
    it("reencolar deja al proceso LISTO al final de la fila",()=>{
        const colas = new ColasProcesos();
        const p = aEjecutando(new Proceso("P1", 100, 1));

        colas.reencolar(p);

        expect(p.estaEn(Estado.LISTO)).toBe(true);
        expect(colas.pidsListos()).toEqual(["P1"]);

    })

    // El planificador necesita saber si hay otros esperando para decidir si rota o renueva.
    it("hayListos refleja si la cola de listos tiene elementos",()=>{
        const colas = new ColasProcesos();
        expect(colas.hayListos()).toBe(false);

        colas.reencolar(aEjecutando(new Proceso("P1", 100, 1)));

        expect(colas.hayListos()).toBe(true);
    })
})

// ---------------------------------------------------------------------------
// Teoría: un proceso bloqueado espera un evento (E/S). Cuando termina, vuelve a LISTO, no a ejecución.
// ---------------------------------------------------------------------------
describe("Bloqueados y entrada/salida (Tema 2)", () => {
    // Al pedir E/S, el proceso pasa a BLOQUEADO.
    it("bloquear deja al proceso BLOQUEADO",()=>{

        const colas = new ColasProcesos();
        const p = aEjecutando(new Proceso("P1", 100, 1));

        colas.bloquear(p);

        expect(p.estaEn(Estado.BLOQUEADO)).toBe(true);
    })

    // Cumplida la espera de E/S, el proceso vuelve a la cola de LISTOS.
    it("avanzarBloqueados pasa a listos a los que ya cumplieron su E/S",()=>{

        const colas = new ColasProcesos();
        const p = aEjecutando(new ProcesoConES("P1", 100, 5, new EventoES(1, 2)));
        p.bloquear(1);
        colas.bloquear(p);

        colas.avanzarBloqueados();

        expect(p.estaEn(Estado.LISTO)).toBe(true);
        expect(colas.pidsListos()).toEqual(["P1"]);
    })

    // Si todavía le falta tiempo de E/S, sigue bloqueado y no pasa a listos.
    it("avanzarBloqueados deja esperando al que todavia no cumplio su E/S",()=>{
        const colas = new ColasProcesos();
        const p = aEjecutando(new ProcesoConES("P1", 100, 5, new EventoES(1, 2)));
        p.bloquear(2);
        colas.bloquear(p);

        colas.avanzarBloqueados();

        expect(p.estaEn(Estado.BLOQUEADO)).toBe(true);
        expect(colas.pidsListos()).toEqual([]);
    })
})

// ---------------------------------------------------------------------------
// Teoría: al terminar, el proceso queda registrado como TERMINADO.
// ---------------------------------------------------------------------------
describe("Fin del ciclo de vida", () => {
    // Pasa a TERMINADO y queda en la lista, en el orden en que fueron terminando.
    it("terminar mueve al proceso a terminados y lo deja en TERMINADO",()=>{
        const colas = new ColasProcesos();
        const p = aEjecutando(new Proceso("P1", 100, 1));

        colas.terminar(p);

        expect(p.estaEn(Estado.TERMINADO)).toBe(true);
        expect(colas.pidsTerminados()).toEqual(["P1"]);
    })
})