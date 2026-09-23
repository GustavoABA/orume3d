import { useEffect } from 'react';
import { motion } from 'framer-motion';

const SCRIPT_ID = 'orume-sociablekit-instagram';
const SCRIPT_SRC = 'https://widgets.sociablekit.com/instagram-feed/widget.js';

const InstagramProjects = () => {
  useEffect(() => {
    const container = document.querySelector('.sk-instagram-feed[data-embed-id="25716212"]');
    if (!container) return;

    document.getElementById(SCRIPT_ID)?.remove();

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.defer = true;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="mt-20"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.28em] text-accent/60">
            Projetos reais
          </p>
          <h2 className="mt-1 font-display text-2xl text-white sm:text-3xl">
            Projetos da <span className="orume-metal-text">Orume</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
            Peças, testes e projetos que já saíram das nossas impressoras.
          </p>
        </div>

        <a
          href="https://www.instagram.com/orume3d/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit rounded-full border border-accent/20 bg-accent/[0.05] px-5 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accentLight transition hover:border-accent/45 hover:bg-accent/10"
        >
          Seguir @orume3d
        </a>
      </div>

      <div className="orume-panel overflow-hidden rounded-[1.5rem] p-3 sm:p-5">
        <div className="min-h-[260px] overflow-hidden rounded-[1.1rem] bg-black/35">
          <div className="sk-instagram-feed" data-embed-id="25716212" />
        </div>
      </div>

      <p className="mt-3 text-center text-[0.6rem] uppercase tracking-[0.15em] text-stone-700">
        Feed sincronizado pelo Instagram
      </p>
    </motion.section>
  );
};

export default InstagramProjects;
