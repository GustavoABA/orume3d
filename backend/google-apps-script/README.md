# Backend Orume v2 (Google Apps Script)

Fonte operacional: `Orume_Controle_Operacional_v2`

Spreadsheet ID: `1IGZ0KY2J5E87qdl4Gza3w0v_Tz_vsESCH9EHMGZtPoI`

## O que o backend v2 faz

- recebe o formulário público de orçamento;
- usa IDs visuais de pedido entre **0000 e 1000**;
- quando todos os IDs estiverem ocupados, arquiva em `Histórico` o pedido concluído/cancelado mais antigo e reutiliza o ID;
- mantém um **UID interno estável** para não confundir pedidos quando o ID visual for reciclado;
- alimenta a aba `Administração`;
- permite salvar/concluir pedidos pela planilha;
- fornece catálogo público para o site;
- fornece CRUD administrativo de produtos para `/admin`;
- tenta scraping público de páginas Shopee via JSON-LD/OpenGraph;
- se houver CAPTCHA, 403, 429 ou ausência de dados, retorna falha e mantém edição manual;
- não tenta contornar sistemas anti-bot.

## Instalação

O arquivo completo pronto para colar é `Orume_Backend_v2.gs` gerado junto da implementação.

1. Abra o projeto Apps Script usado pela Orume.
2. Substitua o código antigo pelo backend v2.
3. Salve.
4. Execute `configureAdminKey_` ou, ao abrir a planilha, use **Orume → Configurar chave do /admin**.
5. Implante uma **nova versão** do Web App mantendo a mesma URL `/exec`.

A chave administrativa deve existir somente em **Script Properties**. Nunca grave a chave no GitHub, em `intake-config.json` ou na própria planilha.

## /admin

O frontend público contém somente a tela. A chave é digitada pelo administrador e mantida em `sessionStorage` durante a sessão.

Observação: por ser GitHub Pages falando com Apps Script, as leituras administrativas usam JSONP. A chave viaja na requisição ao Apps Script; para segurança mais forte no futuro, migre o admin para autenticação Google/OAuth ou um backend com sessão HTTP real.
