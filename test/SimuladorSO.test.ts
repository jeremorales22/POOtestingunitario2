import { describe, it, expect } from 'vitest';
import { SimuladorSO } from '../src/SimuladorSO';
import { Proceso } from '../src/Proceso';
import { ProcesoConES } from '../src/ProcesoConES';
import { EventoES } from '../src/EventoES';

// Lote de la consigna: PID, KB, ticks de CPU. First-Fit, quantum 2.
function simuladorDeLaConsigna(): SimuladorSO {
    const simulador = new SimuladorSO(2);
    simulador.agregarProceso(new Proceso("P1", 200, 4));
    simulador.agregarProceso(new Proceso("P2", 350, 3));
    simulador.agregarProceso(new Proceso("P3", 150, 2));
    simulador.agregarProceso(new Proceso("P4", 400, 3));
    return simulador;

}
//Crea un simulador con quantum 2, le carga los cuatro procesos del lote de la consigna 
//(PID, KB, ticks de CPU) y lo devuelve. Lo deja en el tick 0, antes de avanzar el reloj.

// Hace avanzar el simulador la cantidad de ticks que se le pida.
function avanzar(simulador: SimuladorSO, ticks: number): void {
    Array.from({ length: ticks }).forEach(() => simulador.avanzarTick());
}
// Hace avanzar el simulador N ticks: crea una lista de N lugares y llama a avanzarTick() por cada uno.

// SimuladorSO = el coordinador. Cada tick repite siempre los mismos pasos, en el mismo orden
// (Tema 16: simulación por ticks, determinista):
//   A) admisión: los NUEVOS esperan memoria y se reintenta asignarla (First-Fit)
//   B) entrada/salida: a los BLOQUEADOS les baja la espera
//   C) despacho: si la CPU está libre, entra el primero de LISTOS
//   D) un tick de CPU con Round-Robin, y reacción al resultado (liberar memoria, reencolar, contar)
//
// Lote de la consigna: P1(200 KB, 4 ticks) P2(350, 3) P3(150, 2) P4(400, 3), quantum 2, RAM de 1024 KB.
// Piden 1100 KB en total: P4 va a esperar a que otro libere memoria.
//
// Principios que se prueban acá, a nivel integración: SimuladorSO solo COMPONE colaboradoras
// (colas, planificador, memoria, estadísticas) y las usa a través de sus interfaces (SOLID · D);
// trata igual a un Proceso y a un ProcesoConES (polimorfismo / Liskov).

// ---------------------------------------------------------------------------
// Estos tests siguen el ejemplo de la cátedra. Los resultados coinciden con la salida del programa original.

describe("Simulación del lote de la consigna, tick a tick (Tema 16)", () => {
    // Entran P1, P2 y P3 (700 KB). Quedan 324 KB libres y P4 pide 400: no cabe y espera memoria.
    // P1 ya está en la CPU, por eso en listos quedan P2 y P3.
    it("tick 1: P1, P2 y P3 entran a RAM, P4 no cabe y espera memoria", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 1);

        expect(simulador.pidsEsperandoMemoria()).toEqual(["P4"]);
        expect(simulador.pidsListos()).toEqual(["P2", "P3"]);   // P1 ya esta en la CPU
        expect(simulador.mapaMemoria()).toEqual([
            "[0-200 KB] P1", "[200-550 KB] P2", "[550-700 KB] P3", "[700-1024 KB] LIBRE"
        ]);
    })

    // P1 agota el quantum (2 ticks) y hay otros listos: vuelve al final. Primer cambio de contexto.
    it("tick 2: P1 agota el quantum y vuelve al final de listos", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 2);

        expect(simulador.pidsListos()).toEqual(["P2", "P3", "P1"]);
        expect(simulador.cambiosDeContexto()).toBe(1);
    })

    // Termina P3 y libera 150 KB. Coalescencia: se une con el hueco de la derecha -> un solo hueco de 474 KB.
    it("tick 6: P3 termina, libera y coalesce; queda un unico hueco de 474 KB (0% fragmentacion)", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 6);

        expect(simulador.mapaMemoria()).toEqual(["[0-200 KB] P1", "[200-550 KB] P2", "[550-1024 KB] LIBRE"]);
        expect(simulador.metricasMemoria().libreTotal).toBe(474);
        expect(simulador.metricasMemoria().fragmentacionExterna).toBe(0);
    })

    // Recién ahora P4 entra: el paso A (reintentar memoria) corre antes que la CPU, y en el tick 6
    // la memoria se liberó DESPUÉS de reintentar.
    it("tick 7: con la memoria liberada, P4 por fin obtiene RAM", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 7);

        expect(simulador.pidsEsperandoMemoria()).toEqual([]);
        expect(simulador.mapaMemoria()).toContain("[550-950 KB] P4");
    })

     // Termina P1 y quedan dos huecos separados (200 y 74 KB): hay 274 KB libres pero no juntos.
    // Fragmentación externa = (1 - 200/274) x 100 = 27,01 %.
    it("tick 8: P1 termina y quedan dos huecos separados (200 y 74 KB), 27.01% de fragmentacion", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 8);

        const m = simulador.metricasMemoria();
        expect(m.ocupada).toBe(750);
        expect(m.libreTotal).toBe(274);
        expect(m.mayorHueco).toBe(200);
        expect(m.fragmentacionExterna).toBeCloseTo(27.01, 2);
    });

    // Termina P2 y su bloque se une con el hueco de la izquierda (550 KB).
    // Fragmentación = (1 - 550/624) x 100 = 11,86 %: la coalescencia la mejoró.
    it("tick 9: P2 termina y su bloque se une con el hueco de la izquierda, 11.86% de fragmentacion", () => {
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 9);

        const m = simulador.metricasMemoria();
        expect(m.libreTotal).toBe(624);
        expect(m.mayorHueco).toBe(550);
        expect(m.fragmentacionExterna).toBeCloseTo(11.86, 2);
        expect(simulador.mapaMemoria()).toEqual(["[0-550 KB] LIBRE", "[550-950 KB] P4", "[950-1024 KB] LIBRE"]);
    });

    // Terminaron todos (en el orden P3, P1, P2, P4), la CPU estuvo ocupada el 100 % del tiempo,
    // hubo 2 cambios de contexto y la memoria volvió a ser un único bloque libre.
    it("tras 12 ticks todos terminaron, CPU 100% y 2 cambios de contexto", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 12);

        expect(simulador.pidsTerminados()).toEqual(["P3", "P1", "P2", "P4"]);
        expect(simulador.usoCpu()).toBe(100);
        expect(simulador.cambiosDeContexto()).toBe(2);
        expect(simulador.mapaMemoria()).toEqual(["[0-1024 KB] LIBRE"]);
    })
})

// ---------------------------------------------------------------------------
// Teoría: turnos con quantum; el que agota su turno vuelve al final de la cola.
// Cambio de contexto (criterio de la cátedra): se cuenta al vencer el quantum CON otro esperando,
// y al bloquearse por E/S. No se cuenta al terminar, ni en el primer despacho, ni al renovar sin competencia.
// ---------------------------------------------------------------------------
describe("Round-Robin dentro del simulador (Temas 7 y 8)", () => {
    
    // A y B de 3 ticks: tras 2 ticks A rota detrás de B y se cuenta 1 cambio de contexto.
    it("Round-Robin: al agotar el quantum con otro esperando, rota al final de listos", ()=>{
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 3));
        simulador.agregarProceso(new Proceso("B", 100, 3));

        avanzar(simulador, 1);
        expect(simulador.cambiosDeContexto()).toBe(0);

        avanzar(simulador, 1);
        expect(simulador.cambiosDeContexto()).toBe(1);
        expect(simulador.pidsListos()).toEqual(["B", "A"]);
    })

    // A está solo: al agotar el quantum renueva y sigue, sin cambio de contexto.
    it("Round-Robin: un proceso solo renueva su quantum sin cambio de contexto", ()=>{
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 4));

        avanzar(simulador, 3);
        expect(simulador.pidsTerminados()).toEqual([]);

        avanzar(simulador, 1);
        expect(simulador.pidsTerminados()).toEqual(["A"]);
        expect(simulador.cambiosDeContexto()).toBe(0);
    })

    // Cuando A vuelve a la CPU empieza un turno nuevo (quantum en cero): no rota antes de tiempo.
    it("Round-Robin: el proceso rotado vuelve con el quantum reiniciado", ()=>{
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 4));
        simulador.agregarProceso(new Proceso("B", 100, 4));

        avanzar(simulador, 5);   // t1-2 A, t3-4 B (rota), t5 A con quantum nuevo: aun no rota

        expect(simulador.cambiosDeContexto()).toBe(2);
    })
})

// ---------------------------------------------------------------------------
// Teoría: el proceso pasa por NUEVO, ESPERANDO_MEMORIA, LISTO, EJECUTANDO, BLOQUEADO y TERMINADO.
// ---------------------------------------------------------------------------
describe("Estados de los procesos durante la simulación (Tema 2)", () => {
    // Antes de avanzar el reloj, nadie fue admitido: todos están NUEVOS.
    it("estados: antes del primer tick todos los procesos estan NUEVOS", ()=>{
        const simulador = simuladorDeLaConsigna();

        expect(simulador.estados()).toEqual(["P1: NUEVO", "P2: NUEVO", "P3: NUEVO", "P4: NUEVO"]);
    })

    // P1 ejecuta, P2 y P3 esperan su turno (LISTO) y P4 espera memoria.
    it("estados tick 1: P1 ejecuta, P2 y P3 listos, P4 espera memoria", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 1);

        expect(simulador.estados()).toEqual([
            "P1: EJECUTANDO", "P2: LISTO", "P3: LISTO", "P4: ESPERANDO_MEMORIA",
        ]);
    })

    // P1 agotó su turno y volvió a LISTO.
    it("estados tick 2: P1 agota el quantum y vuelve a LISTO, P2 sigue LISTO", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 2);

        expect(simulador.estados()[0]).toBe("P1: LISTO");
    })

    // P3 terminó: queda TERMINADO.
    it("estados tick 6: P3 termina y queda TERMINADO", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 6);

        expect(simulador.estados()[2]).toBe("P3: TERMINADO");
    })

    // Al final, los cuatro procesos están TERMINADOS.
    it("estados tick 12: todos TERMINADOS", ()=>{
        const simulador = simuladorDeLaConsigna();

        avanzar(simulador, 12);

        expect(simulador.estados()).toEqual(["P1: TERMINADO", "P2: TERMINADO", "P3: TERMINADO", "P4: TERMINADO"]);
    })

    // Recorrido con E/S: EJECUTANDO -> BLOQUEADO -> (termina la E/S, pasa por LISTO) -> EJECUTANDO.
    it("estados: un proceso con E/S pasa por EJECUTANDO, BLOQUEADO y vuelve a EJECUTANDO", ()=>{
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new ProcesoConES("A", 100, 5, new EventoES(1, 2)));

        avanzar(simulador, 1);   // tick 1: ejecuta 1 tick de CPU y su evento lo manda a E/S
        expect(simulador.estados()).toEqual(["A: BLOQUEADO"]);

        avanzar(simulador, 1);   // tick 2: sigue bloqueado
        expect(simulador.estados()).toEqual(["A: BLOQUEADO"]);

        avanzar(simulador, 1);   // tick 3: termina la E/S y toma la CPU
        expect(simulador.estados()).toEqual(["A: EJECUTANDO"]);
    })
})

// ---------------------------------------------------------------------------
// Teoría: un proceso bloqueado no compite por la CPU; al terminar la E/S vuelve a LISTO.
// RF08: el ProcesoConES trae un evento («después de N ticks de CPU, E/S de D ticks»). Polimorfismo: el
// simulador no pregunta el tipo, llama a debeBloquearse() y duracionES(); un Proceso común responde que no.
// ---------------------------------------------------------------------------
describe("Entrada/salida y bloqueo (Tema 2)", () => {
    // A se bloquea 2 ticks (cuenta 1 cambio de contexto). Mientras espera, la CPU queda ociosa
    // (uso 50 %); al tercer tick vuelve a la CPU (uso 66,67 %).
    it("un proceso con E/S bloqueado vuelve a listos cuando termina su espera", ()=>{
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new ProcesoConES("A", 100, 5, new EventoES(1, 2)));

        avanzar(simulador, 1);   // tick 1: el evento bloquea a A
        expect(simulador.cambiosDeContexto()).toBe(1);

        avanzar(simulador, 1);   // tick 2: bloqueado (queda 1)
        expect(simulador.usoCpu()).toBe(50);

        avanzar(simulador, 1);   // tick 3: termina E/S y toma la CPU
        expect(simulador.usoCpu()).toBeCloseTo(66.67, 1);
    })

    // Un Proceso común no tiene evento de E/S: nunca se bloquea y no cuenta cambio de contexto.
    it("un proceso sin E/S nunca se bloquea", ()=>{
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("A", 100, 5));

        avanzar(simulador, 1);

        expect(simulador.estados()).toEqual(["A: EJECUTANDO"]);
        expect(simulador.cambiosDeContexto()).toBe(0);
    })
})

// ---------------------------------------------------------------------------
// Fórmula: uso de CPU (%) = ticks con CPU ocupada / ticks totales x 100.
// ---------------------------------------------------------------------------
describe("Métricas de CPU (documento «Métricas y Fórmulas»)", () => {
    // Antes de avanzar el reloj no hay ticks: el uso es 0 %.
    it("RF09: en el tick 0, antes de avanzar, el uso de CPU es 0%", ()=>{
        const simulador = new SimuladorSO(2);

        expect(simulador.tickActual()).toBe(0);
        expect(simulador.usoCpu()).toBe(0);
    })

    // Sin procesos, la CPU está ociosa los 3 ticks: uso 0 %.
    it("la CPU ociosa baja el uso de CPU", ()=>{
        const simulador = new SimuladorSO(2);

        avanzar(simulador, 3);

        expect(simulador.usoCpu()).toBe(0);
    })
})

// ---------------------------------------------------------------------------
// El simulador rechaza datos inválidos ANTES de cambiar su estado, así no queda a medias.
// ---------------------------------------------------------------------------
describe("Validación de la configuración y del registro (RF01 y RF02)", () => {
    // El quantum debe ser un entero positivo (no cero, negativo ni decimal).
    it("RF01: rechaza un quantum invalido (cero, negativo o decimal)", ()=>{
        expect(() => new SimuladorSO(0)).toThrow();
        expect(() => new SimuladorSO(-1)).toThrow();
        expect(() => new SimuladorSO(1.5)).toThrow();
    })

    // Dos procesos no pueden compartir PID; el segundo no se registra.
    it("RF02: rechaza un PID duplicado sin registrar el segundo proceso", ()=>{
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("P1", 100, 2));

        expect(() => simulador.agregarProceso(new Proceso("P1", 50, 1))).toThrow();
        expect(simulador.estados()).toEqual(["P1: NUEVO"]);
    })

    // Un proceso más grande que toda la RAM nunca podría entrar: se rechaza al registrarlo.
    it("RF02: rechaza un proceso que pide mas memoria que el total", ()=>{
        const simulador = new SimuladorSO(2, 1024);

        expect(() => simulador.agregarProceso(new Proceso("P1", 2000, 1))).toThrow();
        expect(simulador.estados()).toEqual([]);
    })
})

// ---------------------------------------------------------------------------
// El estado se consulta con métodos que devuelven valores simples (texto, números), sin exponer
// los objetos internos (encapsulamiento).
// ---------------------------------------------------------------------------
describe("Consulta del estado del sistema (RF10)", () => {
    // Antes de empezar: tick 0 y nadie en la CPU. Tras un tick: tick 1 y P1 en la CPU.
    it("RF10: expone el tick actual y el pid del proceso que esta en la CPU", ()=>{
        const simulador = simuladorDeLaConsigna();

        expect(simulador.tickActual()).toBe(0);
        expect(simulador.procesoEnCpu()).toBeUndefined();

        avanzar(simulador, 1);

        expect(simulador.tickActual()).toBe(1);
        expect(simulador.procesoEnCpu()).toBe("P1");
    })
})