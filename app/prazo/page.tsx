"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { estimateDays, type DeliveryType } from "../lib/delivery";
import { distanceBetween, fetchCoordinates, formatCep } from "../lib/geo";

export default function DeliveryPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("economico");
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
    } catch (deliveryError) {
      setError(deliveryError instanceof Error ? deliveryError.message : "Não foi possível estimar o prazo.");
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
      <nav className="topbar" aria-label="Navegação principal"><Link className="brand" href="/" aria-label="ConsulCEP início"><span className="brand-mark" aria-hidden="true">C</span><span>Consul<span>CEP</span></span></Link><div className="nav-actions"><span className="nav-note">Ferramentas postais</span><div className="route-links"><Link className="nav-link" href="/">Consultar CEP</Link><Link className="nav-link" href="/distancia">Distância</Link><Link className="nav-link active-route" href="/prazo">Prazo</Link><Link className="nav-link" href="/frete">Frete</Link></div></div></nav>
      <section className="tool-hero" aria-labelledby="delivery-title"><div><p className="eyebrow">Planeje a chegada</p><h1 id="delivery-title">Quando<br /><em>chega?</em></h1><p className="hero-description">Uma estimativa de prazo entre dois CEPs para ajudar você a planejar seu envio.</p></div></section>
      <section className="tool-content"><form className="tool-form" onSubmit={handleSubmit}><div className="tool-heading"><span>01</span><div><strong>Rota e velocidade</strong><p>Escolha os CEPs e o tipo de envio.</p></div></div><div className="tool-fields"><label className="field-label" htmlFor="delivery-origin">CEP de origem<input id="delivery-origin" inputMode="numeric" placeholder="00000-000" value={origin} onChange={(event) => setOrigin(formatCep(event.target.value))} /></label><label className="field-label" htmlFor="delivery-destination">CEP de destino<input id="delivery-destination" inputMode="numeric" placeholder="00000-000" value={destination} onChange={(event) => setDestination(formatCep(event.target.value))} /></label></div><label className="field-label delivery-select" htmlFor="delivery-type">Tipo de envio<select id="delivery-type" value={deliveryType} onChange={(event) => setDeliveryType(event.target.value as DeliveryType)}><option value="economico">Econômico</option><option value="expresso">Expresso</option></select></label><div className="tool-actions"><button className="submit-button" type="submit" disabled={loading}>{loading ? "Estimando..." : "Estimar prazo"}<span aria-hidden="true">→</span></button><button className="new-query-button" type="button" onClick={newQuery}>Nova Consulta</button></div>{error && <p className="error-message" role="alert">{error}</p>}</form><aside className="tool-result" aria-live="polite"><p className="eyebrow">Prazo estimado</p>{distance !== null ? <><strong>{estimateDays(distance, deliveryType)}</strong><p>{Math.round(distance).toLocaleString("pt-BR")} km em linha reta entre as regiões.</p></> : <div className="tool-empty"><span aria-hidden="true">◷</span><p>Preencha os CEPs para consultar um prazo aproximado.</p></div>}<p className="result-disclaimer">Estimativa informativa. Finais de semana, feriados, operação e contrato da transportadora podem alterar o prazo real.</p></aside></section>
      <footer className="footer"><span>ConsulCEP © 2026</span><span>Estimativa baseada em distância</span></footer>
    </main>
  );
}
