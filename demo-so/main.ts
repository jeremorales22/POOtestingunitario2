import { Proceso } from '../src/Proceso';
import { SimuladorSO } from '../src/SimuladorSO';

// Demo para Sistemas Operativos. Vive FUERA del repo de Paradigmas (la biblioteca no tiene consola ni main).
//
//   npx tsx main.ts        -> muestra los 12 ticks, uno detras del otro
//   npx tsx main.ts 8      -> avanza hasta el tick 8 y muestra solo ese tick (para las capturas)

// Muestra por pantalla el estado del simulador en el tick actual.
function mostrarEstado(simulador: SimuladorSO): void {
    const memoria = simulador.metricasMemoria();
    const enCpu = simulador.procesoEnCpu() ?? "libre";

    console.log("");
    console.log("--- TICK " + simulador.tickActual() + " ---");
    console.log("CPU al cerrar el tick: " + enCpu + " | uso " + simulador.usoCpu().toFixed(2) + "% | cambios de contexto " + simulador.cambiosDeContexto());
    console.log("Memoria: ocupada " + memoria.ocupada + " KB | libre " + memoria.libreTotal + " KB | mayor hueco " + memoria.mayorHueco + " KB | fragmentacion externa " + memoria.fragmentacionExterna.toFixed(2) + "%");
    console.log("Listos [" + simulador.pidsListos() + "] | Esperando memoria [" + simulador.pidsEsperandoMemoria() + "] | Terminados [" + simulador.pidsTerminados() + "]");
    console.log("Estados: " + simulador.estados().join(" | "));

    for (const linea of simulador.mapaMemoria()) {
        console.log("   " + linea);
    }
}

// 1) Creo el simulador: quantum 2, memoria de 1024 KB y First-Fit (los valores por defecto).
const simulador = new SimuladorSO(2);

// 2) Creo los procesos del lote (PID, memoria en KB, ticks de CPU) y los agrego.
simulador.agregarProceso(new Proceso("P1", 200, 4));
simulador.agregarProceso(new Proceso("P2", 350, 3));
simulador.agregarProceso(new Proceso("P3", 150, 2));
simulador.agregarProceso(new Proceso("P4", 400, 3));

console.log("=== SIMULADOR DISCRETO: First-Fit + Round-Robin (quantum 2) ===");

// 3) Defino hasta qué tick avanzar. Si escribo un número al ejecutar (por ejemplo 8) uso ese; si no, 12.
const hastaElTick = Number(process.argv[2] ?? 12);
const mostrarTodos = process.argv[2] === undefined;

// 4) Avanzo tick por tick. Muestro todos los ticks, o solo el último si pedí uno en particular.
for (let tick = 1; tick <= hastaElTick; tick++) {
    simulador.avanzarTick();
    (mostrarTodos || tick === hastaElTick) && mostrarEstado(simulador);
}

console.log("");
console.log("FIN de la simulacion.");