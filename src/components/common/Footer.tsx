import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';

const Footer = () => {
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);

  return (
    <>
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="border-t border-white/10 bg-surface/60 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright {new Date().getFullYear()} ShopLite Store. Crafted with care for modern explorers.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span>Privacy</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" aria-hidden="true" />
            <span>Terms</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" aria-hidden="true" />
            <span>Support</span>
            <button
              type="button"
              onClick={() => setIsDeveloperModalOpen(true)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              About Developer
            </button>
          </div>
        </div>
      </motion.footer>

      <DeveloperModal open={isDeveloperModalOpen} onClose={() => setIsDeveloperModalOpen(false)} />
    </>
  );
};

type DeveloperModalProps = {
  open: boolean;
  onClose: () => void;
};

const DeveloperModal = ({ open, onClose }: DeveloperModalProps) => (
  <AnimatePresence>
    {open && (
      <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
        <div className="flex min-h-full items-center justify-center px-4 py-8">
          <Dialog.Overlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70"
          />

          <Dialog.Panel
            as={motion.div}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface/90 via-surface/70 to-white/5 p-8 text-slate-200 shadow-2xl shadow-black/50 backdrop-blur"
          >
            <div className="space-y-4">
              <Dialog.Title className="text-2xl font-semibold text-white">About the Developer</Dialog.Title>
              <p className="text-sm text-slate-300">
                Created by Salama Malek
                <br />
                Full-Stack Developer — React | TypeScript | Node.js
                <br />
                Based in Moscow, Russia
              </p>
              <p className="text-sm text-slate-300">
                Passionate about clean UI, scalable systems, and multilingual digital experiences.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href="https://github.com/Salama-Malek"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:border-accent/60 hover:text-accent"
                >
                  GitHub: https://github.com/Salama-Malek
                </a>
                <a
                  href="https://www.linkedin.com/in/salama-malek"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:border-accent/60 hover:text-accent"
                >
                  LinkedIn: https://www.linkedin.com/in/salama-malek
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    )}
  </AnimatePresence>
);

export default Footer;
