(function () {
  "use strict";

  var PROFILE_URL = "https://www.instagram.com/orume3d/";
  var LINKS_URL = "./instagram/links.json";
  var EVENT_NAME = "orume:instagram-links";
  var MAX_POSTS = 12;
  var REQUEST_TIMEOUT_MS = 9000;

  var proxyReaders = [
    function (targetUrl) {
      return fetch(
        "https://api.allorigins.win/raw?url=" + encodeURIComponent(targetUrl),
        { cache: "no-store" }
      ).then(function (response) {
        if (!response.ok) throw new Error("AllOrigins raw: " + response.status);
        return response.text();
      });
    },
    function (targetUrl) {
      return fetch(
        "https://api.allorigins.win/get?url=" + encodeURIComponent(targetUrl),
        { cache: "no-store" }
      ).then(function (response) {
        if (!response.ok) throw new Error("AllOrigins get: " + response.status);
        return response.json();
      }).then(function (payload) {
        return typeof payload.contents === "string" ? payload.contents : "";
      });
    }
  ];

  function normalizeMarkup(markup) {
    return String(markup || "")
      .replace(/\\u002F/gi, "/")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&");
  }

  function extractPostLinks(markup) {
    var normalized = normalizeMarkup(markup);
    var matcher = /(?:https?:\/\/(?:www\.)?instagram\.com)?\/(p|reel)\/([A-Za-z0-9_-]{5,64})(?:\/|[?"'\\<]|$)/gi;
    var links = [];
    var seen = Object.create(null);
    var match;

    while ((match = matcher.exec(normalized)) && links.length < MAX_POSTS) {
      var link = "https://www.instagram.com/" + match[1].toLowerCase() + "/" + match[2] + "/";
      if (!seen[link]) {
        seen[link] = true;
        links.push(link);
      }
    }

    return links;
  }

  function normalizeLink(value) {
    var match = String(value || "").match(/https?:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([A-Za-z0-9_-]{5,64})/i);
    return match
      ? "https://www.instagram.com/" + match[1].toLowerCase() + "/" + match[2] + "/"
      : "";
  }

  function cleanLinks(values) {
    var seen = Object.create(null);
    return values.map(normalizeLink).filter(function (link) {
      if (!link) return false;
      if (seen[link]) return false;
      seen[link] = true;
      return true;
    }).slice(0, MAX_POSTS);
  }

  function loadConfiguredLinks() {
    return fetch(LINKS_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("links.json: " + response.status);
        return response.json();
      })
      .then(function (values) {
        if (!Array.isArray(values)) throw new Error("links.json precisa ser uma lista");
        return cleanLinks(values);
      });
  }

  function publish(links, source) {
    api.links = links.slice();
    api.source = source;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { links: api.links.slice(), source: source }
    }));
  }

  function readWithTimeout(reader, targetUrl) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    // AllOrigins nao encaminha o signal da mesma forma em todas as respostas;
    // o Promise.race ainda limita o tempo que o site espera pelo proxy.
    return Promise.race([
      reader(targetUrl),
      new Promise(function (_, reject) {
        controller.signal.addEventListener("abort", function () {
          reject(new Error("Tempo limite do proxy"));
        }, { once: true });
      })
    ]).finally(function () {
      window.clearTimeout(timer);
    });
  }

  async function discover() {
    var configuredLinks = [];

    try {
      configuredLinks = await loadConfiguredLinks();
      if (configuredLinks.length) publish(configuredLinks, "json");
    } catch (_) {
      // A pagina preserva o feed gerado no HTML caso o JSON fique indisponivel.
    }

    for (var index = 0; index < proxyReaders.length; index += 1) {
      try {
        var cacheBuster = PROFILE_URL + "?__orume_refresh=" + Date.now();
        var markup = await readWithTimeout(proxyReaders[index], cacheBuster);
        var discovered = extractPostLinks(markup);
        if (discovered.length) {
          publish(cleanLinks(discovered.concat(configuredLinks)), "proxy");
          return api.links;
        }
      } catch (_) {
        // O proximo leitor e tentado automaticamente. O fallback permanece visivel.
      }
    }

    return api.links;
  }

  var api = {
    profile: PROFILE_URL,
    links: [],
    source: "loading",
    refresh: discover,
    extract: extractPostLinks,
    normalize: normalizeLink
  };

  window.OrumeInstagramLinks = api;
  discover();
})();
