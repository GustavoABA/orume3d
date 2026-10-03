# Backend Orume (Google Apps Script)

Fonte operacional: `Orume_Controle_Operacional`

Spreadsheet ID: `1IGZ0KY2J5E87qdl4Gza3w0v_Tz_vsESCH9EHMGZtPoI`

## Arquivos versionados

- `Code.gs` — backend Web App principal (`doGet`, `doPost`, catálogo, checkout e `/admin`).
- `Orume_Operational_Sync_v3.gs` — sincronização de checkouts, pedidos e clientes.
- `Orume_ERP_v4.gs` — ERP da planilha, formulários, estoque, CRM e rotinas operacionais.

## Implantação atual

- Versão implantada: **4**
- Atualizada em: **03/10/2026 09:44**
- Deployment ID: `AKfycby7AHQGEB3LQ7WNA8X5Nu5IpfIu-B1fxsyWpE_aS8JNDK1TDEoPQD-pU--kfOmki_-Opg`
- Web App: `https://script.google.com/macros/s/AKfycby7AHQGEB3LQ7WNA8X5Nu5IpfIu-B1fxsyWpE_aS8JNDK1TDEoPQD-pU--kfOmki_-Opg/exec`

> O Deployment ID é público por natureza. Senhas e `ADMIN_KEY` continuam fora do GitHub, somente em Script Properties.

## Backend web atual

O arquivo canônico do Web App é `Code.gs`.

A rotina de produtos usa duas operações explícitas:

- `mode=create` → gera o próximo ID e **sempre adiciona uma nova linha**;
- `mode=update` → altera somente a linha que já possui aquele `ID Produto`; se o ID não existir, retorna erro em vez de sobrescrever outro produto.

O Web App é responsável por:

- formulário público de orçamento;
- IDs visuais de pedido entre **0000 e 1000**;
- UID interno estável;
- catálogo público;
- `/admin`;
- CRUD de produtos;
- checkout;
- scraping público da Shopee quando a página permite.

A chave administrativa deve continuar somente em **Script Properties**.

## Sincronização operacional v3

Arquivo:

`Orume_Operational_Sync_v3.gs`

Este arquivo é um **módulo complementar**. Ele não declara `doGet` nem `doPost`, portanto deve ser adicionado ao projeto Apps Script ORUME sem remover o backend web que já está funcionando.

Ele mantém as abas operacionais sincronizadas:

- `Checkouts` → `Pedidos`;
- carrinho → `Itens do Pedido`;
- `Pedidos` → `Clientes`;
- recalcula quantidade de pedidos e total comprado por cliente;
- normaliza WhatsApp para evitar duplicidade;
- vincula `ID Pedido` e `UID Pedido` de volta ao checkout;
- registra falhas em `Logs`;
- continua respeitando a faixa de IDs 0000–1000 e arquivamento em `Histórico`.

### Instalação

1. Abra o projeto Apps Script **ORUME** que já atende o endpoint do site.
2. Crie um novo arquivo de script chamado `Orume_Operational_Sync_v3.gs`.
3. Copie o conteúdo do arquivo de mesmo nome deste repositório.
4. Salve.
5. No seletor de funções do Apps Script, escolha `orusInstallSync_`.
6. Clique em **Executar** e autorize o acesso solicitado.
7. A função já executa a primeira sincronização e cria um gatilho para repetir a sincronização **a cada 1 minuto**.

Não é necessário alterar a URL `/exec` do site para esse módulo.

### Funções úteis

- `orusInstallSync_()` — instala/reinstala o gatilho e sincroniza imediatamente.
- `orusSyncNow_()` — força uma sincronização imediata.
- `orusUninstallSync_()` — remove apenas o gatilho deste módulo.

### Regra de duplicidade

- checkout é identificado por `ID Checkout`, gravado em `Pedidos > ID Site`;
- cliente é identificado pelo WhatsApp normalizado;
- um checkout já convertido não cria outro pedido em execuções futuras.

## /admin

O frontend público contém somente a tela. A chave é digitada pelo administrador e mantida em `sessionStorage` durante a sessão.

Por ser GitHub Pages falando com Apps Script, as leituras administrativas usam JSONP. Para segurança mais forte no futuro, migre o admin para autenticação Google/OAuth ou backend com sessão HTTP real.

## Comunicação do site com a planilha

O frontend carrega a URL pública de `public/intake-config.json`. As leituras do catálogo usam `action=catalog` e JSONP. Orçamentos, checkouts e gravações do admin usam POST com JSON no corpo e `Content-Type: text/plain;charset=utf-8`, compatível com `parsePayload_` do backend atual. Esse tipo de conteúdo evita preflight OPTIONS; o navegador acompanha o redirecionamento do Content Service e lê o JSON retornado.

O site só apresenta sucesso quando o backend responde `ok: true`. Erros de validação e de chave administrativa aparecem para o usuário. Erros de rede têm resultado indeterminado: a gravação pode ter ocorrido, portanto não há reenvio automático. Na mesma tela, uma nova tentativa de orçamento/checkout com os mesmos dados reutiliza o identificador, aproveitando a deduplicação já existente no backend. Recarregar a página encerra essa retenção em memória.

Essa correção do frontend não exige nova implantação do Apps Script. Alterar arquivos `.gs` no GitHub, porém, não atualiza automaticamente o Web App: para mudanças futuras no backend, atualize o projeto Google e publique uma nova versão da implantação existente. Nunca adicione simultaneamente `Code.gs` e `../Orume_Backend_Atual.gs` ao projeto: são cópias do mesmo backend.

Validação local: `npm test` e `npm run build`. O teste no navegador com a implantação atual confirmou leitura do catálogo e recebimento de um erro de validação de um orçamento sem ID (sem criar pedido). Uma gravação válida completa e as operações autenticadas do admin precisam ser verificadas com dados de teste controlados.

Referência: https://developers.google.com/apps-script/guides/content
