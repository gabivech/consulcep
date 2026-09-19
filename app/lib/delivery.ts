export type DeliveryType = "economico" | "expresso";

export const estimateDays = (distance: number, deliveryType: DeliveryType) => {
  if (deliveryType === "expresso") {
    if (distance <= 150) return "1 a 2 dias úteis";
    if (distance <= 700) return "2 a 4 dias úteis";
    if (distance <= 1800) return "3 a 6 dias úteis";
    return "4 a 8 dias úteis";
  }
  if (distance <= 150) return "2 a 4 dias úteis";
  if (distance <= 700) return "4 a 8 dias úteis";
  if (distance <= 1800) return "6 a 11 dias úteis";
  return "8 a 15 dias úteis";
};
