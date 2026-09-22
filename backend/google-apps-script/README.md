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

- `WHATSAPP_MESSAGES_URL`: URL completa do endpoint de mensagens da sua conta WhatsApp Business Cloud API.
- `WHATSAPP_TOKEN`: token da API.
- `WHATSAPP_TO`: seu número de destino no formato aceito pela conta da API.

O registro na planilha funciona sem essas três propriedades; apenas a notificação interna fica desativada.
