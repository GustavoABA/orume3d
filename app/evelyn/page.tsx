import type { Metadata } from "next";
import { FaWhatsapp } from "react-icons/fa6";
import feedManifest from "../../public/feed/feed.json";
import styles from "./evelyn.module.css";

const WHATSAPP_URL =
  "https://wa.me/5519989342212?text=VIM%20PELA%20EVELYN";

export const metadata: Metadata = {
  title: "Evelyn — Afiliada",
  description: "Projetos da Orume 3D indicados pela afiliada Evelyn.",
};

type FeedItem = {
  src: string;
  title: string;
  href?: string;
};

const projectImage = (src: string) => `../${src.replace(/^\.\//, "")}`;

export default function EvelynAffiliatePage() {
  const projects = feedManifest as FeedItem[];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <a className={styles.brand} href="../" aria-label="Orume 3D">
          <img src="../orume-logo-mark.webp" alt="" aria-hidden="true" />
          <span>ORUME <b>3D</b></span>
        </a>

        <p className={styles.eyebrow}>INDICAÇÃO DA EVELYN</p>
        <h1>Gostou de algum projeto?</h1>
        <p className={styles.heroText}>Peça seu orçamento direto com a Orume 3D.</p>

        <a
          className={styles.whatsappButton}
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
        >
          <FaWhatsapp aria-hidden="true" />
          <span>
            <small>FALAR DIRETO NO WHATSAPP</small>
            QUERO MEU ORÇAMENTO
          </span>
          <b aria-hidden="true">↗</b>
        </a>
      </section>

      <section className={styles.projects} aria-labelledby="projects-title">
        <div className={styles.projectsHeading}>
          <span>PROJETOS ORUME 3D</span>
          <h2 id="projects-title">Veja o que a gente imprime.</h2>
        </div>

        <div className={styles.grid}>
          {projects.map((project, index) => (
            <a
              className={styles.card}
              key={`${project.src}-${index}`}
              href={project.href || "https://www.instagram.com/orume3d/"}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} — abrir no Instagram`}
            >
              <img
                src={projectImage(project.src)}
                alt={project.title}
                loading={index > 2 ? "lazy" : "eager"}
                decoding="async"
              />
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.affiliateBadge}>AFILIADA ORUME 3D</div>
        <h2>EVELYN</h2>
        <p>
          Evelyn é afiliada da Orume 3D e recebe comissão pelas vendas realizadas por meio desta página.
        </p>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          Orçar pelo WhatsApp <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </main>
  );
}
