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
        <p>Este formulário organiza os mesmos dados usados no controle interno de encomendas da Orume. Ao finalizar, o pedido é preparado para registro automático na planilha, sem redirecionar você para o WhatsApp.</p>
      </section>

      <div className={styles.layout}>
        <form className={styles.formCard} id="quote-form">
          <h2>Dados do projeto</h2>
          <p>Os dados servem exclusivamente para orçamento, contato, produção e entrega. O atendimento acontece pelo WhatsApp informado por você.</p>

          <section className={styles.group}>
            <p className={styles.groupTitle}>01 — Contato</p>
            <div className={`${styles.grid} ${styles.two}`}>
              <div className={styles.field}>
                <label htmlFor="q-name">Nome *</label>
                <input id="q-name" name="name" required autoComplete="name" />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-phone">Seu WhatsApp *</label>
                <input id="q-phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="DDD + número" />
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
                <select id="q-qty" name="quantity" required defaultValue="1">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="Outro">Outros</option>
                </select>
              </div>
              <div className={`${styles.field} ${styles.hiddenField}`} id="q-qty-other-wrap">
                <label htmlFor="q-qty-other">Outra quantidade *</label>
                <input id="q-qty-other" name="quantityOther" inputMode="numeric" placeholder="Digite a quantidade" />
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
              <label htmlFor="q-description">Detalhes do projeto</label>
              <textarea id="q-description" name="description" placeholder="Opcional: explique uso, encaixes, acabamento, personalização ou qualquer detalhe importante." />
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

          <section className={styles.group}>
            <p className={styles.groupTitle}>04 — Preferência de atendimento</p>
            <label className={styles.preferenceCheck}>
              <input id="q-clean" name="cleanService" type="checkbox" value="Sim" />
              <span>
                <strong>Prefiro atendimento com o mínimo de interação</strong>
                <small>Atendimento direto, objetivo e somente pelo WhatsApp, limitado ao necessário para concluir o pedido.</small>
              </span>
            </label>
          </section>

          <button className={styles.submit} id="quote-submit" type="submit">Finalizar orçamento</button>
          <p className={styles.status} id="quote-status" aria-live="polite" />

          <iframe className={styles.submissionFrame} id="quote-frame" name="quote-frame" title="Envio do orçamento" />
          
          <dialog className={styles.cleanModal} id="clean-modal">
            <div className={styles.cleanModalInner}>
              <p className={styles.modalEyebrow}>ATENDIMENTO CLEAN</p>
              <h2>Menos conversa. Mesma entrega.</h2>
              <p>
                Ao ativar esta opção, a comunicação será mantida no mínimo necessário e somente pelo WhatsApp:
                confirmação de informações, orçamento, pagamento, produção e entrega.
              </p>
              <p>
                A Orume evitará ao máximo formalidades desnecessárias, saudações repetidas, conversa social,
                tentativa de criar intimidade ou mensagens que não ajudem a concluir o pedido.
              </p>
              <div className={styles.modalFacts}>
                <div><strong>Não muda</strong><span>Preço, prazo, prioridade, qualidade ou condições do produto.</span></div>
                <div><strong>Muda apenas</strong><span>O estilo do atendimento, deixando a conversa mais objetiva e enxuta.</span></div>
              </div>
              <div className={styles.modalActions}>
                <button id="clean-cancel" type="button">Não ativar</button>
                <button id="clean-confirm" type="button">Ativar atendimento clean</button>
              </div>
            </div>
          </dialog>
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
            <p className={styles.notice}>Ao finalizar, os dados informados são destinados ao controle de clientes e encomendas da Orume 3D para orçamento, contato, produção e entrega. A preferência de atendimento clean altera somente a forma de comunicação.</p>
            <a className={styles.linkButton} href="../termos/">Ver termos de encomenda →</a>
          </section>
        </aside>
      </div>

      <footer className={styles.footer}><span>ORUME 3D • Santa Cruz da Conceição — SP</span><a href="../parcerias/">Parcerias →</a></footer>
    </main>
  );
}
