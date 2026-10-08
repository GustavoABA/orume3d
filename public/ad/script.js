(() => {
  'use strict';
  const INTERVAL_MS = 40 * 60 * 1000;
  const TEST_MODE = new URLSearchParams(location.search).has('test');
  const SEEK_SECONDS = Number(new URLSearchParams(location.search).get('seek')) || 0;
  const SITE_URL = window.location.origin.replace(/\/$/, '') + '/';
  let timer = null;
  let master = null;
  let lastSynchronizedPlay = 0;
  const syncChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('orume-ad-sync-v1') : null;

  function makeParticles() {
    const host = document.querySelector('.particles');
    for (let i = 0; i < 24; i += 1) {
      const dot = document.createElement('i');
      dot.style.cssText = `position:absolute;left:${Math.random()*100}%;top:${Math.random()*100}%;width:${2+Math.random()*5}px;height:${2+Math.random()*5}px;border-radius:50%;background:${i%4===0?'#dfaa4e':'#24dd75'};opacity:${.08+Math.random()*.25};filter:blur(${Math.random()*2}px);box-shadow:0 0 16px currentColor;animation:particle ${10+Math.random()*20}s linear ${-Math.random()*20}s infinite`;
      host.appendChild(dot);
    }
  }

  function catalogJsonp(endpoint, params = {}, timeoutMs = 45000) {
    return new Promise((resolve, reject) => {
      const callback = '__orume_ad_' + Math.random().toString(36).slice(2);
      const tag = document.createElement('script');
      let settled = false;

      const cleanup = () => {
        clearTimeout(timer);
        try { delete window[callback]; } catch { window[callback] = undefined; }
        tag.remove();
      };

      window[callback] = data => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(data);
      };

      tag.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('catálogo indisponível'));
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('timeout do catálogo'));
      }, timeoutMs);

      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.set(key, String(value));
      });
      query.set('callback', callback);
      query.set('_', String(Date.now()));

      tag.src = endpoint + '?' + query.toString();
      tag.async = true;
      document.head.appendChild(tag);
    });
  }

  let pendingProjects = null;
  function refreshProjects() {
    if (pendingProjects) return pendingProjects;
    pendingProjects = updateProjects().finally(() => { pendingProjects = null; });
    return pendingProjects;
  }

  async function updateProjects() {
    try {
      const configResponse = await fetch(`${SITE_URL}intake-config.json?live=${Date.now()}`, { cache: 'no-store' });
      if (!configResponse.ok) throw new Error('configuração indisponível');

      const config = await configResponse.json();
      if (!config?.endpoint) throw new Error('endpoint ausente');

      const result = await catalogJsonp(config.endpoint, { action: 'catalog' });
      if (!result?.ok || !Array.isArray(result.products)) throw new Error('catálogo inválido');
      const products = result.products.flatMap(product => {
        const images = Array.isArray(product?.images) ? product.images : [];
        const src = product?.image || product?.imageMain || product?.mainImage ||
          product?.detectedImage || product?.['Imagem principal'] || images.find(Boolean);
        if (!src) return [];
        try {
          const url = new URL(String(src).replace(/^http:\/\//i, 'https://'), SITE_URL);
          if (!['https:', 'http:'].includes(url.protocol)) return [];
          return [{ id: String(product.id || url.href), image: url.href, name: String(product.name || 'Produto da Orume 3D') }];
        } catch { return []; }
      });
      const slots = [...document.querySelectorAll('.feed-image')];
      const selected = window.ORUME_AD_SELECTION.pick(products, slots.length);
      slots.forEach((image, index) => {
        image.style.objectFit = '';
        image.style.padding = '';
        image.onerror = () => {
          image.onerror = null;
          image.src = '/brand/orume-mark-transparent.png';
          image.style.objectFit = 'contain';
          image.style.padding = '12%';
        };
        image.src = selected[index]?.image || '/brand/orume-mark-transparent.png';
        image.alt = selected[index]?.name || 'Orume 3D';
      });

      document.querySelector('#feed-label').textContent =
        selected.length > 1 ? 'CATÁLOGO ORUME ATUALIZADO' : 'PRODUTO ORUME EM DESTAQUE';
    } catch (error) {
      console.warn('ORUME AD: catálogo não carregou', error);
      document.querySelector('#feed-label').textContent = 'CATÁLOGO ORUME';
    }
  }

  function buildTimeline() {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onComplete: () => document.body.classList.remove('active') });
    gsap.set('.chapter', { autoAlpha: 0 });
    gsap.set('#progress', { width: '100%', scaleX: 0, transformOrigin: 'left center' });
    gsap.set('.opening-copy', { autoAlpha: 0, x: '-3vw' });
    gsap.set('.logo-reveal', { autoAlpha: 1 });
    gsap.set('.logo-reveal img', { autoAlpha: 0, scale: .82, rotation: -5 });
    gsap.set('.print-rail', { autoAlpha: 0, top: '84%' });
    gsap.set('.print-layers', { autoAlpha: 1, height: 0 });
    gsap.set('.project-card', { autoAlpha: 0, xPercent: 28, rotation: 4, scale: .94 });
    gsap.set(['.phase-phone', '.phase-truck', '.copy-2', '.copy-3', '.history-chip'], { autoAlpha: 0 });
    gsap.set(['.phase-person', '.copy-1'], { autoAlpha: 1 });

    tl.to('#progress', { scaleX: 1, duration: 90, ease: 'none' }, 0);

    tl.to('.opening', { autoAlpha: 1, duration: .7 }, 0)
      .to('.opening-copy', { autoAlpha: 1, x: 0, duration: .8 }, .25)
      .to('.print-rail', { autoAlpha: 1, duration: .25 }, 1.8)
      .to('.print-layers', { height: '64%', duration: 5.4, ease: 'none' }, 2.1)
      .to('.print-rail', { top: '20%', duration: 5.4, ease: 'none' }, 2.1)
      .to('.print-nozzle', { xPercent: 430, duration: .36, repeat: 13, yoyo: true, ease: 'sine.inOut' }, 2.15)
      .to(['.print-rail', '.print-layers'], { autoAlpha: 0, duration: .65 }, 7.6)
      .to('.logo-reveal img', { autoAlpha: 1, scale: 1, rotation: 0, duration: .8 }, 7.65)
      .to('.opening', { autoAlpha: 0, y: '-1.5vh', duration: .8 }, 18.1);

    tl.to('.projects', { autoAlpha: 1, y: 0, duration: .65 }, 19.1);
    [['.card-1',20.2],['.card-2',26.5],['.card-3',32.8]].forEach(([card, start]) => {
      tl.to(card, { autoAlpha: 1, xPercent: 0, rotation: 0, scale: 1, duration: .55 }, start)
        .to(card, { autoAlpha: 0, xPercent: -34, rotation: -4, scale: .94, duration: .55 }, start + 4.9);
    });
    tl.to('.auto-hint b', { x: '1.1vw', duration: .45, repeat: 16, yoyo: true, ease: 'sine.inOut' }, 20.2)
      .to('.projects', { autoAlpha: 0, y: '-1.5vh', duration: .7 }, 39.2);

    tl.to('.journey', { autoAlpha: 1, duration: .65 }, 40.1)
      .to('.person-arm', { rotation: 34, y: '2.3vh', duration: .42, transformOrigin: '8% 50%' }, 42.1)
      .to('.person-arm', { rotation: -8, y: 0, duration: .38 }, 42.55)
      .to('.person-arm', { rotation: 34, y: '2.3vh', duration: .38 }, 43.05)
      .to('.person-arm', { rotation: -8, y: 0, duration: .35 }, 43.45)
      .to('.ok-bubble', { autoAlpha: 1, scale: 1, duration: .35, ease: 'back.out(2)' }, 44.0)
      .to('.chip-1', { autoAlpha: 1, x: 0, duration: .35 }, 45.25)
      .to('.copy-1', { autoAlpha: 0, x: '-2vw', duration: .35 }, 45.25)
      .to('.phase-person', { autoAlpha: 0, scale: .35, rotation: -10, duration: .55 }, 45.35)
      .fromTo('.phase-phone', { autoAlpha: 0, scale: .35, rotation: 12 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: .55, ease: 'back.out(1.6)' }, 45.7)
      .to('.copy-2', { autoAlpha: 1, x: 0, duration: .4 }, 45.9);
    ['.m1','.m2','.m3','.m4'].forEach((message, index) => {
      tl.fromTo(message, { autoAlpha: 0, y: '2vh' }, { autoAlpha: 1, y: 0, duration: .32 }, 46.7 + index * .72);
    });
    tl.to('.chip-2', { autoAlpha: 1, x: 0, duration: .35 }, 50.2)
      .to('.copy-2', { autoAlpha: 0, x: '-2vw', duration: .35 }, 50.2)
      .to('.phase-phone', { autoAlpha: 0, scale: .25, rotation: -12, duration: .5 }, 50.25)
      .fromTo('.phase-truck', { autoAlpha: 0, scale: .2, rotation: 8 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: .65, ease: 'back.out(1.5)' }, 50.55)
      .to('.copy-3', { autoAlpha: 1, x: 0, duration: .42 }, 50.8)
      .to('.delivery-truck', { y: '-1.1vh', duration: .23, repeat: 43, yoyo: true, ease: 'sine.inOut' }, 51.2)
      .to('.delivery-truck>i', { rotation: 1080, duration: 10, ease: 'none' }, 51.2)
      .fromTo('.smoke i', { autoAlpha: 0, x: 0, y: 0, scale: .35 }, { autoAlpha: .65, x: '-5vw', y: '-2vh', scale: 1.7, duration: 1.2, repeat: 7, stagger: .35, ease: 'power1.out' }, 51.2)
      .to('.journey', { autoAlpha: 0, y: '-1.2vh', duration: .7 }, 64.8);

    tl.to('.final', { autoAlpha: 1, scale: 1, duration: .75 }, 65.7)
      .to('.final', { autoAlpha: 0, scale: 1.025, duration: 1.15 }, 88.65);
    tl.to({}, { duration: .2 }, 89.8);
    return tl;
  }

  async function playAd(broadcast = true) {
    const now = Date.now();
    if (now - lastSynchronizedPlay < 3000) return;
    lastSynchronizedPlay = now;
    await refreshProjects();
    document.body.classList.add('gsap-active', 'active');
    if (!master) master = buildTimeline();
    master.restart();
    if (SEEK_SECONDS > 0) master.seek(Math.min(SEEK_SECONDS, 89.8)).pause();
    if (broadcast && !TEST_MODE) syncChannel?.postMessage({ type: 'play', at: now });
  }

  function schedule(delay = INTERVAL_MS) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      playAd();
      schedule();
    }, TEST_MODE ? 500 : delay);
  }

  if (syncChannel) {
    syncChannel.addEventListener('message', event => {
      if (event.data?.type !== 'play' || TEST_MODE) return;
      playAd(false);
      schedule();
    });
  }

  window.addEventListener('obsSourceActiveChanged', event => { if (event.detail?.active) schedule(); });
  window.addEventListener('obsSourceVisibleChanged', event => { if (event.detail?.visible && !timer) schedule(); });
  makeParticles();
  if (TEST_MODE) playAd(); else schedule();
  window.ORUME_AD = { play: playAd, schedule, refreshProjects };
})();
