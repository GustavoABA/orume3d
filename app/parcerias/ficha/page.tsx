import type { Metadata } from "next";
import styles from "../../operational.module.css";

export const metadata: Metadata = {
  title: "Ficha de coleção",
  description: "Pré-ficha para organizar uma coleção ou produto em parceria com a Orume 3D.",
};

export default function PartnerProductFormPage() {
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
        <p className={styles.eyebrow}>ANEXO A — PRÉ-FICHA DIGITAL</p>
        <h1>Organize sua coleção.</h1>
        <p>Esta página segue os campos do Anexo A do documento ORU-PAR-001. Ela serve para estruturar a conversa inicial e não substitui o contrato ou o Anexo A aprovado pelas partes.</p>
      </section>

      <div className={styles.layout}>
        <form className={styles.formCard} id="creator-form">
          <h2>Ficha de produto / coleção</h2>
          <p>Preencha o que já souber. Campos comerciais podem ficar em aberto para negociação com a Orume.</p>

          <section className={styles.group}>
            <p className={styles.groupTitle}>01 — Criador e propriedade intelectual</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}><label htmlFor="c-name">Nome *</label><input id="c-name" name="creatorName" required /></div>
              <div className={styles.field}><label htmlFor="c-artistic">Nome artístico *</label><input id="c-artistic" name="artisticName" required /></div>
              <div className={styles.field}><label htmlFor="c-collection">Produto / coleção *</label><input id="c-collection" name="collection" required /></div>
              <div className={styles.field}><label htmlFor="c-ip">Personagem / IP</label><input id="c-ip" name="ip" /></div>
            </div>
            <div className={styles.field} style={{marginTop: ".8rem"}}><label htmlFor="c-desc">Descrição *</label><textarea id="c-desc" name="description" required placeholder="O que será produzido, público, estilo e objetivo da coleção." /></div>
            <div className={`${styles.grid} ${styles.two}`} style={{marginTop: ".8rem"}}>
              <div className={styles.field}>
                <label htmlFor="c-art">Arte-base / origem</label>
                <input id="c-art" name="artBase" placeholder="Artista, arquivo, link ou origem" />
              </div>
              <div className={styles.field}>
                <label htmlFor="c-rights">Direitos para merchandising *</label>
                <select id="c-rights" name="merchRights" required defaultValue="">
                  <option value="" disabled>Selecione</option>
                  <option>Confirmados pelo criador</option>
                  <option>Não se aplica</option>
                  <option>Ainda preciso confirmar</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.group}>
            <p className={styles.groupTitle}>02 — Processo de criação e IA</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}>
                <label htmlFor="c-ai">Uso de IA no produto *</label>
                <select id="c-ai" name="ai" required defaultValue="">
                  <option value="" disabled>Selecione</option>
                  <option>Autorizado</option>
                  <option>Não autorizado</option>
                  <option>Quero discutir antes</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="c-ai-stage">Ferramenta / etapa</label>
                <input id="c-ai-stage" name="aiStage" placeholder="Ex.: geração de base 3D / retopologia" />
              </div>
            </div>
          </section>

          <section className={styles.group}>
            <p className={styles.groupTitle}>03 — Modelo comercial</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}>
                <label htmlFor="c-sale">Modelo de venda *</label>
                <select id="c-sale" name="saleModel" required defaultValue="">
                  <option value="" disabled>Selecione</option>
                  <option>Pré-venda</option>
                  <option>Sob demanda</option>
                  <option>Estoque</option>
                  <option>Outro / quero definir junto</option>
                </select>
              </div>
              <div className={styles.field}><label htmlFor="c-price">Preço ao cliente desejado</label><input id="c-price" name="price" inputMode="decimal" placeholder="R$" /></div>
              <div className={styles.field}><label htmlFor="c-share">Participação do criador</label><input id="c-share" name="creatorShare" placeholder="Ex.: 20% ou R$ por unidade" /></div>
              <div className={styles.field}><label htmlFor="c-base">Base de cálculo</label><input id="c-base" name="calculationBase" placeholder="Taxas, tributos e deduções a discutir" /></div>
              <div className={styles.field}>
                <label htmlFor="c-payout">Repasse</label>
                <select id="c-payout" name="payout" defaultValue="A definir">
                  <option>A definir</option><option>Mensal</option><option>Final da campanha</option><option>Outro</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="c-prototype">Custo do protótipo</label>
                <select id="c-prototype" name="prototypeCost" defaultValue="A definir">
                  <option>A definir</option><option>Orume</option><option>Criador</option><option>Dividido</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.group}>
            <p className={styles.groupTitle}>04 — Produção e aprovação</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}><label htmlFor="c-lot">Lote / quantidade</label><input id="c-lot" name="lot" placeholder="Ex.: 30 unidades ou sob demanda" /></div>
              <div className={styles.field}><label htmlFor="c-deadline">Prazo desejado</label><input id="c-deadline" name="deadline" /></div>
              <div className={styles.field}><label htmlFor="c-finish">Acabamento</label><input id="c-finish" name="finish" placeholder="Cores, pintura, embalagem..." /></div>
              <div className={styles.field}><label htmlFor="c-preview">Estado do protótipo / render</label><select id="c-preview" name="preview" defaultValue="Ainda não existe"><option>Ainda não existe</option><option>Tenho referência</option><option>Tenho modelo 3D</option><option>Tenho protótipo</option></select></div>
            </div>
            <div className={styles.field} style={{marginTop: ".8rem"}}><label htmlFor="c-notes">Observações</label><textarea id="c-notes" name="notes" /></div>
          </section>

          <button className={styles.submit} type="submit">Montar pré-ficha e abrir WhatsApp ↗</button>
          <p className={styles.status} id="creator-status" aria-live="polite" />
        </form>

        <aside className={styles.side}>
          <section className={styles.sideCard}>
            <h2>O que acontece depois</h2>
            <ol className={styles.steps}>
              <li><span>01</span><div><b>Análise técnica</b><p>Viabilidade, modelagem, material, acabamento e custos.</p></div></li>
              <li><span>02</span><div><b>Render ou protótipo</b><p>A coleção só avança para venda após visualização e aprovação.</p></div></li>
              <li><span>03</span><div><b>Anexo A</b><p>Preço, participação, base de cálculo, repasse e produção são formalizados.</p></div></li>
              <li><span>04</span><div><b>Lançamento</b><p>As vendas e os valores devidos ao criador entram no relatório da parceria.</p></div></li>
            </ol>
            <a className={styles.linkButton} href="../contrato/">Ler contrato ORU-PAR-001 →</a>
          </section>
          <section className={styles.sideCard}><h2>Importante</h2><p className={styles.notice}>Não envie CPF, CNPJ, endereço residencial ou documentos nesta pré-ficha. Dados de identificação completos entram somente na formalização da parceria.</p></section>
        </aside>
      </div>
      <footer className={styles.footer}><span>ORUME 3D • Programa de criadores</span><a href="../">Parcerias →</a></footer>
    </main>
  );
}
