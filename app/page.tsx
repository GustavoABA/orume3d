"use client";

/* eslint-disable @next/next/no-img-element -- feed images are discovered dynamically at build time */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const WHATSAPP_URL =
  "https://wa.me/5519989342212?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Orume%203D%20e%20quero%20fazer%20um%20or%C3%A7amento.";
const INSTAGRAM_URL = "https://www.instagram.com/orume3d/";
const TIKTOK_URL = "https://www.tiktok.com/@orume3d";
const CDC_URL = "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm";
const ECOMMERCE_URL = "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm";

type FeedItem = {
  src: string;
  title: string;
  href?: string;
};

type InstagramWindow = Window & {
  instgrm?: { Embeds: { process: () => void } };
};

const services = [
  {
    number: "01",
    title: "Peças personalizadas",
    text: "Objetos criados a partir de referências, medidas e necessidades específicas do seu projeto.",
    tag: "Sob medida",
  },
  {
    number: "02",
    title: "Presentes e decoração",
    text: "Peças com identidade para presentear, decorar ambientes e transformar boas ideias em algo físico.",
    tag: "Criação",
  },
  {
    number: "03",
    title: "Protótipos e soluções",
    text: "Modelos e peças funcionais para testar formatos, validar conceitos e resolver problemas reais.",
    tag: "Funcional",
  },
];

const steps = [
  ["01", "Pedido pelo WhatsApp", "Você envia a ideia, referência, medidas e quantidade pelo nosso canal oficial."],
  ["02", "Orçamento completo", "A Orume informa material, acabamento, valor, pagamento, prazo de produção e entrega."],
  ["03", "Confirmação da venda", "O resumo do pedido e estes termos são confirmados antes do pagamento combinado."],
  ["04", "Produção e entrega", "Após a aprovação, a impressão começa e você recebe as atualizações até a entrega."],
];

function SocialLink({
  href,
  label,
  short,
  className = "",
}: {
  href: string;
  label: string;
  short: string;
  className?: string;
}) {
  return (
    <a
      className={`social-link ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Abrir ${label}`}
    >
      <span aria-hidden="true">{short}</span>
      <b>{label}</b>
    </a>
  );
}

export default function Home() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [instagramOpen, setInstagramOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [showFloatingBudget, setShowFloatingBudget] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px" },
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("./feed/feed.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((items: FeedItem[]) => setFeed(items))
      .catch(() => setFeed([]));
  }, []);

  useEffect(() => {
    const updateFloatingBudget = () => {
      const feedSection = document.getElementById("feed");
      if (!feedSection) return;
      setShowFloatingBudget(feedSection.getBoundingClientRect().top <= window.innerHeight * 0.72);
    };

    updateFloatingBudget();
    window.addEventListener("scroll", updateFloatingBudget, { passive: true });
    window.addEventListener("resize", updateFloatingBudget);
    return () => {
      window.removeEventListener("scroll", updateFloatingBudget);
      window.removeEventListener("resize", updateFloatingBudget);
    };
  }, []);

  useEffect(() => {
    const modalOpen = Boolean(selectedItem || instagramOpen || contractOpen || menuOpen);
    document.body.classList.toggle("modal-open", modalOpen);

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedItem(null);
        setInstagramOpen(false);
        setContractOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contractOpen, instagramOpen, menuOpen, selectedItem]);

  useEffect(() => {
    if (!instagramOpen) return;

    const instagramWindow = window as InstagramWindow;
    const processEmbed = () => instagramWindow.instgrm?.Embeds.process();
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]',
    );

    if (existingScript) {
      processEmbed();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = processEmbed;
    document.body.appendChild(script);
  }, [instagramOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <div className="grain" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Orume 3D — início">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>ORUME <b>3D</b></span>
        </a>

        <div className="header-actions">
          <div className="header-socials">
            <SocialLink href={INSTAGRAM_URL} label="Instagram" short="IG" />
            <SocialLink href={TIKTOK_URL} label="TikTok" short="TT" />
          </div>
          <a className="header-budget" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            <span className="status-dot" aria-hidden="true" />
            Orçar agora
          </a>
          <button
            className={menuOpen ? "menu-button is-active" : "menu-button"}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-navigation"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span />
          </button>
        </div>

        <button
          className={menuOpen ? "nav-scrim is-open" : "nav-scrim"}
          type="button"
          aria-label="Fechar menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />

        <nav id="site-navigation" className={menuOpen ? "nav is-open" : "nav"}>
          <div className="nav-label">Navegue pela Orume</div>
          <a href="#feed" onClick={closeMenu}><span>01</span> Projetos recentes</a>
          <a href="#sobre" onClick={closeMenu}><span>02</span> Sobre nós</a>
          <a href="#solucoes" onClick={closeMenu}><span>03</span> O que fazemos</a>
          <a href="#processo" onClick={closeMenu}><span>04</span> Como funciona</a>
          <a href="#contrato" onClick={closeMenu}><span>05</span> Termos da encomenda</a>
          <div className="nav-socials">
            <SocialLink href={INSTAGRAM_URL} label="Instagram" short="IG" />
            <SocialLink href={TIKTOK_URL} label="TikTok" short="TT" />
          </div>
          <a className="nav-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Pedir orçamento no WhatsApp <b aria-hidden="true">↗</b>
          </a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-lines" aria-hidden="true" />
        <div className="hero-layout">
          <div className="hero-content">
            <div className="hero-socials" aria-label="Redes sociais da Orume 3D">
              <SocialLink href={INSTAGRAM_URL} label="Instagram" short="IG" />
              <SocialLink href={TIKTOK_URL} label="TikTok" short="TT" />
            </div>
            <p className="kicker"><span aria-hidden="true" /> Impressão 3D sob medida</p>
            <h1>
              Você imagina.
              <span>A gente imprime.</span>
            </h1>
            <p className="hero-copy">
              Objetos, presentes e soluções que saem da tela e chegam na sua mão — do seu jeito.
            </p>
            <a className="big-budget" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <span><small>Resposta rápida no WhatsApp</small>Quero meu orçamento</span>
              <b aria-hidden="true">↗</b>
            </a>
            <a className="scroll-link" href="#feed">Ver projetos recentes <span aria-hidden="true">↓</span></a>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="print-status"><i /> imprimindo ideia</div>
            <div className="layer-object">
              {Array.from({ length: 11 }).map((_, index) => (
                <i key={index} style={{ "--layer": index } as CSSProperties} />
              ))}
              <b>3D</b>
            </div>
            <div className="visual-note">camada por camada <span>↗</span></div>
          </div>
        </div>
      </section>

      <section className="feed-section" id="feed">
        <div className="feed-heading" data-reveal>
          <div>
            <p className="section-tag">Direto da bancada</p>
            <h2>Projetos que já<br />ganharam forma.</h2>
          </div>
          <span className="feed-count">{String(feed.length).padStart(2, "0")} projeto{feed.length === 1 ? "" : "s"}</span>
        </div>

        <div className="project-stage">
          <div className={`photo-feed photo-feed-${Math.min(feed.length, 4)}`}>
            {feed.map((item, index) => (
              <button
                className="feed-photo"
                type="button"
                key={item.src}
                aria-label={`Abrir foto: ${item.title}`}
                onClick={() => setSelectedItem(item)}
                style={{ "--delay": `${index * 70}ms` } as CSSProperties}
              >
                <img src={item.src} alt={item.title} loading={index === 0 ? "eager" : "lazy"} />
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>

          <aside className="project-profile-panel" data-reveal>
            <div>
              <span className="panel-index">Instagram oficial</span>
              <h3>Veja o feed<br />ao vivo.</h3>
              <p>Abra o perfil da Orume dentro do site e acompanhe as publicações mais recentes.</p>
            </div>
            <button className="instagram-live" type="button" onClick={() => setInstagramOpen(true)}>
              <span aria-hidden="true">IG</span>
              Abrir Instagram
              <b aria-hidden="true">↗</b>
            </button>
            <a className="profile-handle" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@orume3d <span>↗</span></a>
          </aside>
        </div>
      </section>

      <section className="intro-section section-shell" id="sobre">
        <div className="section-code">01 — SOBRE NÓS</div>
        <div className="intro-copy" data-reveal>
          <p className="section-tag">Orume 3D</p>
          <h2>Impressão 3D feita no interior de São Paulo.</h2>
        </div>
        <div className="about-detail" data-reveal>
          <p>
            Somos uma empresa de impressão 3D situada em Santa Cruz da Conceição, no interior de São Paulo.
            Criamos peças personalizadas, objetos, presentes e soluções funcionais com atendimento próximo do início ao fim.
          </p>
          <p>
            Todos os orçamentos e fechamentos são realizados pelo WhatsApp. Antes da produção, você recebe as informações
            do pedido, valores, prazo, entrega e condições da encomenda.
          </p>
          <div className="about-facts">
            <div><span>Base</span><strong>Santa Cruz da Conceição — SP</strong></div>
            <div><span>Atendimento</span><strong>Direto pelo WhatsApp</strong></div>
          </div>
        </div>
      </section>

      <section className="services section-shell" id="solucoes">
        <div className="section-heading" data-reveal>
          <div>
            <div className="section-code">02 — POSSIBILIDADES</div>
            <p className="section-tag">O que fazemos</p>
          </div>
          <h2>Da peça exclusiva à solução que precisa funcionar.</h2>
        </div>

        <div className="service-grid">
          {services.map((service, index) => (
            <article
              className={`service-card service-card-${index + 1}`}
              key={service.number}
              data-reveal
              style={{ "--delay": `${index * 90}ms` } as CSSProperties}
            >
              <div className="card-top"><span>{service.number}</span><b>{service.tag}</b></div>
              <div className="card-shape" aria-hidden="true"><i /><i /><i /></div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Conversar sobre o projeto <span>↗</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="process section-shell" id="processo">
        <div className="process-intro" data-reveal>
          <div className="section-code">03 — COMO FUNCIONA</div>
          <p className="section-tag">Tudo pelo WhatsApp</p>
          <h2>Do orçamento<br />à produção.</h2>
          <p>O pedido só entra em produção depois que todas as informações e condições são confirmadas com você.</p>
        </div>
        <div className="steps">
          {steps.map(([number, title, text], index) => (
            <article
              className="step"
              key={number}
              data-reveal
              style={{ "--delay": `${index * 80}ms` } as CSSProperties}
            >
              <span className="step-number">{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              <span className="step-arrow" aria-hidden="true">↘</span>
            </article>
          ))}
        </div>
      </section>

      <section className="contract-section section-shell" id="contrato">
        <div className="contract-copy" data-reveal>
          <div className="section-code">04 — TERMOS DA ENCOMENDA</div>
          <p className="section-tag">Tudo claro antes de produzir</p>
          <h2>Seu pedido com regras bem definidas.</h2>
          <p>
            O contrato geral explica orçamento, aprovação, pagamento, produção, entrega, cancelamento e garantia.
            O resumo individual enviado pelo WhatsApp completa as informações de cada encomenda.
          </p>
          <button className="contract-open-button" type="button" onClick={() => setContractOpen(true)}>
            Abrir contrato completo <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="contract-summary" data-reveal>
          <span className="panel-index">Como a venda é fechada</span>
          <ol>
            <li><span>01</span><div><b>Orçamento no WhatsApp</b><p>Peça, material, valor, prazo e entrega.</p></div></li>
            <li><span>02</span><div><b>Confirmação do pedido</b><p>Você revisa e aceita o resumo da encomenda.</p></div></li>
            <li><span>03</span><div><b>Produção liberada</b><p>A impressão começa após as condições combinadas.</p></div></li>
          </ol>
          <small>Os direitos obrigatórios do consumidor permanecem preservados.</small>
        </div>
      </section>

      <section className="final-cta section-shell" data-reveal>
        <div className="final-orbit" aria-hidden="true"><i /><i /><i /></div>
        <p className="section-tag">Tem uma ideia em mente?</p>
        <h2>Vamos dar<br />forma a ela.</h2>
        <p>Mande uma foto, um desenho ou explique o que você precisa. O orçamento começa pelo WhatsApp.</p>
        <a className="big-budget final-budget" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          <span><small>Falar direto com a Orume</small>Abrir WhatsApp</span>
          <b aria-hidden="true">↗</b>
        </a>
      </section>

      <footer className="footer section-shell">
        <div className="footer-main">
          <a className="brand footer-brand" href="#inicio"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>ORUME <b>3D</b></span></a>
          <p>Ideias que ganham forma.</p>
        </div>
        <div className="footer-links">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram ↗</a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer">TikTok ↗</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp ↗</a>
          <button type="button" onClick={() => setContractOpen(true)}>Contrato da encomenda ↗</button>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Orume 3D</span><span>Santa Cruz da Conceição — SP</span></div>
      </footer>

      <a
        className={showFloatingBudget ? "floating-budget is-visible" : "floating-budget"}
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Pedir orçamento pelo WhatsApp"
      >
        <span className="status-dot" aria-hidden="true" />
        <span><small>Tem um projeto?</small>Peça seu orçamento</span>
        <b aria-hidden="true">↗</b>
      </a>

      {selectedItem && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
        >
          <div className="photo-modal" role="dialog" aria-modal="true" aria-label="Foto do projeto">
            <button className="modal-close" type="button" aria-label="Fechar foto" onClick={() => setSelectedItem(null)}>×</button>
            <img src={selectedItem.src} alt={selectedItem.title} />
            <a href={selectedItem.href || INSTAGRAM_URL} target="_blank" rel="noreferrer">Ver no Instagram <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      )}

      {instagramOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInstagramOpen(false);
          }}
        >
          <div className="instagram-modal" role="dialog" aria-modal="true" aria-label="Instagram da Orume 3D">
            <div className="instagram-modal-head">
              <div><span>IG</span><b>@orume3d</b></div>
              <button className="modal-close" type="button" aria-label="Fechar Instagram" onClick={() => setInstagramOpen(false)}>×</button>
            </div>
            <div className="instagram-embed-shell">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink="https://www.instagram.com/orume3d/?utm_source=ig_embed&utm_campaign=loading"
                data-instgrm-version="14"
              >
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Carregando o Instagram da Orume 3D…</a>
              </blockquote>
            </div>
            <a className="open-instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Abrir no app do Instagram ↗</a>
          </div>
        </div>
      )}

      {contractOpen && (
        <div
          className="modal-backdrop contract-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setContractOpen(false);
          }}
        >
          <div className="contract-modal" role="dialog" aria-modal="true" aria-label="Contrato de encomenda e produção 3D">
            <div className="contract-modal-head">
              <div><span>ORUME 3D</span><small>Termos da encomenda</small></div>
              <button className="modal-close" type="button" aria-label="Fechar contrato" onClick={() => setContractOpen(false)}>×</button>
            </div>

            <article className="contract-document">
              <p className="contract-version">Versão 1 — 11 de agosto de 2026</p>
              <h2>Contrato geral de encomenda e produção 3D</h2>
              <p className="contract-lead">
                Este documento apresenta as condições gerais aplicáveis às encomendas da Orume 3D. O resumo individual
                enviado pelo WhatsApp integra este contrato e informa as características específicas de cada pedido.
              </p>

              <div className="contract-parties">
                <p><strong>Fornecedor</strong> Orume 3D, empresa de impressão 3D situada em Santa Cruz da Conceição/SP. Os dados cadastrais completos serão informados no resumo individual antes do fechamento.</p>
                <p><strong>Cliente</strong> Pessoa identificada no atendimento e no resumo do pedido confirmado pelo WhatsApp.</p>
              </div>

              <section>
                <h3>1. Objeto e resumo do pedido</h3>
                <p>A Orume produzirá as peças descritas no resumo enviado ao cliente. Esse resumo deverá indicar, conforme o projeto, modelo ou referência, dimensões, material, cor, acabamento, quantidade, valor, forma de pagamento, prazo estimado, entrega e frete.</p>
              </section>

              <section>
                <h3>2. Orçamento e correção de informações</h3>
                <p>Todos os orçamentos são elaborados e fechados pelo WhatsApp oficial da Orume 3D. Antes da confirmação, o cliente poderá revisar e corrigir informações, medidas, quantidades, endereço e demais dados do pedido. O orçamento será válido pelo prazo informado na própria mensagem.</p>
              </section>

              <section>
                <h3>3. Formação do contrato</h3>
                <p>A contratação ocorre após a confirmação escrita do resumo do pedido e o cumprimento da condição de pagamento combinada. A Orume confirmará o recebimento da aceitação pelo WhatsApp e manterá estes termos disponíveis para consulta e reprodução.</p>
              </section>

              <section>
                <h3>4. Aprovação, características e tolerâncias</h3>
                <p>Quando houver desenho, modelo ou prévia digital, a produção dependerá da aprovação do cliente. Impressões 3D podem apresentar linhas de camada e pequenas variações próprias do processo e do material, desde que não prejudiquem o uso, a segurança ou as características prometidas. Essas particularidades não afastam a responsabilidade por vícios ou defeitos.</p>
              </section>

              <section>
                <h3>5. Pagamento</h3>
                <p>Valor, entrada, saldo, forma e datas de pagamento constarão no resumo individual. A produção começa somente depois do cumprimento da condição inicial combinada. Nenhuma cobrança diferente do orçamento poderá ser aplicada sem informação e concordância prévia do cliente.</p>
              </section>

              <section>
                <h3>6. Produção, prazo e alterações</h3>
                <p>O prazo de produção começa após a confirmação do pedido, do pagamento acordado e da aprovação de arquivos ou medidas, quando necessária. Mudanças solicitadas depois da aprovação poderão exigir novo orçamento e novo prazo, ambos informados antes da continuidade. Eventual atraso relevante será comunicado ao cliente.</p>
              </section>

              <section>
                <h3>7. Entrega e recebimento</h3>
                <p>Retirada, transportadora, endereço, frete e prazo estimado de entrega serão definidos no resumo do pedido. O cliente deverá conferir os dados antes do envio. A Orume responde pela entrega conforme a legislação aplicável. Em caso de avaria aparente, fotos da embalagem e da peça ajudam a agilizar o atendimento, sem limitar direitos legais.</p>
              </section>

              <section>
                <h3>8. Cancelamento e direito de arrependimento</h3>
                <p>Nas contratações realizadas fora do estabelecimento comercial, inclusive pelo WhatsApp, o consumidor poderá exercer o direito de arrependimento no prazo legal de sete dias, contado da assinatura ou do recebimento do produto, comunicando a Orume pelo mesmo WhatsApp utilizado na compra. Os valores serão restituídos conforme a legislação, sem multa. Nenhuma disposição deste contrato reduz direitos obrigatórios do consumidor.</p>
              </section>

              <section>
                <h3>9. Qualidade e garantia legal</h3>
                <p>Produtos duráveis possuem garantia legal de 90 dias para reclamação de vícios aparentes, sem prejuízo das regras aplicáveis aos vícios ocultos. Recebida a reclamação, a Orume analisará o caso e terá o prazo legal para sanar o problema. Não sendo solucionado no prazo previsto em lei, o consumidor poderá escolher as alternativas asseguradas pelo Código de Defesa do Consumidor.</p>
              </section>

              <section>
                <h3>10. Uso e conservação</h3>
                <p>Limites de temperatura, carga, contato com água, alimentos, produtos químicos ou uso externo deverão ser informados quando relevantes ao material escolhido. Danos comprovadamente causados por uso contrário às orientações não são vícios de fabricação, sem prejuízo da análise de cada situação e dos direitos legais.</p>
              </section>

              <section>
                <h3>11. Arquivos, marcas e direitos de terceiros</h3>
                <p>Ao enviar arquivos, logotipos, personagens ou modelos, o cliente declara possuir autorização para utilizá-los. A Orume poderá recusar projetos ilícitos, perigosos ou que apresentem risco evidente de violação de direitos de terceiros.</p>
              </section>

              <section>
                <h3>12. Dados pessoais e registros</h3>
                <p>Os dados do atendimento serão utilizados para orçamento, produção, comunicação, pagamento, entrega e cumprimento de obrigações legais. O compartilhamento será limitado aos prestadores necessários, como meios de pagamento e transporte. Mensagens, aprovações e comprovantes poderão ser mantidos como registro da contratação.</p>
              </section>

              <section>
                <h3>13. Atendimento e solução de dúvidas</h3>
                <p>Dúvidas, alterações, reclamações e pedidos de cancelamento devem ser enviados ao WhatsApp oficial da Orume. As partes buscarão uma solução direta, sem impedir o acesso do consumidor ao Procon, à plataforma pública competente ou ao Poder Judiciário. Aplicam-se a legislação brasileira e o foro competente definido em lei, preservado o domicílio do consumidor quando cabível.</p>
              </section>

              <div className="contract-legal-note">
                <strong>Referências legais</strong>
                <a href={CDC_URL} target="_blank" rel="noreferrer">Código de Defesa do Consumidor ↗</a>
                <a href={ECOMMERCE_URL} target="_blank" rel="noreferrer">Decreto do Comércio Eletrônico ↗</a>
              </div>
            </article>

            <div className="contract-actions">
              <button type="button" onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Falar no WhatsApp ↗</a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
