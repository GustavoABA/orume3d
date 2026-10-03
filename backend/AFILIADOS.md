# Afiliados — instalação e uso

## Atualização obrigatória do Apps Script

1. Abra o projeto Apps Script que atende o site e substitua o conteúdo do arquivo principal pelo arquivo completo `backend/Orume_Backend_Atual.gs`. Não adicione uma segunda cópia das mesmas funções. Preserve outros arquivos e propriedades do projeto.
2. Salve. Em **Implantar → Gerenciar implantações**, edite a implantação web existente, selecione **Nova versão** e implante. Mantenha o endereço `/exec` e as configurações atuais de execução e acesso.
3. Atualize `https://orume.com.br/admin`, entre com sua chave atual e abra **Afiliados**. Enquanto a versão antiga estiver ativa, a tela mostra que o Apps Script precisa ser atualizado.
4. Cadastre o nome, um código exclusivo (ex.: `afiliado-linux`), a taxa `20` e marque **Link ativo**. Clique em **Salvar afiliado** e **Copiar link**.

A aba **Afiliados** é criada na planilha ao salvar o primeiro cadastro. Não é necessário criar colunas manualmente. Ela contém Código, Nome, Acréscimo (%), Ativo e Atualizado em. Use `20`, e não `0,20`, para vinte por cento.

## Regras

- Link: `https://orume.com.br/?afiliado=afiliado-linux`.
- R$ 80 + 20% = R$ 96; arredondamento a centavos por unidade. Em produtos em promoção, o acréscimo incide no preço promocional.
- O catálogo, favoritos, produtos vistos, detalhe, carrinho e mensagens usam a mesma taxa. O preço base da aba Produtos não é alterado.
- O último link aberto vale durante a sessão da aba do navegador, inclusive ao atualizar ou ir ao checkout. Para limpar explicitamente: `https://orume.com.br/?afiliado=`. Outra sessão sem link usa os preços normais.
- A taxa não é aceita no endereço nem recuperada do armazenamento local: ela é consultada no Apps Script. Link inexistente, inativo ou não verificável mostra uma mensagem e não libera compras com preço incorreto.
- O checkout confere novamente código, taxa, produto, quantidade e preço na planilha. Se o preço mudou, remova e adicione a peça novamente pelo catálogo atualizado; se a taxa mudou, recarregue a página.
- Links desativados deixam de funcionar em novas visitas e novos envios de checkout/orçamento. Uma página já aberta pode manter a exibição anterior até ser recarregada. O contato direto pelo WhatsApp contém o código e a taxa, e deve ser conferido no atendimento antes do PIX.
- Mensagens preservam `orume` e o prefixo `cod01#445` dos produtos.
- Não há pagamento automático de comissão: o sistema registra o acréscimo para conferência e acerto com o parceiro.

## Registros

- **Checkouts**, colunas W:Y: código, taxa aplicada, valor total do acréscimo. O JSON dos itens contém preço base e preço final. O frete fica fora do acréscimo.
- **Pedidos**, colunas AG:AI: código e taxa; valor do acréscimo fica vazio nos orçamentos sem preço definido. O campo de indicação também recebe o código.
- As colunas são adicionadas no primeiro envio. Se já tiverem conteúdo diferente, o backend interrompe a gravação com uma mensagem, para não sobrescrever seus dados.
- Alterar uma taxa não muda registros já gravados.
- Um clique no WhatsApp não cria sozinho um pedido na planilha; o cadastro de afiliados fica na planilha, e a atribuição de pedido é gravada nos formulários enviados pelo site.

## Validação após implantar

Crie um afiliado, abra seu link em uma janela privada e compare uma peça com o catálogo direto. Confira o preço no detalhe e carrinho. Confira também que o código e `orume` estão na mensagem preparada para o WhatsApp. Um envio real de teste deve ser identificado como teste, pois gera registro na planilha.

Referência do Google para atualizar a versão sem trocar a URL: https://developers.google.com/apps-script/concepts/deployments#edit_a_versioned_deployment
