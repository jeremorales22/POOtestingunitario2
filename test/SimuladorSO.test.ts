import { describe, it, expect } from 'vitest';
import { SimuladorSO } from '../src/SimuladorSO';
import { Proceso } from '../src/Proceso';
import { ProcesoConES } from '../src/ProcesoConES';

// Lote de la consigna: PID, KB, ticks de CPU. First-Fit, quantum 2.
function simuladorDeLaConsigna(): SimuladorSO {
    const simulador = new SimuladorSO(2);
    simulador.agregarProceso(new Proceso("P1", 200, 4));
    simulador.agregarProceso(new Proceso("P2", 350, 3));
    simulador.agregarProceso(new Proceso("P3", 150, 2));
    simulador.agregarProceso(new Proceso("P4", 400, 3));
    return simulador;
}

function avanzar(simulador: SimuladorSO, ticks: number): void {
    Array.from({ length: ticks }).forEach(() => simulador.avanzarTick());
}

describe("SimuladorSO", () => {
    it("tick 1: P1, P2 y P3 entran a RAM, P4 no cabe y espera memoria", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 1);

        expect(simulador.pidsEsperandoMemoria()).toEqual(["P4"]);
        expect(simulador.pidsListos()).toEqual(["P2", "P3"]);   // P1 ya esta en la CPU
        expect(simulador.mapaMemoria()).toEqual([
            "[0-200 KB] P1", "[200-550 KB] P2", "[550-700 KB] P3", "[700-1024 KB] LIBRE"
        ]);
    });

    it("tick 2: P1 agota el quantum y vuelve al final de listos", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 2);

        expect(simulador.pidsListos()).toEqual(["P2", "P3", "P1"]);
        expect(simulador.cambiosDeContexto()).toBe(1);
    });

    it("tick 6: P3 termina, libera y coalesce; queda un unico hueco de 474 KB (0% fragmentacion)", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 6);

        expect(simulador.mapaMemoria()).toEqual(["[0-200 KB] P1", "[200-550 KB] P2", "[550-1024 KB] LIBRE"]);
        expect(simulador.metricasMemoria().libreTotal).toBe(474);
        expect(simulador.metricasMemoria().fragmentacionExterna).toBe(0);
    });

    it("tick 7: con la memoria liberada, P4 por fin obtiene RAM", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 7);

        expect(simulador.pidsEsperandoMemoria()).toEqual([]);
        expect(simulador.mapaMemoria()).toContain("[550-950 KB] P4");
    });

    it("tras 12 ticks todos terminaron, CPU 100% y 2 cambios de contexto", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 12);

        expect(simulador.pidsTerminados()).toEqual(["P3", "P1", "P2", "P4"]);
        expect(simulador.usoCpu()).toBe(100);
        expect(simulador.cambiosDeContexto()).toBe(2);
        expect(simulador.mapaMemoria()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    it("RF09: en el tick 0, antes de avanzar, el uso de CPU es 0%", () => {
        const simulador = new SimuladorSO(2);

        expect(simulador.tickActual()).toBe(0);
        expect(simulador.usoCpu()).toBe(0);
    });

    it("la CPU ociosa baja el uso de CPU", () => {
        const simulador = new SimuladorSO(2);

        avanzar(simulador, 3);

        expect(simulador.usoCpu()).toBe(0);
    });

    it("un proceso con E/S bloqueado vuelve a listos cuando termina su espera", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new ProcesoConES("A", 100, 5));

        avanzar(simulador, 1);
        simulador.bloquearProcesoActual(2);
        expect(simulador.cambiosDeContexto()).toBe(1);

        avanzar(simulador, 1);   // tick 2: bloqueado (queda 1)
        expect(simulador.usoCpu()).toBe(50);

        avanzar(simulador, 1);   // tick 3: termina E/S y toma la CPU
        expect(simulador.usoCpu()).toBeCloseTo(66.67, 1);
    });

    it("un proceso sin E/S ignora el pedido de bloqueo", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 5));
        avanzar(simulador, 1);

        simulador.bloquearProcesoActual(2);

        expect(simulador.cambiosDeContexto()).toBe(0);
    });

    it("Round-Robin: al agotar el quantum con otro esperando, rota al final de listos", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 3));
        simulador.agregarProceso(new Proceso("B", 100, 3));

        avanzar(simulador, 1);
        expect(simulador.cambiosDeContexto()).toBe(0);

        avanzar(simulador, 1);
        expect(simulador.cambiosDeContexto()).toBe(1);
        expect(simulador.pidsListos()).toEqual(["B", "A"]);
    });

    it("Round-Robin: un proceso solo renueva su quantum sin cambio de contexto", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 4));

        avanzar(simulador, 3);
        expect(simulador.pidsTerminados()).toEqual([]);

        avanzar(simulador, 1);
        expect(simulador.pidsTerminados()).toEqual(["A"]);
        expect(simulador.cambiosDeContexto()).toBe(0);
    });

    it("Round-Robin: el proceso rotado vuelve con el quantum reiniciado", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 4));
        simulador.agregarProceso(new Proceso("B", 100, 4));

        avanzar(simulador, 5);   // t1-2 A, t3-4 B (rota), t5 A con quantum nuevo: aun no rota

        expect(simulador.cambiosDeContexto()).toBe(2);
    });

    it("estados: antes del primer tick todos los procesos estan NUEVOS", () => {
        const simulador = simuladorDeLaConsigna();

        expect(simulador.estados()).toEqual(["P1: NUEVO", "P2: NUEVO", "P3: NUEVO", "P4: NUEVO"]);
    });

    it("estados tick 1: P1 ejecuta, P2 y P3 listos, P4 espera memoria", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 1);

        expect(simulador.estados()).toEqual([
            "P1: EJECUTANDO", "P2: LISTO", "P3: LISTO", "P4: ESPERANDO_MEMORIA",
        ]);
    });

    it("estados tick 2: P1 agota el quantum y vuelve a LISTO, P2 sigue LISTO", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 2);

        expect(simulador.estados()[0]).toBe("P1: LISTO");
    });

    it("estados tick 6: P3 termina y queda TERMINADO", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 6);

        expect(simulador.estados()[2]).toBe("P3: TERMINADO");
    });

    it("estados tick 12: todos TERMINADOS", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 12);

        expect(simulador.estados()).toEqual(["P1: TERMINADO", "P2: TERMINADO", "P3: TERMINADO", "P4: TERMINADO"]);
    });

    it("estados: un proceso con E/S pasa por EJECUTANDO, BLOQUEADO y vuelve a EJECUTANDO", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new ProcesoConES("A", 100, 5));

        avanzar(simulador, 1);
        expect(simulador.estados()).toEqual(["A: EJECUTANDO"]);

        simulador.bloquearProcesoActual(2);
        expect(simulador.estados()).toEqual(["A: BLOQUEADO"]);

        avanzar(simulador, 1);   // tick 2: sigue bloqueado
        expect(simulador.estados()).toEqual(["A: BLOQUEADO"]);

        avanzar(simulador, 1);   // tick 3: termina la E/S y toma la CPU
        expect(simulador.estados()).toEqual(["A: EJECUTANDO"]);
    });

    it("RF01: rechaza un quantum invalido (cero, negativo o decimal)", () => {
        expect(() => new SimuladorSO(0)).toThrow();
        expect(() => new SimuladorSO(-1)).toThrow();
        expect(() => new SimuladorSO(1.5)).toThrow();
    });

    it("RF02: rechaza un PID duplicado sin registrar el segundo proceso", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("P1", 100, 2));

        expect(() => simulador.agregarProceso(new Proceso("P1", 50, 1))).toThrow();
        expect(simulador.estados()).toEqual(["P1: NUEVO"]);
    });

    it("RF02: rechaza un proceso que pide mas memoria que el total", () => {
        const simulador = new SimuladorSO(2, 1024);

        expect(() => simulador.agregarProceso(new Proceso("P1", 2000, 1))).toThrow();
        expect(simulador.estados()).toEqual([]);
    });

    it("RF10: expone el tick actual y el pid del proceso que esta en la CPU", () => {
        const simulador = simuladorDeLaConsigna();

        expect(simulador.tickActual()).toBe(0);
        expect(simulador.procesoEnCpu()).toBeUndefined();

        avanzar(simulador, 1);

        expect(simulador.tickActual()).toBe(1);
        expect(simulador.procesoEnCpu()).toBe("P1");
    });
});

