import { describe, it, expect } from 'vitest';
import { FirstFit } from '../src/FirstFit';
import { BloqueMemoria } from '../src/BloqueMemoria';
import { Proceso } from '../src/Proceso';

// FirstFit = la política de asignación de memoria (Tema 11): elige el PRIMER hueco libre que alcanza.
// POO · Polimorfismo: implementa IEstrategiaAsignacion igual que lo haría Best-Fit o Worst-Fit,
// y AdministradorMemoria la usa sin saber cuál es. SOLID · O: se agregan políticas nuevas sin
// modificar AdministradorMemoria. SOLID · S: esta clase solo decide QUÉ hueco, no lo ocupa.

// ---------------------------------------------------------------------------
// Teoría: recorre los huecos en orden de dirección y se detiene en el primero que alcanza.
// ---------------------------------------------------------------------------
describe("FirstFit · elegirBloque (elige el primer hueco libre que alcanza)", () =>  {

    // Con dos huecos que alcanzan, elige el primero (el de la dirección más baja).
     it("elige el primer bloque que alcanza, en orden de direccion", () => {
        const bloques = [new BloqueMemoria(0, 100), new BloqueMemoria(100, 300)];

        const elegido = new FirstFit().elegirBloque(bloques, new Proceso("P1", 50, 1));

        expect(elegido).toBe(bloques[0]);
    })

    // El primer hueco (20 KB) es chico para 50 KB: lo salta y elige el siguiente.
     it("salta el primero si no alcanza y elige el siguiente", () => {
        const bloques = [new BloqueMemoria(0, 20), new BloqueMemoria(20, 300)];

        const elegido = new FirstFit().elegirBloque(bloques, new Proceso("P1", 50, 1));

        expect(elegido).toBe(bloques[1]);
    })

    // Un bloque ocupado no cuenta, aunque sea grande: solo se miran los huecos libres.
     it("ignora los bloques ocupados", () => {
        const ocupado = new BloqueMemoria(0, 500);
        ocupado.ocuparCon(new Proceso("X", 500, 1));
        const libre = new BloqueMemoria(500, 300);

        const elegido = new FirstFit().elegirBloque([ocupado, libre], new Proceso("P1", 50, 1));

        expect(elegido).toBe(libre);
    })

    // Si ningún hueco alcanza, no hay elección: el proceso tendrá que esperar memoria.
     it("devuelve undefined si ningun bloque alcanza", () => {
        const bloques = [new BloqueMemoria(0, 10)];

        expect(new FirstFit().elegirBloque(bloques, new Proceso("P1", 50, 1))).toBeUndefined();
    })
})