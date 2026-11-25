(function () {
  if (
    document.querySelector(".evan-widget") ||
    /(?:assistant-jason|concept-evan)\.html$/.test(location.pathname)
  ) {
    return;
  }

  var path = location.pathname;
  var page = path.split("/").filter(Boolean).pop() || "";
  if (path.indexOf("/magasin/macon") !== -1) page = "magasin-macon";
  if (path.indexOf("/services/laptop-repair") !== -1) page = "solution-informatique.html";

  var contexts = {
    "reconditionnes.html": {
      label: "Smartphones reconditionnés",
      title: "Quel téléphone recherchez-vous ?",
      items: [
        "Quels iPhone ou Samsung reconditionnés avez-vous en vitrine ?",
        "Je veux réserver un smartphone reconditionné 24h en boutique",
        "Combien pouvez-vous reprendre mon ancien téléphone ?",
      ],
    },
    "accessoires.html": {
      label: "Solution Accessoires",
      title: "Quel accessoire ou service vous faut-il ?",
      items: [
        "Posez-vous une protection Hydrogel sur mesure en boutique ?",
        "Avez-vous des chargeurs rapides certifiés et coques MagSafe ?",
        "Comment fonctionne le rachat cash de mon téléphone ?",
      ],
    },
    "hydrogel.html": {
      label: "Protection Hydrogel",
      title: "Quelle protection pour votre écran ?",
      items: [
        "Hydrogel sur mesure ou verre trempé : que conseillez-vous ?",
        "Protégez-vous aussi les écrans incurvés et les tablettes ?",
        "Combien de temps prend la pose en magasin ?",
      ],
    },
    "reparation-samsung.html": {
      label: "Réparation Samsung & Android",
      title: "Quel est le problème sur votre appareil ?",
      items: [
        "Quel est le prix d’un écran ou d’une batterie Samsung ?",
        "Où en est ma réparation en cours à l’atelier ?",
        "Le Bonus QualiRépar de 25 € s’applique-t-il sur Samsung ?",
      ],
    },
    "remplacement-ecran-samsung-macon.html": {
      label: "Écran Samsung Mâcon",
      title: "Quel modèle Samsung souhaitez-vous réparer ?",
      items: [
        "Combien coûte le remplacement d’écran sur mon Samsung ?",
        "Utilisez-vous des écrans Service Pack d’origine ?",
        "Où en est ma réparation déposée à l’atelier ?",
      ],
    },
    "ecran-iphone-casse-macon.html": {
      label: "Écran iPhone Mâcon",
      title: "Quel modèle d’iPhone a l’écran cassé ?",
      items: [
        "Quel est le tarif écran pour mon modèle d’iPhone ?",
        "Quelle différence entre LCD/LTPS, Soft OLED et ReLife ?",
        "Où en est mon iPhone déposé en réparation ?",
      ],
    },
    "remplacement-batterie-telephone-macon.html": {
      label: "Batterie téléphone Mâcon",
      title: "Une batterie à remplacer rapidement ?",
      items: [
        "Combien coûte le changement de batterie sur mon téléphone ?",
        "Est-ce éligible au Bonus QualiRépar de 25 € ?",
        "Combien de temps dure le remplacement sur place ?",
      ],
    },
    "reparation-telephone-macon.html": {
      label: "Atelier Mâcon",
      title: "Dites-moi votre modèle, la panne ou suivez votre dossier.",
      items: [
        "Obtenir le tarif exact pour mon téléphone",
        "Où en est ma réparation en cours à l’atelier ?",
        "Mon téléphone ne charge plus ou s’éteint tout seul",
      ],
    },
    "reparation-iphone.html": {
      label: "Réparation iPhone",
      title: "Une question sur votre iPhone ?",
      items: [
        "Tarif écran ou batterie selon mon modèle d’iPhone",
        "Mon iPhone redémarre tout seul (diagnostic Panic-Full)",
        "Où en est mon iPhone déposé à l’atelier ?",
      ],
    },
    "solution-informatique.html": {
      label: "Solution Informatique & Consoles",
      title: "PC, Mac ou console à dépanner ?",
      items: [
        "Mon PC est lent ou bloqué par des virus : quel tarif ?",
        "Remplacement d’écran ou de batterie sur PC portable / MacBook",
        "Réparez-vous les ports HDMI et la surchauffe sur PS5 / Switch ?",
      ],
    },
    "atelier.html": {
      label: "Atelier Solution Phone",
      title: "Une question pour Sébastien et l’équipe ?",
      items: [
        "Où en est ma réparation en cours à l’atelier ?",
        "Comment fonctionne le Bonus QualiRépar de 25 € ?",
        "Faites-vous les attestations d’irréparabilité assurance ?",
      ],
    },
    "magasin-macon": {
      label: "Nos 3 boutiques à Mâcon",
      title: "Infos pratiques, tarifs ou suivi en direct ?",
      items: [
        "Quels sont vos horaires d’ouverture aujourd’hui ?",
        "Où en est ma réparation au 21 rue Gambetta ?",
        "Voir les smartphones reconditionnés disponibles en vitrine",
      ],
    },
    "faq.html": {
      label: "Questions fréquentes",
      title: "Je vous réponds immédiatement sur tout.",
      items: [
        "Où en est ma réparation en cours ?",
        "Conditions du Bonus QualiRépar -25 € et garantie 6 mois",
        "Vérifier les téléphones reconditionnés disponibles",
      ],
    },
    "actualites.html": {
      label: "Conseils & diagnostic",
      title: "Un doute sur votre appareil ?",
      items: [
        "Mon téléphone chauffe ou perd vite sa batterie",
        "Mon téléphone est tombé dans l’eau : que faire tout de suite ?",
        "Vaut-il mieux réparer ou passer sur un reconditionné ?",
      ],
    },
    "cgv.html": {
      label: "Garanties & conditions",
      title: "Besoin d’une précision claire ?",
      items: [
        "Quelle est la garantie sur vos réparations et vos reconditionnés ?",
        "Le devis est-il gratuit en boutique ?",
        "Parler directement à Sébastien",
      ],
    },
    "politique-confidentialite.html": {
      label: "Confidentialité",
      title: "Une question sur vos données ?",
      items: [
        "Comment sont protégées mes données lors d’une réparation ?",
        "Comment exercer mes droits RGPD ?",
        "Contacter directement Sébastien",
      ],
    },
    "roulette.html": {
      label: "Roue Cadeaux Solution Phone",
      title: "Une question sur le jeu ou la boutique ?",
      items: [
        "Comment récupérer mon cadeau au 21 rue Gambetta ?",
        "Voir les téléphones reconditionnés disponibles",
        "Demander un tarif de réparation",
      ],
    },
  };

  var ctx = contexts[page] || {
    label: "Solution Phone Mâcon",
    title: "Posez votre question ou suivez votre réparation",
    items: [
      "Obtenir un tarif de réparation téléphone, PC ou console",
      "Où en est ma réparation en cours à l’atelier ?",
      "Voir ou réserver un smartphone reconditionné en vitrine",
    ],
  };

  var oldCrispButton = document.getElementById("crispFloatBtn");
  if (oldCrispButton) oldCrispButton.remove();
  if (window.$crisp && Array.isArray(window.$crisp)) window.$crisp.push(["do", "chat:hide"]);

  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/jason-widget.css?v=3";
  document.head.appendChild(css);

  var brainUrl = "https://vps-8066c206.vps.ovh.net/api/public/jason-brain";
  var tokenKey = "jason_conversation_token";
  var historyKey = "jason_conversation_history_v2";
  var metricToken = "";
  var history = [];
  var pendingImageDataUrl = null;

  try {
    metricToken = sessionStorage.getItem(tokenKey) || "";
    var rawHist = sessionStorage.getItem(historyKey);
    if (rawHist) {
      var parsedHist = JSON.parse(rawHist);
      if (Array.isArray(parsedHist)) history = parsedHist.slice(-8);
    }
  } catch (e) {}

  var metricOpened = false;
  var pollTimer = null;
  var pollCount = 0;
  var metricPage = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "/audit-local/" + path.replace(/^\/+/, "")
    : path;

  function saveState() {
    try {
      if (metricToken) sessionStorage.setItem(tokenKey, metricToken);
      sessionStorage.setItem(historyKey, JSON.stringify(history.slice(-8)));
    } catch (e) {}
  }

  function trackMetric(event, metadata) {
    return fetch(brainUrl, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: event,
        conversation_token: metricToken || undefined,
        event_metadata: metadata || {},
        context: { page: metricPage, consent_to_store: false },
      }),
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.conversation_token) {
          metricToken = data.conversation_token;
          saveState();
        }
      })
      .catch(function () {});
  }

  function ensureMetricOpened() {
    if (!metricOpened) {
      metricOpened = true;
      trackMetric("assistant_opened", { source: "page_widget", page: page || "home" });
    }
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }

  function formatRichHtml(text) {
    var safe = escapeHtml(text);
    safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    var paragraphs = safe.split(/\n{2,}/);
    return paragraphs
      .map(function (block) {
        return "<p>" + block.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function compressImageFile(file, callback) {
    if (!file || !/^image\//i.test(file.type)) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var maxSide = 1080;
        var w = img.width;
        var h = img.height;
        if (w > maxSide || h > maxSide) {
          if (w >= h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx2d = canvas.getContext("2d");
        ctx2d.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.76);
        if (dataUrl.length > 540000) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.58);
        }
        callback(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  var directWaUrl =
    "https://wa.me/33783921884?text=" +
    encodeURIComponent("Bonjour Sébastien, je viens de la page « " + ctx.label + " » sur solution-phone.fr : ");
  var directMailSubject = "Demande depuis " + ctx.label + " — Solution Phone";
  var directMailBody =
    "Bonjour Sébastien,\n\nJe viens de la page « " +
    ctx.label +
    " » du site Solution Phone.\n\nMa demande : \nMon appareil : \n\nMerci.";
  var directMailUrl =
    "mailto:contact@solution-phone.fr?subject=" +
    encodeURIComponent(directMailSubject) +
    "&body=" +
    encodeURIComponent(directMailBody);

  var root = document.createElement("aside");
  root.className = "evan-widget";
  root.setAttribute("aria-label", "L’assistant de Sébastien — Solution Phone");
  root.innerHTML =
    '<input type="file" class="sp-jason-file-input" accept="image/*" hidden>' +
    '<div class="evan-widget-panel">' +
    '<div class="evan-widget-head">' +
    '<span class="evan-widget-avatar" aria-hidden="true"></span>' +
    "<div><b>Sébastien · Solution Phone</b><span>Comptoir IA 24h/24 · Suivi, Photo & Relais Mâcon</span></div>" +
    '<button class="evan-widget-back" type="button" title="Revenir aux suggestions" aria-label="Revenir aux suggestions">↺</button>' +
    '<button class="evan-widget-close" type="button" aria-label="Fermer">×</button>' +
    "</div>" +
    '<div class="evan-widget-body">' +
    '<small class="evan-widget-context">' +
    escapeHtml(ctx.label) +
    "</small>" +
    "<p>" +
    escapeHtml(ctx.title) +
    "</p>" +
    '<div class="evan-widget-suggestions">' +
    ctx.items
      .map(function (item) {
        return (
          '<button type="button" data-question="' +
          escapeHtml(item) +
          '">' +
          escapeHtml(item) +
          "<span>→</span></button>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="sp-jason-photo-bar" data-photo-bar="starter"><img alt="Photo jointe"><span>Photo prête à envoyer</span><button type="button" aria-label="Retirer la photo">×</button></div>' +
    '<form class="evan-widget-form" data-form="starter">' +
    '<button type="button" class="sp-jason-cam-btn" title="Envoyer la photo de votre appareil" aria-label="Joindre une photo">📷</button>' +
    '<input type="text" aria-label="Votre question" placeholder="Tarif, suivi REP-..., photo 📷 ou réservation…">' +
    '<button type="submit" aria-label="Envoyer">→</button>' +
    "</form>" +
    '<div class="evan-widget-direct">' +
    '<a href="' +
    directWaUrl +
    '" target="_blank" rel="noopener">WhatsApp direct</a>' +
    '<a href="' +
    directMailUrl +
    '">E-mail</a>' +
    "<span>21 rue Gambetta · Mâcon</span>" +
    "</div>" +
    "</div>" +
    '<div class="evan-widget-conversation">' +
    '<div class="sp-jason-thread" aria-live="polite"></div>' +
    '<div class="sp-jason-chips"></div>' +
    '<div class="sp-jason-composer">' +
    '<div class="sp-jason-photo-bar" data-photo-bar="followup"><img alt="Photo jointe"><span>Photo prête à envoyer</span><button type="button" aria-label="Retirer la photo">×</button></div>' +
    '<form class="evan-widget-form" data-form="followup">' +
    '<button type="button" class="sp-jason-cam-btn" title="Envoyer une photo à Sébastien" aria-label="Joindre une photo">📷</button>' +
    '<input type="text" aria-label="Continuer la discussion" placeholder="Répondre, joindre une photo 📷 ou réserver…">' +
    '<button type="submit" aria-label="Envoyer">→</button>' +
    "</form>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<button class="evan-widget-launch" type="button" aria-expanded="false" aria-label="Demandez à Sébastien">' +
    '<span class="evan-widget-avatar" aria-hidden="true"></span><i></i>' +
    "<span><b>Demandez à Sébastien</b><small>Tarifs · Suivi · Photo · Stock</small></span>" +
    "</button>";

  document.body.appendChild(root);

  var fileInput = root.querySelector(".sp-jason-file-input");
  var launch = root.querySelector(".evan-widget-launch");
  var closeBtn = root.querySelector(".evan-widget-close");
  var backBtn = root.querySelector(".evan-widget-back");
  var starterForm = root.querySelector('form[data-form="starter"]');
  var starterInput = starterForm.querySelector('input[type="text"]');
  var followupForm = root.querySelector('form[data-form="followup"]');
  var followupInput = followupForm.querySelector('input[type="text"]');
  var followupBtn = followupForm.querySelector('button[type="submit"]');
  var camBtns = root.querySelectorAll(".sp-jason-cam-btn");
  var photoBars = root.querySelectorAll(".sp-jason-photo-bar");
  var threadEl = root.querySelector(".sp-jason-thread");
  var chipsEl = root.querySelector(".sp-jason-chips");
  var currentWaUrl = directWaUrl;

  function syncPhotoPreview() {
    camBtns.forEach(function (b) {
      b.classList.toggle("has-photo", Boolean(pendingImageDataUrl));
    });
    photoBars.forEach(function (bar) {
      bar.classList.toggle("visible", Boolean(pendingImageDataUrl));
      var img = bar.querySelector("img");
      if (img && pendingImageDataUrl) img.src = pendingImageDataUrl;
    });
  }

  camBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      ensureMetricOpened();
      fileInput.click();
    });
  });

  photoBars.forEach(function (bar) {
    var clearBtn = bar.querySelector("button");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        pendingImageDataUrl = null;
        fileInput.value = "";
        syncPhotoPreview();
      });
    }
  });

  fileInput.addEventListener("change", function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    compressImageFile(f, function (dataUrl) {
      pendingImageDataUrl = dataUrl;
      syncPhotoPreview();
      var activeInput = root.classList.contains("conversation-open") ? followupInput : starterInput;
      activeInput.focus();
    });
  });

  function scrollThread() {
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function appendBubble(cls, htmlContent) {
    var div = document.createElement("div");
    div.className = "sp-jason-msg " + cls;
    div.innerHTML = htmlContent;
    threadEl.appendChild(div);
    scrollThread();
    return div;
  }

  function renderChips(quickReplies, waUrl) {
    if (waUrl) currentWaUrl = waUrl;
    chipsEl.innerHTML = "";
    var list = Array.isArray(quickReplies) && quickReplies.length
      ? quickReplies
      : [
          { label: "Continuer sur WhatsApp avec Sébastien", action: "whatsapp" },
          { label: "Où en est ma réparation ?", value: "Où en est ma réparation en cours à l’atelier ?" },
        ];
    list.slice(0, 3).forEach(function (item) {
      if (item.action === "whatsapp") {
        var a = document.createElement("a");
        a.className = "sp-jason-chip sp-jason-chip--wa";
        a.href = currentWaUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "💬 " + item.label;
        a.addEventListener("click", function () {
          trackMetric("whatsapp_clicked", { source: "assistant_chip", page: page || "home" });
        });
        chipsEl.appendChild(a);
      } else if (item.action === "mail") {
        var m = document.createElement("a");
        m.className = "sp-jason-chip";
        m.href = directMailUrl;
        m.textContent = "✉️ " + item.label;
        m.addEventListener("click", function () {
          trackMetric("email_clicked", { source: "assistant_chip", page: page || "home" });
        });
        chipsEl.appendChild(m);
      } else if (item.value) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sp-jason-chip";
        b.textContent = item.label;
        b.addEventListener("click", function () {
          ask(item.value);
        });
        chipsEl.appendChild(b);
      }
    });
  }

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    pollCount = 0;
  }

  function startSebastienPolling() {
    stopPolling();
    if (!metricToken) return;
    var note = document.createElement("div");
    note.className = "sp-jason-relay-note";
    note.textContent = "📡 Transmis en direct à Sébastien à l’atelier — s’il est disponible, sa réponse s’affichera ici automatiquement.";
    threadEl.appendChild(note);
    scrollThread();

    function pollOnce() {
      pollCount += 1;
      fetch(brainUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll: true, conversation_token: metricToken }),
      })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (data) {
          if (data && data.status === "answered" && data.answer) {
            stopPolling();
            if (note.parentNode) note.remove();
            appendBubble(
              "sp-jason-msg--live",
              "<strong>👨‍🔧 Sébastien (en direct de l’atelier) :</strong><br>" + formatRichHtml(data.answer),
            );
            history.push({ role: "assistant", content: data.answer });
            saveState();
            return;
          }
          if (pollCount < 15) {
            pollTimer = setTimeout(pollOnce, 8000);
          }
        })
        .catch(function () {
          if (pollCount < 15) pollTimer = setTimeout(pollOnce, 10000);
        });
    }
    pollTimer = setTimeout(pollOnce, 6000);
  }

  function hydrateExistingHistory() {
    threadEl.innerHTML = "";
    history.forEach(function (turn) {
      appendBubble(
        turn.role === "user" ? "sp-jason-msg--user" : "sp-jason-msg--bot",
        turn.role === "user" ? escapeHtml(turn.content) : formatRichHtml(turn.content),
      );
    });
  }

  function toggle(force) {
    var open = typeof force === "boolean" ? force : !root.classList.contains("open");
    root.classList.toggle("open", open);
    launch.setAttribute("aria-expanded", String(open));
    if (open) {
      ensureMetricOpened();
      if (history.length > 0 && !root.classList.contains("conversation-open")) {
        root.classList.add("conversation-open");
        hydrateExistingHistory();
        renderChips(null, currentWaUrl);
      }
      setTimeout(function () {
        (root.classList.contains("conversation-open") ? followupInput : starterInput).focus();
      }, 80);
    }
  }

  function ask(question) {
    var attachedImg = pendingImageDataUrl;
    var clean = String(question || "").trim();
    if (!clean && attachedImg) {
      clean = "Voici la photo de mon appareil : quel est votre diagnostic et le tarif ?";
    }
    if (!clean) return;

    pendingImageDataUrl = null;
    fileInput.value = "";
    syncPhotoPreview();

    ensureMetricOpened();
    if (!root.classList.contains("conversation-open")) {
      root.classList.add("conversation-open");
      hydrateExistingHistory();
    }
    toggle(true);
    starterInput.value = "";
    followupInput.value = "";
    followupBtn.disabled = true;
    chipsEl.innerHTML = "";

    var userBubbleHtml =
      (attachedImg ? '<img class="sp-jason-user-thumb" src="' + attachedImg + '" alt="Photo envoyée">' : "") +
      escapeHtml(clean);
    appendBubble("sp-jason-msg--user", userBubbleHtml);

    var typingEl = appendBubble(
      "sp-jason-msg--bot sp-jason-msg--typing",
      attachedImg
        ? "Analyse visuelle de votre photo et vérification des stocks en cours…"
        : "L’assistant de Sébastien vérifie en direct…",
    );

    var priorHistory = history.slice(-8);
    history.push({ role: "user", content: attachedImg ? "[Photo envoyée] " + clean : clean });
    saveState();

    fetch(brainUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: clean,
        image_data_url: attachedImg || undefined,
        conversation_token: metricToken || undefined,
        history: priorHistory,
        context: { page: metricPage, consent_to_store: false },
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("unavailable");
        return r.json();
      })
      .then(function (data) {
        if (typingEl.parentNode) typingEl.remove();
        if (data.conversation_token) metricToken = data.conversation_token;
        var reply = data.answer || "Vous pouvez nous joindre directement sur WhatsApp au 07 83 92 18 84.";
        appendBubble("sp-jason-msg--bot", formatRichHtml(reply));
        if (data.quote_reference) {
          var badge = document.createElement("div");
          badge.className = "sp-jason-quote-badge";
          badge.textContent = "✅ Enregistré au comptoir Solution Phone : réf. " + data.quote_reference;
          threadEl.appendChild(badge);
          scrollThread();
        }
        history.push({ role: "assistant", content: reply });
        saveState();
        renderChips(data.quick_replies, data.whatsapp_url);
        if (data.needs_expert) {
          startSebastienPolling();
        }
      })
      .catch(function () {
        if (typingEl.parentNode) typingEl.remove();
        appendBubble(
          "sp-jason-msg--bot",
          formatRichHtml(
            "Le service de réponse instantanée est momentanément occupé. Vous pouvez poser votre question directement à **Sébastien sur WhatsApp (07 83 92 18 84)** ou passer sans rendez-vous au **21 rue Gambetta à Mâcon**.",
          ),
        );
        renderChips(null, directWaUrl);
      })
      .finally(function () {
        followupBtn.disabled = false;
        followupInput.focus();
      });
  }

  function resetToSuggestions() {
    stopPolling();
    history = [];
    pendingImageDataUrl = null;
    syncPhotoPreview();
    saveState();
    threadEl.innerHTML = "";
    chipsEl.innerHTML = "";
    root.classList.remove("conversation-open");
    setTimeout(function () {
      starterInput.focus();
    }, 80);
  }

  launch.addEventListener("click", function () {
    toggle();
  });
  closeBtn.addEventListener("click", function () {
    toggle(false);
  });
  backBtn.addEventListener("click", resetToSuggestions);

  root.querySelectorAll("[data-question]").forEach(function (button) {
    button.addEventListener("click", function () {
      ask(button.getAttribute("data-question"));
    });
  });
  document.querySelectorAll("[data-evan-question]").forEach(function (button) {
    button.addEventListener("click", function () {
      ask(button.getAttribute("data-evan-question"));
    });
  });

  starterForm.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(starterInput.value);
  });
  followupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(followupInput.value);
  });

  root.querySelector('a[href*="wa.me"]').addEventListener("click", function () {
    ensureMetricOpened();
    trackMetric("whatsapp_clicked", { source: "page_widget_direct", page: page || "home" });
  });
  root.querySelector('a[href^="mailto:"]').addEventListener("click", function () {
    ensureMetricOpened();
    trackMetric("email_clicked", { source: "page_widget_direct", page: page || "home" });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") toggle(false);
  });
})();
