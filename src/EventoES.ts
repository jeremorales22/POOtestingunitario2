import { IEventoES } from './IEventoES';

// Evento de E/S de un proceso: inmutable y validado al crearse (los dos valores son enteros positivos).
// Se define desde afuera (por ejemplo desde un test), por eso el resultado es siempre el mismo.
export class EventoES implements IEventoES {

    constructor(readonly despuesDeTicks: number, readonly duracion: number) {

        EventoES.enteroPositivo(despuesDeTicks, "despuesDeTicks");
        EventoES.enteroPositivo(duracion, "duracion");

    }

    private static enteroPositivo(valor: number, nombre: string): void {

        const esValido = Number.isInteger(valor) && valor > 0;

        esValido || EventoES.error(`${nombre} debe ser un entero positivo`);

    }

    private static error(mensaje: string): never {

        throw new Error(mensaje);

    }
}
