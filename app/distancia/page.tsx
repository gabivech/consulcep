"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { distanceBetween, fetchCoordinates, formatCep } from "../lib/geo";

export default function DistancePage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDistance(null);
    setError("");
    if (origin.replace(/\D/g, "").length !== 8 || destination.replace(/\D/g, "").length !== 8) {
      setError("Informe dois CEPs válidos com 8 números.");
      return;
    }
    setLoading(true);
    try {
      const [from, to] = await Promise.all([fetchCoordinates(origin), fetchCoordinates(destination)]);
      setDistance(distanceBetween(from, to));
    } catch (distanceError) {
      setError(distanceError instanceof Error ? distanceError.message : "Não foi possível calcular a distância.");
    } finally {
      setLoading(false);
    }
  };

  const newQuery = () => {
    setOrigin("");
    setDestination("");
    setDistance(null);
    setError("");
  };

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Navegação principal"><Link className="brand" href="/" aria-label="ConsulCEP início"><span className="brand-mark" aria-hidden="true">C</span><span>Consul<span>CEP</span></span></Link><div className="nav-actions"><span className="nav-note">Ferramentas postais</span><div className="route-links"><Link className="nav-link" href="/">Consultar CEP</Link><Link className="nav-link active-route" href="/distancia">Distância</Link><Link className="nav-link" href="/prazo">Prazo</Link><Link className="nav-link" href="/frete">Frete</Link></div></div></nav>
      <section className="tool-hero" aria-labelledby="distance-title"><div><p className="eyebrow">Do ponto A ao ponto B</p><h1 id="distance-title">Qual é a<br /><em>distância?</em></h1><p className="hero-description">Compare dois CEPs e descubra quantos quilômetros separam as regiões em linha reta.</p></div><div className="tool-symbol" aria-hidden="true"><span>A</span><i></i><span>B</span></div></section>
      <section className="tool-content"><form className="tool-form" onSubmit={handleSubmit}><div className="tool-heading"><span>01</span><div><strong>Escolha os pontos</strong><p>A distância é calculada pelas coordenadas dos CEPs.</p></div></div><div className="tool-fields"><label className="field-label" htmlFor="distance-origin">CEP de origem<input id="distance-origin" inputMode="numeric" placeholder="00000-000" value={origin} onChange={(event) => setOrigin(formatCep(event.target.value))} /></label><label className="field-label" htmlFor="distance-destination">CEP de destino<input id="distance-destination" inputMode="numeric" placeholder="00000-000" value={destination} onChange={(event) => setDestination(formatCep(event.target.value))} /></label></div><div className="tool-actions"><button className="submit-button" type="submit" disabled={loading}>{loading ? "Calculando..." : "Calcular distância"}<span aria-hidden="true">→</span></button><button className="new-query-button" type="button" onClick={newQuery}>Nova Consulta</button></div>{error && <p className="error-message" role="alert">{error}</p>}</form><aside className="tool-result" aria-live="polite"><p className="eyebrow">Resultado</p>{distance !== null ? <><strong>{distance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}<small> km</small></strong><p>distância aproximada em linha reta entre os CEPs informados.</p></> : <div className="tool-empty"><span aria-hidden="true">↔</span><p>Informe os dois CEPs para visualizar a distância.</p></div>}</aside></section>
      <footer className="footer"><span>ConsulCEP © 2026</span><span>Dados de localização: BrasilAPI</span></footer>
    </main>
  );
}
