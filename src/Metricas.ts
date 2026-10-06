// ABSTRACCION: esta interfaz expone solo los VALORES ya calculados (ocupada, libreTotal,
// fragmentacionExterna...). Quien la usa no ve como se calculan; eso vive en CalculadoraMetricas.
export interface Metricas {
    total: number;
    ocupada: number;
    libreTotal: number;
    mayorHueco: number;
    porcentajeOcupacion: number;
    fragmentacionExterna: number;
}
