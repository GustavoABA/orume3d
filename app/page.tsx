"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const WHATSAPP_URL =
  "https://wa.me/5519989342212?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Orume%203D%20e%20quero%20fazer%20um%20or%C3%A7amento.";
const INSTAGRAM_URL = "https://www.instagram.com/orume3d/";
const TIKTOK_URL = "https://www.tiktok.com/@orume3d";

type FeedItem = {
  src: string;
  title: string;
};

const services = [
  {
    number: "01",
    title: "Peças personalizadas",
    text: "Transformamos referências, desenhos e ideias em peças únicas, feitas para o seu projeto.",
    tag: "Sob medida",
  },
  {
    number: "02",
    title: "Presentes & decoração",
    text: "Objetos com identidade para presentear, decorar e fazer uma marca ser lembrada.",
    tag: "Exclusivo",
  },
  {
    number: "03",
    title: "Protótipos & soluções",
    text: "Da primeira versão à peça funcional: materializamos, testamos e refinamos a sua ideia.",
    tag: "Funcional",
  },
];

const steps = [
  ["01", "Você conta a ideia", "Envie uma referência, medida ou desenho pelo WhatsApp."],
  ["02", "A gente projeta", "Alinhamos formato, material, cor, acabamento e prazo."],
  ["03", "Sua peça ganha forma", "Produzimos em camadas com cuidado em cada detalhe."],
  ["04", "Pronto para você", "Fazemos o acabamento e combinamos a entrega."],
];

export default function Home() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

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
      { threshold: 0.14, rootMargin: "0px 0px -40px" },
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("./feed/feed.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((items: FeedItem[]) => setFeed(items))
      .catch(() => setFeed([]));
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <div className="noise" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Orume 3D — início">
          <span className="brand-mark">O</span>
          <span>ORUME <b>3D</b></span>
        </a>

        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav id="site-navigation" className={menuOpen ? "nav is-open" : "nav"}>
          <a href="#solucoes" onClick={closeMenu}>O que fazemos</a>
          <a href="#processo" onClick={closeMenu}>Como funciona</a>
          <a href="#feed" onClick={closeMenu}>Projetos</a>
          <a className="nav-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Pedir orçamento
          </a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <img className="hero-art" src="./og.png" alt="" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">Impressão 3D sob medida</p>
          <h1>
            A sua ideia.
            <span>A nossa forma.</span>
          </h1>
          <p className="hero-copy">
            Peças personalizadas, presentes e soluções que saem da imaginação
            e chegam às suas mãos.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Quero tirar minha ideia do papel <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#solucoes">
              Conheça a Orume <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="hero-stamp" aria-hidden="true">
          <span>FEITO</span><i>•</i><span>EM</span><i>•</i><span>CAMADAS</span>
        </div>

        <div className="scroll-hint" aria-hidden="true">
          <span>Role para descobrir</span><i />
        </div>
      </section>

      <section className="manifesto section-shell">
        <div className="section-index">01 / A ORUME</div>
        <div className="manifesto-copy" data-reveal>
          <p className="eyebrow">Da imaginação para o mundo real</p>
          <h2>
            Não vendemos só impressão.
            <span>Materializamos possibilidades.</span>
          </h2>
          <p>
            Na Orume 3D, cada projeto começa com uma conversa. Você traz a
            necessidade; nós cuidamos do caminho até a peça pronta, com precisão,
            acabamento e personalidade.
          </p>
        </div>
        <div className="manifesto-aside" data-reveal>
          <div><strong>100%</strong><span>personalizável</span></div>
          <div><strong>1:1</strong><span>atendimento humano</span></div>
          <div><strong>∞</strong><span>possibilidades</span></div>
        </div>
      </section>

      <section className="services section-shell" id="solucoes">
        <div className="section-heading" data-reveal>
          <div>
            <div className="section-index">02 / POSSIBILIDADES</div>
            <p className="eyebrow">O que podemos criar juntos</p>
          </div>
          <h2>Do detalhe que encanta à solução que funciona.</h2>
        </div>

        <div className="service-grid">
          {services.map((service, index) => (
            <article
              className="service-card"
              key={service.number}
              data-reveal
              style={{ "--delay": String(index * 100) + "ms" } as CSSProperties}
            >
              <div className="card-top">
                <span>{service.number}</span>
                <span className="card-tag">{service.tag}</span>
              </div>
              <div className={"card-object card-object-" + (index + 1)} aria-hidden="true">
                <i /><i /><i />
              </div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                Conversar sobre isso <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="process section-shell" id="processo">
        <div className="process-intro" data-reveal>
          <div className="section-index">03 / PROCESSO</div>
          <p className="eyebrow">Simples do começo ao fim</p>
          <h2>Você imagina.<br />A Orume resolve.</h2>
          <p>Sem complicação técnica. A gente conduz cada etapa com você.</p>
        </div>
        <div className="steps">
          {steps.map(([number, title, text], index) => (
            <article
              className="step"
              key={number}
              data-reveal
              style={{ "--delay": String(index * 90) + "ms" } as CSSProperties}
            >
              <span className="step-number">{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              <span className="step-arrow" aria-hidden="true">↘</span>
            </article>
          ))}
        </div>
      </section>

      <section className="feed-section section-shell" id="feed">
        <div className="feed-heading" data-reveal>
          <div>
            <div className="section-index">04 / ÚLTIMAS CRIAÇÕES</div>
            <p className="eyebrow">@orume3d</p>
            <h2>Feito em camadas.<br />Mostrado sem filtros.</h2>
          </div>
          <a className="button button-outline" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Seguir no Instagram <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="feed-grid">
          {feed.map((item, index) => (
            <a
              className="feed-card"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              key={item.src}
              data-reveal
              style={{ "--delay": String(index * 80) + "ms" } as CSSProperties}
            >
              <img src={item.src} alt={item.title} loading="lazy" />
              <span><b>{item.title}</b><i aria-hidden="true">↗</i></span>
            </a>
          ))}
          {feed.length < 3 && (
            <>
              <a className="feed-card feed-placeholder feed-placeholder-one" href={INSTAGRAM_URL} target="_blank" rel="noreferrer" data-reveal>
                <span><b>Acompanhe os próximos projetos</b><i aria-hidden="true">↗</i></span>
              </a>
              <a className="feed-card feed-placeholder feed-placeholder-two" href={TIKTOK_URL} target="_blank" rel="noreferrer" data-reveal>
                <span><b>Veja o processo no TikTok</b><i aria-hidden="true">↗</i></span>
              </a>
            </>
          )}
        </div>
      </section>

      <section className="cta-section section-shell" data-reveal>
        <div className="cta-glow" aria-hidden="true" />
        <p className="eyebrow">Tem uma ideia em mente?</p>
        <h2>Vamos dar forma a ela.</h2>
        <p>Mande uma foto, um desenho ou conte o que você precisa. O orçamento começa com uma boa conversa.</p>
        <a className="button button-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          Falar com a Orume no WhatsApp <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer className="footer section-shell">
        <div className="footer-brand">
          <a className="brand" href="#inicio"><span className="brand-mark">O</span><span>ORUME <b>3D</b></span></a>
          <p>Ideias que ganham forma.</p>
        </div>
        <div className="footer-links">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram ↗</a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer">TikTok ↗</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp ↗</a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Orume 3D</span>
          <span>Impressão 3D • Campinas e região</span>
        </div>
      </footer>

      <a className="floating-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Pedir orçamento pelo WhatsApp">
        <span>Orçar</span><i aria-hidden="true">↗</i>
      </a>
    </main>
  );
}
