import type { Metadata } from "next";
import styles from "../operational.module.css";

export const metadata: Metadata = {
  title: "Montar orçamento",
  description: "Envie as informações do seu projeto organizadas para a Orume 3D.",
};

const orderStages = [
  ["01", "Orçamento", "A Orume avalia a ideia, material, prazo, entrega e custos."],
  ["02", "Aguardando aprovação", "Você revisa o resumo do pedido antes de qualquer produção."],
  ["03", "Aguardando pagamento", "A condição inicial combinada libera o pedido para a fila."],
  ["04", "Na fila / Imprimindo", "A peça entra na produção conforme prazo e prioridade combinados."],
  ["05", "Pós-processamento / Pronto", "Acabamento, conferência e preparação para entrega."],
  ["06", "Enviado / Entregue", "Rastreio ou confirmação de entrega encerra o pedido."],
];

export default function BudgetPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="../" aria-label="Voltar para Orume 3D">
          <img src="../orume-logo-mark.webp" alt="" aria-hidden="true" width="42" height="42" />
          <span>ORUME <b>3D</b></span>
        </a>
        <a className={styles.back} href="../">Voltar ao site</a>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>ORÇAMENTO ORGANIZADO</p>
        <h1>Conte o que você precisa.</h1>
        <p>Este formulário organiza os mesmos dados usados no controle interno de encomendas da Orume. Ao enviar, ele abre o WhatsApp com a solicitação pronta para você conferir antes de mandar.</p>
      </section>

      <div className={styles.layout}>
        <form className={styles.formCard} id="quote-form">
          <h2>Dados do projeto</h2>
          <p>Nenhum dado é enviado automaticamente. O botão apenas prepara a mensagem no seu WhatsApp.</p>

          <section className={styles.group}>
            <p className={styles.groupTitle}>01 — Contato</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}>
                <label htmlFor="q-name">Nome *</label>
                <input id="q-name" name="name" required autoComplete="name" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-phone">Seu WhatsApp</label>
                <input id="q-phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="DDD + número" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-city">Cidade / UF *</label>
                <input id="q-city" name="city" required placeholder="Ex.: Leme/SP" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-referral">Indicado por</label>
                <input id="q-referral" name="referral" placeholder="Nome do parceiro, criador ou amigo" />
              </div>
            </div>
          </section>

          <section className={styles.group}>
            <p className={styles.groupTitle}>02 — Peça / produto</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}>
                <label htmlFor="q-product">O que deseja imprimir? *</label>
                <input id="q-product" name="product" required placeholder="Ex.: suporte de headset personalizado" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-qty">Quantidade *</label>
                <input id="q-qty" name="quantity" required inputMode="numeric" placeholder="Ex.: 2" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-size">Medidas aproximadas</label>
                <input id="q-size" name="dimensions" placeholder="Ex.: 18 × 12 × 8 cm" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-color">Cor desejada</label>
                <input id="q-color" name="color" placeholder="Ex.: preto e roxo" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-material">Material</label>
                <select id="q-material" name="material" defaultValue="Avaliar com a Orume">
                  <option>Avaliar com a Orume</option>
                  <option>PLA</option>
                  <option>Outro / não sei</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="q-deadline">Precisa até quando?</label>
                <input id="q-deadline" name="deadline" type="date" />
              </div>
            </div>
            <div className={styles.field} style={{marginTop: ".8rem"}}>
              <label htmlFor="q-links">Links / referências</label>
              <textarea id="q-links" name="links" placeholder="Cole links de MakerWorld, imagens, arquivos ou páginas de referência." />
            </div>
            <div className={styles.field} style={{marginTop: ".8rem"}}>
              <label htmlFor="q-description">Detalhes do projeto *</label>
              <textarea id="q-description" name="description" required placeholder="Explique uso, encaixes, acabamento, personalização e o que não pode faltar." />
            </div>
          </section>

          <section className={styles.group}>
            <p className={styles.groupTitle}>03 — Entrega</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}>
                <label htmlFor="q-delivery">Forma de entrega</label>
                <select id="q-delivery" name="delivery" defaultValue="Quero avaliar as opções">
                  <option>Quero avaliar as opções</option>
                  <option>Retirada</option>
                  <option>Correios</option>
                  <option>Transportadora</option>
                  <option>Entrega local</option>
                  <option>Outro</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="q-cep">CEP para cálculo de envio</label>
                <input id="q-cep" name="cep" inputMode="numeric" autoComplete="postal-code" />
              </div>
            </div>
            <div className={styles.field} style={{marginTop: ".8rem"}}>
              <label htmlFor="q-notes">Observações</label>
              <textarea id="q-notes" name="notes" placeholder="Qualquer informação adicional para o orçamento." />
            </div>
          </section>

          <button className={styles.submit} type="submit">Montar mensagem e abrir WhatsApp ↗</button>
          <p className={styles.status} id="quote-status" aria-live="polite" />
        </form>

        <aside className={styles.side}>
          <section className={styles.sideCard}>
            <h2>Etapas do pedido</h2>
            <p>Os estados abaixo seguem o fluxo usado no controle de encomendas da Orume.</p>
            <ol className={styles.steps}>
              {orderStages.map(([n,t,d]) => <li key={n}><span>{n}</span><div><b>{t}</b><p>{d}</p></div></li>)}
            </ol>
          </section>
          <section className={styles.sideCard}>
            <h2>Privacidade</h2>
            <p className={styles.notice}>O formulário funciona no seu navegador. O site não salva nome, telefone, endereço ou descrição do projeto. Você revisa a mensagem antes de enviá-la pelo WhatsApp.</p>
            <a className={styles.linkButton} href="../termos/">Ver termos de encomenda →</a>
          </section>
        </aside>
      </div>

      <footer className={styles.footer}><span>ORUME 3D • Santa Cruz da Conceição — SP</span><a href="../parcerias/">Parcerias →</a></footer>
    </main>
  );
}
