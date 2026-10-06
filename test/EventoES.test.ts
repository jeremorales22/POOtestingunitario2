import { describe, it, expect } from 'vitest';
import { EventoES } from '../src/EventoES';

// RF08: el evento de E/S es un dato inmutable y validado: "después de N ticks de CPU, E/S de D ticks".
describe("EventoES (RF08)", () => {
    it("guarda los ticks de CPU previos y la duracion de la E/S", () => {
        const evento = new EventoES(2, 3);

        expect(evento.despuesDeTicks).toBe(2);
        expect(evento.duracion).toBe(3);
    });

    it.each([
        ["despuesDeTicks", 0, 3],
        ["despuesDeTicks", -1, 3],
        ["despuesDeTicks", 1.5, 3],
        ["duracion", 2, 0],
        ["duracion", 2, -4],
        ["duracion", 2, 2.5],
    ])("rechaza %s invalido (%s, %s)", (campo, ticks, duracion) => {
        expect(() => new EventoES(ticks, duracion)).toThrow(`${campo} debe ser un entero positivo`);
    });
})
