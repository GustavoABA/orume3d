import { ArrowUpIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 420;

const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 left-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent/20 bg-black/80 text-accent/75 shadow-gold-soft backdrop-blur transition-all duration-300 hover:border-accent/55 hover:text-accentLight ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
};

export default BackToTopButton;
