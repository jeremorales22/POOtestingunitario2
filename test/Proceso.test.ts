import { describe, it, expect } from 'vitest';
import { Proceso } from '../src/Proceso';
import { ProcesoConES } from '../src/ProcesoConES';
import { EventoES } from '../src/EventoES';
import { Estado } from '../src/Proceso';


// Proceso = el PCB (Bloque de Control de Proceso) del simulador: la ficha con los datos de cada
// proceso (Temas 1 a 3 del apunte). ProcesoConES hereda de Proceso y agrega la espera de E/S.
// Principios que se prueban acá:
//  - Encapsulamiento: los datos son privados; se usan métodos (ejecutarTick, cambiarEstado...).
//  - Herencia y polimorfismo: ProcesoConES responde distinto a admiteES(), bloquear() y estaBloqueado().
//  - SRP: el proceso solo sabe de sí mismo; no decide quién usa la CPU (eso es del planificador).

// ---------------------------------------------------------------------------
// 1. NACIMIENTO Y ESTADOS (Tema 2: estados del proceso, Tema 4: creación)
//    Teoría: al crearse un proceso, el sistema le arma su PCB y lo deja en estado NUEVO.
//    Después pasa por los estados según lo que le ocurra. La consigna pide 6 estados.
// ---------------------------------------------------------------------------
describe("Estados de un proceso", () => {
    
    // Teoría: todo proceso nace en NUEVO (todavía no fue admitido ni tiene memoria).
    // Verifica además estaEn() y describirEstado(), que el reporte usa para mostrar el estado.
    it("un proceso recien creado esta en estado NUEVO", () => {
        const proceso = new Proceso("P1", 200, 4);

        expect(proceso.estaEn(Estado.NUEVO)).toBe(true);
        expect(proceso.describirEstado()).toBe("NUEVO");
    });

    // Teoría: un proceso está en UN solo estado a la vez. Al pasar a LISTO deja de estar NUEVO.
    it("cambiar de estado deja al proceso en el estado nuevo y lo saca del anterior", () => {
        const proceso = new Proceso("P1", 200, 4);

        proceso.cambiarEstado(Estado.ESPERANDO_MEMORIA);

        expect(proceso.estaEn(Estado.ESPERANDO_MEMORIA)).toBe(true);
        expect(proceso.estaEn(Estado.NUEVO)).toBe(false);
    });

    // Teoría: el modelo clásico tiene 5 estados; el simulador agrega ESPERANDO_MEMORIA porque
    // en memoria contigua un proceso puede no entrar a la RAM. Esta prueba recorre los 6.
    it("recorre los 6 estados de la consigna", () => {
        const proceso = new Proceso("P1", 200, 4);
        const estados = [
            Estado.ESPERANDO_MEMORIA, Estado.LISTO, Estado.EJECUTANDO, Estado.BLOQUEADO,
            Estado.LISTO, Estado.EJECUTANDO, Estado.TERMINADO,
        ];

        const recorrido = [proceso.describirEstado(), ...estados.map(estado => {
            proceso.cambiarEstado(estado);
            return proceso.describirEstado();
        })];

        expect(recorrido).toEqual([
            "NUEVO", "ESPERANDO_MEMORIA", "LISTO", "EJECUTANDO", "BLOQUEADO", "LISTO", "EJECUTANDO", "TERMINADO",
        ]);

    });

    // Doble encapsulamiento: el proceso protege sus propias transiciones (NUEVO no salta a EJECUTANDO).
    it("rechaza una transicion que no existe en el modelo de 6 estados", () => {
        const proceso = new Proceso("P1", 200, 4);

        expect(() => proceso.cambiarEstado(Estado.EJECUTANDO)).toThrow("Transicion invalida: NUEVO -> EJECUTANDO");
        expect(proceso.estaEn(Estado.NUEVO)).toBe(true);
    });

    // TERMINADO es final: ya no sale a ningun estado.
    it("un proceso TERMINADO no puede cambiar de estado", () => {
        const proceso = new Proceso("P1", 200, 4);
        // recorre el camino válido hasta TERMINADO
        [Estado.ESPERANDO_MEMORIA, Estado.LISTO, Estado.EJECUTANDO, Estado.TERMINADO]
            .forEach(estado => proceso.cambiarEstado(estado));

        expect(() => proceso.cambiarEstado(Estado.LISTO)).toThrow("Transicion invalida: TERMINADO -> LISTO");
    });
})

// ---------------------------------------------------------------------------
// 2. CPU Y TICKS (Tema 16: el simulador avanza por ticks)
//    Teoría: un proceso necesita una cantidad de CPU (su "ráfaga"). Cada tick que usa la CPU
//    se le descuenta una unidad. Cuando no le queda nada, terminó.
// ---------------------------------------------------------------------------
describe("Proceso en la CPU", () => {
    
    // Caso límite: la ráfaga más corta posible. Antes de ejecutar no terminó; después sí.
    it("un proceso de 1 tick de CPU termina despues de ejecutar 1 tick", () => {
        const proceso = new Proceso("P1", 200, 1);

        expect(proceso.estaTerminado()).toBe(false);
        proceso.ejecutarTick();
        expect(proceso.estaTerminado()).toBe(true);
    });

    // Teoría: el tiempo restante baja de a uno. Con 2 ticks de CPU, el primero no alcanza.
    it("un proceso de 2 ticks de CPU necesita 2 ticks para terminar", () => {
        const proceso = new Proceso("P1", 200, 2);

        proceso.ejecutarTick();
        expect(proceso.estaTerminado()).toBe(false);

        proceso.ejecutarTick();
        expect(proceso.estaTerminado()).toBe(true);
    });
})

// ---------------------------------------------------------------------------
// 3. QUANTUM (Temas 7 y 8: Round-Robin)
//    Teoría: en Round-Robin cada proceso usa la CPU como máximo un "quantum" seguido. El PCB
//    lleva la cuenta de cuántos ticks consumió en su turno. Quien decide qué hacer cuando se
//    agota es el planificador (se prueba en PlanificadorRoundRobin.test.ts); acá solo se
//    prueba que el proceso sabe contar su turno.
// ---------------------------------------------------------------------------

describe("Quantum del proceso", () => {
    // Con quantum 2: después de 1 tick todavía le queda turno; después de 2 se le acabó.
    it("agota el quantum cuando consume tantos ticks como el limite", () => {
        const proceso = new Proceso("P1", 200, 5);

        proceso.ejecutarTick();
        expect(proceso.agotoQuantum(2)).toBe(false);

        proceso.ejecutarTick();
        expect(proceso.agotoQuantum(2)).toBe(true);
    });

    // Teoría: al volver a la cola (o renovar su turno) el proceso empieza un turno nuevo, con
    // el contador en cero. Si no se reiniciara, agotaría el quantum antes de tiempo.
    it("reiniciar el quantum vuelve a dejarlo sin consumir", () => {
        const proceso = new Proceso("P1", 200, 5);
        proceso.ejecutarTick();
        proceso.ejecutarTick();

        proceso.reiniciarQuantum();

        expect(proceso.agotoQuantum(2)).toBe(false);
    });
})

// ---------------------------------------------------------------------------
// 4. ENTRADA/SALIDA (Tema 2: el estado Bloqueado)
//    Teoría: un proceso se bloquea cuando espera un evento (normalmente E/S). Mientras espera
//    no compite por la CPU. Cuando termina la espera NO vuelve directo a ejecutar: vuelve a
//    LISTO. (Ese paso a LISTO lo hace ColasProcesos y se prueba en ColasProcesos.test.ts.)
//    POO · Herencia y polimorfismo: solo algunos procesos hacen E/S, por eso existe
//    ProcesoConES (hereda de Proceso). El simulador no pregunta de qué tipo es cada uno:
//    llama a admiteES(), bloquear() y estaBloqueado(), y cada clase responde a su manera.
// ---------------------------------------------------------------------------

describe("Proceso con E/S", () => {
    it("admite E/S", () => {
        expect(new ProcesoConES("P1", 100, 5, new EventoES(1, 2)).admiteES()).toBe(true);
    });

    it("no esta bloqueado al crearse", () => {
        expect(new ProcesoConES("P1", 100, 5, new EventoES(1, 2)).estaBloqueado()).toBe(false);
    });

    // bloquear(2) = "va a esperar 2 ticks de E/S".
    it("queda bloqueado despues de bloquear", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 2));

        proceso.bloquear(2);

        expect(proceso.estaBloqueado()).toBe(true);
    });

    // La espera de E/S se mide en ticks, igual que el resto: con 2 ticks, sigue bloqueado
    // después del primero y se libera después del segundo.
    it("se desbloquea cuando avanzan tantos ticks como pidio", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 2));
        proceso.bloquear(2);

        proceso.avanzarBloqueo();
        expect(proceso.estaBloqueado()).toBe(true);

        proceso.avanzarBloqueo();
        expect(proceso.estaBloqueado()).toBe(false);
    });

    // Un proceso que no está esperando nada no debe quedar "bloqueado" por avanzar el reloj
    // de E/S (la espera nunca baja de cero).
    it("avanzar el bloqueo de un proceso que no esta esperando lo deja libre", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 2));

        proceso.avanzarBloqueo();

        expect(proceso.estaBloqueado()).toBe(false);
    });
})

// ---------------------------------------------------------------------------
// 5. EVENTO DE E/S (RF08)
//    El ProcesoConES se bloquea una sola vez, justo cuando completa los N ticks de su evento.
// ---------------------------------------------------------------------------
describe("Evento de E/S del proceso (RF08)", () => {
    it("debeBloquearse es true solo cuando ejecuto exactamente N ticks", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(2, 3));

        expect(proceso.debeBloquearse()).toBe(false);
        proceso.ejecutarTick();
        expect(proceso.debeBloquearse()).toBe(false);
        proceso.ejecutarTick();
        expect(proceso.debeBloquearse()).toBe(true);
    });

    it("despues de bloquearse una vez, el evento no se repite", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 3));
        proceso.ejecutarTick();

        proceso.bloquear(proceso.duracionES());

        expect(proceso.duracionES()).toBe(3);
        expect(proceso.debeBloquearse()).toBe(false);
    });

    it("rechaza un evento que ocurre cuando el proceso ya termino", () => {
        expect(() => new ProcesoConES("P1", 100, 3, new EventoES(3, 2)))
            .toThrow("El evento de E/S debe ocurrir antes de que el proceso termine");
    });

    it("un Proceso comun nunca pide E/S", () => {
        const proceso = new Proceso("P1", 100, 5);

        expect(proceso.debeBloquearse()).toBe(false);
        expect(proceso.duracionES()).toBe(0);
    });
})