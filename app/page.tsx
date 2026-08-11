"use client";

/* eslint-disable @next/next/no-img-element -- feed images are discovered dynamically at build time */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const WHATSAPP_URL =
  "https://wa.me/5519989342212?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Orume%203D%20e%20quero%20fazer%20um%20or%C3%A7amento.";
const INSTAGRAM_URL = "https://www.instagram.com/orume3d/";
const TIKTOK_URL = "https://www.tiktok.com/@orume3d";

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
    title: "Peças do seu jeito",
    text: "Nome, personagem, cor, medida ou referência: a gente transforma em um objeto só seu.",
    tag: "Personalizados",
  },
  {
    number: "02",
    title: "Presentes que marcam",
    text: "Decoração, lembranças e objetos criativos para fugir do presente de sempre.",
    tag: "Presentes",
  },
  {
    number: "03",
    title: "Ideias que resolvem",
    text: "Protótipos e peças funcionais para testar, ajustar e colocar sua solução no mundo.",
    tag: "Protótipos",
  },
];

const steps = [
  ["01", "Manda a ideia", "Foto, rabisco, medida ou uma mensagem já bastam para começar."],
  ["02", "A gente monta", "Definimos formato, cor, material, acabamento e prazo com você."],
  ["03", "A peça nasce", "Imprimimos camada por camada e cuidamos do acabamento."],
  ["04", "Chega até você", "Tudo pronto: combinamos retirada ou envio do seu projeto."],
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
    const modalOpen = Boolean(selectedItem || instagramOpen || menuOpen);
    document.body.classList.toggle("modal-open", modalOpen);

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedItem(null);
        setInstagramOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [instagramOpen, menuOpen, selectedItem]);

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

        <nav id="site-navigation" className={menuOpen ? "nav is-open" : "nav"}>
          <div className="nav-label">Navegue pela Orume</div>
          <a href="#feed" onClick={closeMenu}><span>01</span> Nossos projetos</a>
          <a href="#solucoes" onClick={closeMenu}><span>02</span> O que fazemos</a>
          <a href="#processo" onClick={closeMenu}><span>03</span> Como funciona</a>
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
            <a className="scroll-link" href="#feed">Ver o que já ganhou forma <span aria-hidden="true">↓</span></a>
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
            <h2>O que a gente<br />já fez.</h2>
          </div>
          <button className="instagram-live" type="button" onClick={() => setInstagramOpen(true)}>
            <span aria-hidden="true">IG</span>
            Abrir Instagram ao vivo
            <b aria-hidden="true">↗</b>
          </button>
        </div>

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

        <div className="feed-footer" data-reveal>
          <span>@orume3d</span>
          <p>Novas fotos entram aqui automaticamente quando são adicionadas à pasta do feed.</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Seguir no Instagram ↗</a>
        </div>
      </section>

      <section className="intro-section section-shell">
        <div className="section-code">01 — SOBRE</div>
        <div className="intro-copy" data-reveal>
          <p className="section-tag">Ideia + matéria + cuidado</p>
          <h2>Impressão 3D com mais personalidade e menos complicação.</h2>
        </div>
        <p className="intro-aside" data-reveal>
          Você conta o que precisa. A Orume ajuda a encontrar o melhor caminho para criar, testar e produzir.
        </p>
      </section>

      <section className="services section-shell" id="solucoes">
        <div className="section-heading" data-reveal>
          <div>
            <div className="section-code">02 — POSSIBILIDADES</div>
            <p className="section-tag">O que fazemos</p>
          </div>
          <h2>Do presente diferente à peça que resolve.</h2>
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
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Tenho uma ideia assim <span>↗</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="process section-shell" id="processo">
        <div className="process-intro" data-reveal>
          <div className="section-code">03 — COMO FUNCIONA</div>
          <p className="section-tag">Sem enrolação</p>
          <h2>Da conversa<br />para a sua mão.</h2>
          <p>Você não precisa entender de impressão 3D. Essa parte é com a gente.</p>
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

      <section className="final-cta section-shell" data-reveal>
        <div className="final-orbit" aria-hidden="true"><i /><i /><i /></div>
        <p className="section-tag">Tem uma ideia aí?</p>
        <h2>Bora dar<br />forma pra ela.</h2>
        <p>Manda uma foto, um desenho ou só explica do seu jeito. A conversa começa por aqui.</p>
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
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Orume 3D</span><span>Impressão 3D • Campinas e região</span></div>
      </footer>

      <div className="contact-dock" aria-label="Contatos rápidos">
        <SocialLink href={INSTAGRAM_URL} label="Instagram" short="IG" />
        <a className="dock-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          <span className="status-dot" aria-hidden="true" /> Orçar no WhatsApp
        </a>
        <SocialLink href={TIKTOK_URL} label="TikTok" short="TT" />
      </div>

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
    </main>
  );
}
