(() => {
  const WHATSAPP_PHONE = "5519989342212";
  const AFFILIATES = {
    evelyn: "EVELYN",
  };

  const params = new URLSearchParams(window.location.search);
  const ref = (params.get("ref") || "").trim().toLowerCase();
  const affiliateName = AFFILIATES[ref];

  if (!affiliateName) return;

  const whatsappBase = `https://wa.me/${WHATSAPP_PHONE}`;
  const affiliateMessage = `VIM PELA ${affiliateName}`;

  const updateWhatsappLinks = () => {
    document.querySelectorAll(`a[href^="${whatsappBase}"]`).forEach((link) => {
      const currentHref = link.getAttribute("href") || whatsappBase;
      let currentMessage = "";

      try {
        currentMessage = new URL(currentHref, window.location.href).searchParams.get("text")?.trim() || "";
      } catch {
        currentMessage = "";
      }

      const message = currentMessage.toUpperCase().startsWith(affiliateMessage)
        ? currentMessage
        : [affiliateMessage, currentMessage].filter(Boolean).join("\n\n");

      link.setAttribute("href", `${whatsappBase}?text=${encodeURIComponent(message)}`);
    });
  };

  updateWhatsappLinks();

  const observer = new MutationObserver(() => updateWhatsappLinks());
  observer.observe(document.body, { childList: true, subtree: true });
})();
