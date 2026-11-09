/* i18n: carga lang/es.json como base y encima el idioma elegido.
   Si falta una clave en el idioma elegido se usa la de es.json. */
var LANGS = ['es', 'en', 'ru', 'ja'];

/* Funciones por idioma. Cada idioma activa solo lo suyo:
   - support: panel "Apoyar" (solo español)
   - jp: extras exclusivos del japonés (marco negro, etc.; se conectan en la fase de idiomas) */
var FEATURES = {
  es: { support: true },
  en: {},
  ru: {},
  ja: { jp: true }
};

var LANG = 'es', STR = {}, BASE = {};

function getLang() {
  try { var l = localStorage.getItem('lang'); if (LANGS.indexOf(l) > -1) return l; } catch (e) {}
  return 'en';
}

function tr(key, vars) {
  var s = STR[key];
  if (s === undefined) s = BASE[key];
  if (s === undefined) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, function (m, n) { return vars[n] !== undefined ? vars[n] : m; });
  return s;
}

function loadJSON(url) {
  return fetch(url).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); });
}

function loadLang(l) {
  return loadJSON('lang/es.json').then(function (base) {
    BASE = base; STR = base; LANG = l;
    if (l === 'es') return;
    return loadJSON('lang/' + l + '.json').then(function (j) { STR = j; }).catch(function () { STR = {}; });
  });
}

function applyI18n() {
  document.documentElement.lang = LANG;
  document.title = tr('page.title');
  document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = tr(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = tr(el.getAttribute('data-i18n-html')); });
  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(';').forEach(function (p) {
      var i = p.indexOf(':'); el.setAttribute(p.slice(0, i), tr(p.slice(i + 1)));
    });
  });
  var F = FEATURES[LANG] || {};
  ['sup', 'smodal'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.hidden = !F.support || (id === 'smodal');
  });
  document.documentElement.classList.remove('i18n-pending');
  var sel = document.getElementById('lang');
  if (sel) {
    sel.value = LANG;
    sel.onchange = function () {
      try { localStorage.setItem('lang', sel.value); } catch (e) {}
      location.reload();
    };
  }
}

var I18N_READY = loadLang(getLang());
