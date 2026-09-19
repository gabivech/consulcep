export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

export const fetchCoordinates = async (value: string): Promise<Coordinates> => {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${value.replace(/\D/g, "")}`);
  if (!response.ok) throw new Error("Um dos CEPs não foi encontrado.");
  const data = (await response.json()) as {
    location?: { coordinates?: { latitude?: string | number; longitude?: string | number } };
  };
  const latitude = Number(data.location?.coordinates?.latitude);
  const longitude = Number(data.location?.coordinates?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Não foi possível obter a localização de um dos CEPs.");
  }
  return { latitude, longitude };
};

export const distanceBetween = (from: Coordinates, to: Coordinates) => {
  const earthRadius = 6371;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const latitudeOne = (from.latitude * Math.PI) / 180;
  const latitudeTwo = (to.latitude * Math.PI) / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latitudeOne) * Math.cos(latitudeTwo);
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};
