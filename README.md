# ConsulCEP

ConsulCEP é uma aplicação web estática para consultar endereços brasileiros, comparar distâncias entre CEPs e estimar prazos e custos de envio.

Deploy na Vercel: https://consulcep-sigma.vercel.app/

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

O build usa o fluxo padrão do Next.js e gera a aplicação na pasta `.next/`.

## Deploy na Vercel

1. Envie o repositório para o GitHub.
2. Na Vercel, selecione **Add New Project** e importe o repositório.
3. Mantenha o framework como **Next.js**, deixe **Output Directory** vazio e confirme o deploy.

O projeto usa a configuração padrão da Vercel para Next.js, com build em `.next/`, e não exige variáveis de ambiente.

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
