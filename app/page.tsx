"use client";

/* eslint-disable @next/next/no-img-element -- feed images are discovered dynamically at build time */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import feedManifest from "../public/feed/feed.json";
import initialLiveConfig from "../public/live.json";

const WHATSAPP_URL =
  "https://wa.me/5519989342212?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Orume%203D%20e%20quero%20fazer%20um%20or%C3%A7amento.";
const INSTAGRAM_URL = "https://www.instagram.com/orume3d/";
const TIKTOK_URL = "https://www.tiktok.com/@orume3d";

const whatsappUrl = (message: string) =>
  `https://wa.me/5519989342212?text=${encodeURIComponent(message)}`;

const CREATOR_WHATSAPP_URL = whatsappUrl(
  "Olá, Orume 3D! Sou criador(a) de conteúdo e quero conversar sobre uma coleção oficial de produtos personalizados. Gostaria de entender desenvolvimento, protótipo, aprovação, modelo de venda e participação nas vendas.",
);

type FeedItem = {
  src: string;
  title: string;
  href?: string;
};

type LiveConfig = {
  active: boolean;
  videoId?: string;
  channelId?: string;
  youtubeUrl?: string;
  title?: string;
};

const services = [
  {
    number: "01",
    title: "Peças personalizadas",
    text: "Objetos criados a partir de referências, medidas e necessidades específicas do seu projeto.",
    tag: "Sob medida",
    imageLabel: "Peça personalizada",
    message:
      "Olá, Orume 3D! Vim pelo site e gostaria de criar uma peça personalizada. Tenho uma ideia ou referência e quero conversar sobre medidas, material, acabamento, quantidade e prazo. Podem me ajudar com o orçamento?",
  },
  {
    number: "02",
    title: "Presentes e decoração",
    text: "Peças com identidade para presentear, decorar ambientes e transformar boas ideias em algo físico.",
    tag: "Criação",
    imageLabel: "Presente e decoração",
    message:
      "Olá, Orume 3D! Vim pelo site e gostaria de encomendar um presente ou item de decoração personalizado. Quero conversar sobre tema, tamanho, cores, quantidade, acabamento, prazo e valor. Podem me ajudar a transformar essa ideia em uma peça 3D?",
  },
  {
    number: "03",
    title: "Protótipos e soluções",
    text: "Modelos e peças funcionais para testar formatos, validar conceitos e resolver problemas reais.",
    tag: "Funcional",
    imageLabel: "Protótipo funcional",
    message:
      "Olá, Orume 3D! Vim pelo site e preciso desenvolver um protótipo ou uma solução funcional em impressão 3D. Posso enviar referências, medidas e requisitos de uso para vocês avaliarem material, viabilidade, prazo e orçamento?",
  },
];

const steps = [
  ["01", "Pedido pelo WhatsApp", "Você envia a ideia, referência, medidas e quantidade pelo nosso canal oficial."],
  ["02", "Orçamento completo", "A Orume informa material, acabamento, valor, pagamento, prazo de produção e entrega."],
  ["03", "Confirmação da venda", "O resumo do pedido e estes termos são confirmados antes do pagamento combinado."],
  ["04", "Produção e entrega", "Após a aprovação, a impressão começa e você recebe as atualizações até a entrega."],
];

const creatorSteps = [
  ["01", "Conceito da coleção", "Você apresenta personagem, identidade, público e quais produtos gostaria de transformar em itens físicos."],
  ["02", "Desenvolvimento e protótipo", "A Orume avalia viabilidade, modelagem, materiais, acabamento, custos e prepara uma visualização ou protótipo para aprovação."],
  ["03", "Aprovação e modelo comercial", "Produto, preço, participação, produção sob demanda, pré-venda ou estoque ficam definidos por escrito antes do lançamento."],
  ["04", "Lançamento e relatório", "A coleção aprovada pode ser divulgada como colaboração e as vendas são acompanhadas para cálculo dos repasses combinados."],
];

function SocialLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
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
      <span aria-hidden="true">{label === "Instagram" ? <FaInstagram /> : <FaTiktok />}</span>
      <b>{label}</b>
    </a>
  );
}

export default function Home() {
  const feed = feedManifest as FeedItem[];
  const live = initialLiveConfig as LiveConfig;
  const [menuOpen, setMenuOpen] = useState(false);
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

    const hero = document.querySelector<HTMLElement>(".hero");
    const heroVisibilityObserver = new IntersectionObserver(([entry]) => {
      hero?.classList.toggle("is-offscreen", !entry.isIntersecting);
    });

    if (hero) heroVisibilityObserver.observe(hero);

    return () => {
      observer.disconnect();
      heroVisibilityObserver.disconnect();
    };
  }, []);


  useEffect(() => {
    const root = document.documentElement;
    let animationFrame = 0;

    const updateScrollMotion = () => {
      animationFrame = 0;
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
      root.style.setProperty("--page-progress", `${progress * 100}%`);
    };

    const requestScrollMotion = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateScrollMotion);
    };

    updateScrollMotion();
    window.addEventListener("scroll", requestScrollMotion, { passive: true });
    window.addEventListener("resize", requestScrollMotion);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestScrollMotion);
      window.removeEventListener("resize", requestScrollMotion);
    };
  }, []);


  useEffect(() => {
    const feedSection = document.getElementById("feed");
    if (!feedSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingBudget(entry.isIntersecting || entry.boundingClientRect.top < 0);
      },
      { rootMargin: "0px 0px -28% 0px" },
    );

    observer.observe(feedSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", menuOpen);

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const videoId = /^[A-Za-z0-9_-]{11}$/.test(live.videoId ?? "") ? live.videoId : "";
  const channelId = /^UC[A-Za-z0-9_-]{20,}$/.test(live.channelId ?? "") ? live.channelId : "";
  const liveEmbedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`
    : channelId
      ? `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&rel=0&playsinline=1`
      : "";
  const liveWatchUrl = live.youtubeUrl
    || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "")
    || (channelId ? `https://www.youtube.com/channel/${channelId}/live` : "");
  const showLive = live.active && Boolean(liveEmbedUrl && liveWatchUrl);

  return (
    <main>
      <div className="grain" aria-hidden="true" />
      <div className="site-progress" aria-hidden="true"><i /></div>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Orume 3D — início">
          <img className="brand-logo" src="./orume-logo-mark.webp" alt="" aria-hidden="true" decoding="async" />
          <span>ORUME <b>3D</b></span>
        </a>

        <div className="header-actions">
          <div className="header-socials">
            <SocialLink href={INSTAGRAM_URL} label="Instagram" />
            <SocialLink href={TIKTOK_URL} label="TikTok" />
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
          <a href="./parcerias/" onClick={closeMenu}><span>05</span> Parcerias</a>
          <a href="./termos/" onClick={closeMenu}><span>06</span> Termos da encomenda</a>
          <div className="nav-socials">
            <SocialLink href={INSTAGRAM_URL} label="Instagram" />
            <SocialLink href={TIKTOK_URL} label="TikTok" />
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
              <SocialLink href={INSTAGRAM_URL} label="Instagram" />
              <SocialLink href={TIKTOK_URL} label="TikTok" />
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
            <div className="hero-mark">
              <img src="./orume-logo-mark.webp" alt="" decoding="async" />
            </div>
            <div className="visual-note">camada por camada <span>↗</span></div>
          </div>
        </div>
      </section>

      {showLive && (
        <section className="live-section" id="ao-vivo" aria-labelledby="live-title">
          <div className="live-layout">
            <div className="live-copy" data-reveal>
              <div className="live-status"><i aria-hidden="true" /> Ao vivo agora</div>
              <p className="section-tag">Direto da impressora</p>
              <h2 id="live-title">{live.title || "Impressão ao vivo."}</h2>
              <p>Acompanhe uma peça da Orume ganhando forma, camada por camada.</p>
              <a href={liveWatchUrl} target="_blank" rel="noreferrer">
                Assistir no YouTube <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="live-player" data-reveal>
              <div className="live-player-label"><i aria-hidden="true" /> Orume 3D ao vivo</div>
              <iframe
                src={liveEmbedUrl}
                title="Transmissão ao vivo da impressão 3D da Orume"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      <section className="feed-section" id="feed">
        <div className="feed-heading" data-reveal>
          <div>
            <p className="section-tag">Direto da bancada</p>
            <h2>Projetos.</h2>
          </div>
          <span className="feed-count">{String(feed.length).padStart(2, "0")} projeto{feed.length === 1 ? "" : "s"}</span>
        </div>

        <div className="project-stage">
          <div className="project-image-grid">
            {feed.slice(0, 6).map((item, index) => (
              <a
                className="project-image-card"
                key={item.src}
                href={item.href || INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={`${item.title} — abrir no Instagram`}
                style={{ "--delay": `${index * 55}ms` } as CSSProperties}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  width="720"
                  height="720"
                />
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>

          <aside className="project-profile-panel" data-reveal>
            <div className="project-profile-copy">
              <span className="panel-index">Instagram oficial</span>
              <h3>Mais projetos em <span>@orume3d</span></h3>
              <p>Veja peças, bastidores e novidades direto no perfil oficial.</p>
            </div>
            <a className="instagram-live" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <span aria-hidden="true"><FaInstagram /></span>
              Ver todos os projetos
              <b aria-hidden="true">↗</b>
            </a>
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
              data-reveal="card"
              style={{ "--delay": `${index * 90}ms` } as CSSProperties}
            >
              <div className="card-top"><span>{service.number}</span><b>{service.tag}</b></div>
              <div
                className={`service-visual service-visual-${index + 1}`}
                role="img"
                aria-label={service.imageLabel}
                style={{ backgroundImage: 'url("./service-triptych.webp")' }}
              ><span>{service.imageLabel}</span></div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <a className="service-whatsapp" href={whatsappUrl(service.message)} target="_blank" rel="noreferrer">
                <FaWhatsapp aria-hidden="true" />
                <span>Conversar sobre o projeto</span>
                <b aria-hidden="true">↗</b>
              </a>
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
              data-reveal="line"
              style={{ "--delay": `${index * 80}ms` } as CSSProperties}
            >
              <span className="step-number">{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              <span className="step-arrow" aria-hidden="true">↘</span>
            </article>
          ))}
        </div>
      </section>


      <section className="creator-section section-shell" id="criadores">
        <div className="creator-intro" data-reveal>
          <div className="section-code">04 — PARCERIAS COM CRIADORES</div>
          <p className="section-tag">Merchandising físico com aprovação</p>
          <h2>Seu personagem pode virar uma coleção real.</h2>
          <p>
            A Orume desenvolve produtos físicos em parceria com criadores, streamers e VTubers.
            Cada item nasce de uma proposta aprovada: identidade, produto, uso de artes, processo de criação,
            modelo de venda, custos e participação ficam definidos antes da comercialização.
          </p>
          <div className="creator-actions">
            <a className="creator-cta" href={CREATOR_WHATSAPP_URL} target="_blank" rel="noreferrer">
              Quero criar uma coleção <span aria-hidden="true">↗</span>
            </a>
            <a className="creator-more" href="./parcerias/">
              Ver programa de parcerias <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="creator-flow" data-reveal>
          <span className="panel-index">Fluxo de colaboração</span>
          {creatorSteps.map(([number, title, text]) => (
            <article className="creator-step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="creator-rules" data-reveal>
          <div>
            <span>Direitos</span>
            <strong>A identidade continua pertencendo ao criador.</strong>
            <p>A Orume usa apenas os materiais autorizados para os produtos aprovados.</p>
          </div>
          <div>
            <span>Aprovação</span>
            <strong>Nada vai à venda sem validação do produto.</strong>
            <p>Render, foto, protótipo ou outra prévia clara é apresentada antes do lançamento.</p>
          </div>
          <div>
            <span>Modelo comercial</span>
            <strong>Pré-venda, sob demanda ou estoque.</strong>
            <p>Preço, base de cálculo, participação e repasse são definidos para cada produto ou coleção.</p>
          </div>
          <div>
            <span>IA</span>
            <strong>Uso somente com ciência e autorização.</strong>
            <p>Quando houver IA no desenvolvimento, a ferramenta ou etapa deve ser informada e aprovada.</p>
          </div>
        </div>
      </section>

      <section className="contract-section section-shell" id="contrato">
        <div className="contract-copy" data-reveal>
          <div className="section-code">05 — TERMOS DA ENCOMENDA</div>
          <p className="section-tag">Tudo claro antes de produzir</p>
          <h2>Seu pedido com regras bem definidas.</h2>
          <p>
            O contrato geral explica orçamento, aprovação, pagamento, produção, entrega, cancelamento e garantia.
            O resumo individual enviado pelo WhatsApp completa as informações de cada encomenda.
          </p>
          <a className="contract-open-button" href="./termos/">
            Abrir termos completos <span aria-hidden="true">↗</span>
          </a>
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
          <a className="brand footer-brand" href="#inicio"><img className="brand-logo" src="./orume-logo-mark.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" /><span>ORUME <b>3D</b></span></a>
          <p>Ideias que ganham forma.</p>
        </div>
        <div className="footer-links">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><FaInstagram aria-hidden="true" /> Instagram ↗</a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer"><FaTiktok aria-hidden="true" /> TikTok ↗</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> WhatsApp ↗</a>
          <a href="./parcerias/">Parcerias ↗</a>
          <a href="./termos/">Termos da encomenda ↗</a>
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

    </main>
  );
}
