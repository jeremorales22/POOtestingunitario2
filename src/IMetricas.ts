// [POO · Abstracción] + [Encapsulamiento]: expone solo los VALORES ya calculados (ocupada,
// libreTotal, fragmentacionExterna...). Quien la usa no ve cómo se calculan ni toca los bloques.
// Son las métricas del documento de la cátedra.
export interface IMetricas {
    total: number;
    ocupada: number;
    libreTotal: number;
    mayorHueco: number;
    porcentajeOcupacion: number;
    fragmentacionExterna: number;
}
