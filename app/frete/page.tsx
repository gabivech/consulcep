"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Quote = {
  name: string;
  days: string;
  price: number;
  accent: string;
};

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const distanceBetween = (from: Coordinates, to: Coordinates) => {
  const earthRadius = 6371;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const latitudeOne = (from.latitude * Math.PI) / 180;
  const latitudeTwo = (to.latitude * Math.PI) / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latitudeOne) * Math.cos(latitudeTwo);
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const fetchCoordinates = async (value: string): Promise<Coordinates> => {
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

export default function FreightPage() {
  const [originCep, setOriginCep] = useState("");
  const [destinationCep, setDestinationCep] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewQuery = () => {
    setOriginCep("");
    setDestinationCep("");
    setWeight("");
    setLength("");
    setWidth("");
    setHeight("");
    setQuotes([]);
    setDistance(null);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setQuotes([]);
    setDistance(null);

    const numericValues = [weight, length, width, height].map(Number);
    if (originCep.replace(/\D/g, "").length !== 8 || destinationCep.replace(/\D/g, "").length !== 8) {
      setError("Informe um CEP de origem e um CEP de destino válidos.");
      return;
    }
    if (numericValues.some((value) => !Number.isFinite(value) || value <= 0)) {
      setError("Preencha peso e todas as dimensões com valores maiores que zero.");
      return;
    }

    setLoading(true);
    try {
      const [origin, destination] = await Promise.all([
        fetchCoordinates(originCep),
        fetchCoordinates(destinationCep),
      ]);
      const kilometers = distanceBetween(origin, destination);
      const [packageWeight, packageLength, packageWidth, packageHeight] = numericValues;
      const cubicWeight = (packageLength * packageWidth * packageHeight) / 6000;
      const chargeableWeight = Math.max(packageWeight, cubicWeight);
      setDistance(kilometers);
      setQuotes([
        { name: "Econômico", days: "6 a 12 dias úteis", price: 14.9 + kilometers * 0.045 + chargeableWeight * 2.1, accent: "green" },
        { name: "Expresso", days: "2 a 6 dias úteis", price: 22.9 + kilometers * 0.07 + chargeableWeight * 3.6, accent: "orange" },
      ]);
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Não foi possível calcular a estimativa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Navegação principal">
        <Link className="brand" href="/" aria-label="ConsulCEP início">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>Consul<span>CEP</span></span>
        </Link>
        <div className="nav-actions"><span className="nav-note">Ferramentas postais</span><div className="route-links"><Link className="nav-link" href="/">Consultar CEP</Link><Link className="nav-link" href="/distancia">Distância</Link><Link className="nav-link" href="/prazo">Prazo</Link><Link className="nav-link active-route" href="/frete">Frete</Link></div></div>
      </nav>

      <section className="freight-hero" aria-labelledby="freight-title">
        <div><p className="eyebrow">Distância + pacote</p><h1 id="freight-title">Quanto custa<br /><em>enviar?</em></h1><p className="hero-description">Uma simulação rápida baseada nos dois CEPs, peso e volume da sua encomenda.</p></div>
      </section>

      <section className="freight-content">
        <form className="freight-form" onSubmit={handleSubmit}>
          <div className="form-block"><div className="block-heading"><span>01</span><div><strong>Rota</strong><p>De onde sai e para onde vai?</p></div></div><div className="freight-fields two-columns"><label className="field-label" htmlFor="origin">CEP de origem<input id="origin" inputMode="numeric" placeholder="00000-000" value={originCep} onChange={(event) => setOriginCep(formatCep(event.target.value))} /></label><label className="field-label" htmlFor="destination">CEP de destino<input id="destination" inputMode="numeric" placeholder="00000-000" value={destinationCep} onChange={(event) => setDestinationCep(formatCep(event.target.value))} /></label></div></div>
          <div className="form-block"><div className="block-heading"><span>02</span><div><strong>Pacote</strong><p>Medidas em centímetros e peso em quilos.</p></div></div><div className="freight-fields package-fields"><label className="field-label" htmlFor="weight">Peso<input id="weight" type="number" min="0.01" step="0.01" placeholder="1" value={weight} onChange={(event) => setWeight(event.target.value)} /><small>kg</small></label><label className="field-label" htmlFor="length">Comprimento<input id="length" type="number" min="1" step="0.1" placeholder="20" value={length} onChange={(event) => setLength(event.target.value)} /><small>cm</small></label><label className="field-label" htmlFor="width">Largura<input id="width" type="number" min="1" step="0.1" placeholder="15" value={width} onChange={(event) => setWidth(event.target.value)} /><small>cm</small></label><label className="field-label" htmlFor="height">Altura<input id="height" type="number" min="1" step="0.1" placeholder="10" value={height} onChange={(event) => setHeight(event.target.value)} /><small>cm</small></label></div></div>
          <div className="freight-actions"><button className="submit-button freight-submit" type="submit" disabled={loading}>{loading ? "Calculando..." : "Calcular estimativa"}<span aria-hidden="true">→</span></button><button className="new-query-button" type="button" onClick={handleNewQuery}>Nova Consulta</button></div>
          {error && <p className="error-message" role="alert">{error}</p>}
        </form>

        <aside className="quote-panel" aria-live="polite"><div className="quote-panel-top"><p className="eyebrow">Sua simulação</p>{distance !== null && <span>{Math.round(distance)} km em linha reta</span>}</div>{quotes.length > 0 ? <div className="quote-list">{quotes.map((quote) => <article className={`quote-card ${quote.accent}`} key={quote.name}><div><strong>{quote.name}</strong><p>{quote.days}</p></div><b>{formatCurrency(quote.price)}</b></article>)}</div> : <div className="quote-empty"><span aria-hidden="true">◎</span><p>Preencha os dados ao lado para ver uma estimativa de envio.</p></div>}<p className="quote-disclaimer">Estimativa própria, não é cotação oficial de transportadora. O valor real pode variar por região, contrato, adicionais e regras de cada serviço.</p></aside>
      </section>

      <footer className="footer"><span>ConsulCEP © 2026</span><span>Dados de localização: BrasilAPI</span></footer>
    </main>
  );
}
