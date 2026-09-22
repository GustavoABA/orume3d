import type { Metadata } from "next";
import styles from "./termos.module.css";

export const metadata: Metadata = {
  title: "Termos da encomenda",
  description: "Condições gerais aplicáveis às encomendas da Orume 3D.",
};

const WHATSAPP_URL =
  "https://wa.me/5519989342212?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Orume%203D%20e%20quero%20fazer%20um%20or%C3%A7amento.";

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="../" className={styles.brand} aria-label="Voltar para Orume 3D">
          <img src="../orume-logo-mark.webp" alt="" aria-hidden="true" width="42" height="42" />
          <span>ORUME <b>3D</b></span>
        </a>
        <a href="../">Voltar ao site</a>
      </header>

      <article className={styles.document}>
        <p className={styles.version}>Versão 1 — 11 de agosto de 2026</p>
        <h1>Contrato geral de encomenda e produção 3D</h1>
        <p className={styles.lead}>
          Estas são as condições gerais aplicáveis às encomendas da Orume 3D.
          O resumo individual enviado pelo WhatsApp complementa este documento com as características específicas do pedido.
        </p>

        <div className={styles.parties}>
          <p><strong>Fornecedor</strong> Orume 3D, empresa de impressão 3D situada em Santa Cruz da Conceição/SP. Os dados cadastrais completos são informados no resumo individual antes do fechamento.</p>
          <p><strong>Cliente</strong> Pessoa identificada no atendimento e no resumo do pedido confirmado pelo WhatsApp.</p>
        </div>

        <section><h2>1. Objeto e resumo do pedido</h2><p>A Orume produzirá as peças descritas no resumo enviado ao cliente. O resumo deverá indicar, conforme o projeto, modelo ou referência, dimensões, material, cor, acabamento, quantidade, valor, forma de pagamento, prazo estimado, entrega e frete.</p></section>
        <section><h2>2. Orçamento e correção de informações</h2><p>Os orçamentos são elaborados e fechados pelo WhatsApp oficial da Orume 3D. Antes da confirmação, o cliente poderá revisar e corrigir informações, medidas, quantidades, endereço e demais dados. O orçamento será válido pelo prazo informado na própria mensagem.</p></section>
        <section><h2>3. Formação do contrato</h2><p>A contratação ocorre após a confirmação escrita do resumo do pedido e o cumprimento da condição de pagamento combinada. A Orume manterá estes termos disponíveis para consulta e reprodução.</p></section>
        <section><h2>4. Aprovação, características e tolerâncias</h2><p>Quando houver desenho, modelo ou prévia digital, a produção dependerá da aprovação do cliente. Impressões 3D podem apresentar linhas de camada e pequenas variações próprias do processo e do material, desde que não prejudiquem o uso, a segurança ou as características prometidas.</p></section>
        <section><h2>5. Pagamento</h2><p>Valor, entrada, saldo, forma e datas de pagamento constarão no resumo individual. A produção começa somente depois do cumprimento da condição inicial combinada. Nenhuma cobrança diferente do orçamento poderá ser aplicada sem informação e concordância prévia.</p></section>
        <section><h2>6. Produção, prazo e alterações</h2><p>O prazo começa após confirmação do pedido, pagamento acordado e aprovação de arquivos ou medidas, quando necessária. Mudanças posteriores podem exigir novo orçamento e novo prazo, informados antes da continuidade.</p></section>
        <section><h2>7. Entrega e recebimento</h2><p>Retirada, transportadora, endereço, frete e prazo estimado serão definidos no resumo. Em caso de avaria aparente, fotos da embalagem e da peça ajudam a agilizar o atendimento, sem limitar direitos legais.</p></section>
        <section><h2>8. Cancelamento e direito de arrependimento</h2><p>Nas contratações realizadas fora do estabelecimento comercial, inclusive pelo WhatsApp, aplicam-se as regras legais de arrependimento do consumidor. Nenhuma disposição destes termos reduz direitos obrigatórios previstos na legislação.</p></section>
        <section><h2>9. Qualidade e garantia legal</h2><p>A garantia legal e os prazos para reclamação seguem o Código de Defesa do Consumidor, inclusive as regras aplicáveis a vícios aparentes e ocultos.</p></section>
        <section><h2>10. Uso e conservação</h2><p>Limites de temperatura, carga, contato com água, alimentos, produtos químicos ou uso externo serão informados quando relevantes ao material escolhido.</p></section>
        <section><h2>11. Arquivos, marcas e direitos de terceiros</h2><p>Ao enviar arquivos, logotipos, personagens ou modelos, o cliente declara possuir autorização para utilizá-los. A Orume poderá recusar projetos ilícitos, perigosos ou com risco evidente de violação de direitos de terceiros.</p></section>
        <section><h2>12. Dados pessoais e registros</h2><p>Os dados do atendimento serão utilizados para orçamento, produção, comunicação, pagamento, entrega e cumprimento de obrigações legais. Mensagens, aprovações e comprovantes poderão ser mantidos como registro da contratação.</p></section>
        <section><h2>13. Atendimento e solução de dúvidas</h2><p>Dúvidas, alterações, reclamações e pedidos de cancelamento devem ser enviados ao WhatsApp oficial da Orume. Aplicam-se a legislação brasileira e o foro competente definido em lei.</p></section>

        <div className={styles.references}>
          <strong>Referências legais</strong>
          <a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" target="_blank" rel="noreferrer">Código de Defesa do Consumidor ↗</a>
          <a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm" target="_blank" rel="noreferrer">Decreto do Comércio Eletrônico ↗</a>
        </div>

        <div className={styles.actions}>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Falar com a Orume no WhatsApp ↗</a>
          <span>Para salvar uma cópia, use a opção “Imprimir” do navegador e escolha PDF.</span>
        </div>
      </article>
    </main>
  );
}
