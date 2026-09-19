"use client";

import cep from "cep-promise";
import Link from "next/link";
import { FormEvent, useState } from "react";

type SearchMode = "cep" | "address";

type Address = {
  cep: string;
  state: string;
  city: string;
  street: string;
  neighborhood: string;
  coordinates?: Coordinates;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const readableError = (error: unknown) => {
  if (error instanceof TypeError) {
    return "Não foi possível conectar ao serviço de endereços. Tente novamente em instantes.";
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Não foi possível localizar esse endereço agora.";
};

const withoutHouseNumber = (value: string) => value
  .replace(/,\s*\d+[A-Za-z]?\b.*$/i, "")
  .replace(/\s+#?\d+[A-Za-z]?\s*$/i, "")
  .trim();

export default function Home() {
  const [mode, setMode] = useState<SearchMode>("cep");
  const [cepValue, setCepValue] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [results, setResults] = useState<Address[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const loadCoordinates = async (address: Address) => {
    setCoordinates(null);
    setMapError("");
    setMapLoading(true);
    try {
      if (address.coordinates) {
        setCoordinates(address.coordinates);
        return;
      }

      const cepResponse = await fetch(
        `https://brasilapi.com.br/api/cep/v2/${address.cep.replace(/\D/g, "")}`,
      );
      if (cepResponse.ok) {
        const cepData = (await cepResponse.json()) as {
          location?: { coordinates?: { latitude?: string | number; longitude?: string | number } };
        };
        const latitude = Number(cepData.location?.coordinates?.latitude);
        const longitude = Number(cepData.location?.coordinates?.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setCoordinates({ latitude, longitude });
          return;
        }
      }

      const query = [address.street, address.neighborhood, address.city, address.state, address.cep, "Brasil"]
        .filter(Boolean)
        .join(", ");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("O mapa não respondeu.");
      const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
      const result = data[0];
      if (!result?.lat || !result.lon) throw new Error("Localização não encontrada.");
      setCoordinates({ latitude: Number(result.lat), longitude: Number(result.lon) });
    } catch {
      setMapError("Não foi possível posicionar esse endereço no mapa.");
    } finally {
      setMapLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResults([]);
    setCoordinates(null);
    setMapError("");

    if (mode === "cep" && cepValue.replace(/\D/g, "").length !== 8) {
      setError("Digite um CEP válido com 8 números.");
      return;
    }

    if (mode === "address" && (!state || !city.trim() || street.trim().length < 3)) {
      setError("Preencha UF, cidade e pelo menos 3 caracteres do logradouro.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "cep") {
        const address = await cep(cepValue.replace(/\D/g, ""), {
          providers: ["brasilapi", "viacep", "widenet"],
        });
        setResults([address]);
        void loadCoordinates(address);
      } else {
        const streetValue = street.trim();
        const streetQueries = [streetValue, withoutHouseNumber(streetValue)].filter(
          (query, index, queries) => query.length >= 3 && queries.indexOf(query) === index,
        );
        let addresses: Address[] = [];

        for (const streetQuery of streetQueries) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=br&q=${encodeURIComponent(`${streetQuery}, ${city.trim()}, ${state}, Brasil`)}`,
            );
            if (!response.ok) continue;
            const data = (await response.json()) as Array<{
              lat?: string;
              lon?: string;
              address?: {
                postcode?: string;
                state?: string;
                state_code?: string;
                city?: string;
                town?: string;
                village?: string;
                municipality?: string;
                road?: string;
                suburb?: string;
                neighbourhood?: string;
              };
            }>;
            addresses = data
              .map((item) => {
                const details = item.address;
                const postcode = details?.postcode?.replace(/\D/g, "") ?? "";
                return {
                  cep: postcode.length === 8 ? formatCep(postcode) : "",
                  state: details?.state_code?.toUpperCase() ?? state,
                  city: details?.city ?? details?.town ?? details?.village ?? details?.municipality ?? city,
                  street: details?.road ?? streetValue,
                  neighborhood: details?.suburb ?? details?.neighbourhood ?? "",
                    coordinates: Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon))
                      ? { latitude: Number(item.lat), longitude: Number(item.lon) }
                      : undefined,
                };
              })
              .filter((address) => address.cep);
            if (addresses.length) break;
          } catch {
          }
        }

        if (!addresses.length) {
          let data: Array<{
            cep?: string;
            uf?: string;
            localidade?: string;
            logradouro?: string;
            bairro?: string;
            erro?: boolean;
          }> = [];
          for (const streetQuery of streetQueries) {
            const response = await fetch(
              `https://viacep.com.br/ws/${state}/${encodeURIComponent(city.trim())}/${encodeURIComponent(streetQuery)}/json/`,
            );
            if (!response.ok) continue;
            data = (await response.json()) as typeof data;
            if (data.some((item) => !item.erro && item.cep)) break;
          }
          addresses = data
            .filter((item) => !item.erro && item.cep)
            .map((item) => ({
              cep: item.cep ?? "",
              state: item.uf ?? state,
              city: item.localidade ?? city,
              street: item.logradouro ?? street,
              neighborhood: item.bairro ?? "",
            }));
        }
        if (!addresses.length) throw new Error("Nenhum CEP encontrado para esse endereço.");
        setResults(addresses.slice(0, 8));
        void loadCoordinates(addresses[0]);
      }
    } catch (searchError) {
      setError(readableError(searchError));
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setResults([]);
    setError("");
    setCoordinates(null);
    setMapError("");
  };

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Navegação principal">
        <Link className="brand" href="/" aria-label="ConsulCEP início">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>Consul<span>CEP</span></span>
        </Link>
        <div className="nav-actions"><span className="nav-note">Ferramentas postais</span><div className="route-links"><Link className="nav-link active-route" href="/">Consultar CEP</Link><Link className="nav-link" href="/distancia">Distância</Link><Link className="nav-link" href="/prazo">Prazo</Link><Link className="nav-link" href="/frete">Frete</Link></div></div>
      </nav>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Encontre o endereço certo</p>
          <h1 id="page-title">Seu endereço,<br /><em>sem rodeios.</em></h1>
          <p className="hero-description">Consulte um CEP em segundos ou descubra o CEP a partir de um endereço. Simples, direto e atualizado.</p>
          <div className="trust-line"><span className="status-dot" /> Consulta em tempo real</div>
        </div>

        <div className="search-panel">
          <div className="mode-switch" role="tablist" aria-label="Tipo de consulta">
            <button className={mode === "cep" ? "mode-button active" : "mode-button"} onClick={() => { setMode("cep"); resetSearch(); }} role="tab" aria-selected={mode === "cep"} type="button">Por CEP</button>
            <button className={mode === "address" ? "mode-button active" : "mode-button"} onClick={() => { setMode("address"); resetSearch(); }} role="tab" aria-selected={mode === "address"} type="button">Por endereço</button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "cep" ? (
              <label className="field-label" htmlFor="cep">CEP
                <input id="cep" className="main-input" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cepValue} onChange={(event) => setCepValue(formatCep(event.target.value))} />
              </label>
            ) : (
              <div className="address-fields">
                <label className="field-label uf-field" htmlFor="state">UF
                  <select id="state" value={state} onChange={(event) => setState(event.target.value)}>
                    <option value="">--</option>
                    {"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ").map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </label>
                <label className="field-label" htmlFor="city">Cidade
                  <input id="city" autoComplete="address-level2" placeholder="São Paulo" value={city} onChange={(event) => setCity(event.target.value)} />
                </label>
                <label className="field-label full-field" htmlFor="street">Logradouro
                  <input id="street" autoComplete="street-address" placeholder="Rua, avenida ou praça" value={street} onChange={(event) => setStreet(event.target.value)} />
                </label>
              </div>
            )}
            <button className="submit-button" type="submit" disabled={loading}>{loading ? "Consultando..." : "Consultar"}<span aria-hidden="true">→</span></button>
          </form>
          {error && <p className="error-message" role="alert">{error}</p>}
          <p className="panel-hint">Dados fornecidos por serviços públicos de localização.</p>
        </div>
      </section>

      {results.length > 0 ? (
        <section className="results-section" aria-live="polite">
          <div className="section-heading"><div><p className="eyebrow">Resultado da consulta</p><h2>{results.length > 1 ? `${results.length} endereços encontrados` : "Endereço localizado"}</h2></div><button className="clear-button" onClick={resetSearch} type="button">Limpar busca</button></div>
          <div className="result-grid">
            {results.map((address, index) => <article className="result-card" key={`${address.cep}-${index}`}><div className="result-top"><span className="result-index">{String(index + 1).padStart(2, "0")}</span><strong>{address.cep}</strong></div><p className="result-street">{address.street || "Logradouro não informado"}</p><p className="result-meta">{address.neighborhood || "Bairro não informado"}<span>·</span>{address.city} / {address.state}</p></article>)}
          </div>
        </section>
      ) : (
        <section className="feature-strip" aria-label="Recursos do ConsulCEP"><div><span className="feature-number">01</span><strong>Rápido</strong><p>Resultado em poucos instantes.</p></div><div><span className="feature-number">02</span><strong>Dois caminhos</strong><p>CEP ou endereço, você escolhe.</p></div><div><span className="feature-number">03</span><strong>Sem cadastro</strong><p>Use quando precisar, sem barreiras.</p></div></section>
      )}

      {results.length > 0 && (
        <section className="location-section" aria-labelledby="location-title">
          <div className="location-heading">
            <div><p className="eyebrow">Localização</p><h2 id="location-title">Veja a região no mapa</h2></div>
            <span className="location-note">Área aproximada do CEP</span>
          </div>
          <div className="map-frame">
            {mapLoading && <div className="map-state">Localizando endereço...</div>}
            {!mapLoading && coordinates && <iframe title="Mapa da localização consultada" src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.012}%2C${coordinates.latitude - 0.008}%2C${coordinates.longitude + 0.012}%2C${coordinates.latitude + 0.008}&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`} />}
            {!mapLoading && !coordinates && <div className="map-state">{mapError || "O mapa aparecerá após a consulta."}</div>}
          </div>
          {coordinates && <a className="map-link" href={`https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=16/${coordinates.latitude}/${coordinates.longitude}`} target="_blank" rel="noreferrer">Abrir mapa maior <span aria-hidden="true">→</span></a>}
        </section>
      )}

      <footer className="footer"><span>ConsulCEP © 2026</span><span>Feito para facilitar a vida.</span></footer>
    </main>
  );
}
