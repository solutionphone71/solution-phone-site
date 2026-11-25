/* Conversation directe avec Sébastien — Solution Phone Mâcon (3 sites : solution-phone.fr, reparation-iphone-macon.fr, solution-accessoires.fr) */
(function () {
  if (
    document.querySelector(".evan-widget") ||
    document.querySelector(".sp-sebastien-mini") ||
    /(?:assistant-jason|concept-evan)\.html$/.test(location.pathname)
  ) {
    return;
  }

  var host = (location.hostname || "").replace(/^www\./, "");
  var isIphoneSite = host === "reparation-iphone-macon.fr";
  var isAccSite = host === "solution-accessoires.fr";
  var path = location.pathname || "/";
  var page = path.split("/").filter(Boolean).pop() || "";
  if (path.indexOf("/magasin/macon") !== -1) page = "magasin-macon";
  if (path.indexOf("/services/laptop-repair") !== -1) page = "solution-informatique.html";

  function detectPageModel() {
    var heroSel = document.getElementById("hero-model");
    if (heroSel && heroSel.value && heroSel.value.toLowerCase() !== "choisir") {
      var v = String(heroSel.value).trim();
      return /^iphone/i.test(v) ? v : "iPhone " + v;
    }
    var liveBox = document.getElementById("sp-android-live-pricing");
    if (liveBox && liveBox.getAttribute("data-display")) {
      return liveBox.getAttribute("data-display");
    }
    if (/^iphone-/.test(page)) {
      var h1 = document.querySelector("main h1");
      if (h1) {
        var m = h1.textContent.replace(/^Réparation\s+/i, "").replace(/\s+à\s+Mâcon.*$/i, "").trim();
        if (m) return m;
      }
    }
    return "";
  }

  var detectedModel = detectPageModel();

  function buildGreetingAndStarters() {
    if (detectedModel) {
      return {
        label: detectedModel + " · Atelier Mâcon",
        greeting:
          "Bonjour ! Ici **Sébastien** au comptoir du 21 rue Gambetta 👋 Vous regardez pour votre **" +
          detectedModel +
          "** : qu’est-ce qui lui arrive exactement ? Écrivez-moi, joignez une photo 📷 ou parlez au micro 🎙️, on regarde ça ensemble tout de suite !",
        starters: [
          { label: "Écran cassé sur mon " + detectedModel, value: "J’ai cassé l’écran de mon " + detectedModel + ", quel est le tarif ?" },
          { label: "Batterie / autonomie " + detectedModel, value: "Combien coûte le changement de batterie sur mon " + detectedModel + " ?" },
          { label: "Est-ce dispo aujourd’hui ?", value: "Avez-vous la pièce en stock aujourd’hui pour mon " + detectedModel + " ?" },
        ],
      };
    }
    if (isAccSite || /reconditionne|accessoire/.test(page)) {
      return {
        label: "Solution Accessoires · Mâcon",
        greeting:
          "Bonjour ! Ici **Sébastien** 👋 Vous cherchez un **iPhone ou Samsung reconditionné** garanti 12 mois, le prix d’une reprise de votre ancien mobile ou un **film Hydrogel sur mesure** ? Dites-moi votre besoin ou votre budget !",
        starters: [
          { label: "Quels reconditionnés avez-vous en stock ?", value: "Quels iPhone ou Samsung reconditionnés avez-vous en vitrine aujourd’hui ?" },
          { label: "Combien reprenez-vous mon téléphone ?", value: "Combien pouvez-vous reprendre mon ancien téléphone ?" },
          { label: "Prix pose film Hydrogel", value: "Quel est le prix d’un film Hydrogel posé sur mesure ?" },
        ],
      };
    }
    if (/informatique|ordinateur|pc-mac|donnees|console|trottinette/.test(page)) {
      return {
        label: "Solution Informatique · Mâcon",
        greeting:
          "Bonjour ! Ici **Sébastien** 👋 Un souci sur votre **PC, Mac, console PS5/Switch ou trottinette**, ou vous cherchez un ordinateur reconditionné ? Décrivez-moi le symptôme (ou envoyez une photo 📷), je vous dis franchement ce qu’on peut faire !",
        starters: [
          { label: "Mon PC est lent / bloqué", value: "Mon ordinateur est devenu très lent, que me conseillez-vous et à quel tarif ?" },
          { label: "Port HDMI PS5 / USB-C Switch", value: "Quel est le tarif et le délai pour réparer ma console PS5 ou Switch ?" },
          { label: "PC ou Mac reconditionnés en stock", value: "Avez-vous des PC portables ou MacBook reconditionnés en stock ?" },
        ],
      };
    }
    if (/suivi-reparation/.test(page)) {
      return {
        label: "Suivi Atelier en direct",
        greeting:
          "Bonjour ! Ici **Sébastien** 👋 Donnez-moi votre numéro **REP-...** et les **4 derniers chiffres** de votre téléphone, je vérifie tout de suite sur l’établi si votre appareil est prêt !",
        starters: [
          { label: "Vérifier si mon téléphone est prêt", value: "Je voudrais savoir si ma réparation est terminée à l’atelier" },
          { label: "Ajouter un film Hydrogel avant retrait", value: "Pouvez-vous poser un film Hydrogel sur mon téléphone avant que je passe le récupérer ?" },
        ],
      };
    }
    return {
      label: "Comptoir Solution Phone · Mâcon",
      greeting:
        "Bonjour ! Ici **Sébastien** au comptoir Solution Phone (21 rue Gambetta) 👋 Dites-moi quel est votre appareil et ce qu’il vous fait — à l’écrit, en photo 📷 ou au micro 🎙️ — on fait le point ensemble comme en boutique !",
      starters: [
        { label: "Tarif pour réparer mon téléphone", value: "Bonjour Sébastien, je voudrais connaître le tarif pour réparer mon téléphone" },
        { label: "Où en est ma réparation REP-... ?", value: "Où en est ma réparation déposée à l’atelier ?" },
        { label: "Voir les téléphones reconditionnés", value: "Quels téléphones reconditionnés avez-vous en vitrine actuellement ?" },
      ],
    };
  }

  var ctx = buildGreetingAndStarters();

  var oldCrispButton = document.getElementById("crispFloatBtn");
  if (oldCrispButton) oldCrispButton.remove();
  if (window.$crisp && Array.isArray(window.$crisp)) window.$crisp.push(["do", "chat:hide"]);

  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/jason-widget.css?v=5";
  document.head.appendChild(css);

  var brainUrl = "https://vps-8066c206.vps.ovh.net/api/public/jason-brain";
  var tokenKey = "sp_sebastien_conv_token_v5";
  var historyKey = "sp_sebastien_conv_history_v5";
  var voicePrefKey = "sp_sebastien_voice_auto_v5";
  var metricToken = "";
  var history = [];
  var pendingImageDataUrl = null;
  var voiceAutoEnabled = false;

  try {
    metricToken = localStorage.getItem(tokenKey) || sessionStorage.getItem("jason_conversation_token") || "";
    voiceAutoEnabled = localStorage.getItem(voicePrefKey) === "1";
    var rawHist = localStorage.getItem(historyKey) || sessionStorage.getItem("jason_conversation_history_v2");
    if (rawHist) {
      var parsedHist = JSON.parse(rawHist);
      if (Array.isArray(parsedHist)) history = parsedHist.slice(-16);
    }
  } catch (e) {}

  var metricOpened = false;
  var pollTimer = null;
  var pollCount = 0;
  var metricPage = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "/audit-local/" + path.replace(/^\/+/, "")
    : (isIphoneSite ? "/reparation-iphone-macon" : isAccSite ? "/solution-accessoires" : "") + path;

  function saveState() {
    try {
      if (metricToken) localStorage.setItem(tokenKey, metricToken);
      localStorage.setItem(historyKey, JSON.stringify(history.slice(-16)));
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
        context: { page: metricPage, model: detectedModel || undefined, consent_to_store: false },
      }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
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
      trackMetric("assistant_opened", { source: "sebastien_live_twin", page: page || "home" });
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
      .map(function (block) { return "<p>" + block.replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  function speakFrench(text) {
    if (!("speechSynthesis" in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      var plain = String(text)
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[👋📷🎙️🔊💬✉️✅🔧📦📋🔍📡]/g, "")
        .trim();
      if (!plain) return;
      var utter = new SpeechSynthesisUtterance(plain);
      utter.lang = "fr-FR";
      utter.rate = 1.03;
      var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      var frVoice =
        voices.find(function (v) { return /^fr/i.test(v.lang) && /thomas|nicolas|henri|daniel|google|premium|enhanced/i.test(v.name); }) ||
        voices.find(function (v) { return /^fr/i.test(v.lang); });
      if (frVoice) utter.voice = frVoice;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
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
        if (dataUrl.length > 540000) dataUrl = canvas.toDataURL("image/jpeg", 0.58);
        callback(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var directWaUrl =
    "https://wa.me/33783921884?text=" +
    encodeURIComponent("Bonjour Sébastien, je discute depuis « " + ctx.label + " » : ");
  var directMailUrl =
    "mailto:contact@solution-phone.fr?subject=" +
    encodeURIComponent("Question pour Sébastien — " + ctx.label);

  var root = document.createElement("aside");
  root.className = "evan-widget conversation-open";
  root.setAttribute("aria-label", "Discussion directe avec Sébastien — Solution Phone Mâcon");
  root.innerHTML =
    '<input type="file" class="sp-jason-file-input" accept="image/*" hidden>' +
    '<div class="evan-widget-panel">' +
    '<div class="evan-widget-head">' +
    '<span class="evan-widget-avatar" aria-hidden="true"></span>' +
    '<div class="evan-widget-head-info">' +
    '<b><span class="evan-widget-live-dot"></span>Sébastien · Solution Phone</b>' +
    "<span>En direct du comptoir (version numérique 24h/24 · Mâcon)</span>" +
    "</div>" +
    ("speechSynthesis" in window
      ? '<button class="evan-widget-voice-toggle' +
        (voiceAutoEnabled ? " active" : "") +
        '" type="button" title="Activer / couper la voix de Sébastien" aria-label="Voix de Sébastien">' +
        (voiceAutoEnabled ? "🔊" : "🔈") +
        "</button>"
      : "") +
    '<button class="evan-widget-back" type="button" title="Nouvelle discussion" aria-label="Nouvelle discussion">↺</button>' +
    '<button class="evan-widget-close" type="button" aria-label="Fermer">×</button>' +
    "</div>" +
    '<div class="evan-widget-conversation">' +
    '<div class="sp-jason-thread" aria-live="polite"></div>' +
    '<div class="sp-jason-chips"></div>' +
    '<div class="sp-jason-composer">' +
    '<div class="sp-jason-photo-bar"><img alt="Photo jointe"><span>Photo prête à montrer à Sébastien</span><button type="button" aria-label="Retirer la photo">×</button></div>' +
    '<form class="evan-widget-form' +
    (SpeechRec ? "" : " no-mic") +
    '">' +
    '<button type="button" class="sp-jason-cam-btn" title="Montrer une photo de votre appareil" aria-label="Joindre une photo">📷</button>' +
    (SpeechRec
      ? '<button type="button" class="sp-jason-mic-btn" title="Parler directement à Sébastien au micro" aria-label="Parler au micro">🎙️</button>'
      : "") +
    '<input type="text" aria-label="Parler avec Sébastien" placeholder="Écrivez à Sébastien' +
    (SpeechRec ? " ou cliquez sur 🎙️…" : " ou joignez une photo 📷…") +
    '">' +
    '<button type="submit" aria-label="Envoyer">→</button>' +
    "</form>" +
    '<div class="evan-widget-direct">' +
    '<a href="' +
    directWaUrl +
    '" target="_blank" rel="noopener">Passer sur WhatsApp</a>' +
    '<a href="tel:+33385330689">03 85 33 06 89</a>' +
    "<span>21 rue Gambetta · Mâcon</span>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<button class="evan-widget-launch" type="button" aria-expanded="false" aria-label="Parler avec Sébastien">' +
    '<span class="evan-widget-avatar" aria-hidden="true"></span><i></i>' +
    "<span><b>Parler avec Sébastien</b><small>Diagnostic · Tarifs · Voix 🎙️ · Photo</small></span>" +
    "</button>";

  document.body.appendChild(root);

  var fileInput = root.querySelector(".sp-jason-file-input");
  var launch = root.querySelector(".evan-widget-launch");
  var closeBtn = root.querySelector(".evan-widget-close");
  var backBtn = root.querySelector(".evan-widget-back");
  var voiceToggleBtn = root.querySelector(".evan-widget-voice-toggle");
  var form = root.querySelector(".evan-widget-form");
  var input = form.querySelector('input[type="text"]');
  var submitBtn = form.querySelector('button[type="submit"]');
  var camBtn = root.querySelector(".sp-jason-cam-btn");
  var micBtn = root.querySelector(".sp-jason-mic-btn");
  var photoBar = root.querySelector(".sp-jason-photo-bar");
  var threadEl = root.querySelector(".sp-jason-thread");
  var chipsEl = root.querySelector(".sp-jason-chips");
  var currentWaUrl = directWaUrl;
  var activeRecognition = null;

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", function () {
      voiceAutoEnabled = !voiceAutoEnabled;
      voiceToggleBtn.classList.toggle("active", voiceAutoEnabled);
      voiceToggleBtn.textContent = voiceAutoEnabled ? "🔊" : "🔈";
      try {
        localStorage.setItem(voicePrefKey, voiceAutoEnabled ? "1" : "0");
      } catch (e) {}
      if (!voiceAutoEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    });
  }

  function syncPhotoPreview() {
    camBtn.classList.toggle("has-photo", Boolean(pendingImageDataUrl));
    photoBar.classList.toggle("visible", Boolean(pendingImageDataUrl));
    var img = photoBar.querySelector("img");
    if (img && pendingImageDataUrl) img.src = pendingImageDataUrl;
  }

  camBtn.addEventListener("click", function () {
    ensureMetricOpened();
    fileInput.click();
  });

  photoBar.querySelector("button").addEventListener("click", function () {
    pendingImageDataUrl = null;
    fileInput.value = "";
    syncPhotoPreview();
  });

  fileInput.addEventListener("change", function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    compressImageFile(f, function (dataUrl) {
      pendingImageDataUrl = dataUrl;
      syncPhotoPreview();
      input.focus();
    });
  });

  if (micBtn && SpeechRec) {
    micBtn.addEventListener("click", function () {
      ensureMetricOpened();
      if (activeRecognition) {
        try { activeRecognition.stop(); } catch (e) {}
        return;
      }
      try {
        var rec = new SpeechRec();
        activeRecognition = rec;
        rec.lang = "fr-FR";
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        micBtn.classList.add("recording");
        var prevPlaceholder = input.placeholder;
        input.placeholder = "🎙️ Parlez à Sébastien, je vous écoute…";
        var finalTranscript = "";
        rec.onresult = function (ev) {
          var interim = "";
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            if (ev.results[i].isFinal) {
              finalTranscript += ev.results[i][0].transcript;
            } else {
              interim += ev.results[i][0].transcript;
            }
          }
          input.value = (finalTranscript || interim).trim();
        };
        rec.onend = function () {
          micBtn.classList.remove("recording");
          input.placeholder = prevPlaceholder;
          activeRecognition = null;
          if (input.value.trim().length >= 2) {
            ask(input.value.trim());
          }
        };
        rec.onerror = function () {
          micBtn.classList.remove("recording");
          input.placeholder = prevPlaceholder;
          activeRecognition = null;
        };
        rec.start();
      } catch (e) {
        micBtn.classList.remove("recording");
        activeRecognition = null;
      }
    });
  }

  function scrollThread() {
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function appendBotMessage(rawText, isLiveHuman) {
    var row = document.createElement("div");
    row.className = "sp-jason-msg-row";
    var av = document.createElement("span");
    av.className = "sp-jason-mini-av";
    av.setAttribute("aria-hidden", "true");
    var bubble = document.createElement("div");
    bubble.className = "sp-jason-msg " + (isLiveHuman ? "sp-jason-msg--live" : "sp-jason-msg--bot");
    bubble.innerHTML =
      (isLiveHuman ? "<strong>👨‍🔧 Sébastien (depuis l’établi) :</strong>" : "") +
      formatRichHtml(rawText);
    if ("speechSynthesis" in window && rawText.length > 8) {
      var spk = document.createElement("button");
      spk.type = "button";
      spk.className = "sp-jason-speak-btn";
      spk.textContent = "🔊 Écouter";
      spk.addEventListener("click", function () {
        speakFrench(rawText);
      });
      bubble.appendChild(spk);
    }
    row.appendChild(av);
    row.appendChild(bubble);
    threadEl.appendChild(row);
    scrollThread();
    return row;
  }

  function appendUserMessage(htmlContent) {
    var row = document.createElement("div");
    row.className = "sp-jason-msg-row sp-jason-msg-row--user";
    var bubble = document.createElement("div");
    bubble.className = "sp-jason-msg sp-jason-msg--user";
    bubble.innerHTML = htmlContent;
    row.appendChild(bubble);
    threadEl.appendChild(row);
    scrollThread();
    return row;
  }

  function appendTypingRow(label) {
    var row = document.createElement("div");
    row.className = "sp-jason-msg-row";
    row.innerHTML =
      '<span class="sp-jason-mini-av" aria-hidden="true"></span>' +
      '<div class="sp-jason-msg sp-jason-msg--bot sp-jason-msg--typing">' +
      '<span class="sp-jason-dots"><i></i><i></i><i></i></span>' +
      "<span>" + escapeHtml(label) + "</span></div>";
    threadEl.appendChild(row);
    scrollThread();
    return row;
  }

  function renderChips(quickReplies, waUrl) {
    if (waUrl) currentWaUrl = waUrl;
    chipsEl.innerHTML = "";
    var list = Array.isArray(quickReplies) && quickReplies.length ? quickReplies : ctx.starters;
    list.slice(0, 4).forEach(function (item) {
      if (item.action === "whatsapp") {
        var a = document.createElement("a");
        a.className = "sp-jason-chip sp-jason-chip--wa";
        a.href = currentWaUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "💬 " + item.label;
        a.addEventListener("click", function () {
          trackMetric("whatsapp_clicked", { source: "sebastien_chip", page: page || "home" });
        });
        chipsEl.appendChild(a);
      } else if (item.action === "mail") {
        var m = document.createElement("a");
        m.className = "sp-jason-chip";
        m.href = directMailUrl;
        m.textContent = "✉️ " + item.label;
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
    note.textContent = "📡 Signalé sur l’écran de l’atelier — si je suis devant le comptoir, je vous complète ici en direct.";
    threadEl.appendChild(note);
    scrollThread();

    function pollOnce() {
      pollCount += 1;
      fetch(brainUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll: true, conversation_token: metricToken }),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && data.status === "answered" && data.answer) {
            stopPolling();
            if (note.parentNode) note.remove();
            appendBotMessage(data.answer, true);
            if (voiceAutoEnabled) speakFrench(data.answer);
            history.push({ role: "assistant", content: data.answer });
            saveState();
            return;
          }
          if (pollCount < 15) pollTimer = setTimeout(pollOnce, 8000);
        })
        .catch(function () {
          if (pollCount < 15) pollTimer = setTimeout(pollOnce, 10000);
        });
    }
    pollTimer = setTimeout(pollOnce, 6000);
  }

  function hydrateThread() {
    threadEl.innerHTML = "";
    if (history.length === 0) {
      appendBotMessage(ctx.greeting, false);
      renderChips(ctx.starters, currentWaUrl);
      return;
    }
    history.forEach(function (turn) {
      if (turn.role === "user") {
        appendUserMessage(escapeHtml(turn.content));
      } else {
        appendBotMessage(turn.content, false);
      }
    });
    renderChips(null, currentWaUrl);
  }

  var initializedThread = false;
  function toggle(force) {
    var open = typeof force === "boolean" ? force : !root.classList.contains("open");
    root.classList.toggle("open", open);
    launch.setAttribute("aria-expanded", String(open));
    if (open) {
      ensureMetricOpened();
      if (!initializedThread) {
        initializedThread = true;
        hydrateThread();
      }
      setTimeout(function () {
        input.focus();
      }, 80);
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function ask(question) {
    var attachedImg = pendingImageDataUrl;
    var clean = String(question || "").trim();
    if (!clean && attachedImg) {
      clean = "Regarde la photo de mon appareil : qu’en penses-tu et quel serait le tarif ?";
    }
    if (!clean) return;

    pendingImageDataUrl = null;
    fileInput.value = "";
    syncPhotoPreview();

    if (!initializedThread) {
      initializedThread = true;
      hydrateThread();
    }
    toggle(true);
    input.value = "";
    submitBtn.disabled = true;
    chipsEl.innerHTML = "";

    var userBubbleHtml =
      (attachedImg ? '<img class="sp-jason-user-thumb" src="' + attachedImg + '" alt="Photo envoyée">' : "") +
      escapeHtml(clean);
    appendUserMessage(userBubbleHtml);

    var typingRow = appendTypingRow(
      attachedImg ? "Sébastien examine votre photo…" : "Sébastien regarde les tarifs et le stock…"
    );

    var priorHistory = history.slice(-16);
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
        context: { page: metricPage, model: detectedModel || undefined, consent_to_store: false },
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("unavailable");
        return r.json();
      })
      .then(function (data) {
        if (typingRow.parentNode) typingRow.remove();
        if (data.conversation_token) metricToken = data.conversation_token;
        var reply = data.answer || "Écrivez-moi directement sur WhatsApp au 07 83 92 18 84, je vous réponds tout de suite.";
        appendBotMessage(reply, false);
        if (voiceAutoEnabled) speakFrench(reply);
        if (data.quote_reference) {
          var badge = document.createElement("div");
          badge.className = "sp-jason-quote-badge";
          badge.textContent = "✅ Bien noté au comptoir Solution Phone (réf. " + data.quote_reference + ")";
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
        if (typingRow.parentNode) typingRow.remove();
        appendBotMessage(
          "J’ai une petite coupure réseau sur le chat ! Envoyez-moi directement votre message sur **WhatsApp (07 83 92 18 84)** ou appelez la boutique au **03 85 33 06 89**.",
          false
        );
        renderChips([{ label: "Écrire à Sébastien sur WhatsApp", action: "whatsapp" }], directWaUrl);
      })
      .finally(function () {
        submitBtn.disabled = false;
        input.focus();
      });
  }

  function resetConversation() {
    stopPolling();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    history = [];
    pendingImageDataUrl = null;
    syncPhotoPreview();
    saveState();
    hydrateThread();
    setTimeout(function () { input.focus(); }, 80);
  }

  launch.addEventListener("click", function () { toggle(); });
  closeBtn.addEventListener("click", function () { toggle(false); });
  backBtn.addEventListener("click", resetConversation);

  document.querySelectorAll("[data-evan-question]").forEach(function (button) {
    button.addEventListener("click", function () {
      ask(button.getAttribute("data-evan-question"));
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
  });

  root.querySelector('a[href*="wa.me"]').addEventListener("click", function () {
    ensureMetricOpened();
    trackMetric("whatsapp_clicked", { source: "sebastien_widget_direct", page: page || "home" });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") toggle(false);
  });

  window.SolutionPhoneTalkToSebastien = ask;
})();
