/* CBFX Hub — DEV MOCK FILL
 * Auto-fills every empty form field, checks the first radio in each group,
 * ticks reasonable checkboxes. Banner at top lets you clear and re-fill.
 *
 * REMOVE THIS SCRIPT AND THE <script src="..."> REFERENCES BEFORE PRODUCTION.
 *
 * Activates automatically on any tools/ page.
 * Press Alt+M to toggle fill on/off after page load.
 */
(function () {
  if (window.__cbfxMockInstalled) return;
  window.__cbfxMockInstalled = true;

  const mockTextByPattern = [
    [/email/i,            'mock.artist@chicken-bone.com'],
    [/phone|tel/i,        '(555) 123-4567'],
    [/firstname|first.?n|^fn/i,  'Mock'],
    [/lastname|last.?n|^ln/i,    'Tester'],
    [/fullname|full.?n|name/i,   'Mock Tester'],
    [/role|title/i,       'Compositor'],
    [/show|project/i,     'OCTET'],
    [/client|broadcaster/i, 'Netflix'],
    [/contact/i,          'Jane Producer'],
    [/episode|segment/i,  'EP101'],
    [/requested|requester|submit|approv|sup|crew/i, 'Biggie Rodas'],
    [/vendor|payee/i,     'Chicken Bone FX'],
    [/department|dept/i,  'Compositing'],
    [/batch/i,            'Batch-Mock-001'],
    [/notes|description|reqs|expected|actual|steps|terms|memo|other/i,
                          'Mock data for testing — replace before sending.'],
    [/system|machine|host/i, 'DESKTOP-DIED0FQ'],
    [/affected/i,         'Nuke 16.0v8 on DESKTOP-DIED0FQ'],
    [/colorspace/i,       'ACES 1.3 / ACEScg'],
    [/cost|code|budget|po.?num|invoice|invno/i, 'PO-2026-0001'],
    [/url|link/i,         'https://example.com'],
  ];

  const numericByPattern = [
    [/amount|rate|fee|rental|kit|box/i, '1500'],
    [/days|count|shots|crew|tier|handles|frames/i, '5'],
  ];

  function pickMockText(el) {
    const tag = el.tagName.toLowerCase();
    const idn = (el.id + ' ' + el.name + ' ' + (el.placeholder || '')).toLowerCase();
    if (el.type === 'number') {
      for (const [re, v] of numericByPattern) if (re.test(idn)) return v;
      return '5';
    }
    if (el.type === 'date') {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().slice(0, 10);
    }
    if (el.type === 'email') return 'mock.artist@chicken-bone.com';
    if (el.type === 'tel')   return '(555) 123-4567';
    if (el.type === 'url')   return 'https://example.com';
    for (const [re, v] of mockTextByPattern) if (re.test(idn)) return v;
    if (tag === 'textarea') return 'Mock data for testing — replace before sending.';
    return 'Mock value';
  }

  function fireEvents(el) {
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
  }

  function fillTextInputs() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.disabled || el.readOnly) return;
      const t = (el.type || '').toLowerCase();
      if (['radio','checkbox','hidden','submit','button','file'].includes(t)) return;
      if (el.tagName === 'SELECT') {
        if (!el.value) {
          const opt = [...el.options].find(o => o.value && !o.disabled);
          if (opt) { el.value = opt.value; fireEvents(el); }
        }
        return;
      }
      if (el.value && el.value.trim() !== '') return;
      el.value = pickMockText(el);
      fireEvents(el);
    });
  }

  function pickRadios() {
    const groups = new Map();
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      if (!r.name || r.disabled) return;
      if (!groups.has(r.name)) groups.set(r.name, []);
      groups.get(r.name).push(r);
    });
    groups.forEach((radios, name) => {
      if (radios.some(r => r.checked)) return;
      const first = radios.find(r => !r.disabled);
      if (!first) return;
      first.checked = true;
      fireEvents(first);
      // also click in case there's a custom UI handler bound to click
      try { first.click(); } catch (e) {}
    });
  }

  function tickCheckboxes() {
    // Tick "yes / received / completed / acknowledged / I agree" style boxes.
    // Skip ones with words that mean "no/skip".
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.disabled || cb.checked) return;
      const idn = (cb.id + ' ' + cb.name + ' ' + (cb.value || '')).toLowerCase();
      if (/skip|none|optout|opt-out|do.?not/i.test(idn)) return;
      cb.checked = true;
      fireEvents(cb);
    });
  }

  function clearAll() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
      const t = (el.type || '').toLowerCase();
      if (t === 'radio' || t === 'checkbox') { el.checked = false; fireEvents(el); return; }
      if (['hidden','submit','button','file'].includes(t)) return;
      if (el.tagName === 'SELECT') { el.selectedIndex = 0; fireEvents(el); return; }
      el.value = '';
      fireEvents(el);
    });
  }

  function fillAll() {
    fillTextInputs();
    pickRadios();
    tickCheckboxes();
    // workstation-request: it dynamically adds artist cards via addArtist() - fill those too
    setTimeout(() => { fillTextInputs(); pickRadios(); tickCheckboxes(); }, 250);
  }

  function makeBanner() {
    const bar = document.createElement('div');
    bar.id = 'cbfx-mock-banner';
    bar.style.cssText = [
      'position:fixed','top:0','left:0','right:0','z-index:99999',
      'background:#e8620a','color:#fff','font:600 12px/1.4 Figtree,sans-serif',
      'padding:8px 16px','display:flex','align-items:center','gap:12px',
      'box-shadow:0 2px 8px rgba(0,0,0,.25)','letter-spacing:.04em',
      'text-transform:uppercase'
    ].join(';');
    bar.innerHTML = `
      <span style="flex:1">⚠️ DEV MOCK FILL ACTIVE — remove assets/dev-mock-fill.js before production</span>
      <button id="cbfx-mock-refill" style="background:#fff;color:#e8620a;border:0;padding:5px 12px;font:700 11px Figtree,sans-serif;letter-spacing:.08em;text-transform:uppercase;border-radius:4px;cursor:pointer">Refill</button>
      <button id="cbfx-mock-clear"  style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:5px 12px;font:600 11px Figtree,sans-serif;letter-spacing:.08em;text-transform:uppercase;border-radius:4px;cursor:pointer">Clear</button>
      <button id="cbfx-mock-hide"   style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:5px 10px;font:600 11px Figtree,sans-serif;border-radius:4px;cursor:pointer">×</button>
    `;
    document.body.appendChild(bar);
    document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop) || 0) + 40 + 'px';
    document.getElementById('cbfx-mock-refill').onclick = fillAll;
    document.getElementById('cbfx-mock-clear').onclick  = clearAll;
    document.getElementById('cbfx-mock-hide').onclick   = () => bar.style.display = 'none';
  }

  function init() {
    makeBanner();
    fillAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Alt+M toggles fill again (useful after navigating wizard steps)
  document.addEventListener('keydown', e => {
    if (e.altKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); fillAll(); }
  });
})();
