import { motion } from 'framer-motion';

const Footer = () => {
  const logo = '/orume3d/brand/orume-mark.webp';

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="border-t border-accent/10 bg-black/70 backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/15 bg-[#0c0a07]">
              <img src={logo} alt="" className="h-8 w-8 object-contain" />
            </span>
            <div>
              <p className="orume-metal-text font-display text-xl tracking-[0.16em]">ORUME</p>
              <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone-600">
                impressão 3D • design • coleções
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/5519989342212"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-accent/16 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-stone-400 transition hover:border-accent/45 hover:text-accentLight"
            >
              WhatsApp
            </a>
            <a
              href="https://shopee.com.br/orume3d?entryPoint=ShopBySearch&searchKeyword=orume3d"
              target="_blank"
              rel="noreferrer"
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#b77b2d] via-[#e3b65b] to-[#b6792b] px-5 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-black shadow-glow transition hover:brightness-110"
            >
              <span className="relative z-10">Comprar na Shopee</span>
              <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-white/30 blur-sm transition-all duration-700 group-hover:left-[120%]" />
            </a>
          </div>
        </div>

        <div className="mt-9 h-px orume-gold-line opacity-30" />
        <div className="mt-5 flex flex-col gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-stone-700 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Orume 3D</span>
          <span>Feito camada por camada.</span>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
