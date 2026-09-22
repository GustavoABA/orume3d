import type { Metadata } from "next";
import styles from "../../operational.module.css";

export const metadata: Metadata = {
  title: "Parceria de indicação",
  description: "Cadastro inicial para afiliados, pontos de venda e parceiros de indicação da Orume 3D.",
};

export default function AffiliateFormPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="../../" aria-label="Orume 3D">
          <img src="../../orume-logo-mark.webp" alt="" aria-hidden="true" width="42" height="42" />
          <span>ORUME <b>3D</b></span>
        </a>
        <a className={styles.back} href="../">Voltar às parcerias</a>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>PARCEIROS / AFILIADOS</p>
        <h1>Indique a Orume e acompanhe suas vendas.</h1>
        <p>O cadastro inicial organiza os dados usados na área de parceiros do controle interno: parceiro, origem das vendas, regra de comissão e observações.</p>
      </section>

      <div className={styles.layout}>
        <form className={styles.formCard} id="affiliate-form">
          <h2>Proposta de parceria</h2>
          <p>O envio apenas prepara uma mensagem no WhatsApp. A comissão só passa a valer depois de ser combinada com a Orume.</p>

          <section className={styles.group}>
            <p className={styles.groupTitle}>01 — Identificação</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}><label htmlFor="a-name">Nome *</label><input id="a-name" name="name" required /></div>
              <div className={styles.field}><label htmlFor="a-public">Nome público / empresa</label><input id="a-public" name="publicName" /></div>
              <div className={styles.field}><label htmlFor="a-phone">WhatsApp *</label><input id="a-phone" name="phone" required inputMode="tel" /></div>
              <div className={styles.field}><label htmlFor="a-city">Cidade / UF</label><input id="a-city" name="city" /></div>
            </div>
          </section>

          <section className={styles.group}>
            <p className={styles.groupTitle}>02 — Modelo de parceria</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}>
                <label htmlFor="a-type">Tipo *</label>
                <select id="a-type" name="type" required defaultValue="">
                  <option value="" disabled>Selecione</option>
                  <option>Afiliado / indicação online</option>
                  <option>Criador de conteúdo</option>
                  <option>Ponto de venda físico</option>
                  <option>Loja / empresa</option>
                  <option>Parceiro comercial</option>
                  <option>Outro</option>
                </select>
              </div>
              <div className={styles.field}><label htmlFor="a-profile">Perfil, site ou canal</label><input id="a-profile" name="profile" placeholder="Link principal" /></div>
            </div>
            <div className={styles.field} style={{marginTop: ".8rem"}}><label htmlFor="a-how">Como pretende indicar ou vender? *</label><textarea id="a-how" name="how" required placeholder="Ex.: link próprio, divulgação em lives, exposição física, indicação direta..." /></div>
          </section>

          <section className={styles.group}>
            <p className={styles.groupTitle}>03 — Comercial</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}><label htmlFor="a-volume">Volume ou público aproximado</label><input id="a-volume" name="volume" placeholder="Opcional" /></div>
              <div className={styles.field}><label htmlFor="a-commission">Comissão / modelo imaginado</label><input id="a-commission" name="commission" placeholder="Opcional; será negociado" /></div>
            </div>
            <div className={styles.field} style={{marginTop: ".8rem"}}><label htmlFor="a-notes">Observações</label><textarea id="a-notes" name="notes" /></div>
          </section>

          <div className={styles.checks}>
            <label className={styles.check}>
              <input type="checkbox" name="understood" required />
              <span>Entendo que percentual, base de cálculo e forma de pagamento da comissão precisam ser definidos com a Orume antes das vendas atribuídas à parceria.</span>
            </label>
          </div>

          <button className={styles.submit} type="submit">Enviar proposta pelo WhatsApp ↗</button>
          <p className={styles.status} id="affiliate-status" aria-live="polite" />
        </form>

        <aside className={styles.side}>
          <section className={styles.sideCard}>
            <h2>Como a Orume controla</h2>
            <ol className={styles.steps}>
              <li><span>01</span><div><b>Parceiro cadastrado</b><p>Nome, comissão combinada e observações.</p></div></li>
              <li><span>02</span><div><b>Pedido atribuído</b><p>A origem da venda é registrada no pedido.</p></div></li>
              <li><span>03</span><div><b>Faturamento gerado</b><p>As vendas vinculadas alimentam o total do parceiro.</p></div></li>
              <li><span>04</span><div><b>Comissão</b><p>O controle separa valor gerado, pago e pendente.</p></div></li>
            </ol>
          </section>
          <section className={styles.sideCard}><h2>Link exclusivo</h2><p className={styles.notice}>Quando fizer sentido para a parceria, a Orume pode criar uma página de indicação própria — como a página já utilizada para afiliados — para manter a origem das vendas identificável.</p></section>
        </aside>
      </div>

      <footer className={styles.footer}><span>ORUME 3D • Parceiros</span><a href="../">Programa de parcerias →</a></footer>
    </main>
  );
}
