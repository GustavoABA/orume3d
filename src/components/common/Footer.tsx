import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { motion } from 'framer-motion';

const Footer = () => {
  const logo = '/brand/orume-mark.webp';

  const socialLinks = [
    { label: 'Instagram', handle: '@orume3d', href: 'https://www.instagram.com/orume3d/' },
    { label: 'TikTok', handle: '@orume3d', href: 'https://www.tiktok.com/@orume3d' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="border-t border-paper/[0.07] bg-background/92"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/15 bg-surface">
                <img src={logo} alt="" className="h-8 w-8 object-contain" />
              </span>
              <div>
                <p className="text-xl font-black tracking-[0.16em] text-paper">ORUME</p>
                <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-muted">
                  impressão 3D • design • projetos
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="orume-eyebrow">Acompanhe a Orume</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-full border border-paper/10 bg-paper/[0.025] px-4 py-2 text-xs transition hover:border-accent/35 hover:bg-accent/[0.06]"
                    aria-label={`Seguir a Orume no ${social.label}`}
                  >
                    <span className="font-bold text-paper group-hover:text-accentLight">
                      {social.label}
                    </span>
                    <span className="ml-2 text-muted">{social.handle}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={buildWhatsAppUrl('Olá, vim pelo site da orume e gostaria de tirar uma dúvida.')}
              target="_blank"
              rel="noreferrer"
              className="orume-secondary"
            >
              WhatsApp
            </a>
            <a
              href="https://shopee.com.br/orume3d?entryPoint=ShopBySearch&searchKeyword=orume3d"
              target="_blank"
              rel="noreferrer"
              className="orume-primary"
            >
              Comprar na Shopee
            </a>
          </div>
        </div>

        <div className="mt-9 h-px orume-green-line opacity-30" />
        <div className="mt-5 flex flex-col gap-2 text-[0.6rem] uppercase tracking-[0.14em] text-muted sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Orume 3D</span>
          <span>Feito camada por camada.</span>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
