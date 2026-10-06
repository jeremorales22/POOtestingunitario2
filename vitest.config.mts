import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      // La consigna exige >90% de lineas de produccion. Se deja el piso en 97% (statements,
      // functions y lines dan hoy 97-99%) para no pedir el 100%: 3 getters/metodos que no
      // son parte de ningun RF (getTiempoTotal, setTiempoTotal, porcentajeCompletado en
      // Proceso.ts) quedan deliberadamente sin test.
           thresholds: {
        statements: 97,
        branches: 97,
        functions: 97,
        lines: 97
      }
    }
  }
});