import { BloqueMemoria } from './BloqueMemoria';
import { IEstrategiaAsignacion } from './IEstrategiaAsignacion';
import { FirstFit } from './FirstFit';
import { IGestorMemoria } from './IGestorMemoria';
import { IMetricas } from './IMetricas';
import { Proceso } from './Proceso';

// Teoría (Temas 9, 10, 11, 14 y 15): administra la RAM como una lista de bloques contiguos:
// asigna (dividiendo huecos), libera (fusionando huecos vecinos) y calcula las métricas.
//
// PRINCIPIOS QUE APLICA
// [SOLID · S] solo administra la memoria. Qué hueco elegir lo decide la estrategia (FirstFit).
// [SOLID · O] agregar otra política (Best-Fit, Worst-Fit) es crear una clase nueva; esta no cambia.
// [SOLID · D] depende de la interfaz IEstrategiaAsignacion, no de una política concreta; y
//     SimuladorSO depende de IGestorMemoria, no de esta clase.
// [POO · Inyección de dependencias] la estrategia llega por el constructor.
// [POO · Composición] «tiene» una lista de BloqueMemoria que ella misma crea y gobierna: si la
//     clase desaparece, sus bloques también. [POO · Agregación] la estrategia, en cambio, llega de
//     afuera y existe por sí sola.
// [POO · Encapsulamiento] la lista de bloques es privada: solo se cambia con asignar() y liberar().
export class AdministradorMemoria implements IGestorMemoria {

    // [POO · Encapsulamiento] la lista de bloques es privada. Nadie de afuera puede agregar, sacar ni
    // reordenar bloques; solo a través de asignar() y liberar().
    private bloques: BloqueMemoria[];
    private tamanoTotal: number;
    private estrategia: IEstrategiaAsignacion;

    // RAM de 1024 KB por defecto y First-Fit por defecto. Al arrancar, toda la memoria es UN hueco libre.
    constructor(tamanoTotal: number = 1024, estrategia: IEstrategiaAsignacion = new FirstFit()) {

        this.tamanoTotal = AdministradorMemoria.enteroPositivo(tamanoTotal, "El tamano de memoria");
        this.bloques = [new BloqueMemoria(0, this.tamanoTotal)];
        this.estrategia = estrategia;

    }

    // RF01: rechaza configuraciones inválidas antes de crear ningún bloque (sin estados a medias).
    private static enteroPositivo(valor: number, nombre: string): number {

        const esValido = Number.isInteger(valor) && valor > 0;

        return esValido ? valor : AdministradorMemoria.error(`${nombre} debe ser un entero positivo`);

    }

    // Auxiliar: `throw` no se puede usar como expresión, y el proyecto evita `if`. Este método permite
    // lanzar el error desde un ternario. Devuelve `never`: nunca retorna, siempre corta la ejecución.
    private static error(mensaje: string): never {

        throw new Error(mensaje);

    }
    // [POO · Encapsulamiento] get/set protegidos de la lista de bloques.
    protected getBloques(): BloqueMemoria[] {

        return this.bloques;

    }

    protected setBloques(bloques: BloqueMemoria[]): void {

        this.bloques = bloques;

    }

    // Temas 10 y 11: delega en la estrategia inyectada la elección del hueco. [POO · Polimorfismo]: no
    // importa si es FirstFit u otra, se usa igual. Si hay hueco, el bloque se divide (splitting) y se
    // inserta el sobrante justo después. Devuelve false si el proceso no entra en ningún hueco.
    asignar(proceso: Proceso): boolean {
        const elegido = this.estrategia.elegirBloque(this.getBloques(), proceso);

        elegido ? this.ocupar(elegido, proceso) : undefined;

        return elegido !== undefined;
    }

    private ocupar(bloque: BloqueMemoria, proceso: Proceso): void {
        const posicion = this.getBloques().indexOf(bloque);
        const sobrante = bloque.ocuparCon(proceso);

        this.getBloques().splice(posicion + 1, 0, ...sobrante);
    }

    // Tema 15: libera el bloque del proceso que terminó y fusiona los huecos vecinos (coalescencia).
    liberar(pid: string): void {

        this.getBloques().filter(bloque => bloque.esDe(pid)).forEach(bloque => bloque.liberar());

        this.coalescer();

    }

    // Recorre la lista UNA vez, de izquierda a derecha, uniendo huecos libres contiguos. Como el bloque
    // que acaba de crecer puede volver a fusionarse con el siguiente, una sola pasada alcanza para unir
    // tres bloques libres seguidos.
    private coalescer(): void {

        this.setBloques(this.getBloques().reduce<BloqueMemoria[]>(AdministradorMemoria.unir, []));

    }

    private static unir(acumulados: BloqueMemoria[], bloque: BloqueMemoria): BloqueMemoria[] {

        const ultimo = acumulados.at(-1);

        ultimo?.puedeFusionarCon(bloque) ? ultimo.fusionarCon(bloque) : acumulados.push(bloque);

        return acumulados;

        // Un paso de la coalescencia: si el bloque que llega y 
        // el último guardado están libres, se fusionan; si no, se guarda aparte.

    }

    // Documento «Métricas»: ocupada, libre total, mayor hueco y fragmentación externa.
    // Fragmentación externa (%) = (1 - mayor hueco / libre total) x 100; da 0 si no hay memoria libre.
    // Devuelve un objeto con valores simples (IMetricas): no expone los bloques internos.
    metricas(): IMetricas {

        const suma = (valores: number[]) => valores.reduce((a, b) => a + b, 0);
        const ocupada = suma(this.getBloques().map(bloque => bloque.kbOcupados()));
        const libreTotal = suma(this.getBloques().map(bloque => bloque.kbLibres()));
        const mayorHueco = this.getBloques()
            .map(bloque => bloque.kbLibres())
            .reduce((mayor, actual) => actual > mayor ? actual : mayor, 0);
        const libreParaDividir = libreTotal > 0 ? libreTotal : 1;

        return {
            total: this.tamanoTotal,
            ocupada,
            libreTotal,
            mayorHueco,
            porcentajeOcupacion: (ocupada / this.tamanoTotal) * 100,
            fragmentacionExterna: ((libreTotal - mayorHueco) / libreParaDividir) * 100
        };

    }
    // El mapa de memoria como texto: un renglón por bloque. Devuelve copias, no los bloques.
    mapa(): string[] {

        return this.getBloques().map(bloque => bloque.describir());

    }
}
