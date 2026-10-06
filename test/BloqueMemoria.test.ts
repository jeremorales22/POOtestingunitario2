import { describe, it, expect } from 'vitest';
import { BloqueMemoria } from '../src/BloqueMemoria';
import { Proceso } from '../src/Proceso';


// BloqueMemoria = un pedazo continuo de RAM, libre u ocupado (Tema 10).
// Principios: encapsulamiento (sus datos son privados, se usan métodos) y SRP (solo sabe de
// SU pedazo; la lista completa la maneja AdministradorMemoria).

// ---------------------------------------------------------------------------
// Teoría: la memoria se lleva como un registro de zonas libres (huecos) y zonas ocupadas.
// ---------------------------------------------------------------------------
describe("Estado del bloque: libre u ocupado", () => {
    // Todo bloque nace libre.
    it("un bloque nuevo esta libre", ()=>{
        expect(new BloqueMemoria(0, 100).estaLibre()).toBe(true);
    })

    // Un bloque ocupado no acepta a nadie más.
    it("ocupado deja de estar libre y ya no acepta procesos", ()=>{
        const bloque = new BloqueMemoria(0, 100);
        bloque.ocuparCon(new Proceso("P1", 40, 1));

        expect(bloque.estaLibre()).toBe(false);
        expect(bloque.entra(new Proceso("P2", 10, 1))).toBe(false);
    })

    // Guarda el PID del dueño: así se sabe a quién liberar cuando termine.
    it("recuerda que proceso lo ocupa", ()=>{
        const bloque = new BloqueMemoria(0, 100);
        bloque.ocuparCon(new Proceso("P1", 40, 1));

        expect(bloque.esDe("P1")).toBe(true);
        expect(bloque.esDe("P2")).toBe(false);
    })

    // Al terminar el proceso, su bloque vuelve a ser un hueco libre.
    it("liberar lo deja libre otra vez", ()=>{
        const bloque = new BloqueMemoria(0, 100);
        bloque.ocuparCon(new Proceso("P1", 100, 1));

        bloque.liberar();

        expect(bloque.estaLibre()).toBe(true);
    })

    // Cada bloque aporta sus KB a «libre» o a «ocupado»; de ahí salen las métricas.
    it("cuenta sus KB como libres u ocupados segun su estado", ()=>{
        const bloque = new BloqueMemoria(0, 100);
        expect(bloque.kbLibres()).toBe(100);
        expect(bloque.kbOcupados()).toBe(0);

        bloque.ocuparCon(new Proceso("P1", 100, 1));
        expect(bloque.kbLibres()).toBe(0);
        expect(bloque.kbOcupados()).toBe(100);
    })

})

// ---------------------------------------------------------------------------
// Teoría: el proceso necesita un único bloque lo bastante grande; no se puede repartir.
// ---------------------------------------------------------------------------
describe("Cabe o no cabe (asignación contigua, Tema 10)", () => {
    // Si el bloque es libre y alcanza, el proceso entra.
    it("acepta un proceso que cabe", ()=>{
        const bloque = new BloqueMemoria(0, 100);

        expect(bloque.entra(new Proceso("P1", 100, 1))).toBe(true);
    })

    // Un proceso más grande que el bloque no entra (aunque haya otros huecos).
    it("no acepta un proceso mas grande que el bloque", ()=>{
        const bloque = new BloqueMemoria(0, 100);

        expect(bloque.entra(new Proceso("P1", 101, 1))).toBe(false);
    })
})

// ---------------------------------------------------------------------------
// Teoría: al asignar, el hueco se parte: una parte para el proceso y el sobrante sigue libre.
// ---------------------------------------------------------------------------
describe("División del bloque al asignar (splitting)", () => {
    // Bloque de 100 KB con un proceso de 40: el bloque queda de 40 y devuelve un sobrante libre de 60.
    it("al ocuparse con un proceso mas chico se parte y devuelve el sobrante libre", ()=>{
        const bloque = new BloqueMemoria(0, 100);

        const sobrante = bloque.ocuparCon(new Proceso("P1", 40, 1));

        expect(bloque.capacidad()).toBe(40);
        expect(sobrante).toHaveLength(1);
        expect(sobrante[0].describir()).toBe("[40-100 KB] LIBRE");
    })

    // Si entra justo, no hay sobrante: nunca queda un bloque de 0 KB.
    it("si el proceso ocupa todo el bloque no queda sobrante", ()=>{
        const bloque = new BloqueMemoria(0, 100);

        const sobrante = bloque.ocuparCon(new Proceso("P1", 100, 1));

        expect(sobrante).toHaveLength(0);
        expect(bloque.capacidad()).toBe(100);
    })
})

// ---------------------------------------------------------------------------
// Teoría: dos huecos libres vecinos se pueden unir en uno mayor; uno ocupado no.
// ---------------------------------------------------------------------------
describe("Fusión de huecos (coalescencia, Tema 15)", () => {
    // Dos libres vecinos se fusionan y suman sus tamaños (100 + 50 = 150).
    it("dos bloques libres pueden fusionarse y suman su tamano", ()=>{
        const a = new BloqueMemoria(0, 100);
        const b = new BloqueMemoria(100, 50);

        expect(a.puedeFusionarCon(b)).toBe(true);
        a.fusionarCon(b);

        expect(a.capacidad()).toBe(150);
    })
    // Si uno está ocupado, no se puede fusionar: tiene un proceso adentro.
    it("un bloque ocupado no puede fusionarse", ()=>{
        const a = new BloqueMemoria(0, 100);
        const b = new BloqueMemoria(100, 50);

        b.ocuparCon(new Proceso("P1", 50, 1));

        expect(a.puedeFusionarCon(b)).toBe(false);
    })
})
// ---------------------------------------------------------------------------
// Cómo se muestra un bloque en el mapa de memoria.
// ---------------------------------------------------------------------------
describe("Representación", () => {
    // Formato [inicio-fin KB] dueño, que se usa en los reportes.
    it("se describe con su rango y su ocupante", ()=>{
        const bloque = new BloqueMemoria(200, 350);

        bloque.ocuparCon(new Proceso("P2", 350, 1));
        
        expect(bloque.describir()).toBe("[200-550 KB] P2");
    })
})