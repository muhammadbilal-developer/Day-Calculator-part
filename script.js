/* ===== Contador de Dias — lógica da calculadora ===== */
(function () {
  "use strict";

  var SITE = "https://icontadordedias.com.br/";
  var $ = function (id) { return document.getElementById(id); };

  var WD = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  var MO = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  var DAY = 864e5;

  /* ---------------- date core (noon-anchored → imune a horário de verão) --------------- */
  function D(y, m, d) { return new Date(y, m, d, 12, 0, 0, 0); }
  function today() { var n = new Date(); return D(n.getFullYear(), n.getMonth(), n.getDate()); }
  function addDays(d, n) { return D(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function diffDays(a, b) { return Math.round((b - a) / DAY); }
  function key(d) { return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }
  function dim(y, m) { return new Date(y, m + 1, 0).getDate(); }

  function addMonths(b, n) {
    var m = b.getMonth() + n;
    var y = b.getFullYear() + Math.floor(m / 12);
    var mm = ((m % 12) + 12) % 12;
    return D(y, mm, Math.min(b.getDate(), dim(y, mm)));
  }

  function fmt(d) { return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function fmtLong(d) { return d.getDate() + " de " + MO[d.getMonth()] + " de " + d.getFullYear(); }
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function num(n) { return Number(n).toLocaleString("pt-BR"); }
  function dec(n) { return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 1 }); }

  /* years / months / days breakdown, ancorado no dia inicial */
  function ymd(s, e) {
    var months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (addMonths(s, months) > e) months -= 1;
    if (months < 0) months = 0;
    return {
      y: Math.floor(months / 12),
      m: months % 12,
      d: diffDays(addMonths(s, months), e),
      totalMonths: months
    };
  }

  /* ---------------- máscara DD/MM/AAAA ---------------- */
  function mask(el) {
    el.addEventListener("input", function () {
      var v = el.value.replace(/\D/g, "").slice(0, 8);
      var out = v.slice(0, 2);
      if (v.length > 2) out += "/" + v.slice(2, 4);
      if (v.length > 4) out += "/" + v.slice(4, 8);
      el.value = out;
      el.classList.remove("is-bad");
    });
  }

  function parse(str) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((str || "").trim());
    if (!m) return null;
    var d = +m[1], mo = +m[2], y = +m[3];
    if (mo < 1 || mo > 12 || y < 1900 || y > 2200) return null;
    if (d < 1 || d > dim(y, mo - 1)) return null;
    return D(y, mo - 1, d);
  }

  /* ---------------- Páscoa (Meeus/Jones/Butcher) ---------------- */
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mo = Math.floor((h + l - 7 * m + 114) / 31);
    var da = ((h + l - 7 * m + 114) % 31) + 1;
    return D(y, mo - 1, da);
  }

  /* n-ésima ocorrência de um dia da semana (n = -1 → última) */
  function nth(y, mo, wd, n) {
    if (n > 0) {
      var first = D(y, mo, 1);
      return addDays(first, ((wd - first.getDay() + 7) % 7) + (n - 1) * 7);
    }
    var last = D(y, mo, dim(y, mo));
    return addDays(last, -((last.getDay() - wd + 7) % 7));
  }

  /* ---------------- feriados ---------------- */
  function holidays(country, year, carnival) {
    var E = easter(year), out = [];
    var add = function (d, name) { out.push({ d: d, name: name }); };

    if (country === "BR") {
      add(D(year, 0, 1),  "Confraternização Universal");
      add(D(year, 3, 21), "Tiradentes");
      add(D(year, 4, 1),  "Dia do Trabalho");
      add(D(year, 8, 7),  "Independência do Brasil");
      add(D(year, 9, 12), "Nossa Senhora Aparecida");
      add(D(year, 10, 2), "Finados");
      add(D(year, 10, 15),"Proclamação da República");
      add(D(year, 10, 20),"Consciência Negra");
      add(D(year, 11, 25),"Natal");
      add(addDays(E, -2), "Sexta-feira Santa");
      add(addDays(E, 60), "Corpus Christi");
      if (carnival) {
        add(addDays(E, -48), "Carnaval (segunda-feira)");
        add(addDays(E, -47), "Carnaval (terça-feira)");
      }
    } else if (country === "PT") {
      add(D(year, 0, 1),  "Ano Novo");
      add(addDays(E, -2), "Sexta-feira Santa");
      add(E,              "Domingo de Páscoa");
      add(D(year, 3, 25), "Dia da Liberdade");
      add(D(year, 4, 1),  "Dia do Trabalhador");
      add(addDays(E, 60), "Corpus Christi");
      add(D(year, 5, 10), "Dia de Portugal");
      add(D(year, 7, 15), "Assunção de Nossa Senhora");
      add(D(year, 9, 5),  "Implantação da República");
      add(D(year, 10, 1), "Todos os Santos");
      add(D(year, 11, 1), "Restauração da Independência");
      add(D(year, 11, 8), "Imaculada Conceição");
      add(D(year, 11, 25),"Natal");
      if (carnival) add(addDays(E, -47), "Carnaval (terça-feira)");
    } else if (country === "US") {
      add(D(year, 0, 1),   "Ano Novo");
      add(nth(year, 0, 1, 3),  "Martin Luther King Jr. Day");
      add(nth(year, 1, 1, 3),  "Washington's Birthday");
      add(nth(year, 4, 1, -1), "Memorial Day");
      add(D(year, 5, 19),  "Juneteenth");
      add(D(year, 6, 4),   "Independence Day");
      add(nth(year, 8, 1, 1),  "Labor Day");
      add(nth(year, 9, 1, 2),  "Columbus Day");
      add(D(year, 10, 11), "Veterans Day");
      add(nth(year, 10, 4, 4), "Thanksgiving");
      add(D(year, 11, 25), "Natal");
    }
    return out;
  }

  /* mapa de feriados cobrindo o intervalo (com margem de 1 ano de cada lado) */
  function holidayMap(country, y1, y2, carnival) {
    var map = new Map();
    if (country === "NONE") return map;
    for (var y = y1 - 1; y <= y2 + 1; y++) {
      holidays(country, y, carnival).forEach(function (h) { map.set(key(h.d), h.name); });
    }
    return map;
  }

  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }
  function isBiz(d, map) { return !isWeekend(d) && !map.has(key(d)); }

  /* ---------------- estado + UI helpers ---------------- */
  var state = null, activeTab = "diff";
  var formCard = $("cdForm");
  var resultCard = $("cdResult");

  function showCalculator() {
    formCard.hidden = false;
    resultCard.hidden = true;
  }

  function showResult() {
    formCard.hidden = true;
    resultCard.hidden = false;
  }

  function bad(el, errId, msg) {
    el.classList.add("is-bad");
    $(errId).textContent = msg;
    el.focus();
  }
  function clearErr(errId, els) {
    $(errId).textContent = "";
    els.forEach(function (e) { e.classList.remove("is-bad"); });
  }

  var toastT;
  function toast(msg) {
    $("cdToast").textContent = msg;
    clearTimeout(toastT);
    toastT = setTimeout(function () { $("cdToast").textContent = ""; }, 2600);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------- abas ---------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".cd-tab"));
  function movePill(i) {
    var pill = $("cdPill");
    if (getComputedStyle(pill).display === "none") return;
    pill.style.transform = "translateX(" + (i * 100) + "%)";
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.remove("is-active"); x.setAttribute("aria-selected", "false"); });
      t.classList.add("is-active"); t.setAttribute("aria-selected", "true");
      activeTab = t.dataset.tab;
      document.querySelectorAll(".cd-panel").forEach(function (p) {
        p.classList.toggle("is-open", p.dataset.panel === activeTab);
      });
      movePill(i);
      showCalculator();
      state = null;
    });
  });
  window.addEventListener("resize", function () {
    movePill(tabs.findIndex(function (t) { return t.classList.contains("is-active"); }));
  });

  /* ---------------- máscaras + atalhos ---------------- */
  ["dfStart","dfEnd","asBase","duStart","duEnd"].forEach(function (id) { mask($(id)); });

  document.querySelectorAll(".cd-chip[data-target]").forEach(function (c) {
    c.addEventListener("click", function () {
      var el = $(c.dataset.target);
      el.value = fmt(addDays(today(), +c.dataset.shift));
      el.classList.remove("is-bad");
    });
  });
  document.querySelectorAll(".cd-chip[data-qty]").forEach(function (c) {
    c.addEventListener("click", function () { $("asQty").value = c.dataset.qty; $("asQty").classList.remove("is-bad"); });
  });

  var op = "add";
  document.querySelectorAll(".cd-seg-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".cd-seg-btn").forEach(function (x) { x.classList.remove("is-active"); x.setAttribute("aria-checked", "false"); });
      b.classList.add("is-active"); b.setAttribute("aria-checked", "true");
      op = b.dataset.op;
    });
  });

  /* feriados: o país muda o rótulo do ponto facultativo */
  $("duCountry").addEventListener("change", function () {
    var c = $("duCountry").value, box = $("duCarnival");
    var supported = (c === "BR" || c === "PT");
    box.disabled = !supported;
    if (!supported) box.checked = false;
    $("duOptWrap").style.opacity = supported ? "1" : ".5";
    $("duOptLabel").textContent = c === "PT"
      ? "Incluir Carnaval (terça-feira)"
      : "Incluir Carnaval (segunda e terça-feira)";
    $("duOptHint").textContent = supported
      ? "Pontos facultativos — desmarque se sua empresa não observa Carnaval."
      : "Não aplicável ao país selecionado.";
  });

  /* limpar */
  document.querySelectorAll(".cd-clear").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = document.querySelector('.cd-panel[data-panel="' + b.dataset.clear + '"]');
      p.querySelectorAll("input").forEach(function (i) {
        if (i.type === "checkbox") i.checked = false; else i.value = "";
        i.classList.remove("is-bad");
      });
      p.querySelectorAll(".cd-error").forEach(function (e) { e.textContent = ""; });
      showCalculator();
      state = null;
    });
  });

  /* ---------------- cálculos ---------------- */
  document.querySelectorAll(".cd-submit").forEach(function (b) {
    b.addEventListener("click", function () { run(b.dataset.run); });
  });

  function run(tab) {
    if (tab === "diff") return runDiff();
    if (tab === "addsub") return runAddSub();
    return runUteis();
  }

  /* ---- 1. Diferença de Datas ---- */
  function runDiff() {
    var sEl = $("dfStart"), eEl = $("dfEnd");
    clearErr("dfError", [sEl, eEl]);

    var s = parse(sEl.value), e = parse(eEl.value);
    if (!s) return bad(sEl, "dfError", "Informe a data inicial no formato DD/MM/AAAA.");
    if (!e) return bad(eEl, "dfError", "Informe a data final no formato DD/MM/AAAA.");

    var reversed = e < s;
    if (reversed) { var t = s; s = e; e = t; }

    var inclusive = $("dfInclusive").checked;
    var span = diffDays(s, e);              // dias corridos (exclusivo)
    var counted = inclusive ? span + 1 : span;
    var b = ymd(s, e);

    // percorre o intervalo contado para separar úteis / fins de semana
    var map = holidayMap("BR", s.getFullYear(), e.getFullYear(), true);
    var biz = 0, wknd = 0, hol = 0;
    for (var i = 0; i < counted; i++) {
      var d = addDays(s, i);
      if (isWeekend(d)) wknd++;
      else if (map.has(key(d))) hol++;
      else biz++;
    }

    var weeks = Math.floor(counted / 7), restDays = counted % 7;

    state = {
      tab: "diff",
      badge: "Diferença de Datas",
      range: fmt(s) + " → " + fmt(e) + (reversed ? "  (datas invertidas automaticamente)" : ""),
      heroNum: num(counted),
      heroCap: counted === 1 ? "dia" : "dias",
      heroSub: b.y + " ano(s), " + b.m + " mês(es) e " + b.d + " dia(s)",
      stats: [
        [num(weeks) + (restDays ? " + " + restDays + "d" : ""), "Semanas"],
        [num(b.totalMonths), "Meses completos"],
        [num(biz), "Dias úteis"],
        [num(wknd), "Fins de semana"],
        [num(counted * 24), "Horas"],
        [num(counted * 1440), "Minutos"]
      ],
      holidays: [],
      note: (inclusive ? "Data final incluída na contagem." : "Data final não contada (padrão DATEDIF / dias corridos).") +
            " Dias úteis calculados com os feriados nacionais do Brasil (incluindo Carnaval)." +
            (hol ? " " + hol + " feriado(s) caíram em dia de semana." : ""),
      shareLines: [
        "De " + fmtLong(s) + " (" + WD[s.getDay()] + ")",
        "Até " + fmtLong(e) + " (" + WD[e.getDay()] + ")",
        "= " + num(counted) + " dias corridos",
        b.y + " ano(s), " + b.m + " mês(es), " + b.d + " dia(s) | " + num(biz) + " dias úteis"
      ]
    };
    paint();
  }

  /* ---- 2. Somar / Subtrair Dias ---- */
  function runAddSub() {
    var bEl = $("asBase"), qEl = $("asQty");
    clearErr("asError", [bEl, qEl]);

    var base = parse(bEl.value);
    if (!base) return bad(bEl, "asError", "Informe a data base no formato DD/MM/AAAA.");

    var q = parseInt(qEl.value, 10);
    if (isNaN(q) || q < 0) return bad(qEl, "asError", "Informe um número de dias válido (0 ou mais).");
    if (q > 36500) return bad(qEl, "asError", "Limite máximo: 36.500 dias (100 anos).");

    var sign = op === "add" ? 1 : -1;
    var bizOnly = $("asBiz").checked;
    var yPad = Math.ceil(q / 200) + 2;
    var map = holidayMap("BR", base.getFullYear() - yPad, base.getFullYear() + yPad, true);

    var res = base, skipped = 0, holSkipped = 0;
    if (bizOnly) {
      var left = q;
      while (left > 0) {
        res = addDays(res, sign);
        if (isBiz(res, map)) left--;
        else { skipped++; if (!isWeekend(res)) holSkipped++; }
      }
    } else {
      res = addDays(base, sign * q);
    }

    var span = Math.abs(diffDays(base, res));
    var b = ymd(sign > 0 ? base : res, sign > 0 ? res : base);

    state = {
      tab: "addsub",
      badge: op === "add" ? "Somar Dias" : "Subtrair Dias",
      range: fmt(base) + (sign > 0 ? "  +  " : "  −  ") + num(q) + (bizOnly ? " dias úteis" : " dias corridos"),
      heroNum: fmt(res),
      heroCap: WD[res.getDay()],
      heroSub: fmtLong(res),
      isDate: true,
      stats: [
        [num(span), "Dias corridos"],
        [num(b.totalMonths), "Meses completos"],
        [b.y + "a " + b.m + "m " + b.d + "d", "Equivalente"],
        [bizOnly ? num(skipped) : "—", "Dias pulados"],
        [bizOnly ? num(holSkipped) : "—", "Feriados pulados"],
        [WD[base.getDay()], "Dia base"]
      ],
      holidays: [],
      note: bizOnly
        ? "Contagem em dias úteis: fins de semana e feriados nacionais do Brasil foram pulados. O dia base não é contado — a contagem começa no dia seguinte (D+1)."
        : "Contagem em dias corridos: todos os dias incluídos, sem pular fins de semana ou feriados.",
      shareLines: [
        fmtLong(base) + (sign > 0 ? " + " : " − ") + num(q) + (bizOnly ? " dias úteis" : " dias corridos"),
        "= " + fmtLong(res) + " (" + WD[res.getDay()] + ")",
        num(span) + " dias corridos de diferença"
      ]
    };
    paint();
  }

  /* ---- 3. Dias Úteis ---- */
  function runUteis() {
    var sEl = $("duStart"), eEl = $("duEnd");
    clearErr("duError", [sEl, eEl]);

    var s = parse(sEl.value), e = parse(eEl.value);
    if (!s) return bad(sEl, "duError", "Informe a data inicial no formato DD/MM/AAAA.");
    if (!e) return bad(eEl, "duError", "Informe a data final no formato DD/MM/AAAA.");
    if (e < s) { var t = s; s = e; e = t; }

    var country = $("duCountry").value;
    var carn = $("duCarnival").checked;
    var map = holidayMap(country, s.getFullYear(), e.getFullYear(), carn);

    var total = diffDays(s, e) + 1;         // ambas as datas incluídas (padrão DIATRABALHOTOTAL)
    var biz = 0, wknd = 0, holWd = 0, list = [];

    for (var i = 0; i < total; i++) {
      var d = addDays(s, i);
      var name = map.get(key(d));
      var we = isWeekend(d);
      if (we) wknd++;
      else if (name) holWd++;
      else biz++;
      if (name) list.push({ d: d, name: name, weekend: we });
    }

    var label = { BR: "Brasil", PT: "Portugal", US: "Estados Unidos", NONE: "Nenhum" }[country];

    state = {
      tab: "uteis",
      badge: "Dias Úteis",
      range: fmt(s) + " → " + fmt(e) + "  •  Feriados: " + label,
      heroNum: num(biz),
      heroCap: biz === 1 ? "dia útil" : "dias úteis",
      heroSub: "de " + num(total) + " dias corridos no período",
      stats: [
        [num(total), "Dias corridos"],
        [num(wknd), "Fins de semana"],
        [num(holWd), "Feriados em dia útil"],
        [dec(biz / 5), "Semanas úteis"],
        [num(biz * 8), "Horas úteis (8h/dia)"],
        [num(list.length), "Feriados no período"]
      ],
      holidays: list,
      note: "Ambas as datas são incluídas na contagem (mesmo critério do DIATRABALHOTOTAL do Excel / NETWORKDAYS). " +
            (country === "NONE"
              ? "Nenhum feriado foi excluído — apenas sábados e domingos."
              : "Feriados nacionais de " + label + (carn ? ", incluindo Carnaval." : ".")),
      shareLines: [
        "De " + fmtLong(s) + " até " + fmtLong(e),
        "= " + num(biz) + " dias úteis (" + num(total) + " dias corridos)",
        num(wknd) + " dias de fim de semana | " + num(holWd) + " feriados em dia útil",
        "Feriados: " + label + (carn ? " + Carnaval" : "")
      ]
    };
    paint();
  }

  /* ---------------- render ---------------- */
  function paint() {
    var s = state;
    $("cdBadge").textContent = s.badge;
    $("cdRange").textContent = s.range;
    $("cdHeroNum").textContent = s.heroNum;
    $("cdHeroNum").style.fontSize = s.isDate ? "clamp(2rem,7vw,3.2rem)" : "";
    $("cdHeroCap").textContent = s.heroCap;
    $("cdHeroSub").textContent = s.heroSub;

    $("cdStats").innerHTML = s.stats.map(function (st) {
      return '<div class="cd-stat"><span class="cd-stat-num">' + esc(st[0]) +
             '</span><span class="cd-stat-cap">' + esc(st[1]) + "</span></div>";
    }).join("");

    var hol = $("cdHolidays");
    if (s.holidays && s.holidays.length) {
      hol.hidden = false;
      $("cdHolidaysList").innerHTML = s.holidays.map(function (h) {
        return "<li><b>" + esc(h.name) + "</b><span>" + fmt(h.d) + " · " + WD[h.d.getDay()] +
               (h.weekend ? " (cai no fim de semana)" : "") + "</span></li>";
      }).join("");
    } else {
      hol.hidden = true;
    }

    $("cdNote").textContent = s.note;
    showResult();
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("cdBack").addEventListener("click", function () {
    showCalculator();
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------------- compartilhar ---------------- */
  function shareText() {
    if (!state) return "";
    return [state.badge]
      .concat(state.shareLines)
      .concat(["", "Calcule o seu em " + SITE])
      .join("\n");
  }

  $("cdWa").addEventListener("click", function () {
    if (!state) return;
    window.open("https://wa.me/?text=" + encodeURIComponent(shareText()), "_blank", "noopener");
  });

  $("cdShare").addEventListener("click", async function () {
    if (!state) return;
    var text = shareText();
    if (navigator.share) {
      try { await navigator.share({ title: "Contador de Dias", text: text, url: SITE }); return; }
      catch (err) { if (err && err.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(text); toast("Resultado copiado para a área de transferência."); }
    catch (e) { toast("Não foi possível copiar. Copie o resultado manualmente."); }
  });

  /* ---------------- PDF ---------------- */
  $("cdPdf").addEventListener("click", function () {
    if (!state) return;
    var ns = window.jspdf;
    if (!ns || !ns.jsPDF) { window.print(); return; }

    var s = state;
    var doc = new ns.jsPDF({ unit: "pt", format: "a4" });
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    var M = 46, cx = W / 2, y;

    doc.setFillColor(41, 44, 83);
    doc.rect(0, 0, W, 96, "F");
    doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(20);
    doc.text("Contador de Dias", cx, 44, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(230, 232, 240);
    doc.text(s.badge + "  |  " + s.range.replace(/\s+/g, " "), cx, 68, { align: "center" });

    y = 150;
    doc.setFont("helvetica", "bold").setFontSize(s.isDate ? 26 : 40).setTextColor(227, 104, 74);
    doc.text(String(s.heroNum), cx, y, { align: "center" });
    y += 26;
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(41, 44, 83);
    doc.text(String(s.heroCap), cx, y, { align: "center" });
    y += 20;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(122, 127, 153);
    doc.text(String(s.heroSub), cx, y, { align: "center" });
    y += 34;

    // grade de estatísticas 3 x 2
    var bw = (W - M * 2 - 24) / 3, bh = 62;
    s.stats.forEach(function (st, i) {
      var col = i % 3, row = Math.floor(i / 3);
      var x = M + col * (bw + 12), yy = y + row * (bh + 12);
      doc.setDrawColor(230, 232, 240).setFillColor(250, 250, 252);
      doc.roundedRect(x, yy, bw, bh, 8, 8, "FD");
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(41, 44, 83);
      doc.text(String(st[0]), x + bw / 2, yy + 26, { align: "center", maxWidth: bw - 10 });
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(122, 127, 153);
      doc.text(String(st[1]), x + bw / 2, yy + 44, { align: "center", maxWidth: bw - 10 });
    });
    y += Math.ceil(s.stats.length / 3) * (bh + 12) + 18;

    if (s.holidays && s.holidays.length) {
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(201, 84, 47);
      doc.text("FERIADOS NO PERÍODO", M, y); y += 16;
      doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(47, 53, 96);
      s.holidays.forEach(function (h) {
        if (y > H - 90) { doc.addPage(); y = 60; }
        doc.text(h.name + (h.weekend ? " (fim de semana)" : ""), M, y);
        doc.text(fmt(h.d) + " · " + WD[h.d.getDay()], W - M, y, { align: "right" });
        y += 15;
      });
      y += 10;
    }

    if (y > H - 100) { doc.addPage(); y = 60; }
    doc.setDrawColor(227, 104, 74).setLineWidth(2.5);
    doc.line(M, y - 10, M, y + 24);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(122, 127, 153);
    doc.text(doc.splitTextToSize(s.note, W - M * 2 - 14), M + 12, y);

    doc.setFontSize(8.5).setTextColor(160, 164, 185);
    doc.text(SITE, cx, H - 32, { align: "center" });

    doc.save("contador-de-dias-" + s.tab + ".pdf");
    toast("PDF baixado.");
  });

  /* ---------------- init ---------------- */
  movePill(0);
})();
