# Orume 3D

[Site](https://orume.com.br/) · [Administração](https://orume.com.br/admin/)

![Publicação](https://github.com/GustavoABA/orume3d/actions/workflows/deploy.yml/badge.svg)

Loja da Orume para peças impressas em 3D e projetos sob encomenda. O catálogo e os registros comerciais ficam em uma planilha Google, acessada pelo Google Apps Script. O front-end é publicado no GitHub Pages.

## Funcionalidades

- Catálogo com busca, categorias, ordenação, favoritos e produtos vistos recentemente.
- No celular, categoria e ordenação ficam diretamente abaixo da busca.
- Galeria de fotos com miniaturas, navegação por teclado e gesto lateral.
- Medidas opcionais de altura, largura e profundidade, em centímetros.
- Carrinho persistente, checkout com confirmação de gravação e continuação pelo WhatsApp.
- Orçamento em duas etapas; informações adicionais são opcionais, mas o CEP é obrigatório.
- Admin com produtos, pedidos e cadastro de afiliados.
- Links de afiliado com acréscimo percentual, aplicado ao catálogo e ao carrinho, e atribuição na planilha.

O frete é combinado no atendimento. O pagamento é por PIX manual: o site não processa pagamentos nem paga comissões automaticamente. Clicar no WhatsApp prepara a mensagem; o visitante ainda precisa enviá-la.

## Desenvolvimento

Use Node.js 20 ou compatível e npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm run dev` inicia o Vite. `npm run build` verifica TypeScript e gera `dist/`. Os testes usam Node Test Runner e simulações de React/Apps Script; não enviam pedidos reais.

## Configuração e backend

O arquivo público `public/intake-config.json` contém o endereço `/exec` da implantação Apps Script. Não coloque chaves administrativas, senhas ou dados privados nesse arquivo.

- Código para implantação: [`backend/Orume_Backend_Atual.gs`](backend/Orume_Backend_Atual.gs).
- Cópia equivalente: [`backend/google-apps-script/Code.gs`](backend/google-apps-script/Code.gs). Mantenha as duas iguais.
- Orientações gerais: [`backend/google-apps-script/README.md`](backend/google-apps-script/README.md).
- Regras dos afiliados: [`backend/AFILIADOS.md`](backend/AFILIADOS.md).

O script define a planilha em `SPREADSHEET_ID`. A administração usa a propriedade `ADMIN_KEY` do Apps Script e guarda a chave informada apenas na sessão do navegador. Nunca envie essa chave ao repositório.

O catálogo é consultado por JSONP. Gravações usam POST `text/plain` e só são consideradas concluídas após uma resposta JSON de sucesso. IDs estáveis permitem repetir uma tentativa após falha de rede sem criar outro registro para a mesma solicitação.

### Produtos e medidas

Cadastre e edite peças em **Admin → Produtos**. As imagens são URLs; os arquivos precisam estar acessíveis ao navegador do cliente. As medidas da peça são opcionais e aceitam até duas casas decimais. Campos vazios não aparecem no anúncio. Ao salvar, o script adiciona as colunas de medidas que faltarem na aba Produtos, sem substituir outras colunas.

### Afiliados

Em **Admin → Afiliados**, crie um código, nome, percentual e estado ativo. Exemplo: `?afiliado=afiliado-linux`, com taxa de 20%, transforma R$ 80 em R$ 96. O último link vale durante a sessão da aba. `?afiliado=` limpa explicitamente a atribuição.

O cadastro fica na aba Afiliados, criada no primeiro salvamento. Checkouts registram código, taxa e valor do acréscimo; orçamentos registram código e taxa. O backend valida novamente os preços dos checkouts afiliados. Detalhes e limitações estão no guia de afiliados.

### WhatsApp: integração obrigatória

Todas as mensagens preparadas pelo site devem conter **`orume` em minúsculas**, usado pelo fluxo de atendimento para cadastrar clientes. Use `src/lib/whatsapp.ts` para gerar links. Preserve também o identificador `cod01#445` nas mensagens de interesse em produto.

## Carregamento do catálogo

- A consulta começa na inicialização da loja, antes de a página inicial terminar de carregar.
- Consultas simultâneas compartilham uma única solicitação, inclusive entre catálogo e favoritos.
- O navegador mantém preços base em memória e localStorage por até cinco minutos. Dentro desse prazo, voltar à loja ou aos favoritos dispensa nova consulta. Dados expirados são buscados novamente; falhas não são guardadas como sucesso.
- Respostas vazias também substituem o cache, evitando ressuscitar um catálogo removido.
- O percentual do afiliado é aplicado separadamente; preços já acrescidos não são guardados no cache do catálogo.
- Busca, categoria e ordenação não têm atraso artificial de carregamento.
- O widget do Instagram só começa a carregar quando sua seção está perto da área visível.

A primeira visita ainda depende da resposta do Google Apps Script e da velocidade dos servidores das imagens. O backend também possui cache público de cinco minutos, invalidado ao salvar produtos pelo admin. Alterações diretas na planilha podem demorar até a expiração dos caches para aparecer.

## Publicação

Ao enviar alterações para `main`, o workflow [Deploy](.github/workflows/deploy.yml) executa `npm ci`, testes, build e publicação no GitHub Pages. Ele prepara as rotas `/admin/`, `/checkout/` e a página de fallback. O domínio é definido em `public/CNAME`.

Alterações somente no front-end não exigem nova implantação do Apps Script. Quando mudar o `.gs`, salve o código no projeto Google e, em **Implantar → Gerenciar implantações → Editar**, publique uma nova versão da implantação existente para manter a URL. O deploy do GitHub não atualiza o Apps Script automaticamente.

## Estrutura

```text
src/pages/                 Home, Wishlist, Checkout e Admin
src/components/            Interface, galeria, filtros e formulários
src/context/               Carrinho, preferências, afiliado e notificações
src/lib/catalog.ts         Cache e solicitação compartilhada do catálogo
src/hooks/useCatalog.ts    Ligação do catálogo com React e preços do afiliado
src/lib/backend.ts         Configuração, JSONP e gravações confirmadas
src/lib/whatsapp.ts        Identificação obrigatória de atendimento
public/                    Configuração pública, marca e imagens
backend/                   Apps Script e instruções
tests/                     Testes automatizados
```

## Licença

MIT. Consulte [LICENSE](LICENSE).
