import type { Metadata } from "next";
import styles from "./parcerias.module.css";

export const metadata: Metadata = {
  title: "Parcerias",
  description: "Programa de parcerias da Orume 3D para criadores de conteúdo e afiliados.",
};

const whatsapp = (message: string) =>
  `https://wa.me/5519989342212?text=${encodeURIComponent(message)}`;

const CREATOR_URL = whatsapp(
  "Olá, Orume 3D! Sou criador(a) de conteúdo e quero conversar sobre uma coleção oficial de produtos personalizados. Gostaria de entender desenvolvimento, aprovação, modelo de venda e participação nas vendas.",
);

const AFFILIATE_URL = whatsapp(
  "Olá, Orume 3D! Quero conversar sobre uma parceria de indicação/afiliado e entender como funciona o rastreamento das vendas e a comissão.",
);

const creatorFlow = [
  ["01", "Conceito", "Personagem, identidade, público e produtos que fazem sentido para a coleção."],
  ["02", "Desenvolvimento", "Viabilidade, modelagem, materiais, acabamento, custos e protótipo ou render."],
  ["03", "Aprovação", "O produto só é colocado à venda depois da validação do criador."],
  ["04", "Comercialização", "Pré-venda, sob demanda, estoque ou outro modelo definido para a coleção."],
  ["05", "Relatório e repasse", "Vendas, base de cálculo e participação são acompanhadas conforme o acordo."],
];

const affiliateFlow = [
  ["01", "Cadastro da parceria", "Nome do parceiro, regra de comissão e observações ficam registrados na operação."],
  ["02", "Link identificado", "A Orume prepara uma página ou origem identificável para separar as indicações."],
  ["03", "Venda atribuída", "Pedidos vinculados ao parceiro entram no controle de faturamento e comissão."],
  ["04", "Comissão", "Percentual, cálculo e pagamento seguem o que foi combinado com cada parceiro."],
];

export default function PartnershipsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="../" className={styles.brand} aria-label="Voltar para Orume 3D">
          <img src="../orume-logo-mark.webp" alt="" aria-hidden="true" width="42" height="42" />
          <span>ORUME <b>3D</b></span>
        </a>
        <a href="../">Voltar ao site</a>
      </header>

      <section className={styles.hero}>
        <p>PARCERIAS ORUME 3D</p>
        <h1>Crie, indique e participe do resultado.</h1>
        <span>
          A operação separa dois modelos: coleções desenvolvidas com criadores e parcerias de indicação.
          Em ambos, as regras comerciais são definidas antes das vendas.
        </span>
      </section>

      <section className={styles.track}>
        <div className={styles.trackIntro}>
          <small>01 — CRIADORES, STREAMERS E VTUBERS</small>
          <h2>Coleções oficiais.</h2>
          <p>
            A identidade continua pertencendo ao criador. A Orume recebe autorização apenas para os
            produtos aprovados e registra produto, preço, custos, modelo comercial e participação antes do lançamento.
          </p>
          <a href="./ficha/">Preencher pré-ficha da coleção ↗</a>
          <a href="./contrato/">Ler contrato ORU-PAR-001 →</a>
          <a href={CREATOR_URL} target="_blank" rel="noreferrer">Falar direto no WhatsApp →</a>
        </div>
        <div className={styles.flow}>
          {creatorFlow.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.track}>
        <div className={styles.trackIntro}>
          <small>02 — AFILIADOS E INDICAÇÕES</small>
          <h2>Indicação rastreável.</h2>
          <p>
            O controle operacional da Orume registra parceiro, pedidos, faturamento gerado,
            comissão gerada, comissão paga e saldo pendente. O percentual não é presumido:
            ele é definido para cada parceria.
          </p>
          <a href={AFFILIATE_URL} target="_blank" rel="noreferrer">Quero ser parceiro ↗</a>
        </div>
        <div className={styles.flow}>
          {affiliateFlow.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.rules}>
        <article><span>Direitos</span><strong>Materiais e identidade permanecem com seus titulares.</strong></article>
        <article><span>Transparência</span><strong>Preço, participação e base de cálculo são definidos antes da venda.</strong></article>
        <article><span>IA</span><strong>Uso no desenvolvimento de uma coleção somente quando informado e autorizado.</strong></article>
        <article><span>Produção</span><strong>Pré-venda, sob demanda ou estoque conforme o produto.</strong></article>
      </section>

      <footer className={styles.footer}>
        <span>ORUME 3D • Santa Cruz da Conceição — SP</span>
        <span><a href="./contrato/">Contrato de parceria</a> • <a href="../termos/">Termos de encomenda</a></span>
      </footer>
    </main>
  );
}
