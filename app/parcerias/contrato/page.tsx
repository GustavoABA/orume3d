import type { Metadata } from "next";
import styles from "../../termos/termos.module.css";

export const metadata: Metadata = {
  title: "Contrato de parceria ORU-PAR-001",
  description: "Documento-base de parceria da Orume 3D para criação e comercialização de produtos personalizados.",
};

const clauses = [
  ["1. OBJETO DA PARCERIA", "A ORUME e o CRIADOR poderão desenvolver em conjunto produtos físicos inspirados no personagem, identidade visual, mascote, logotipo ou outros elementos previamente aprovados pelo CRIADOR. Podem integrar a parceria chaveiros, símbolos, placas e itens decorativos; figuras, miniaturas e peças de coleção; suportes, acessórios e produtos impressos em 3D; e outros produtos descritos em Anexo de Produto assinado ou aprovado pelas partes."],
  ["2. PROPRIEDADE INTELECTUAL E TITULARIDADE", "O personagem, nome artístico, identidade, logotipo, ilustrações, modelos e demais elementos pertencentes ao CRIADOR ou a terceiros continuam sendo propriedade de seus respectivos titulares. Este contrato não transfere à ORUME a propriedade intelectual desses elementos. Durante a vigência e exclusivamente para os produtos aprovados, o CRIADOR autoriza a ORUME a utilizar os materiais necessários para desenvolvimento, fabricação, fotografia, divulgação, oferta, venda e envio dos produtos da parceria."],
  ["3. AUTORIZAÇÃO PARA MERCHANDISING", "O CRIADOR declara possuir autorização suficiente para permitir o uso comercial dos materiais fornecidos à ORUME. Caso uma arte, modelo, fonte, logotipo ou outro elemento tenha sido criado por terceiro, caberá ao CRIADOR confirmar se os direitos contratados permitem merchandising e reprodução comercial. Restrições conhecidas de uso deverão ser informadas à ORUME antes do início da produção."],
  ["4. USO DE INTELIGÊNCIA ARTIFICIAL", "A ORUME poderá utilizar ferramentas de inteligência artificial ou geração assistida por IA no desenvolvimento somente quando o CRIADOR tiver ciência e autorizar esse uso para o produto específico. A autorização não é geral nem permanente: cada produto deverá registrar, no respectivo Anexo de Produto, se o uso de IA está autorizado e, quando relevante, quais ferramentas ou etapas do processo serão assistidas por IA. Entre os usos possíveis estão geração ou apoio à criação de modelos 3D, reconstrução de formas a partir de imagens, criação de bases ou protótipos, otimização, retopologia ou adaptação técnica de arquivos e outros usos expressamente informados ao CRIADOR."],
  ["5. APROVAÇÃO DO PRODUTO", "Antes da venda pública, a ORUME apresentará ao CRIADOR render, fotografia, protótipo ou outra visualização suficientemente clara do produto. A comercialização somente ocorrerá após aprovação do CRIADOR. A aprovação poderá ser registrada por assinatura do Anexo de Produto ou por mensagem escrita em canal que permita comprovar a manifestação de vontade. Alterações significativas de design após a aprovação exigirão nova validação."],
  ["6. PRODUÇÃO E QUALIDADE", "A ORUME será responsável pela fabricação dos produtos acordados. O CRIADOR reconhece que processos de impressão 3D podem apresentar pequenas variações naturais de textura, linha de camada, tonalidade ou acabamento, desde que tais variações não prejudiquem substancialmente a aparência, a função ou a qualidade do produto aprovado. Unidades claramente defeituosas não deverão ser comercializadas como unidades regulares."],
  ["7. MODELO DE VENDA", "O modelo comercial de cada produto será definido no Anexo de Produto, podendo ser pré-venda, fabricação sob demanda, estoque previamente produzido ou outro formato acordado entre as partes."],
  ["8. PREÇO, RECEITA E PARTICIPAÇÃO DO CRIADOR", "O preço de venda, a forma de remuneração do CRIADOR e a base de cálculo serão definidos individualmente no Anexo de Produto. Salvo ajuste diferente por escrito, valores de frete pagos pelo comprador, estornos, cancelamentos e devoluções não integrarão a base da participação do CRIADOR. Tributos, taxas de plataforma ou meios de pagamento deverão ser tratados no Anexo quando influenciarem o cálculo."],
  ["9. RELATÓRIO E PAGAMENTO", "A ORUME fornecerá ao CRIADOR relatório de vendas contendo, no mínimo, quantidade vendida, cancelamentos ou devoluções relevantes, base utilizada no cálculo e valor devido ao CRIADOR. Periodicidade, meio de pagamento e eventual valor mínimo para repasse serão definidos no Anexo de Produto."],
  ["10. CUSTOS DE DESENVOLVIMENTO E PROTÓTIPO", "Os custos de modelagem, prototipagem, materiais, acabamento ou outras despesas extraordinárias serão definidos antes da execução e registrados no Anexo de Produto. Nenhuma parte poderá cobrar da outra custo não previamente aprovado."],
  ["11. DIVULGAÇÃO E USO DO NOME ARTÍSTICO", "O CRIADOR não garante número mínimo de vendas. As ações de divulgação serão combinadas entre as partes. Durante a vigência da parceria e para produtos aprovados, a ORUME poderá identificar a coleção como colaboração oficial, por exemplo: ORUME 3D x [Nome do Criador]. A identidade do CRIADOR não poderá ser utilizada para insinuar apoio a produtos, empresas, campanhas ou causas não autorizadas."],
  ["12. EXCLUSIVIDADE", "A parceria é não exclusiva, salvo acordo específico por escrito. O CRIADOR poderá trabalhar com outros fabricantes e a ORUME poderá trabalhar com outros criadores."],
  ["13. CONFIDENCIALIDADE DE MATERIAIS NÃO PUBLICADOS", "Arquivos, artes, modelos, conceitos, lançamentos e informações ainda não públicos que sejam enviados para desenvolvimento deverão ser tratados de forma confidencial até autorização de divulgação ou lançamento público pelo CRIADOR."],
  ["14. ENCERRAMENTO DA PARCERIA", "Qualquer parte poderá solicitar o encerramento da parceria por comunicação escrita. Após o encerramento, novos produtos não poderão ser fabricados utilizando a identidade do CRIADOR, salvo acordo específico para conclusão de pedidos já pagos. Pedidos já confirmados poderão ser concluídos e enviados. Valores devidos por vendas anteriores permanecerão exigíveis. O destino de eventual estoque remanescente será definido por escrito entre as partes."],
  ["15. RESPONSABILIDADE POR CONTEÚDO FORNECIDO", "Cada parte responde pelas informações, arquivos e declarações que fornecer. Caso surja alegação de terceiro sobre direitos de uma arte, modelo ou elemento usado no produto, as partes se comprometem a cooperar na análise e, quando prudente, suspender novas vendas até esclarecimento."],
  ["16. ALTERAÇÕES E ANEXOS", "Alterações relevantes deste contrato deverão ser registradas por escrito. Cada produto ou coleção poderá ser documentado por Anexo de Produto próprio, que integrará este contrato quando aprovado pelas partes."],
  ["17. ASSINATURA ELETRÔNICA", "As partes poderão assinar este instrumento fisicamente ou por meio eletrônico. Quando utilizada assinatura eletrônica, as partes concordam em preservar o arquivo final assinado e os registros de autenticação disponibilizados pela ferramenta escolhida. A utilização de plataforma de assinatura não altera as obrigações previstas neste contrato."],
  ["18. VIGÊNCIA E FORO", "Este contrato entra em vigor na data da última assinatura e permanecerá válido até seu encerramento, observadas as obrigações que, por sua natureza, devam permanecer após o término. Para controvérsias que não possam ser solucionadas amigavelmente, as partes poderão indicar o foro competente abaixo, observadas as regras legais aplicáveis."],
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
        <p className={styles.lead}>Versão web de consulta do documento-base da Orume 3D para colaborações com criadores. A identificação das partes, assinaturas e condições específicas de cada produto ou coleção são completadas no arquivo aprovado/assinado e em seu Anexo A.</p>

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
