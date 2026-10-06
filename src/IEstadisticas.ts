// Contrato público de las estadísticas de CPU. EstadisticasCpu lo implementa.
// [SOLID · D] SimuladorSO depende de este contrato. [SOLID · I] interfaz chica: solo contadores.
export interface IEstadisticas {
     avanzarReloj(): void;
     registrarEjecucion(huboEjecucion: boolean): void;
     registrarCambioDeContexto():  void;
     tickActual(): number;
     usoCpu(): number;
     cambiosDeContexto(): number;

}