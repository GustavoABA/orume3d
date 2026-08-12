# Orume 3D

Site de prospecção e vendas da Orume 3D, com foco em impressão 3D sob medida e experiência mobile.

A versão atual apresenta os projetos logo após a abertura, a história da empresa em Santa Cruz da Conceição/SP, o fluxo de atendimento pelo WhatsApp e um contrato geral consultável e imprimível dentro do site.

## Feed automático do Instagram

O site consulta a API oficial do Instagram a cada cinco minutos. Quando encontra uma publicação diferente, baixa a imagem original fornecida pela API, atualiza a galeria e aciona uma nova publicação do GitHub Pages. Fotos, capas de Reels/vídeos e capas de carrosséis são aceitas. Os arquivos não são recomprimidos pelo projeto.

Configuração única:

1. Use uma conta profissional (Empresa ou Criador) no perfil `@orume3d`.
2. No painel Meta for Developers, crie ou conecte um aplicativo com a API do Instagram e gere uma credencial que possa ler as mídias da própria conta.
3. No repositório GitHub, abra `Settings > Secrets and variables > Actions`, crie o secret `INSTAGRAM_ACCESS_TOKEN` e cole somente a credencial.
4. Em `Actions`, execute manualmente `Atualizar feed do Instagram` uma vez para validar. Depois disso, a verificação fica agendada.

A credencial nunca é enviada ao navegador nem gravada no repositório. Se a Meta expirar ou invalidar a credencial, ela precisa ser renovada no mesmo secret.

## Feed local de reserva

1. Coloque novas fotos em `public/feed`.
2. Use nomes em ordem, por exemplo: `02-chaveiro-personalizado.jpg`.
3. Envie a alteração para o GitHub.

A publicação encontra as imagens automaticamente e mostra somente as fotos, sem legenda. Não é preciso editar a página. As imagens vindas do Instagram aparecem primeiro e a foto local continua servindo como reserva se a integração ainda não estiver configurada.

Para vincular uma imagem a um post específico do Instagram, inclua o código do post no nome: `02-instagram-CODIGO_DO_POST.jpg`. Imagens com qualquer outro nome levam ao perfil da Orume.

Formatos aceitos: JPG, JPEG, PNG, WEBP, AVIF e GIF.

## Contatos configurados

- Instagram: @orume3d
- TikTok: @orume3d
- WhatsApp: +55 19 98934-2212
