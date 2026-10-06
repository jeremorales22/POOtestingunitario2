import { describe, it, expect } from 'vitest';
import { SimuladorSO } from '../src/SimuladorSO';
import { Proceso } from '../src/Proceso';
import { ReporteSimulacion } from '../src/ReporteSimulacion';

describe("ReporteSimulacion", () => {
    it("incluye el tick actual y las metricas", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("P1", 200, 4));
        simulador.avanzarTick();

        const reporte = new ReporteSimulacion(simulador).reporte();

        expect(reporte).toContain("TICK 1");
        expect(reporte).toContain("Fragmentacion Externa");
        expect(reporte).toContain("[0-200 KB] P1");
    });

    it("incluye el estado de cada proceso", () => {
        const simulador = new SimuladorSO(2);
        simulador.agregarProceso(new Proceso("P1", 200, 4));
        simulador.avanzarTick();

        expect(new ReporteSimulacion(simulador).reporte()).toContain("P1: EJECUTANDO");
    });
});
