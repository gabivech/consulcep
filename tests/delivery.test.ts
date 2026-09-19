import { describe, expect, it } from "vitest";
import { estimateDays } from "../app/lib/delivery";

describe("estimateDays", () => {
  it("estima prazo econômico para uma entrega local", () => {
    expect(estimateDays(80, "economico")).toBe("2 a 4 dias úteis");
  });

  it("estima prazo expresso para uma entrega regional", () => {
    expect(estimateDays(500, "expresso")).toBe("2 a 4 dias úteis");
  });

  it("usa a faixa nacional para distâncias intermediárias", () => {
    expect(estimateDays(1200, "economico")).toBe("6 a 11 dias úteis");
  });

  it("usa a maior faixa para longas distâncias", () => {
    expect(estimateDays(2500, "expresso")).toBe("4 a 8 dias úteis");
    expect(estimateDays(2500, "economico")).toBe("8 a 15 dias úteis");
  });

  it("respeita os limites entre as faixas", () => {
    expect(estimateDays(150, "economico")).toBe("2 a 4 dias úteis");
    expect(estimateDays(151, "economico")).toBe("4 a 8 dias úteis");
    expect(estimateDays(700, "expresso")).toBe("2 a 4 dias úteis");
    expect(estimateDays(701, "expresso")).toBe("3 a 6 dias úteis");
  });
});
