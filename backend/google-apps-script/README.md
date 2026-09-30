# Backend Orume (Google Apps Script)

Fonte operacional: `Orume`

Spreadsheet ID: `1794QUx2drPZuuyUpuB8fBowGiUzJ-3L34qa_NwLPp1M`

## Backend web atual

O Web App existente continua responsável por:

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
