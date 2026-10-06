import { describe, it, expect } from 'vitest';
import { ColasProcesos } from '../src/ColasProcesos';
import { Estado, Proceso } from '../src/Proceso';
import { ProcesoConES } from '../src/ProcesoConES';

describe("ColasProcesos", () => {
    it("un proceso recien agregado queda en NUEVO", () => {
        const colas = new ColasProcesos();
        const p = new Proceso("P1", 100, 1);

        colas.agregarNuevo(p);

        expect(p.estaEn(Estado.NUEVO)).toBe(true);
    });

    it("ingresarNuevos pasa a ESPERANDO_MEMORIA y vacia la cola de nuevos", () => {
        const colas = new ColasProcesos();
        const p = new Proceso("P1", 100, 1);
        colas.agregarNuevo(p);

        colas.ingresarNuevos();

        expect(p.estaEn(Estado.ESPERANDO_MEMORIA)).toBe(true);
        expect(colas.pidsEsperandoMemoria()).toEqual(["P1"]);
    });

    it("reintentarMemoria solo mueve a listos los que consiguen asignarse", () => {
        const colas = new ColasProcesos();
        const p1 = new Proceso("P1", 100, 1);
        const p2 = new Proceso("P2", 100, 1);
        colas.agregarNuevo(p1);
        colas.agregarNuevo(p2);
        colas.ingresarNuevos();

        colas.reintentarMemoria(proceso => proceso.pid === "P1");

        expect(colas.pidsListos()).toEqual(["P1"]);
        expect(colas.pidsEsperandoMemoria()).toEqual(["P2"]);
    });

    it("tomarListo saca al primero en orden FIFO", () => {
        const colas = new ColasProcesos();
        colas.reencolar(new Proceso("P1", 100, 1));
        colas.reencolar(new Proceso("P2", 100, 1));

        expect(colas.tomarListo()?.pid).toBe("P1");
        expect(colas.pidsListos()).toEqual(["P2"]);
    });

    it("reencolar deja al proceso LISTO al final de la fila", () => {
        const colas = new ColasProcesos();
        const p = new Proceso("P1", 100, 1);

        colas.reencolar(p);

        expect(p.estaEn(Estado.LISTO)).toBe(true);
        expect(colas.pidsListos()).toEqual(["P1"]);
    });

    it("bloquear deja al proceso BLOQUEADO", () => {
        const colas = new ColasProcesos();
        const p = new Proceso("P1", 100, 1);

        colas.bloquear(p);

        expect(p.estaEn(Estado.BLOQUEADO)).toBe(true);
    });

    it("avanzarBloqueados pasa a listos a los que ya cumplieron su E/S", () => {
        const colas = new ColasProcesos();
        const p = new ProcesoConES("P1", 100, 5);
        p.bloquear(1);
        colas.bloquear(p);

        colas.avanzarBloqueados();

        expect(p.estaEn(Estado.LISTO)).toBe(true);
        expect(colas.pidsListos()).toEqual(["P1"]);
    });

    it("avanzarBloqueados deja esperando al que todavia no cumplio su E/S", () => {
        const colas = new ColasProcesos();
        const p = new ProcesoConES("P1", 100, 5);
        p.bloquear(2);
        colas.bloquear(p);

        colas.avanzarBloqueados();

        expect(p.estaEn(Estado.BLOQUEADO)).toBe(true);
        expect(colas.pidsListos()).toEqual([]);
    });

    it("terminar mueve al proceso a terminados y lo deja en TERMINADO", () => {
        const colas = new ColasProcesos();
        const p = new Proceso("P1", 100, 1);

        colas.terminar(p);

        expect(p.estaEn(Estado.TERMINADO)).toBe(true);
        expect(colas.pidsTerminados()).toEqual(["P1"]);
    });

    it("hayListos refleja si la cola de listos tiene elementos", () => {
        const colas = new ColasProcesos();
        expect(colas.hayListos()).toBe(false);

        colas.reencolar(new Proceso("P1", 100, 1));

        expect(colas.hayListos()).toBe(true);
    });
});
