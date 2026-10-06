import { describe, it, expect } from 'vitest';
import { AdministradorMemoria } from '../src/AdministradorMemoria';
import { Proceso } from '../src/Proceso';


// AdministradorMemoria = la RAM completa como una lista de bloques contiguos.
// Teoría (apunte): Tema 9 (gestión de memoria), 10 (asignación contigua), 11 (First-Fit),
// 14 (fragmentación) y 15 (liberación y coalescencia). También el documento de métricas.
// Principios que se prueban: la lista de bloques es privada (encapsulamiento) y todo pasa por
// asignar() / liberar() (SRP: esta clase solo administra la memoria).

// ---------------------------------------------------------------------------
// Teoría: en la asignación contigua cada proceso necesita UN único bloque continuo de RAM.
// Al arrancar, toda la memoria es un solo hueco libre; al asignar, ese hueco se divide.
// ---------------------------------------------------------------------------

describe("Asignación contigua (Temas 9 y 10)", () => {
    // Al arrancar, toda la RAM (1024 KB) es un único hueco libre.
    it("arranca con un unico bloque libre de 1024 KB", () => {
        const memoria = new AdministradorMemoria();

        expect(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    // Splitting: el hueco se divide en una parte ocupada, del tamaño exacto del proceso,
    // y el sobrante, que queda libre justo a continuación.
    it("asigna un proceso y parte el bloque en ocupado + libre", () => {
        const memoria = new AdministradorMemoria();

        expect(memoria.asignar(new Proceso("P1", 200, 1))).toBe(true);

        expect(memoria.mapa()).toEqual(["[0-200 KB] P1", "[200-1024 KB] LIBRE"]);
    });

    // Si ningún hueco alcanza, el proceso no entra (queda esperando memoria) y la RAM no se toca.
    it("no asigna un proceso que no cabe en ningun hueco", () => {
        const memoria = new AdministradorMemoria();

        expect(memoria.asignar(new Proceso("P1", 2000, 1))).toBe(false);

        expect(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    // Si el proceso mide justo lo que el hueco, no queda sobrante: nunca hay un bloque de 0 KB.
    it("un proceso del tamano exacto del bloque no deja sobrante", () => {
        const memoria = new AdministradorMemoria(100);

        memoria.asignar(new Proceso("P1", 100, 1));

        expect(memoria.mapa()).toEqual(["[0-100 KB] P1"]);
    });

    // Invariante: ocupada + libre = total. No se pierde ni se inventa memoria.
    // Además muestra que no hay fragmentación interna: cada bloque ocupado mide lo que pidió.
    it("la suma de los bloques siempre da el total", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));
        memoria.asignar(new Proceso("P2", 350, 1));
        memoria.liberar("P1");

        const metricas = memoria.metricas();

        expect(metricas.ocupada + metricas.libreTotal).toBe(1024);
    });
})

// ---------------------------------------------------------------------------
// Teoría: First-Fit recorre los huecos desde el principio y elige el PRIMERO que alcanza,
// sin comparar con los demás. (Best-Fit elegiría el más justo; Worst-Fit, el más grande.)
// SOLID · O/D: la política se inyecta por constructor (IEstrategiaAsignacion), por eso esta
// clase no cambia aunque se agreguen otras políticas.
// ---------------------------------------------------------------------------
describe("Política First-Fit (Tema 11)", () => {
    // Hay dos huecos: 300 KB al inicio y 200 KB en el medio. El proceso E (150 KB) entra
    // en el primero, aunque el de 200 KB le quedaba más justo.
    it("First-Fit elige el PRIMER hueco que alcanza, aunque haya otro mas justo despues", () => {
        const memoria = new AdministradorMemoria(1000);
        memoria.asignar(new Proceso("A", 300, 1));   // 0-300
        memoria.asignar(new Proceso("B", 100, 1));   // 300-400
        memoria.asignar(new Proceso("C", 200, 1));   // 400-600
        memoria.asignar(new Proceso("D", 100, 1));   // 600-700
        memoria.liberar("A");                        // hueco 300 al inicio
        memoria.liberar("C");                        // hueco 200 en el medio

        memoria.asignar(new Proceso("E", 150, 1));

        expect(memoria.mapa()[0]).toBe("[0-150 KB] E");
    });
})

// ---------------------------------------------------------------------------
// Teoría: al terminar un proceso se libera su bloque; si al lado hay memoria libre, los
// huecos se fusionan (coalescencia). Es lo que evita que la memoria se llene de huecos chicos.
// ---------------------------------------------------------------------------
describe("Liberación y coalescencia (Tema 15)", () => {
    // Se liberan A y B, que son vecinos: sus huecos se unen en uno solo de 500 KB.
    it("liberar une (coalescencia) dos huecos vecinos", () => {
        const memoria = new AdministradorMemoria(1000);
        memoria.asignar(new Proceso("A", 300, 1));
        memoria.asignar(new Proceso("B", 200, 1));
        memoria.asignar(new Proceso("C", 100, 1));

        memoria.liberar("A");
        memoria.liberar("B");

        expect(memoria.mapa()).toEqual(["[0-500 KB] LIBRE", "[500-600 KB] C", "[600-1000 KB] LIBRE"]);
    });

    // Cuando se libera todo, los huecos se fusionan hasta volver al único bloque de 1024 KB.
    it("liberar al ultimo proceso deja otra vez un unico bloque libre", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));
        memoria.asignar(new Proceso("P2", 350, 1));

        memoria.liberar("P2");
        memoria.liberar("P1");

        expect(memoria.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    // Liberar un proceso que no está en memoria no cambia nada.
    it("liberar un pid inexistente no cambia nada", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));

        memoria.liberar("NO-EXISTE");

        expect(memoria.mapa()).toEqual(["[0-200 KB] P1", "[200-1024 KB] LIBRE"]);
    });
})

// ---------------------------------------------------------------------------
// Teoría: fragmentación externa = hay memoria libre en total, pero partida en huecos separados.
// Fórmula de la cátedra: (1 - mayor hueco / libre total) x 100. Da 0 % cuando todo el libre
// está junto; se acerca a 100 % cuanto más repartido está.
// ---------------------------------------------------------------------------

describe("Fragmentación externa y métricas (Tema 14 y documento de métricas)", () => {
    // Huecos de 100 y 600 KB: libre total 700, mayor hueco 600 -> (1 - 600/700) x 100 = 14,29 %.
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

    // Huecos de 100 y 300 KB: libre 400, mayor 300 -> 25 % de fragmentación. Ocupan 400 de 800 KB -> 50 %.
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

    // Con un solo hueco libre, mayor hueco = libre total -> 0 %.
    it("la fragmentacion externa es 0 con un unico hueco libre", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));

        expect(memoria.metricas().fragmentacionExterna).toBe(0);
    });

    // Sin memoria libre no hay nada que fragmentar. Verifica que el código evita dividir por cero.
    it("la fragmentacion externa es 0 si no queda memoria libre", () => {
        const memoria = new AdministradorMemoria(100);
        memoria.asignar(new Proceso("P1", 100, 1));

        expect(memoria.metricas().fragmentacionExterna).toBe(0);
    });

    // Ejemplo del documento de la cátedra. Caso 2: huecos de 200 + 200 KB separados por P2 -> 50 %.
    // Caso 3: termina P2 y los tres bloques libres se fusionan en uno de 624 KB -> 0 %.
    it("casos 2 y 3 de la catedra: 50% de fragmentacion y la coalescencia la deja en 0%", () => {
        const memoria = new AdministradorMemoria();
        memoria.asignar(new Proceso("P1", 200, 1));
        memoria.asignar(new Proceso("A", 200, 1));
        memoria.asignar(new Proceso("P2", 224, 1));
        memoria.asignar(new Proceso("B", 200, 1));
        memoria.asignar(new Proceso("P3", 200, 1));
        memoria.liberar("A");
        memoria.liberar("B");

        const antes = memoria.metricas();
        expect(antes.ocupada).toBe(624);
        expect(antes.libreTotal).toBe(400);
        expect(antes.mayorHueco).toBe(200);
        expect(antes.fragmentacionExterna).toBe(50);

        memoria.liberar("P2");

        const despues = memoria.metricas();
        expect(despues.libreTotal).toBe(624);
        expect(despues.mayorHueco).toBe(624);
        expect(despues.fragmentacionExterna).toBe(0);
        expect(memoria.mapa()).toEqual(["[0-200 KB] P1", "[200-824 KB] LIBRE", "[824-1024 KB] P3"]);
    });
})

// ---------------------------------------------------------------------------
// RF01: el simulador rechaza configuraciones inválidas antes de crear ningún bloque,
// así nunca queda en un estado a medias.
// ---------------------------------------------------------------------------
describe("Configuración de la memoria (RF01)", () => {
    // Tamaños de memoria inválidos (cero, negativo o decimal) lanzan error.
    it("RF01: rechaza un tamano de memoria invalido (cero, negativo o decimal) sin crear ningun bloque", () => {
        expect(() => new AdministradorMemoria(0)).toThrow();
        expect(() => new AdministradorMemoria(-100)).toThrow();
        expect(() => new AdministradorMemoria(10.5)).toThrow();
    });
})