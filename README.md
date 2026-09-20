# ConsulCEP

ConsulCEP é uma aplicação web estática para consultar endereços brasileiros, comparar distâncias entre CEPs e estimar prazos e custos de envio.

## Funcionalidades

- Consulta de endereço por CEP usando `cep-promise`.
- Busca reversa por UF, cidade e logradouro, incluindo número da residência.
- Visualização da região consultada em um mapa OpenStreetMap.
- Comparação da distância aproximada entre dois CEPs.
- Estimativa de prazo econômico ou expresso.
- Simulação de frete baseada em distância, peso e dimensões do pacote.
- Interface responsiva em português, sem cadastro ou variáveis secretas.

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Consulta por CEP ou endereço |
| `/distancia` | Distância aproximada entre dois CEPs |
| `/prazo` | Estimativa de prazo por distância e tipo de envio |
| `/frete` | Simulação de custo por rota e características do pacote |

## Fontes de dados

- [`cep-promise`](https://www.npmjs.com/package/cep-promise): consulta principal de CEP.
- [BrasilAPI](https://brasilapi.com.br/): coordenadas geográficas e dados de CEP.
- [Nominatim](https://nominatim.org/): busca de endereço e geocodificação.
- [OpenStreetMap](https://www.openstreetmap.org/): mapa incorporado na página de consulta.

As páginas de distância, prazo e frete apresentam estimativas. Elas não representam uma cotação oficial dos Correios ou de outra transportadora e podem variar conforme operação, contrato, adicionais, feriados e regras regionais.

## Desenvolvimento

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

No PowerShell do Windows, use `npm.cmd` caso a política de execução bloqueie `npm`:

```powershell
npm.cmd run dev
```

## Testes e build

Os testes unitários usam Vitest e cobrem formatação de CEP, coordenadas, distância e faixas de prazo.

```bash
npm test
npm run lint
npm run build
```

O build usa `output: "export"` no Next.js e gera o site estático na pasta `out/`, que pode ser publicado em qualquer hospedagem de arquivos estáticos.

## Deploy na Vercel

1. Envie o repositório para o GitHub.
2. Na Vercel, selecione **Add New Project** e importe o repositório.
3. Mantenha o framework como **Next.js** e confirme o deploy.

O arquivo `vercel.json` já configura `npm run build` e a pasta `out/` como saída. Este projeto não exige variáveis de ambiente.

## Estrutura principal

```text
app/
  page.tsx              # Consulta de CEP e endereço
  distancia/page.tsx    # Comparação de distância
  prazo/page.tsx        # Estimativa de prazo
  frete/page.tsx        # Simulação de frete
  lib/                  # Regras compartilhadas
tests/                  # Testes unitários
```
