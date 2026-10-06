"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Proceso_1 = require("../src/Proceso");
const ReporteSimulacion_1 = require("../src/ReporteSimulacion");
const SimuladorSO_1 = require("../src/SimuladorSO");
// Demo SOLO para la defensa de Sistemas Operativos: corre el lote de la consigna con
// First-Fit y quantum 2, y muestra las metricas en cada tick por consola.
//
// No es parte de la biblioteca de Paradigmas: esa entrega prohibe explicitamente
// interfaz grafica, menu de consola, funcion main o script de demostracion ejecutable
// (Anexo I, "Alcance de la entrega"). Por eso este archivo vive fuera de src/, no se
// compila con la biblioteca y no cuenta para la cobertura de produccion.
console.log("INICIANDO SIMULADOR DISCRETO (SISTEMAS OPERATIVOS)...\n");
const simulador = new SimuladorSO_1.SimuladorSO(2);
const reporte = new ReporteSimulacion_1.ReporteSimulacion(simulador);
// PID, tamano en memoria (KB), ticks de CPU
[
    new Proceso_1.Proceso("P1", 200, 4),
    new Proceso_1.Proceso("P2", 350, 3),
    new Proceso_1.Proceso("P3", 150, 2),
    new Proceso_1.Proceso("P4", 400, 3),
].forEach(proceso => simulador.agregarProceso(proceso));
Array.from({ length: 12 }).forEach(() => {
    simulador.avanzarTick();
    console.log(reporte.reporte() + "\n");
});
