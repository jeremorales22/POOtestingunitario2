// Contrato publico de las estadisticas de CPU. EstadisticasCpu lo implementa.
export interface Estadisticas {
    avanzarReloj(): void;
    registrarEjecucion(huboEjecucion: boolean): void;
    registrarCambioDeContexto(): void;
    tickActual(): number;
    usoCpu(): number;
    cambiosDeContexto(): number;
}
