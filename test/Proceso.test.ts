import { describe, it, expect } from 'vitest';
import { Proceso } from '../src/Proceso';
import { ProcesoConES } from '../src/ProcesoConES';
import { Estado } from '../src/Proceso';

describe("Proceso CPU", () => {
    it("un proceso de 1 tick de CPU termina despues de ejecutar 1 tick", () => {
        const proceso = new Proceso("P1", 200, 1);

        expect(proceso.estaTerminado()).toBe(false);
        proceso.ejecutarTick();
        expect(proceso.estaTerminado()).toBe(true);
    });

    it("un proceso de 2 ticks de CPU necesita 2 ticks para terminar", () => {
        const proceso = new Proceso("P1", 200, 2);

        proceso.ejecutarTick();
        expect(proceso.estaTerminado()).toBe(false);

        proceso.ejecutarTick();
        expect(proceso.estaTerminado()).toBe(true);
    });

    it("agota el quantum cuando consume tantos ticks como el limite", () => {
        const proceso = new Proceso("P1", 200, 5);

        proceso.ejecutarTick();
        expect(proceso.agotoQuantum(2)).toBe(false);

        proceso.ejecutarTick();
        expect(proceso.agotoQuantum(2)).toBe(true);
    });

    it("reiniciar el quantum vuelve a dejarlo sin consumir", () => {
        const proceso = new Proceso("P1", 200, 5);

        proceso.ejecutarTick();
        proceso.ejecutarTick();
        proceso.reiniciarQuantum();

        expect(proceso.agotoQuantum(2)).toBe(false);
    });

    it("un proceso solo CPU no admite E/S ni se bloquea", () => {
        const proceso = new Proceso("P1", 200, 5);

        proceso.bloquear(3);

        expect(proceso.admiteES()).toBe(false);
        expect(proceso.estaBloqueado()).toBe(false);
    });

    it("un proceso solo CPU tambien ignora avanzarBloqueo() (no hace nada)", () => {
        const proceso = new Proceso("P1", 200, 5);

        proceso.avanzarBloqueo();

        expect(proceso.estaBloqueado()).toBe(false);
    });
});

describe("Proceso con E/S", () => {
    it("admite E/S", () => {
        expect(new ProcesoConES("P1", 100, 5).admiteES()).toBe(true);
    });

    it("no esta bloqueado al crearse", () => {
        expect(new ProcesoConES("P1", 100, 5).estaBloqueado()).toBe(false);
    });

    it("queda bloqueado despues de bloquear", () => {
        const proceso = new ProcesoConES("P1", 100, 5);

        proceso.bloquear(2);

        expect(proceso.estaBloqueado()).toBe(true);
    });

    it("se desbloquea cuando avanzan tantos ticks como pidio", () => {
        const proceso = new ProcesoConES("P1", 100, 5);
        proceso.bloquear(2);

        proceso.avanzarBloqueo();
        expect(proceso.estaBloqueado()).toBe(true);

        proceso.avanzarBloqueo();
        expect(proceso.estaBloqueado()).toBe(false);
    });

    it("avanzar el bloqueo de un proceso libre no lo deja en negativo", () => {
        const proceso = new ProcesoConES("P1", 100, 5);

        proceso.avanzarBloqueo();
        proceso.bloquear(1);

        expect(proceso.estaBloqueado()).toBe(true);
    });
});

describe("Estados del proceso", () => {
    it("un proceso recien creado esta en estado NUEVO", () => {
        const proceso = new Proceso("P1", 200, 4);

        expect(proceso.estaEn(Estado.NUEVO)).toBe(true);
        expect(proceso.describirEstado()).toBe("NUEVO");
    });

    it("cambiar de estado deja al proceso solo en el estado nuevo", () => {
        const proceso = new Proceso("P1", 200, 4);

        proceso.cambiarEstado(Estado.LISTO);

        expect(proceso.estaEn(Estado.LISTO)).toBe(true);
        expect(proceso.estaEn(Estado.NUEVO)).toBe(false);
    });

    it("recorre los 6 estados de la consigna", () => {
        const proceso = new Proceso("P1", 200, 4);
        const recorrido = [
            Estado.NUEVO, Estado.ESPERANDO_MEMORIA, Estado.LISTO,
            Estado.EJECUTANDO, Estado.BLOQUEADO, Estado.TERMINADO,
        ].map(estado => {
            proceso.cambiarEstado(estado);
            return proceso.describirEstado();
        });

        expect(recorrido).toEqual([
            "NUEVO", "ESPERANDO_MEMORIA", "LISTO", "EJECUTANDO", "BLOQUEADO", "TERMINADO",
        ]);
    });
});

// Nota: porcentajeCompletado() no es una de las 6 metricas que pide el RF09 del Anexo I
// (ocupacion de memoria, uso de CPU, cambios de contexto, memoria libre, mayor hueco y
// fragmentacion externa), asi que no tiene tests propios en esta entrega.

