"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AdministradorMemoria_1 = require("../src/AdministradorMemoria");
const Proceso_1 = require("../src/Proceso");
(0, vitest_1.describe)("AdministradorMemoria (First-Fit)", () => {
    (0, vitest_1.it)("arranca con un unico bloque libre de 1024 KB", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria();
        (0, vitest_1.expect)(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });
    (0, vitest_1.it)("asigna un proceso y parte el bloque en ocupado + libre", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria();
        (0, vitest_1.expect)(memoria.asignar(new Proceso_1.Proceso("P1", 200, 1))).toBe(true);
        (0, vitest_1.expect)(memoria.mapa()).toEqual(["[0-200 KB] P1", "[200-1024 KB] LIBRE"]);
    });
    (0, vitest_1.it)("no asigna un proceso que no cabe en ningun hueco", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria();
        (0, vitest_1.expect)(memoria.asignar(new Proceso_1.Proceso("P1", 2000, 1))).toBe(false);
        (0, vitest_1.expect)(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });
    (0, vitest_1.it)("un proceso del tamano exacto del bloque no deja sobrante", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria(100);
        memoria.asignar(new Proceso_1.Proceso("P1", 100, 1));
        (0, vitest_1.expect)(memoria.mapa()).toEqual(["[0-100 KB] P1"]);
    });
    (0, vitest_1.it)("la suma de los bloques siempre da el total", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria();
        memoria.asignar(new Proceso_1.Proceso("P1", 200, 1));
        memoria.asignar(new Proceso_1.Proceso("P2", 350, 1));
        memoria.liberar("P1");
        const metricas = memoria.metricas();
        (0, vitest_1.expect)(metricas.ocupada + metricas.libreTotal).toBe(1024);
    });
    (0, vitest_1.it)("First-Fit elige el PRIMER hueco que alcanza, aunque haya otro mas justo despues", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria(1000);
        memoria.asignar(new Proceso_1.Proceso("A", 300, 1)); // 0-300
        memoria.asignar(new Proceso_1.Proceso("B", 100, 1)); // 300-400
        memoria.asignar(new Proceso_1.Proceso("C", 200, 1)); // 400-600
        memoria.asignar(new Proceso_1.Proceso("D", 100, 1)); // 600-700
        memoria.liberar("A"); // hueco 300 al inicio
        memoria.liberar("C"); // hueco 200 en el medio
        memoria.asignar(new Proceso_1.Proceso("E", 150, 1));
        (0, vitest_1.expect)(memoria.mapa()[0]).toBe("[0-150 KB] E");
    });
    (0, vitest_1.it)("liberar une (coalescencia) dos huecos vecinos", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria(1000);
        memoria.asignar(new Proceso_1.Proceso("A", 300, 1));
        memoria.asignar(new Proceso_1.Proceso("B", 200, 1));
        memoria.asignar(new Proceso_1.Proceso("C", 100, 1));
        memoria.liberar("A");
        memoria.liberar("B");
        (0, vitest_1.expect)(memoria.mapa()).toEqual(["[0-500 KB] LIBRE", "[500-600 KB] C", "[600-1000 KB] LIBRE"]);
    });
    (0, vitest_1.it)("liberar al ultimo proceso deja otra vez un unico bloque libre", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria();
        memoria.asignar(new Proceso_1.Proceso("P1", 200, 1));
        memoria.asignar(new Proceso_1.Proceso("P2", 350, 1));
        memoria.liberar("P2");
        memoria.liberar("P1");
        (0, vitest_1.expect)(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });
    (0, vitest_1.it)("liberar un pid inexistente no cambia nada", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria();
        memoria.asignar(new Proceso_1.Proceso("P1", 200, 1));
        memoria.liberar("NO-EXISTE");
        (0, vitest_1.expect)(memoria.mapa()).toEqual(["[0-200 KB] P1", "[200-1024 KB] LIBRE"]);
    });
    (0, vitest_1.it)("las metricas reflejan la fragmentacion externa", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria(1000);
        memoria.asignar(new Proceso_1.Proceso("A", 100, 1));
        memoria.asignar(new Proceso_1.Proceso("B", 200, 1));
        memoria.asignar(new Proceso_1.Proceso("C", 100, 1));
        memoria.liberar("A");
        // huecos: 100 (inicio) y 600 (final). Libre total 700, mayor 600.
        const metricas = memoria.metricas();
        (0, vitest_1.expect)(metricas.libreTotal).toBe(700);
        (0, vitest_1.expect)(metricas.mayorHueco).toBe(600);
        (0, vitest_1.expect)(metricas.fragmentacionExterna).toBeCloseTo(14.2857, 3);
    });
    (0, vitest_1.it)("huecos de 100 y 300 KB dan 25% de fragmentacion externa y 50% de ocupacion", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria(800);
        memoria.asignar(new Proceso_1.Proceso("A", 100, 1)); // 0-100
        memoria.asignar(new Proceso_1.Proceso("B", 100, 1)); // 100-200
        memoria.asignar(new Proceso_1.Proceso("C", 300, 1)); // 200-500
        memoria.asignar(new Proceso_1.Proceso("D", 300, 1)); // 500-800
        memoria.liberar("A");
        memoria.liberar("C");
        const metricas = memoria.metricas();
        (0, vitest_1.expect)(metricas.libreTotal).toBe(400);
        (0, vitest_1.expect)(metricas.mayorHueco).toBe(300);
        (0, vitest_1.expect)(metricas.fragmentacionExterna).toBe(25);
        (0, vitest_1.expect)(metricas.porcentajeOcupacion).toBe(50);
    });
    (0, vitest_1.it)("la fragmentacion externa es 0 con un unico hueco libre", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria();
        memoria.asignar(new Proceso_1.Proceso("P1", 200, 1));
        (0, vitest_1.expect)(memoria.metricas().fragmentacionExterna).toBe(0);
    });
    (0, vitest_1.it)("la fragmentacion externa es 0 si no queda memoria libre", () => {
        const memoria = new AdministradorMemoria_1.AdministradorMemoria(100);
        memoria.asignar(new Proceso_1.Proceso("P1", 100, 1));
        (0, vitest_1.expect)(memoria.metricas().fragmentacionExterna).toBe(0);
    });
    (0, vitest_1.it)("RF01: rechaza un tamano de memoria invalido (cero, negativo o decimal) sin crear ningun bloque", () => {
        (0, vitest_1.expect)(() => new AdministradorMemoria_1.AdministradorMemoria(0)).toThrow();
        (0, vitest_1.expect)(() => new AdministradorMemoria_1.AdministradorMemoria(-100)).toThrow();
        (0, vitest_1.expect)(() => new AdministradorMemoria_1.AdministradorMemoria(10.5)).toThrow();
    });
});
