/* Sree Sahithi Kantamneni, portfolio. Vanilla JS + GSAP/ScrollTrigger (optional, loaded locally). */
(function () {
  'use strict';

  var doc = document.documentElement;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileMQ = window.matchMedia('(max-width: 900px)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = reduceMQ.matches;
  if (reduced) doc.classList.add('reduced');

  var EMAIL = 'sreesahithikapply@gmail.com';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------------- Page visibility: pause everything when hidden ---------------- */
  var pageVisible = !document.hidden;
  document.addEventListener('visibilitychange', function () {
    pageVisible = !document.hidden;
    doc.classList.toggle('paused', !pageVisible);
    if (hasGSAP) pageVisible ? gsap.globalTimeline.resume() : gsap.globalTimeline.pause();
    if (pageVisible) startLoop();
  });

  /* ---------------- Theme ---------------- */
  var themeBtn = $('#themeToggle');
  function setTheme(t) {
    doc.setAttribute('data-theme', t);
    store('theme', t);
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#070E1F' : '#F1F5FB');
  }
  setTheme(doc.getAttribute('data-theme') || 'dark');
  themeBtn.addEventListener('click', function () { setTheme(doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });

  /* ---------------- Security notes ---------------- */
  var secBtn = $('#secToggle');
  function setSec(on) {
    doc.classList.toggle('sec', on);
    secBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    store('secNotes', on ? '1' : '0');
    setTimeout(function () { if (hasST) ScrollTrigger.refresh(); if (typeof syncActive === 'function') syncActive(); }, 700);
  }
  setSec(doc.classList.contains('sec'));
  secBtn.addEventListener('click', function () { setSec(!doc.classList.contains('sec')); });
  $$('[data-sec]').forEach(function (b) { b.addEventListener('click', function () { setSec(b.getAttribute('data-sec') === 'on'); }); });

  /* ---------------- Diagram: camera, packets, probe ---------------- */
  var svg = $('#diagram'), stage = $('#stage'), probe = $('#probe');
  var nodes = {};
  $$('.node', svg).forEach(function (n) {
    nodes[n.getAttribute('data-id')] = { el: n, x: +n.getAttribute('data-x'), y: +n.getAttribute('data-y') };
  });
  var litEdges = { overview: [], frontend: [], api: ['e1'], database: ['e2'], monitoring: ['e3'], security: ['e4', 'e5'], response: ['e6'] };
  var cam = { x: 0, y: 0, w: 1200, h: 700 };
  var current = 'overview';

  function fit(b, r) {
    var W = stage.clientWidth || window.innerWidth, H = stage.clientHeight || window.innerHeight;
    var aspect = W / H, rw = r[1] - r[0], rh = r[3] - r[2];
    var vw = b.w / rw, vh = vw / aspect;
    if (b.h / rh > vh) { vh = b.h / rh; vw = vh * aspect; }
    return { x: b.x - r[0] * vw - (rw * vw - b.w) / 2, y: b.y - r[2] * vh - (rh * vh - b.h) / 2, w: vw, h: vh };
  }
  function cameraFor(id) {
    var mobile = mobileMQ.matches;
    if (id === 'overview' || mobile || !nodes[id]) {
      return fit({ x: 90, y: 70, w: 1080, h: 600 }, mobile ? [0.03, 0.97, 0.04, 0.96] : [0.44, 0.98, 0.1, 0.94]);
    }
    var n = nodes[id];
    return fit({ x: n.x - 260, y: n.y - 220, w: 520, h: 440 }, [0.02, 0.5, 0.12, 0.92]);
  }
  function applyCam() { svg.setAttribute('viewBox', cam.x.toFixed(1) + ' ' + cam.y.toFixed(1) + ' ' + cam.w.toFixed(1) + ' ' + cam.h.toFixed(1)); }

  function goTo(id, instant) {
    current = id;
    var target = cameraFor(id);
    Object.keys(nodes).forEach(function (k) {
      nodes[k].el.classList.toggle('active', k === id);
      nodes[k].el.classList.toggle('dim', id !== 'overview' && k !== id && !mobileMQ.matches);
    });
    $$('.edge', svg).forEach(function (e) { e.classList.toggle('lit', (litEdges[id] || []).indexOf(e.id) > -1); });
    var p = nodes[id] || nodes.frontend;
    if (hasGSAP && !reduced && !instant) {
      gsap.to(cam, { x: target.x, y: target.y, w: target.w, h: target.h, duration: 1.2, ease: 'power3.inOut', onUpdate: applyCam, overwrite: true });
      gsap.to(probe, { attr: { cx: p.x, cy: p.y }, duration: 1.2, ease: 'power3.inOut', overwrite: true });
    } else {
      cam = target; applyCam();
      probe.setAttribute('cx', p.x); probe.setAttribute('cy', p.y);
    }
  }

  // Packets that flow continuously along every edge
  var packets = [];
  var pkLayer = $('#packets');
  var NS = 'http://www.w3.org/2000/svg';
  $$('.edge', svg).forEach(function (path) {
    var len = path.getTotalLength();
    var count = path.classList.contains('edge-return') ? 1 : 2;
    for (var i = 0; i < count; i++) {
      var g = document.createElementNS(NS, 'g');
      var halo = document.createElementNS(NS, 'circle'); halo.setAttribute('r', '11'); halo.setAttribute('class', 'pk-glow');
      var dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '3.6'); dot.setAttribute('class', 'pk');
      g.appendChild(halo); g.appendChild(dot); pkLayer.appendChild(g);
      packets.push({ g: g, path: path, len: len, t: i / count + Math.random() * 0.15, speed: 70 + Math.random() * 30 });
    }
  });
  function placePackets() {
    packets.forEach(function (p) {
      var pt = p.path.getPointAtLength((p.t % 1) * p.len);
      p.g.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
    });
  }
  var stageVisible = true, loopOn = false, last = 0;
  function frame(ts) {
    if (!pageVisible || !stageVisible || reduced) { loopOn = false; return; }
    var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0; last = ts;
    packets.forEach(function (p) { p.t += (p.speed * dt) / p.len; });
    placePackets();
    requestAnimationFrame(frame);
  }
  function startLoop() { if (loopOn || reduced) return; loopOn = true; last = 0; requestAnimationFrame(frame); }
  placePackets();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { stageVisible = es[0].isIntersecting; if (stageVisible) startLoop(); }).observe(stage);
  }
  startLoop();

  goTo('overview', true);
  window.addEventListener('resize', function () { goTo(current, true); sizePipe(); });

  /* ---------------- Hero entrance (one orchestrated moment) ---------------- */
  doc.classList.add('ready');
  if (hasGSAP && !reduced) {
    var tl = gsap.timeline();
    tl.from('.edge', { opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power1.out' })
      .from('.node', { opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, 0.1)
      .from('.hero-copy > *', { opacity: 0, y: 18, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 0.35);
  }

  /* ---------------- Scroll storytelling ---------------- */
  var stopEls = $$('[data-stop]');
  // The active stop is whichever section crosses 55% of the viewport height.
  function syncActive() {
    var mark = window.innerHeight * 0.55, id = 'overview';
    stopEls.forEach(function (s) { if (s.getBoundingClientRect().top <= mark) id = s.getAttribute('data-stop'); });
    if (id !== current) goTo(id);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; syncActive(); });
  }, { passive: true });
  syncActive();
  if (hasST && !reduced) {
    stopEls.forEach(function (sec) {
      var panel = $('.panel', sec);
      if (panel) gsap.from(panel, { opacity: 0, y: 48, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 80%', once: true } });
    });
  }
  mobileMQ.addEventListener && mobileMQ.addEventListener('change', function () { goTo(current, true); sizePipe(); if (hasST) ScrollTrigger.refresh(); });

  /* ---------------- Mobile: packets flowing down the vertical pipeline ---------------- */
  var stops = $('#stops'), pipePks = [];
  if (!reduced) {
    for (var i = 0; i < 4; i++) {
      var s = document.createElement('span'); s.className = 'pipe-pk'; s.setAttribute('aria-hidden', 'true');
      stops.appendChild(s); pipePks.push(s);
    }
  }
  function sizePipe() {
    if (!pipePks.length) return;
    var on = mobileMQ.matches, h = stops.offsetHeight, dur = Math.max(h / 240, 8);
    pipePks.forEach(function (p, k) {
      p.style.display = on ? '' : 'none';
      p.style.setProperty('--pipe-h', h + 'px');
      p.style.animationDuration = dur + 's';
      p.style.animationDelay = (-k * dur / pipePks.length) + 's';
    });
  }
  sizePipe();

  /* ---------------- Count-up numbers ---------------- */
  function fmt(el, v) { el.textContent = (el.getAttribute('data-prefix') || '') + Math.round(v) + (el.getAttribute('data-suffix') || ''); }
  function countUp(el) {
    if (el.__done) return; el.__done = true;
    var to = +el.getAttribute('data-count');
    if (reduced || !hasGSAP) { fmt(el, to); return; }
    var o = { v: 0 }; fmt(el, 0);
    gsap.to(o, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: function () { fmt(el, o.v); } });
  }

  /* ---------------- Widgets ---------------- */
  var widgets = {
    tree: function (w) {
      if (!hasGSAP || reduced) return;
      gsap.from($$('.cmp > span, .cmp em', w), { opacity: 0, x: -16, duration: 0.45, stagger: 0.14, ease: 'power2.out' });
    },
    api: function (w) {
      var num = $('.lat-num', w), bar = $('.lat-bar', w);
      if (!hasGSAP || reduced) return;
      var o = { v: 100 };
      num.textContent = '100'; bar.style.width = '100%';
      gsap.to(o, { v: 60, duration: 2.2, delay: 0.3, ease: 'power2.inOut', onUpdate: function () { num.textContent = Math.round(o.v); bar.style.width = o.v + '%'; } });
    },
    db: function (w) {
      var bar = $('.plan-new', w);
      if (hasGSAP && !reduced) gsap.fromTo(bar, { width: '100%' }, { width: '50%', duration: 1.8, delay: 0.3, ease: 'power3.inOut' });
      startStream(w);
    },
    gauges: function (w) {
      var fill = $('#gFill');
      if (hasGSAP && !reduced) gsap.fromTo(fill, { strokeDasharray: '0 100' }, { strokeDasharray: '30 100', duration: 1.4, ease: 'power2.out' });
      startSpark(w);
    },
    inspect: function (w) { startInspect(w); }
  };

  // Sensor stream for the database widget (illustrative values)
  var streamTimer = null, streamT = 9 * 3600;
  function streamRow() {
    var rows = $('#streamRows'); if (!rows) return;
    streamT += 10;
    var hh = String(Math.floor(streamT / 3600) % 24).padStart(2, '0'), mm = String(Math.floor(streamT / 60) % 60).padStart(2, '0'), ss = String(streamT % 60).padStart(2, '0');
    var p = document.createElement('p');
    p.innerHTML = '<span>' + hh + ':' + mm + ':' + ss + '</span>  sensor_' + String(1 + Math.floor(Math.random() * 12)).padStart(2, '0') + '  INSERT ok';
    rows.appendChild(p);
    while (rows.children.length > 3) rows.removeChild(rows.firstChild);
  }
  function startStream(w) {
    for (var k = 0; k < 3; k++) streamRow();
    if (reduced || streamTimer) return;
    streamTimer = setInterval(function () { if (pageVisible && isOn(w)) streamRow(); }, 1400);
  }

  // Sparkline (illustrative)
  var sparkTimer = null, sparkPts = [];
  for (var j = 0; j < 30; j++) sparkPts.push(22 + Math.random() * 14);
  function drawSpark() {
    var d = sparkPts.map(function (v, k) { return (k ? 'L' : 'M') + (k * 300 / (sparkPts.length - 1)).toFixed(1) + ' ' + v.toFixed(1); }).join(' ');
    $('#sparkPath').setAttribute('d', d);
  }
  function startSpark(w) {
    drawSpark();
    if (reduced || sparkTimer) return;
    sparkTimer = setInterval(function () {
      if (!pageVisible || !isOn(w)) return;
      var lastV = sparkPts[sparkPts.length - 1];
      sparkPts.shift(); sparkPts.push(Math.max(8, Math.min(44, lastV + (Math.random() - 0.5) * 12)));
      drawSpark();
    }, 700);
  }

  // Packet inspection stream (documentation IP ranges and example domains)
  var PKTS = [
    { src: '192.0.2.14', req: 'GET /menu', ok: true },
    { src: '198.51.100.7', req: 'POST /login', ok: true },
    { src: '203.0.113.66', req: 'GET paypa1-login.example/verify', ok: false, why: 'PhishAlert: look-alike domain' },
    { src: '192.0.2.41', req: 'GET /orders/1042', ok: true },
    { src: '203.0.113.9', req: 'SYN to ports 1-1024', ok: false, why: 'Snort rule: port scan' },
    { src: '198.51.100.23', req: 'POST /billing/invoices', ok: true },
    { src: '203.0.113.88', req: 'POST /login x40 in 10 s', ok: false, why: 'Snort rule: brute force' }
  ];
  var pkIdx = 0, inspectTimer = null;
  function pkRow(animate) {
    var list = $('#pkList'), p = PKTS[pkIdx++ % PKTS.length];
    var li = document.createElement('li');
    if (!p.ok) li.className = 'bad';
    if (animate) li.className += ' enter';
    li.innerHTML = '<span class="src">' + esc(p.src) + '</span><span class="req-t">' + esc(p.req) + (p.why ? '<span class="why">' + esc(p.why) + '</span>' : '') + '</span><span class="v">' + (p.ok ? 'ALLOW' : 'BLOCK') + '</span>';
    list.appendChild(li);
    while (list.children.length > 5) list.removeChild(list.firstChild);
  }
  function startInspect(w) {
    if (!$('#pkList').children.length) for (var k = 0; k < 5; k++) pkRow(false);
    if (reduced || inspectTimer) return;
    inspectTimer = setInterval(function () { if (pageVisible && isOn(w)) pkRow(true); }, 1300);
  }

  // Visibility of widgets, and one-time triggers
  var onScreen = new WeakMap();
  function isOn(el) { return onScreen.get(el) === true; }
  if ('IntersectionObserver' in window) {
    var wio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        onScreen.set(e.target, e.isIntersecting);
        if (!e.isIntersecting) return;
        var t = e.target;
        if (t.hasAttribute('data-widget') && !t.__started) { t.__started = true; widgets[t.getAttribute('data-widget')](t); }
        if (t.hasAttribute('data-count')) countUp(t);
      });
    }, { threshold: 0.35 });
    $$('[data-widget], [data-count]').forEach(function (el) { wio.observe(el); });
  } else {
    $$('[data-widget]').forEach(function (w) { widgets[w.getAttribute('data-widget')](w); });
  }

  /* ---------------- Microinteractions ---------------- */
  if (fineMQ.matches && !reduced) {
    $$('.mag').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * 0.22, dy = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transition = 'transform .4s cubic-bezier(.3,1.6,.5,1)'; el.style.transform = ''; setTimeout(function () { el.style.transition = ''; }, 400); });
    });
    $$('.glow').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------- Copy email ---------------- */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var out = $('.copied', b.closest('.panel') || document);
      var text = b.getAttribute('data-copy');
      function ok() { if (out) { out.textContent = 'Email copied'; setTimeout(function () { out.textContent = ''; }, 2500); } }
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, function () { if (out) out.textContent = text; });
      else if (out) out.textContent = text;
    });
  });

  /* ---------------- Resume: fall back gracefully until assets/resume.pdf exists ---------------- */
  var resumeReady = false;
  function resumeFallback() {
    $$('[data-resume]').forEach(function (a) {
      a.removeAttribute('download');
      a.href = 'mailto:' + EMAIL + '?subject=Resume%20request';
      a.textContent = 'Request my resume';
    });
  }
  if (location.protocol === 'file:') resumeFallback();
  else fetch('resume.pdf', { method: 'HEAD' }).then(function (r) { if (r.ok) resumeReady = true; else resumeFallback(); }).catch(resumeFallback);

  /* ---------------- Command palette ---------------- */
  var pal = $('#palette'), input = $('#paletteInput'), list = $('#paletteList'), out = $('#paletteOut');
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var hintKey = isMac ? '⌘K' : 'Ctrl K';
  $('#kbdHint').textContent = fineMQ.matches ? hintKey : '>_';
  $$('.kbd-inline').forEach(function (k) { k.textContent = hintKey; });

  function jump(id) { return function () { closePal(); var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }; }
  function print(html) { out.hidden = false; out.innerHTML = html; }

  var TRACE = [
    ['frontend', 'QuickBite, +22% retention'],
    ['api', 'Improvation LLC (current), 40% lower latency'],
    ['database', 'Shiv Nadar University, 50% less scan time'],
    ['monitoring', 'Cyber Florida, 500GB+ telemetry'],
    ['security', 'PhishAlert, NetSleuth IDS, GICSP'],
    ['response', '200 OK, ' + EMAIL]
  ];
  var CMDS = [
    { label: 'Follow the request', hint: 'start', kw: 'tour start frontend', run: jump('frontend') },
    { label: 'Frontend', hint: 'hop 1', kw: 'quickbite react', run: jump('frontend') },
    { label: 'API, current role', hint: 'hop 2', kw: 'improvation backend aws', run: jump('api') },
    { label: 'Database', hint: 'hop 3', kw: 'shiv nadar mysql schema', run: jump('database') },
    { label: 'Monitoring', hint: 'hop 4', kw: 'jelly glass cyber florida splunk dashboards', run: jump('monitoring') },
    { label: 'Security checkpoint', hint: 'hop 5', kw: 'certifications gicsp btl1', run: jump('security') },
    { label: '30-second summary', hint: 'skip', kw: 'skip summary recruiter skills', run: jump('summary') },
    { label: 'QuickBite', hint: 'project', kw: 'food ordering java php', run: jump('p-quickbite') },
    { label: 'Smart prescription dictation', hint: 'project', kw: 'asr speech react medical', run: jump('p-dictation') },
    { label: 'AI recipe planner (FOON)', hint: 'project', kw: 'mcts a* search ai', run: jump('p-foon') },
    { label: 'PhishAlert', hint: 'project', kw: 'phishing nlp', run: jump('p-phishalert') },
    { label: 'NetSleuth IDS', hint: 'project', kw: 'snort wireshark ids', run: jump('p-netsleuth') },
    { label: 'SafeCodeCheck', hint: 'project', kw: 'rust c vulnerabilities', run: jump('p-safecodecheck') },
    { cmd: 'trace', label: 'trace', hint: 'command', kw: 'traceroute route hops', keep: true, run: function () {
      print('<span class="k">trace</span> to sree-sahithi-kantamneni, 6 hops\n\n' + TRACE.map(function (h, k) {
        return ' ' + (k + 1) + '  ' + esc(h[0]).padEnd(12) + esc(h[1]);
      }).join('\n') + '\n\n<span class="s">Reached in 6 hops.</span> Type "follow" to take the tour.');
    } },
    { cmd: 'resume', label: 'resume', hint: 'command', kw: 'cv pdf download', run: function () {
      closePal();
      if (resumeReady) window.location.href = 'resume.pdf';
      else jump('summary')();
    } },
    { cmd: 'contact', label: 'contact', hint: 'command', kw: 'email hire', run: jump('response') },
    { cmd: 'security on', label: 'security on', hint: 'command', kw: 'notes', run: function () { setSec(true); closePal(); } },
    { cmd: 'security off', label: 'security off', hint: 'command', kw: 'notes', run: function () { setSec(false); closePal(); } },
    { cmd: 'theme light', label: 'theme light', hint: 'command', kw: 'mode', run: function () { setTheme('light'); closePal(); } },
    { cmd: 'theme dark', label: 'theme dark', hint: 'command', kw: 'mode', run: function () { setTheme('dark'); closePal(); } },
    { cmd: 'curl', label: 'curl', hint: 'try it', kw: 'api json me', keep: true, run: function () {
      var j = {
        name: 'Sree Sahithi Kantamneni', role: 'Software Developer', company: 'Improvation LLC', since: '2025-07',
        location: 'FL, USA', focus: ['full-stack', 'data systems', 'security mindset'],
        certs: ['GICSP', 'ICS410', 'ICS310', 'BTL1'], contact: EMAIL, status: 200
      };
      print('$ curl -s https://sahithik156.github.io/api/me\n\n' + esc(JSON.stringify(j, null, 2)).replace(/&quot;([^&]+)&quot;:/g, '<span class="k">"$1"</span>:'));
    } },
    { cmd: 'help', label: 'help', hint: 'command', kw: 'commands ?', keep: true, run: function () {
      print('Commands\n\n  <span class="k">trace</span>         show every hop of the request\n  <span class="k">resume</span>        get my resume\n  <span class="k">contact</span>       jump to contact details\n  <span class="k">security on</span>   show how I would harden each layer\n  <span class="k">security off</span>  hide the notes\n  <span class="k">theme light</span>   or theme dark\n  <span class="k">curl</span>          query me like an API\n\nOr type any section or project name.');
    } }
  ];
  CMDS.forEach(function (c) { c.hay = (c.label + ' ' + c.kw + ' ' + c.hint).toLowerCase(); });

  var results = [], sel = 0, lastFocus = null;
  function filter() {
    var q = input.value.trim().toLowerCase();
    if (q === 'follow') q = 'follow the request';
    results = !q ? CMDS : CMDS.filter(function (c) {
      return c.hay.indexOf(q) > -1 || (c.cmd && q.indexOf(c.cmd) === 0);
    });
    if (q.indexOf('curl') === 0) results = CMDS.filter(function (c) { return c.cmd === 'curl'; });
    sel = 0; render();
  }
  function render() {
    if (!results.length) {
      list.innerHTML = '<li class="empty" role="option" aria-disabled="true">No match. Type help to see commands.</li>';
      input.setAttribute('aria-activedescendant', '');
      return;
    }
    list.innerHTML = results.map(function (c, k) {
      return '<li id="opt-' + k + '" role="option" aria-selected="' + (k === sel) + '" data-k="' + k + '"><span>' + esc(c.label) + '</span><small>' + esc(c.hint) + '</small></li>';
    }).join('');
    input.setAttribute('aria-activedescendant', 'opt-' + sel);
    var s = list.children[sel]; if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
  }
  function exec(c) { if (!c) return; c.run(); }
  function openPal() {
    lastFocus = document.activeElement;
    pal.hidden = false; out.hidden = true; input.value = ''; filter();
    setTimeout(function () { input.focus(); }, 10);
  }
  function closePal() { if (pal.hidden) return; pal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  $('#paletteBtn').addEventListener('click', openPal);
  input.addEventListener('input', function () { out.hidden = true; filter(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); exec(results[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); closePal(); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  });
  list.addEventListener('click', function (e) { var li = e.target.closest('li[data-k]'); if (li) exec(results[+li.getAttribute('data-k')]); });
  list.addEventListener('mousemove', function (e) { var li = e.target.closest('li[data-k]'); if (li && +li.getAttribute('data-k') !== sel) { sel = +li.getAttribute('data-k'); render(); } });
  pal.addEventListener('click', function (e) { if (e.target === pal) closePal(); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
    else if (e.key === 'Escape' && !pal.hidden) closePal();
  });

  /* ---------------- For the engineers who open DevTools ---------------- */
  try {
    console.log('%c200 OK', 'font: 700 22px monospace; color: #3DDCF5');
    console.log('%cYou opened the console, so we would probably get along.\nPress ' + hintKey + ' on the page and type "curl".\nOr just say hi: ' + EMAIL, 'font: 13px monospace; color: #9DAECB');
  } catch (e) {}
})();
