import { describe, expect, it, vi } from "vitest";
import { distanceBetween, fetchCoordinates, formatCep } from "../app/lib/geo";

describe("formatCep", () => {
  it("aplica a máscara a um CEP com oito dígitos", () => {
    expect(formatCep("01310930")).toBe("01310-930");
  });

  it("remove letras, símbolos e limita o valor a oito dígitos", () => {
    expect(formatCep("CEP 01310-930 extra")).toBe("01310-930");
  });

  it("mantém a entrada parcial sem adicionar hífen cedo demais", () => {
    expect(formatCep("01310")).toBe("01310");
  });
});

describe("distanceBetween", () => {
  it("retorna zero para o mesmo ponto", () => {
    const point = { latitude: -23.55, longitude: -46.63 };
    expect(distanceBetween(point, point)).toBe(0);
  });

  it("calcula aproximadamente a distância de um grau no equador", () => {
    const distance = distanceBetween({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(distance).toBeCloseTo(111.2, 0);
  });

  it("é simétrica entre origem e destino", () => {
    const origin = { latitude: -23.55, longitude: -46.63 };
    const destination = { latitude: -22.90, longitude: -43.20 };
    expect(distanceBetween(origin, destination)).toBeCloseTo(distanceBetween(destination, origin), 10);
  });
});

describe("fetchCoordinates", () => {
  it("lê latitude e longitude da BrasilAPI", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ location: { coordinates: { latitude: "-23.55", longitude: "-46.63" } } }),
    }));

    await expect(fetchCoordinates("01310-930")).resolves.toEqual({ latitude: -23.55, longitude: -46.63 });
    expect(fetch).toHaveBeenCalledWith("https://brasilapi.com.br/api/cep/v2/01310930");
  });

  it("rejeita CEP que a API não encontra", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(fetchCoordinates("00000-000")).rejects.toThrow("Um dos CEPs não foi encontrado.");
  });
});
