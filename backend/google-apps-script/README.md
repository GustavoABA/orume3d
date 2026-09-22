# Backend do formulário de orçamento — Google Apps Script

Este backend foi preparado para a planilha nativa **Orume_Controle_de_Encomendas_Site**.

## O que ele faz

1. Recebe o formulário público de orçamento.
2. Salva o envio bruto na aba `Pedidos Site`.
3. Procura o telefone em `Clientes` e atualiza ou cria o cliente.
4. Cria uma nova linha em `Encomendas` usando as fórmulas já existentes na planilha.
5. Registra a preferência de atendimento CLEAN nas observações.
6. Opcionalmente envia uma notificação para o WhatsApp da Orume usando a API oficial configurada em Script Properties.

## Ativação

A implantação do Google Apps Script não pode ser publicada pela integração atual do Drive. Para ativar:

1. Abra a planilha `Orume_Controle_de_Encomendas_Site`.
2. Extensões → Apps Script.
3. Substitua o conteúdo de `Code.gs` pelo arquivo deste diretório.
4. Implantar → Nova implantação → Aplicativo da Web.
5. Executar como: você.
6. Quem tem acesso: qualquer pessoa.
7. Copie a URL `.../exec`.
8. Coloque essa URL em `public/intake-config.json` no campo `endpoint`.

## Notificação automática no WhatsApp

Sem a API oficial, um site não pode enviar silenciosamente uma mensagem de WhatsApp em nome da Orume. Para ativar a notificação interna, crie estas Script Properties:

- `WHATSAPP_TOKEN`: token da WhatsApp Business Cloud API.
- `WHATSAPP_PHONE_NUMBER_ID`: Phone Number ID fornecido pela Meta.
- `WHATSAPP_TO`: número que receberá a notificação, no formato aceito pela sua conta.
- `WHATSAPP_API_VERSION`: versão da Graph API habilitada para sua integração, por exemplo `vXX.X`. Consulte a versão atual na documentação/painel da Meta antes de preencher.

Não coloque token no GitHub, no HTML do site ou em `intake-config.json`. Use apenas **Configurações do projeto → Propriedades do script** no Apps Script.

O registro na planilha funciona sem essas propriedades; apenas a notificação interna fica desativada.
