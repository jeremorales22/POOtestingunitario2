import { describe, it, expect } from 'vitest';
import { AdministradorMemoria } from '../src/AdministradorMemoria';
import { Proceso } from '../src/Proceso';

describe("AdministradorMemoria (First-Fit)", () => {
    it("arranca con un unico bloque libre de 1024 KB", () => {
        const memoria = new AdministradorMemoria();

        expect(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    it("asigna un proceso y parte el bloque en ocupado + libre", () => {
        const memoria = new AdministradorMemoria();

        expect(memoria.asignar(new Proceso("P1", 200, 1))).toBe(true);

        expect(memoria.mapa()).toEqual(["[0-200 KB] P1", "[200-1024 KB] LIBRE"]);
    });

    it("no asigna un proceso que no cabe en ningun hueco", () => {
        const memoria = new AdministradorMemoria();

        expect(memoria.asignar(new Proceso("P1", 2000, 1))).toBe(false);

        expect(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    it("un proceso del tamano exacto del bloque no deja sobrante", () => {
        const memoria = new AdministradorMemoria(100);

        memoria.asignar(new Proceso("P1", 100, 1));

        expect(memoria.mapa()).toEqual(["[0-100 KB] P1"]);
    });

    it("la suma de los bloques siempre da el total", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));
        memoria.asignar(new Proceso("P2", 350, 1));
        memoria.liberar("P1");

        const metricas = memoria.metricas();

        expect(metricas.ocupada + metricas.libreTotal).toBe(1024);
    });

    it("First-Fit elige el PRIMER hueco que alcanza, aunque haya otro mas justo despues", () => {
        const memoria = new AdministradorMemoria(1000);
        memoria.asignar(new Proceso("A", 300, 1));   // 0-300
        memoria.asignar(new Proceso("B", 100, 1));   // 300-400
        memoria.asignar(new Proceso("C", 200, 1));   // 400-600
        memoria.asignar(new Proceso("D", 100, 1));   // 600-700
        memoria.liberar("A");                            // hueco 300 al inicio
        memoria.liberar("C");                            // hueco 200 en el medio

        memoria.asignar(new Proceso("E", 150, 1));

        expect(memoria.mapa()[0]).toBe("[0-150 KB] E");
    });

    it("liberar une (coalescencia) dos huecos vecinos", () => {
        const memoria = new AdministradorMemoria(1000);
        memoria.asignar(new Proceso("A", 300, 1));
        memoria.asignar(new Proceso("B", 200, 1));
        memoria.asignar(new Proceso("C", 100, 1));

        memoria.liberar("A");
        memoria.liberar("B");

        expect(memoria.mapa()).toEqual(["[0-500 KB] LIBRE", "[500-600 KB] C", "[600-1000 KB] LIBRE"]);
    });

    it("liberar al ultimo proceso deja otra vez un unico bloque libre", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));
        memoria.asignar(new Proceso("P2", 350, 1));

        memoria.liberar("P2");
        memoria.liberar("P1");

        expect(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    it("liberar un pid inexistente no cambia nada", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));

        memoria.liberar("NO-EXISTE");

        expect(memoria.mapa()).toEqual(["[0-200 KB] P1", "[200-1024 KB] LIBRE"]);
    });

    it("las metricas reflejan la fragmentacion externa", () => {
        const memoria = new AdministradorMemoria(1000);
        memoria.asignar(new Proceso("A", 100, 1));
        memoria.asignar(new Proceso("B", 200, 1));
        memoria.asignar(new Proceso("C", 100, 1));
        memoria.liberar("A");
        // huecos: 100 (inicio) y 600 (final). Libre total 700, mayor 600.

        const metricas = memoria.metricas();

        expect(metricas.libreTotal).toBe(700);
        expect(metricas.mayorHueco).toBe(600);
        expect(metricas.fragmentacionExterna).toBeCloseTo(14.2857, 3);
    });

    it("huecos de 100 y 300 KB dan 25% de fragmentacion externa y 50% de ocupacion", () => {
        const memoria = new AdministradorMemoria(800);
        memoria.asignar(new Proceso("A", 100, 1));   // 0-100
        memoria.asignar(new Proceso("B", 100, 1));   // 100-200
        memoria.asignar(new Proceso("C", 300, 1));   // 200-500
        memoria.asignar(new Proceso("D", 300, 1));   // 500-800
        memoria.liberar("A");
        memoria.liberar("C");

        const metricas = memoria.metricas();

        expect(metricas.libreTotal).toBe(400);
        expect(metricas.mayorHueco).toBe(300);
        expect(metricas.fragmentacionExterna).toBe(25);
        expect(metricas.porcentajeOcupacion).toBe(50);
    });

    it("la fragmentacion externa es 0 con un unico hueco libre", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));

        expect(memoria.metricas().fragmentacionExterna).toBe(0);
    });

    it("la fragmentacion externa es 0 si no queda memoria libre", () => {
        const memoria = new AdministradorMemoria(100);
        memoria.asignar(new Proceso("P1", 100, 1));

        expect(memoria.metricas().fragmentacionExterna).toBe(0);
    });

    it("RF01: rechaza un tamano de memoria invalido (cero, negativo o decimal) sin crear ningun bloque", () => {
        expect(() => new AdministradorMemoria(0)).toThrow();
        expect(() => new AdministradorMemoria(-100)).toThrow();
        expect(() => new AdministradorMemoria(10.5)).toThrow();
    });
});
