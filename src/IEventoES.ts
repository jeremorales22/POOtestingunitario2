// RF08: contrato de un evento de entrada/salida determinista.
// «Después de N ticks de CPU, el proceso se bloquea durante `duracion` ticks.»
export interface IEventoES {
    readonly despuesDeTicks: number;
    readonly duracion: number;
}
