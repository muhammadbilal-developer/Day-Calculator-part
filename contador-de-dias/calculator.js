/**
 * Contador de Dias — Calculadora com 3 abas (WordPress embed)
 * Abas: Diferença de Datas | Somar/Subtrair Dias | Dias Úteis
 */
(function () {
  "use strict";

  const SITE_NAME = "Contador de Dias";
  const SITE_ORIGIN = "https://icontadordedias.com.br";

  const STR = {
    tabs: {
      difference: "Diferença de Datas",
      reverse: "Somar / Subtrair Dias",
      working: "Dias Úteis",
    },
    startDate: "DATA INICIAL",
    endDate: "DATA FINAL",
    baseDate: "DATA BASE",
    daysLabel: "NÚMERO DE DIAS",
    daysPlaceholder: "ex: 30",
    addDays: "Somar dias",
    subtractDays: "Subtrair dias",
    optionsHeading: "OPÇÕES DE CÁLCULO",
    radioAll: "Todos os dias (dias corridos)",
    radioWorking: "Apenas dias úteis (Seg-Sex)",
    holidayLabel: "FERIADOS DO PAÍS",
    carnavalLabel: "Incluir Carnaval (segunda e terça-feira)",
    carnavalHint: "Pontos facultativos — desmarque se sua empresa não observa Carnaval.",
    submitDiff: "Calcular Dias →",
    submitReverse: "Encontrar Data →",
    submitWorking: "Calcular Dias Úteis →",
    clear: "Limpar Campos",
    loading: "Calculando...",
    countryOptions: [
      { value: "br", label: "Brasil (12 feriados nacionais)" },
      { value: "us", label: "Estados Unidos" },
      { value: "none", label: "Sem feriados" },
    ],
    errors: {
      startDateRequired: "A Data Inicial é obrigatória.",
      endDateRequired: "A Data Final é obrigatória.",
      dateFormat: "Insira uma data no formato DD/MM/AAAA.",
      endBeforeStart: "A Data Final deve ser posterior à Data Inicial.",
      baseDateRequired: "A Data Base é obrigatória.",
      daysRequired: "O número de dias é obrigatório.",
      daysInvalid: "Informe um número válido de dias maior que zero.",
    },
    results: {
      title: "Resultados do Cálculo",
      periodLabel: "Período calculado",
      heroLabel: "Dias Totais",
      heroLabelWorking: "Dias Úteis",
      shareButton: "Compartilhar",
      whatsappButton: "WhatsApp",
      pdfButton: "Baixar PDF",
      newCalculation: "Nova consulta",
      shareCopied: "Resultados copiados para a área de transferência.",
      shareImageSuccess: "Imagem dos resultados compartilhada.",
      shareImageDownloaded: "Imagem baixada — anexe no WhatsApp se necessário.",
      shareFailed: "Não foi possível compartilhar. Tente novamente.",
      pdfLoading: "Gerando PDF…",
      holidaysInRangeTitle: "Feriados no período",
      holidaysInRangeSubtitle: "Datas excluídas do cálculo (dias de semana)",
      holidaysNational: "Nacional",
      holidaysOptional: "Opcional",
      holidaysNone: "Nenhum feriado em dia de semana neste período.",
    },
    cardBlueprints: [
      { key: "totalDays", title: "Dias Totais", subtitle: "período inclusivo", icon: "fa-calendar", tone: "button" },
      { key: "workingDays", title: "Dias Úteis", subtitle: "Seg-Sex, excl. feriados", icon: "fa-briefcase", tone: "accent" },
      { key: "weeks", title: "Semanas", subtitle: "arredondado para 1 casa decimal", icon: "fa-calendar-week", tone: "button" },
      { key: "hours", title: "Horas", subtitle: "total de horas", icon: "fa-clock", tone: "accent", format: "locale" },
      { key: "minutes", title: "Minutos", subtitle: "total de minutos", icon: "fa-stopwatch", tone: "button", format: "locale" },
      { key: "weekends", title: "Finais de Semana", subtitle: "sábados e domingos", icon: "fa-sun", tone: "accent" },
      { key: "holidayCount", title: "Feriados", subtitle: "em dias de semana no período", icon: "fa-landmark", tone: "button" },
      { key: "monthsApprox", title: "Meses (aprox)", subtitle: "com base em 30,44 dias", icon: "fa-calendar", tone: "button" },
      { key: "daysLeftInYear", title: "Dias Restantes", subtitleFrom: "endDateYear", icon: "fa-calendar-day", tone: "accent" },
    ],
    metricAccents: ["cdc-accent-orange", "cdc-accent-mint", "cdc-accent-lavender", "cdc-accent-peach"],
  };

  /* ── Date & holiday engine ── */
  function toIsoDateKey(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const probe = new Date(year, month - 1, day);
    if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function dateKey(date) {
    return toIsoDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  function isoToLocalDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d);
    return dateKey(date) === iso ? date : null;
  }

  function isHolidayHash(date, holidayHashes) {
    const key = dateKey(date);
    if (holidayHashes instanceof Set) return holidayHashes.has(key);
    return holidayHashes.includes(key);
  }

  function parseDate(str) {
    if (!str) return null;
    const parts = String(str).split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts.map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
    return d;
  }

  function formatDate(date) {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${date.getFullYear()}`;
  }

  function isLeapYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  }

  function daysInYear(y) {
    return isLeapYear(y) ? 366 : 365;
  }

  function dayOfYear(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  function isWeekend(d) {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  const BRAZIL_NATIONAL = [
    { id: "new_year", name: "Confraternização Universal", type: "fixed", month: 1, day: 1 },
    { id: "good_friday", name: "Sexta-feira Santa (Paixão de Cristo)", type: "easter", offset: -2 },
    { id: "tiradentes", name: "Tiradentes", type: "fixed", month: 4, day: 21 },
    { id: "labor_day", name: "Dia do Trabalho", type: "fixed", month: 5, day: 1 },
    { id: "corpus_christi", name: "Corpus Christi", type: "easter", offset: 60 },
    { id: "independence", name: "Independência do Brasil", type: "fixed", month: 9, day: 7 },
    { id: "aparecida", name: "Nossa Senhora Aparecida", type: "fixed", month: 10, day: 12 },
    { id: "finados", name: "Finados", type: "fixed", month: 11, day: 2 },
    { id: "republic", name: "Proclamação da República", type: "fixed", month: 11, day: 15 },
    { id: "black_consciousness", name: "Dia da Consciência Negra", type: "fixed", month: 11, day: 20 },
    { id: "christmas", name: "Natal", type: "fixed", month: 12, day: 25 },
    { id: "easter", name: "Páscoa", type: "easter", offset: 0 },
  ];

  const BRAZIL_CARNAVAL = [
    { id: "carnival_mon", name: "Segunda-feira de Carnaval", type: "easter", offset: -48 },
    { id: "carnival_tue", name: "Terça-feira de Carnaval", type: "easter", offset: -47 },
  ];

  function resolveHolidayDate(def, year) {
    if (def.type === "fixed") return new Date(year, def.month - 1, def.day);
    const e = easterSunday(year);
    const d = new Date(e);
    d.setDate(d.getDate() + def.offset);
    return d;
  }

  function getBrazilHolidayMap(year, includeCarnaval) {
    const map = new Map();
    for (const def of BRAZIL_NATIONAL) {
      const date = resolveHolidayDate(def, year);
      map.set(dateKey(date), { name: def.name, category: "national" });
    }
    if (includeCarnaval) {
      for (const def of BRAZIL_CARNAVAL) {
        const date = resolveHolidayDate(def, year);
        map.set(dateKey(date), { name: def.name, category: "optional" });
      }
    }
    return map;
  }

  function collectBrazilHolidayKeys(start, end, includeCarnaval) {
    const keys = new Set();
    for (let y = start.getFullYear(); y <= end.getFullYear(); y += 1) {
      getBrazilHolidayMap(y, includeCarnaval).forEach((_, key) => keys.add(key));
    }
    return keys;
  }

  function getBrazilHolidaysInRange(start, end, includeCarnaval) {
    const inRange = new Map();
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      getBrazilHolidayMap(year, includeCarnaval).forEach((meta, key) => {
        const date = isoToLocalDate(key);
        if (!date || date < start || date > end) return;
        if (isWeekend(date)) return;
        inRange.set(key, { date, name: meta.name, category: meta.category, formattedDate: formatDate(date) });
      });
    }
    return [...inRange.values()].sort((a, b) => a.date - b.date);
  }

  function getUsHolidaySet(year) {
    const holidays = new Set();
    const add = (m, d) => holidays.add(dateKey(new Date(year, m - 1, d)));
    add(1, 1); add(7, 4); add(11, 11); add(12, 25);
    return holidays;
  }

  function collectHolidaySet(start, end, country, options) {
    if (country === "NONE") return new Set();
    if (country === "BR") return collectBrazilHolidayKeys(start, end, options.includeCarnaval);
    const set = new Set();
    for (let y = start.getFullYear(); y <= end.getFullYear(); y += 1) {
      getUsHolidaySet(y).forEach((h) => set.add(h));
    }
    return set;
  }

  function getHolidaysInRange(start, end, country, options) {
    if (country === "BR") return getBrazilHolidaysInRange(start, end, options.includeCarnaval);
    if (country === "US") {
      const names = { "01-01": "Ano Novo", "07-04": "Independence Day", "11-11": "Veterans Day", "12-25": "Christmas Day" };
      const results = [];
      for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
        getUsHolidaySet(year).forEach((key) => {
          const date = isoToLocalDate(key);
          if (!date || date < start || date > end || isWeekend(date)) return;
          const md = key.slice(5);
          results.push({ date, name: names[md] || "Feriado", category: "national", formattedDate: formatDate(date) });
        });
      }
      return results.sort((a, b) => a.date - b.date);
    }
    return [];
  }

  function iterateDays(start, end, fn) {
    const d = new Date(start);
    while (d <= end) {
      fn(new Date(d));
      d.setDate(d.getDate() + 1);
    }
  }

  function countWeekendDays(start, end) {
    let count = 0;
    iterateDays(start, end, (d) => { if (isWeekend(d)) count += 1; });
    return count;
  }

  function countWorkingDays(start, end, holidayHashes) {
    let count = 0;
    iterateDays(start, end, (d) => {
      if (!isWeekend(d) && !isHolidayHash(d, holidayHashes)) count += 1;
    });
    return count;
  }

  function countWeekdayHolidays(start, end, holidayHashes) {
    let count = 0;
    iterateDays(start, end, (d) => {
      if (!isWeekend(d) && isHolidayHash(d, holidayHashes)) count += 1;
    });
    return count;
  }

  function getDateDifferenceResult(startDate, endDate, workingOnly, country, options) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) return null;
    const totalDays = Math.round((e - s) / 86400000);
    const holidaySet = collectHolidaySet(s, e, country, options);
    const holidaysInRange = getHolidaysInRange(s, e, country, options);
    return {
      totalDays,
      workingDays: countWorkingDays(s, e, holidaySet),
      weeks: +(totalDays / 7).toFixed(1),
      hours: totalDays * 24,
      minutes: totalDays * 24 * 60,
      weekends: countWeekendDays(s, e),
      holidayCount: countWeekdayHolidays(s, e, holidaySet),
      holidaysInRange,
      includeCarnaval: Boolean(options.includeCarnaval),
      daysLeftInYear: daysInYear(e.getFullYear()) - dayOfYear(e),
      monthsApprox: +(totalDays / 30.44).toFixed(1),
      startDate: formatDate(s),
      endDate: formatDate(e),
      country,
      calculationMode: workingOnly ? "working" : "calendar",
    };
  }

  function getReverseDateResult(baseDate, days, operation) {
    const base = new Date(baseDate);
    const offset = Math.abs(Number(days));
    const resultDate = new Date(base);
    if (operation === "subtract") resultDate.setDate(resultDate.getDate() - offset);
    else resultDate.setDate(resultDate.getDate() + offset);
    const start = operation === "add" ? base : resultDate;
    const end = operation === "add" ? resultDate : base;
    const metrics = getDateDifferenceResult(start, end, false, "NONE", {});
    if (!metrics) return null;
    return {
      ...metrics,
      startDate: formatDate(base),
      endDate: formatDate(resultDate),
      calculationType: "reverse",
      direction: operation,
    };
  }

  function toHolidayCountry(code) {
    if (code === "us") return "US";
    if (code === "none") return "NONE";
    return "BR";
  }

  /* ── Result helpers ── */
  function getVisibleResultCards(result) {
    const isWorking = result.calculationMode === "working";
    return STR.cardBlueprints.filter((bp) => {
      if (bp.key === "totalDays") return false;
      if (isWorking && bp.key === "workingDays") return false;
      if (bp.key === "holidayCount" && (!result.holidayCount || result.country === "NONE")) return false;
      return true;
    });
  }

  function getResultHero(result) {
    const isWorking = result.calculationMode === "working";
    const isReverse = result.calculationType === "reverse";
    let label = isWorking ? STR.results.heroLabelWorking : STR.results.heroLabel;
    if (isReverse) label = result.direction === "subtract" ? "Dias subtraídos" : "Dias somados";
    return { value: isWorking ? result.workingDays : result.totalDays, label };
  }

  function shouldShowHolidaysInResult(result) {
    return (result.calculationMode === "working" || result.holidayCount > 0) && result.country !== "NONE" && Array.isArray(result.holidaysInRange);
  }

  function formatMetricValue(bp, result) {
    const v = result[bp.key];
    if (bp.format === "locale" && typeof v === "number") return v.toLocaleString("pt-BR");
    return String(v);
  }

  function metricSubtitle(bp, result) {
    if (bp.key === "workingDays" && result.holidayCount > 0) {
      return `Seg-Sex, excl. ${result.holidayCount} feriado(s)`;
    }
    if (bp.subtitleFrom === "endDateYear") {
      return `Dias restantes em ${result.endDate.split("/")[2]}`;
    }
    return bp.subtitle;
  }

  function pdfFilename(result) {
    return `contador-de-dias-${result.startDate.replace(/\//g, "-")}-a-${result.endDate.replace(/\//g, "-")}.pdf`;
  }

  /* ── Share image (canvas) ── */
  const SHARE_C = { cream: "#FAF7F4", white: "#FFFFFF", coral: "#E96C49", peach: "#FCF3E9", navy: "#292C53", heading: "#21253F", body: "#5B6478", muted: "#8A93A6", border: "#EFE7DD", lavender: "#F0EDF8" };

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function truncateCanvas(ctx, text, maxW) {
    let out = String(text ?? "");
    if (ctx.measureText(out).width <= maxW) return out;
    while (out.length > 1 && ctx.measureText(out + "…").width > maxW) out = out.slice(0, -1);
    return out + "…";
  }

  function captureResultSharePng(result) {
    const W = 520, PAD = 18, SCALE = 2;
    const cards = getVisibleResultCards(result);
    const showHolidays = shouldShowHolidaysInResult(result);
    const holidays = showHolidays ? (result.holidaysInRange || []) : [];
    const metricRows = Math.ceil(cards.length / 3);
    let height = PAD + 52 + 50 + 100 + 12 + metricRows * 66;
    if (showHolidays) height += 48 + Math.max(holidays.length, 1) * 28;
    height += 36 + PAD;
    const hero = getResultHero(result);
    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE;
    canvas.height = height * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);
    roundRect(ctx, 0, 0, W, height, 16);
    ctx.fillStyle = SHARE_C.cream;
    ctx.fill();
    ctx.fillStyle = SHARE_C.coral;
    ctx.fillRect(0, 0, W, 52);
    ctx.fillStyle = SHARE_C.white;
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText(SITE_NAME, PAD, 22);
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(STR.results.title, PAD, 40);
    let y = 52 + PAD;
    ctx.textAlign = "center";
    ctx.fillStyle = SHARE_C.coral;
    ctx.font = "bold 40px Inter, sans-serif";
    ctx.fillText(String(hero.value), W / 2, y + 46);
    ctx.fillStyle = SHARE_C.heading;
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillText(hero.label, W / 2, y + 66);
    ctx.textAlign = "left";
    y += 100;
    const cols = 3, gap = 8, cellW = (W - PAD * 2 - gap * 2) / cols, cellH = 52;
    cards.forEach((bp, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = PAD + col * (cellW + gap), cy = y + row * (cellH + gap);
      roundRect(ctx, x, cy, cellW, cellH, 10);
      ctx.fillStyle = SHARE_C.white;
      ctx.fill();
      ctx.fillStyle = bp.tone === "accent" ? SHARE_C.coral : SHARE_C.heading;
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.fillText(truncateCanvas(ctx, formatMetricValue(bp, result), cellW - 14), x + 8, cy + 20);
      ctx.fillStyle = SHARE_C.heading;
      ctx.font = "600 9px Inter, sans-serif";
      ctx.fillText(truncateCanvas(ctx, bp.title, cellW - 14), x + 8, cy + 34);
    });
    return canvas.toDataURL("image/png");
  }

  async function dataUrlToFile(dataUrl, filename) {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], filename, { type: "image/png" });
  }

  function triggerDownload(href, filename) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function shareResultAsImage(result) {
    const filename = `resultado-${result.startDate.replace(/\//g, "-")}-a-${result.endDate.replace(/\//g, "-")}.png`;
    const dataUrl = captureResultSharePng(result);
    const file = await dataUrlToFile(dataUrl, filename);
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: `${SITE_NAME} — Resultados`, files: [file] });
        return { ok: true, method: "share-image" };
      } catch (err) {
        if (err?.name === "AbortError") return { ok: false, method: "abort" };
      }
    }
    triggerDownload(dataUrl, filename);
    return { ok: true, method: "download" };
  }

  async function openWhatsAppShare(result) {
    const out = await shareResultAsImage(result);
    if (out.method === "share-image" || out.method === "abort") return out;
    const text = `${SITE_NAME} — Resultados (${result.startDate} a ${result.endDate})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    return { ok: true, method: "download-whatsapp" };
  }

  function openPrintReport(result) {
    const hero = getResultHero(result);
    const cards = getVisibleResultCards(result);
    const metricsHtml = cards.map((bp) => `
      <div class="metric">
        <p class="value" style="color:${bp.tone === "accent" ? "#E96C49" : "#21253F"}">${formatMetricValue(bp, result)}</p>
        <p class="label">${bp.title}</p>
        <p class="sub">${metricSubtitle(bp, result)}</p>
      </div>`).join("");
    let holidaysHtml = "";
    if (shouldShowHolidaysInResult(result)) {
      const holidays = result.holidaysInRange || [];
      holidaysHtml = `<div class="holidays"><p class="holidays-title">${STR.results.holidaysInRangeTitle}</p>
        ${holidays.length ? `<ul>${holidays.map((h) => `<li>${h.formattedDate} — ${h.name}</li>`).join("")}</ul>` : `<p>${STR.results.holidaysNone}</p>`}
        </div>`;
    }
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${SITE_NAME}</title>
      <style>*{box-sizing:border-box}body{margin:0;font-family:Inter,sans-serif;background:#FAF7F4;padding:24px}
      .header{background:#E96C49;color:#fff;border-radius:12px;padding:16px 20px;margin-bottom:20px}
      .hero{background:#FCF3E9;border-radius:14px;padding:20px;text-align:center;margin:16px 0}
      .hero-value{font-size:42px;font-weight:700;color:#E96C49;margin:0}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      .metric{background:#fff;border:1px solid #EFE7DD;border-radius:12px;padding:14px}
      .value{font-size:24px;font-weight:700;margin:0}.label{font-size:13px;font-weight:600;margin:6px 0 0}
      .sub{font-size:11px;color:#8A93A6;margin:2px 0 0}
      @media(max-width:720px){.grid{grid-template-columns:repeat(2,1fr)}}</style></head><body>
      <div class="header"><h1>${SITE_NAME}</h1><p>Relatório de cálculo de datas</p></div>
      <h2>${STR.results.title}</h2><p>Período: ${result.startDate} a ${result.endDate}</p>
      <div class="hero"><p class="hero-value">${hero.value}</p><p>${hero.label}</p></div>
      <div class="grid">${metricsHtml}</div>${holidaysHtml}
      <script>window.onload=()=>window.print()</script></body></html>`;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return false;
    win.document.write(html);
    win.document.close();
    return true;
  }

  async function downloadResultPdf(result) {
    if (typeof PDFLib !== "undefined") {
      try {
        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        const doc = await PDFDocument.create();
        const page = doc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const margin = 45;
        const bold = await doc.embedFont(StandardFonts.HelveticaBold);
        const regular = await doc.embedFont(StandardFonts.Helvetica);
        const hero = getResultHero(result);
        page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.98, 0.97, 0.96) });
        page.drawRectangle({ x: margin, y: height - 80, width: width - margin * 2, height: 50, color: rgb(0.91, 0.42, 0.29) });
        page.drawText(SITE_NAME, { x: margin + 15, y: height - 55, size: 16, font: bold, color: rgb(1, 1, 1) });
        page.drawText(`${STR.results.title} — ${result.startDate} a ${result.endDate}`, { x: margin, y: height - 110, size: 11, font: regular, color: rgb(0.13, 0.15, 0.25) });
        page.drawText(`${hero.value} ${hero.label}`, { x: margin, y: height - 140, size: 22, font: bold, color: rgb(0.91, 0.42, 0.29) });
        let y = height - 180;
        getVisibleResultCards(result).forEach((bp) => {
          page.drawText(`${bp.title}: ${formatMetricValue(bp, result)}`, { x: margin, y, size: 10, font: regular, color: rgb(0.13, 0.15, 0.25) });
          y -= 18;
        });
        page.drawText(`${SITE_ORIGIN} • ${new Date().toLocaleString("pt-BR")}`, { x: margin, y: 40, size: 8, font: regular, color: rgb(0.36, 0.39, 0.55) });
        const bytes = await doc.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        triggerDownload(URL.createObjectURL(blob), pdfFilename(result));
        return;
      } catch (_) { /* fall through */ }
    }
    if (!openPrintReport(result)) throw new Error("PDF unavailable");
  }

  /* ── UI ── */
  const root = document.getElementById("cdc-calculator");
  if (!root) return;

  let state = {
    tab: "difference",
    startDate: "", endDate: "", mode: "all",
    baseDate: "", days: "", direction: "add",
    workingCountry: "br",
    includeCarnaval: false,
    result: null, loading: false, errors: {},
  };
  let pickers = [];

  function defaultState() {
    return {
      tab: state.tab,
      startDate: "", endDate: "", mode: "all",
      baseDate: "", days: "", direction: "add",
      workingCountry: "br",
      includeCarnaval: false,
      result: null, loading: false, errors: {},
    };
  }

  function applyQuickDate(field, delta) {
    const d = new Date();
    d.setDate(d.getDate() + delta);
    const formatted = formatDate(d);
    if (field === "startDate") state.startDate = formatted;
    else if (field === "endDate") state.endDate = formatted;
    else state.baseDate = formatted;
    const input = root.querySelector(`[data-field="${field}"]`);
    if (input?._flatpickr) input._flatpickr.setDate(d, true);
    render();
  }

  function renderResult(result) {
    const hero = getResultHero(result);
    const cards = getVisibleResultCards(result);
    const showHolidays = shouldShowHolidaysInResult(result);
    const holidays = result.holidaysInRange || [];
    const periodLabel = result.calculationType === "reverse" ? "Data base → Data resultante" : STR.results.periodLabel;

    return `
      <div class="cdc-result">
        <div class="cdc-result-header">
          <span class="cdc-result-header-icon"><i class="fa-solid fa-circle-check"></i></span>
          <div>
            <p class="cdc-result-title">${STR.results.title}</p>
            <p class="cdc-result-subtitle">${periodLabel}</p>
          </div>
        </div>
        <div class="cdc-result-period">
          <span class="cdc-date-chip">${result.startDate}</span>
          <span class="cdc-date-arrow">→</span>
          <span class="cdc-date-chip">${result.endDate}</span>
        </div>
        <div class="cdc-result-hero">
          <p class="cdc-result-hero-value">${hero.value}</p>
          <p class="cdc-result-hero-label">${hero.label}</p>
        </div>
        <div class="cdc-metrics">
          ${cards.map((bp, i) => `
            <div class="cdc-metric">
              <span class="cdc-metric-icon ${STR.metricAccents[i % STR.metricAccents.length]}"><i class="fa-solid ${bp.icon}"></i></span>
              <div>
                <p class="cdc-metric-value">${formatMetricValue(bp, result)}</p>
                <p class="cdc-metric-label">${bp.title}</p>
                <p class="cdc-metric-sub">${metricSubtitle(bp, result)}</p>
              </div>
            </div>`).join("")}
        </div>
        ${showHolidays ? `
          <div class="cdc-holidays">
            <p class="cdc-holidays-title">${STR.results.holidaysInRangeTitle}</p>
            <p class="cdc-holidays-sub">${STR.results.holidaysInRangeSubtitle}</p>
            ${holidays.length ? `<ul class="cdc-holidays-list">${holidays.map((h) => `
              <li class="cdc-holiday-item">
                <span class="cdc-holiday-date">${h.formattedDate}</span>
                <span class="cdc-holiday-name">${h.name}</span>
                <span class="cdc-holiday-tag ${h.category === "optional" ? "cdc-holiday-tag-optional" : ""}">${h.category === "optional" ? STR.results.holidaysOptional : STR.results.holidaysNational}</span>
              </li>`).join("")}</ul>` : `<p class="cdc-holidays-empty">${STR.results.holidaysNone}</p>`}
          </div>` : ""}
        <div class="cdc-actions">
          <button type="button" class="cdc-action-btn cdc-btn-whatsapp" data-action="whatsapp">
            <i class="fa-brands fa-whatsapp"></i> ${STR.results.whatsappButton}
          </button>
          <button type="button" class="cdc-action-btn cdc-btn-ghost" data-action="share">
            <i class="fa-solid fa-share-nodes"></i> ${STR.results.shareButton}
          </button>
          <button type="button" class="cdc-action-btn cdc-btn-download" data-action="pdf">
            <i class="fa-solid fa-download"></i> ${STR.results.pdfButton}
          </button>
        </div>
        <p class="cdc-notice cdc-hidden" id="cdc-notice" role="status"></p>
        <div class="cdc-result-footer">
          <button type="button" class="cdc-new-btn" data-action="new">
            <i class="fa-solid fa-arrow-left"></i> ${STR.results.newCalculation}
          </button>
        </div>
      </div>`;
  }

  function renderTabs() {
    return `
      <div class="cdc-tabs" role="tablist">
        <button type="button" class="cdc-tab ${state.tab === "difference" ? "is-active" : ""}" data-tab="difference" role="tab">${STR.tabs.difference}</button>
        <button type="button" class="cdc-tab ${state.tab === "reverse" ? "is-active" : ""}" data-tab="reverse" role="tab">${STR.tabs.reverse}</button>
        <button type="button" class="cdc-tab ${state.tab === "working" ? "is-active" : ""}" data-tab="working" role="tab">${STR.tabs.working}</button>
      </div>`;
  }

  function renderDateRangeFields() {
    return `
      <div class="cdc-grid-2">
        <div class="cdc-field">
          <label for="cdc-start">${STR.startDate}</label>
          <div class="cdc-input-wrap">
            <i class="fa-solid fa-calendar-days"></i>
            <input type="text" id="cdc-start" class="cdc-input" data-field="startDate" placeholder="DD/MM/AAAA" value="${state.startDate}" autocomplete="off">
          </div>
          ${state.errors.startDate ? `<p class="cdc-error">${state.errors.startDate}</p>` : ""}
          <div class="cdc-quick-btns">
            <button type="button" class="cdc-quick-btn" data-quick="startDate" data-delta="-7">-7 dias</button>
            <button type="button" class="cdc-quick-btn" data-quick="startDate" data-delta="-30">-30 dias</button>
            <button type="button" class="cdc-quick-btn" data-quick="startDate" data-delta="0">Hoje</button>
          </div>
        </div>
        <div class="cdc-field">
          <label for="cdc-end">${STR.endDate}</label>
          <div class="cdc-input-wrap">
            <i class="fa-solid fa-calendar-days"></i>
            <input type="text" id="cdc-end" class="cdc-input" data-field="endDate" placeholder="DD/MM/AAAA" value="${state.endDate}" autocomplete="off">
          </div>
          ${state.errors.endDate ? `<p class="cdc-error">${state.errors.endDate}</p>` : ""}
          <div class="cdc-quick-btns">
            <button type="button" class="cdc-quick-btn" data-quick="endDate" data-delta="7">+7 dias</button>
            <button type="button" class="cdc-quick-btn" data-quick="endDate" data-delta="30">+30 dias</button>
            <button type="button" class="cdc-quick-btn" data-quick="endDate" data-delta="0">Hoje</button>
          </div>
        </div>
      </div>`;
  }

  function renderDifferenceOptions() {
    return `
      <div class="cdc-options">
        <p class="cdc-options-title">${STR.optionsHeading}</p>
        <label class="cdc-radio">
          <input type="radio" name="cdc-mode" value="all" ${state.mode === "all" ? "checked" : ""}> ${STR.radioAll}
        </label>
        <label class="cdc-radio">
          <input type="radio" name="cdc-mode" value="working" ${state.mode === "working" ? "checked" : ""}> ${STR.radioWorking}
        </label>
        ${state.mode === "working" ? `
          <label class="cdc-check">
            <input type="checkbox" id="cdc-carnaval" ${state.includeCarnaval ? "checked" : ""}>
            <span>${STR.carnavalLabel}<span class="cdc-check-hint">${STR.carnavalHint}</span></span>
          </label>` : ""}
      </div>
      <button type="button" class="cdc-btn-primary" id="cdc-submit" ${state.loading ? "disabled" : ""}>
        ${state.loading ? `<i class="fa-solid fa-spinner cdc-spin"></i> ${STR.loading}` : STR.submitDiff}
      </button>`;
  }

  function renderWorkingOptions() {
    return `
      <div class="cdc-options">
        <label class="cdc-field" for="cdc-country">${STR.holidayLabel}</label>
        <select id="cdc-country" class="cdc-select">
          ${STR.countryOptions.map((o) => `<option value="${o.value}" ${state.workingCountry === o.value ? "selected" : ""}>${o.label}</option>`).join("")}
        </select>
        ${state.workingCountry === "br" ? `
          <label class="cdc-check">
            <input type="checkbox" id="cdc-carnaval" ${state.includeCarnaval ? "checked" : ""}>
            <span>${STR.carnavalLabel}<span class="cdc-check-hint">${STR.carnavalHint}</span></span>
          </label>` : ""}
      </div>
      <button type="button" class="cdc-btn-primary" id="cdc-submit" ${state.loading ? "disabled" : ""}>
        ${state.loading ? `<i class="fa-solid fa-spinner cdc-spin"></i> ${STR.loading}` : STR.submitWorking}
      </button>`;
  }

  function renderReverseForm() {
    return `
      <div class="cdc-grid-2">
        <div class="cdc-field">
          <label for="cdc-base">${STR.baseDate}</label>
          <div class="cdc-input-wrap">
            <i class="fa-solid fa-calendar-days"></i>
            <input type="text" id="cdc-base" class="cdc-input" data-field="baseDate" placeholder="DD/MM/AAAA" value="${state.baseDate}" autocomplete="off">
          </div>
          ${state.errors.baseDate ? `<p class="cdc-error">${state.errors.baseDate}</p>` : ""}
          <div class="cdc-quick-btns">
            <button type="button" class="cdc-quick-btn" data-quick="baseDate" data-delta="-7">-7 dias</button>
            <button type="button" class="cdc-quick-btn" data-quick="baseDate" data-delta="-30">-30 dias</button>
            <button type="button" class="cdc-quick-btn" data-quick="baseDate" data-delta="0">Hoje</button>
          </div>
        </div>
        <div class="cdc-field">
          <label for="cdc-days">${STR.daysLabel}</label>
          <input type="number" id="cdc-days" class="cdc-input cdc-input-number" placeholder="${STR.daysPlaceholder}" value="${state.days}" min="1" step="1">
          ${state.errors.days ? `<p class="cdc-error">${state.errors.days}</p>` : ""}
        </div>
      </div>
      <div class="cdc-radio-row">
        <label class="cdc-radio">
          <input type="radio" name="cdc-direction" value="add" ${state.direction === "add" ? "checked" : ""}> ${STR.addDays}
        </label>
        <label class="cdc-radio">
          <input type="radio" name="cdc-direction" value="subtract" ${state.direction === "subtract" ? "checked" : ""}> ${STR.subtractDays}
        </label>
      </div>
      <button type="button" class="cdc-btn-primary" id="cdc-submit" ${state.loading ? "disabled" : ""}>
        ${state.loading ? `<i class="fa-solid fa-spinner cdc-spin"></i> ${STR.loading}` : STR.submitReverse}
      </button>`;
  }

  function renderForm() {
    const tabContent = state.tab === "reverse"
      ? renderReverseForm()
      : renderDateRangeFields() + (state.tab === "working" ? renderWorkingOptions() : renderDifferenceOptions());

    return `
      ${renderTabs()}
      ${tabContent}
      <button type="button" class="cdc-btn-clear" id="cdc-clear">${STR.clear}</button>`;
  }

  function syncEmbedHeight() {
    requestAnimationFrame(() => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      if (window.parent !== window) {
        window.parent.postMessage({ type: "cdc-embed-height", height }, "*");
      }
    });
  }

  window.addEventListener("message", (event) => {
    if (event.data?.type === "cdc-request-height") syncEmbedHeight();
  });
  window.addEventListener("load", syncEmbedHeight);
  window.addEventListener("resize", syncEmbedHeight);

  function render() {
    root.innerHTML = `<div class="cdc-card">${state.result ? renderResult(state.result) : renderForm()}</div>`;
    if (state.result) bindResultEvents();
    else bindFormEvents();
    syncEmbedHeight();
  }

  function initPickers() {
    pickers.forEach((p) => p.destroy());
    pickers = [];
    root.querySelectorAll("[data-field]").forEach((el) => {
      const fp = flatpickr(el, {
        dateFormat: "d/m/Y",
        locale: flatpickr.l10ns.pt,
        allowInput: true,
        disableMobile: true,
        onChange: (_, dateStr) => {
          const field = el.dataset.field;
          if (field === "startDate") state.startDate = dateStr;
          else if (field === "endDate") state.endDate = dateStr;
          else if (field === "baseDate") state.baseDate = dateStr;
        },
      });
      pickers.push(fp);
    });
  }

  function validateRange() {
    const e = {};
    if (!state.startDate) e.startDate = STR.errors.startDateRequired;
    if (!state.endDate) e.endDate = STR.errors.endDateRequired;
    const start = parseDate(state.startDate);
    const end = parseDate(state.endDate);
    if (state.startDate && !start) e.startDate = STR.errors.dateFormat;
    if (state.endDate && !end) e.endDate = STR.errors.dateFormat;
    if (start && end && end < start) e.endDate = STR.errors.endBeforeStart;
    state.errors = e;
    return { ok: !Object.keys(e).length, start, end };
  }

  function validateReverse() {
    const e = {};
    if (!state.baseDate) e.baseDate = STR.errors.baseDateRequired;
    const base = parseDate(state.baseDate);
    if (state.baseDate && !base) e.baseDate = STR.errors.dateFormat;
    if (!state.days) e.days = STR.errors.daysRequired;
    else if (!Number.isFinite(Number(state.days)) || Number(state.days) <= 0) e.days = STR.errors.daysInvalid;
    state.errors = e;
    return { ok: !Object.keys(e).length, base };
  }

  function bindFormEvents() {
    initPickers();
    root.querySelectorAll(".cdc-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tab = btn.dataset.tab;
        state.errors = {};
        render();
      });
    });
    root.querySelector("#cdc-days")?.addEventListener("input", (ev) => { state.days = ev.target.value; });
    root.querySelector("#cdc-submit")?.addEventListener("click", () => {
      if (state.tab === "reverse") {
        const { ok, base } = validateReverse();
        render();
        if (!ok || !base) return;
        state.loading = true;
        render();
        setTimeout(() => {
          state.result = getReverseDateResult(base, Number(state.days), state.direction);
          state.loading = false;
          render();
        }, 120);
        return;
      }
      const { ok, start, end } = validateRange();
      render();
      if (!ok) return;
      state.loading = true;
      render();
      setTimeout(() => {
        if (state.tab === "working") {
          const country = toHolidayCountry(state.workingCountry);
          state.result = getDateDifferenceResult(start, end, true, country, {
            includeCarnaval: state.workingCountry === "br" && state.includeCarnaval,
          });
        } else {
          const workingOnly = state.mode === "working";
          const country = workingOnly ? "BR" : "NONE";
          state.result = getDateDifferenceResult(start, end, workingOnly, country, {
            includeCarnaval: workingOnly && state.includeCarnaval,
          });
        }
        state.loading = false;
        render();
      }, 120);
    });
    root.querySelector("#cdc-clear")?.addEventListener("click", () => {
      state = defaultState();
      render();
    });
    root.querySelectorAll("[data-quick]").forEach((btn) => {
      btn.addEventListener("click", () => applyQuickDate(btn.dataset.quick, Number(btn.dataset.delta)));
    });
    root.querySelectorAll('input[name="cdc-mode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        state.mode = radio.value;
        if (state.mode !== "working") state.includeCarnaval = false;
        render();
      });
    });
    root.querySelectorAll('input[name="cdc-direction"]').forEach((radio) => {
      radio.addEventListener("change", () => { state.direction = radio.value; });
    });
    root.querySelector("#cdc-country")?.addEventListener("change", (ev) => {
      state.workingCountry = ev.target.value;
      if (state.workingCountry !== "br") state.includeCarnaval = false;
      render();
    });
    root.querySelector("#cdc-carnaval")?.addEventListener("change", (ev) => {
      state.includeCarnaval = ev.target.checked;
    });
  }

  function showNotice(msg) {
    const el = root.querySelector("#cdc-notice");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("cdc-hidden");
    setTimeout(() => el.classList.add("cdc-hidden"), 3200);
    syncEmbedHeight();
  }

  function bindResultEvents() {
    const handleShare = async (fn) => {
      try {
        const out = await fn(state.result);
        if (!out.ok && out.method === "abort") return;
        if (!out.ok) { showNotice(STR.results.shareFailed); return; }
        if (out.method === "download" || out.method === "download-whatsapp") showNotice(STR.results.shareImageDownloaded);
        else if (out.method === "share-image") showNotice(STR.results.shareImageSuccess);
      } catch {
        showNotice(STR.results.shareFailed);
      }
    };
    root.querySelector('[data-action="whatsapp"]')?.addEventListener("click", () => handleShare(openWhatsAppShare));
    root.querySelector('[data-action="share"]')?.addEventListener("click", () => handleShare(shareResultAsImage));
    root.querySelector('[data-action="pdf"]')?.addEventListener("click", async () => {
      try { await downloadResultPdf(state.result); }
      catch { showNotice(STR.results.shareFailed); }
    });
    root.querySelector('[data-action="new"]')?.addEventListener("click", () => {
      const tab = state.tab;
      state = defaultState();
      state.tab = tab;
      render();
    });
  }

  render();
})();
