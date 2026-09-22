import type { Metadata } from "next";
import styles from "../../termos/termos.module.css";

export const metadata: Metadata = {
  title: "Contrato de parceria ORU-PAR-001",
  description: "Documento-base de parceria da Orume 3D para criação e comercialização de produtos personalizados.",
};

const clauses = [
  ["1. Objeto da parceria", "A ORUME e o CRIADOR poderão desenvolver em conjunto produtos físicos inspirados no personagem, identidade visual, mascote, logotipo ou outros elementos previamente aprovados pelo CRIADOR. Podem ser desenvolvidos chaveiros, símbolos, placas e itens decorativos; figuras, miniaturas e peças de coleção; suportes, acessórios e produtos impressos em 3D; e outros produtos descritos em Anexo de Produto aprovado pelas partes."],
  ["2. Propriedade intelectual e titularidade", "O personagem, nome artístico, identidade, logotipo, ilustrações, modelos e demais elementos pertencentes ao CRIADOR ou a terceiros continuam sendo propriedade de seus respectivos titulares. Este contrato não transfere à ORUME a propriedade intelectual desses elementos. Durante a vigência e exclusivamente para os produtos aprovados, o CRIADOR autoriza a ORUME a utilizar os materiais necessários para desenvolvimento, fabricação, fotografia, divulgação, oferta, venda e envio dos produtos da parceria."],
  ["3. Autorização para merchandising", "O CRIADOR declara possuir autorização suficiente para permitir o uso comercial dos materiais fornecidos à ORUME. Quando uma arte, modelo, fonte, logotipo ou outro elemento tiver sido criado por terceiro, caberá ao CRIADOR confirmar se os direitos contratados permitem merchandising e reprodução comercial. Restrições conhecidas deverão ser informadas antes do início da produção."],
  ["4. Uso de inteligência artificial", "A ORUME poderá utilizar ferramentas de inteligência artificial ou geração assistida por IA no desenvolvimento somente quando o CRIADOR tiver ciência e autorizar esse uso para o produto específico. A autorização não é geral nem permanente: cada produto deve registrar no Anexo de Produto se o uso está autorizado e, quando relevante, quais ferramentas ou etapas serão assistidas por IA."],
  ["5. Aprovação do produto", "Antes da venda pública, a ORUME apresentará ao CRIADOR render, fotografia, protótipo ou outra visualização suficientemente clara. A comercialização somente ocorrerá após aprovação do CRIADOR. Alterações significativas de design após a aprovação exigem nova validação."],
  ["6. Produção e qualidade", "A ORUME será responsável pela fabricação dos produtos acordados. Processos de impressão 3D podem apresentar pequenas variações naturais de textura, linha de camada, tonalidade ou acabamento, desde que não prejudiquem substancialmente a aparência, função ou qualidade do produto aprovado. Unidades claramente defeituosas não devem ser comercializadas como regulares."],
  ["7. Modelo de venda", "O modelo comercial de cada produto será definido no Anexo de Produto e poderá ser pré-venda, fabricação sob demanda, estoque previamente produzido ou outro formato acordado."],
  ["8. Preço, receita e participação do criador", "O preço de venda, a forma de remuneração do CRIADOR e a base de cálculo serão definidos individualmente no Anexo de Produto. Salvo ajuste diferente por escrito, frete pago pelo comprador, estornos, cancelamentos e devoluções não integram a base da participação. Tributos, taxas de plataforma ou meios de pagamento devem ser tratados no Anexo quando influenciarem o cálculo."],
  ["9. Relatório e pagamento", "A ORUME fornecerá ao CRIADOR relatório de vendas contendo, no mínimo, quantidade vendida, cancelamentos ou devoluções relevantes, base utilizada no cálculo e valor devido ao CRIADOR. Periodicidade, meio de pagamento e eventual valor mínimo para repasse serão definidos no Anexo de Produto."],
  ["10. Custos de desenvolvimento e protótipo", "Custos de modelagem, prototipagem, materiais, acabamento ou outras despesas extraordinárias serão definidos antes da execução e registrados no Anexo de Produto. Nenhuma parte poderá cobrar custo não previamente aprovado."],
  ["11. Divulgação e uso do nome artístico", "O CRIADOR não garante número mínimo de vendas. As ações de divulgação serão combinadas. Durante a vigência e para produtos aprovados, a ORUME poderá identificar a coleção como colaboração oficial, por exemplo ORUME 3D x [Nome do Criador]. A identidade do CRIADOR não poderá ser utilizada para insinuar apoio a produtos, empresas, campanhas ou causas não autorizadas."],
  ["12. Exclusividade", "A parceria é não exclusiva, salvo acordo específico por escrito. O CRIADOR poderá trabalhar com outros fabricantes e a ORUME poderá trabalhar com outros criadores."],
  ["13. Confidencialidade", "Arquivos, artes, modelos, conceitos, lançamentos e informações ainda não públicos enviados para desenvolvimento deverão ser tratados de forma confidencial até autorização de divulgação ou lançamento público pelo CRIADOR."],
  ["14. Encerramento da parceria", "Qualquer parte poderá solicitar o encerramento por comunicação escrita. Após o encerramento, novos produtos não poderão ser fabricados utilizando a identidade do CRIADOR, salvo acordo para conclusão de pedidos já pagos. Valores devidos por vendas anteriores permanecem exigíveis e o destino de eventual estoque remanescente será definido por escrito."],
  ["15. Responsabilidade por conteúdo fornecido", "Cada parte responde pelas informações, arquivos e declarações que fornecer. Se surgir alegação de terceiro sobre direitos de uma arte, modelo ou elemento utilizado, as partes cooperarão na análise e, quando prudente, suspenderão novas vendas até esclarecimento."],
  ["16. Alterações e anexos", "Alterações relevantes devem ser registradas por escrito. Cada produto ou coleção poderá ser documentado por Anexo de Produto próprio, que integrará este contrato quando aprovado pelas partes."],
  ["17. Assinatura eletrônica", "As partes poderão assinar o instrumento fisicamente ou por meio eletrônico e concordam em preservar o arquivo final assinado e os registros de autenticação disponibilizados pela ferramenta escolhida."],
  ["18. Vigência e foro", "O contrato entra em vigor na data da última assinatura e permanece válido até seu encerramento, observadas as obrigações que devam sobreviver ao término. Para controvérsias não solucionadas amigavelmente, as partes poderão indicar o foro competente no instrumento, observadas as regras legais aplicáveis."],
];

export default function CreatorContractPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="../../" className={styles.brand} aria-label="Orume 3D">
          <img src="../../orume-logo-mark.webp" alt="" aria-hidden="true" width="42" height="42" />
          <span>ORUME <b>3D</b></span>
        </a>
        <a href="../">Voltar às parcerias</a>
      </header>
      <article className={styles.document}>
        <p className={styles.version}>ORU-PAR-001 • Versão 1.0 • 15/09/2026</p>
        <h1>Contrato de parceria para criação e comercialização de produtos personalizados</h1>
        <p className={styles.lead}>Documento-base da Orume 3D para colaborações com criadores. A identificação das partes e as condições de cada produto ou coleção são completadas no instrumento assinado e em seu Anexo A.</p>

        {clauses.map(([title,text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}

        <section>
          <h2>Anexo A — Ficha de produto / coleção</h2>
          <p>Para cada produto ou coleção devem ser definidos: criador e nome artístico; produto/coleção; personagem/IP; descrição; autorização de IA e ferramenta/etapa; arte-base e confirmação de direitos de merchandising; modelo de venda; preço ao cliente; participação do criador; base de cálculo; periodicidade de repasse; responsabilidade pelo custo de protótipo; lote/quantidade; prazo; acabamento; aprovação do protótipo/render e observações.</p>
        </section>

        <div className={styles.references}>
          <strong>Fluxo digital</strong>
          <a href="../ficha/">Preencher pré-ficha da coleção →</a>
          <span>Para uso recorrente ou valores relevantes, o próprio documento-base recomenda revisão jurídica.</span>
        </div>
        <div className={styles.actions}>
          <a href="../ficha/">Começar uma coleção ↗</a>
          <span>Use “Imprimir” no navegador para gerar uma cópia em PDF desta versão.</span>
        </div>
      </article>
    </main>
  );
}
