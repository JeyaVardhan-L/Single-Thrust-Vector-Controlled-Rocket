/* Light / dark theme. Classic script, loaded in <head> on every page so the theme is set before first paint.
 * Light = bone paper + indigo, dark = near-black + orange. The choice is remembered; the first visit follows the system setting.
 * Pages that draw on a canvas or in three.js read their colours from TVCTheme.colors() and redraw on the 'themechange' event. */
(function () {
  var KEY = 'tvc-theme';
  var root = document.documentElement;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function initial() {
    var s = stored();
    if (s === 'dark' || s === 'light') return s;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function hex(str) { return parseInt(str.replace('#', ''), 16); }

  // Canvas / three.js colours per theme (CSS handles the rest through variables).
  var PALETTE = {
    light: { bg: '#e8e6e0', panel: '#ffffff', ink: '#000000', accent: '#1925aa', muted: '#4a4840', grid: '#dad7cf', gridMajor: '#c6c3ba', soft: '#d6d3cb', mid: '#9d9a92', sulfur: '#d6d3cb', lineInk: '#000000', fill: '#ffffff', warn: '#000000' },
    dark:  { bg: '#121214', panel: '#1b1b1e', ink: '#f1ede6', accent: '#ff7a1f', muted: '#a09b90', grid: '#222226', gridMajor: '#33333a', soft: '#2a2a2e', mid: '#6d6a63', sulfur: '#34343a', lineInk: '#f1ede6', fill: '#17171a', warn: '#ffd0a8' },
  };

  var api = {
    get: function () { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    colors: function () { return PALETTE[api.get()]; },
    /** same palette with the colours as 0xRRGGBB numbers (three.js) */
    three: function () { var c = PALETTE[api.get()], o = {}; for (var k in c) o[k] = hex(c[k]); return o; },
    set: function (t) {
      root.setAttribute('data-theme', t);
      try { localStorage.setItem(KEY, t); } catch (e) { /* private mode */ }
      var b = document.getElementById('themeBtn');
      if (b) { b.setAttribute('aria-pressed', t === 'dark'); b.querySelector('span').textContent = t === 'dark' ? 'Light' : 'Dark'; }
      window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
    },
    toggle: function () { api.set(api.get() === 'dark' ? 'light' : 'dark'); },
  };
  window.TVCTheme = api;
  root.setAttribute('data-theme', initial());

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.topbar');
    if (!bar || document.getElementById('themeBtn')) return;
    var b = document.createElement('button');
    b.id = 'themeBtn'; b.type = 'button'; b.className = 'theme-btn';
    b.setAttribute('aria-label', 'Switch between light and dark theme');
    b.setAttribute('aria-pressed', api.get() === 'dark');
    b.innerHTML = '<i aria-hidden="true"></i><span>' + (api.get() === 'dark' ? 'Light' : 'Dark') + '</span>';
    b.addEventListener('click', api.toggle);
    var cta = bar.querySelector('.cta');
    bar.insertBefore(b, cta || null);
  });
})();
