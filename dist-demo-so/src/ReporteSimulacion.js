"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporteSimulacion = void 0;
// RESPONSABILIDAD UNICA: esta clase solo formatea un tick como texto, usando unicamente
// metodos publicos de Simulador (nunca su estado interno). No imprime nada por consola:
// devuelve un string. Imprimirlo (console.log) queda para quien la use (por ejemplo,
// demo-so/main.ts), no para la biblioteca.
// SOLID (D): depende de la interfaz Simulador, no de la clase concreta SimuladorSO.
class ReporteSimulacion {
    simulador;
    constructor(simulador) {
        this.simulador = simulador;
    }
    reporte() {
        const m = this.simulador.metricasMemoria();
        return [
            `${"=".repeat(25)} TICK ${this.simulador.tickActual()} ${"=".repeat(25)}`,
            `Uso de CPU: ${this.simulador.usoCpu().toFixed(2)}% | Cambios de Contexto: ${this.simulador.cambiosDeContexto()}`,
            `Memoria Ocupada: ${m.ocupada} KB (${m.porcentajeOcupacion.toFixed(1)}%) | Libre Total: ${m.libreTotal} KB`,
            `Mayor Hueco Contiguo: ${m.mayorHueco} KB | Fragmentacion Externa: ${m.fragmentacionExterna.toFixed(2)}%`,
            `Cola de Listos: [${this.simulador.pidsListos()}]`,
            `Esperando Memoria: [${this.simulador.pidsEsperandoMemoria()}]`,
            `Estados: [${this.simulador.estados().join(" | ")}]`,
            ...this.simulador.mapaMemoria().map(linea => `   ${linea}`)
        ].join("\n");
    }
}
exports.ReporteSimulacion = ReporteSimulacion;
