// iii PORTAL — the mobile menu, plus a fix so every navigation lands
// at the top of the destination (or its intended section) reliably.
//
// The site used to set `scroll-behavior: smooth` globally. That made the
// browser *animate* toward an anchor target even on a fresh page load —
// and because images below the fold are still loading and reserving their
// height as that animation runs, the page keeps growing underneath it,
// so the scroll frequently overshot and landed near the bottom instead of
// at the section a button pointed to. Fix: page loads (including a link
// that opens a new page at a #section) jump instantly and correctly, with
// no animation to be thrown off by. Smooth scrolling is instead applied
// by hand, only for a click that stays on the current page.
(function () {
  document.querySelectorAll('a[href*="#"]').forEach(function (link) {
    var url;
    try { url = new URL(link.href, location.href); } catch (e) { return; }
    if (url.pathname !== location.pathname || !url.hash) return;
    link.addEventListener('click', function (e) {
      var target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', url.hash);
    });
  });
})();

// Contact form context: every page's CTA into this shared form can tag
// what it's about with a ?inquiry= param (e.g. index.html?inquiry=
// soulflow-host#contact). If one is present and recognized, it renames the
// hidden "subject" field so the email that lands in the inbox says which
// offering and intent it's for instead of the generic default, and shows
// a short "Regarding:" line above the form so the visitor sees the same
// context. Unrecognized or missing params leave the form exactly as-is.
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var subjectField = document.getElementById('cf-subject');
  var context = document.getElementById('cf-context');
  var TOPICS = {
    'soulflow-join': { subject: 'SoulFlow & Create — Join a Gathering (via iii Portal)', label: 'Joining a SoulFlow & Create gathering' },
    'soulflow-host': { subject: 'SoulFlow & Create — Hosting Inquiry (via iii Portal)', label: 'Hosting SoulFlow & Create' },
    'speaking': { subject: 'Speaking & Collaborations Inquiry (via iii Portal)', label: 'A speaking or collaboration invitation' }
  };
  var params = new URLSearchParams(location.search);
  var topic = TOPICS[params.get('inquiry')];
  if (topic) {
    if (subjectField) subjectField.value = topic.subject;
    if (context) {
      context.textContent = 'Regarding: ' + topic.label;
      context.hidden = false;
    }
    if (params.has('inquiry')) {
      params.delete('inquiry');
      var clean = location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash;
      history.replaceState(null, '', clean);
    }
  }
  var status = form.querySelector('.contact-form__status');
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = Object.fromEntries(new FormData(form));
    button.disabled = true;
    status.removeAttribute('data-state');
    status.textContent = 'Sending…';

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json && json.success) {
          form.reset();
          status.textContent = 'Thank you — your message is on its way.';
          status.setAttribute('data-state', 'success');
        } else {
          status.textContent = 'Something went wrong — please try again, or use the email link below.';
          status.setAttribute('data-state', 'error');
        }
      })
      .catch(function () {
        status.textContent = 'Something went wrong — please try again, or use the email link below.';
        status.setAttribute('data-state', 'error');
      })
      .finally(function () { button.disabled = false; });
  });
})();

// YouTube click-to-play cards: swap the real thumbnail for the actual
// player only on click, so nothing loads from YouTube — no player, no
// tracking cookie — until someone wants to watch. `data-yt-video` is
// the specific video's 11-character id. To feature a different video,
// change both data-yt-video AND the <img> src on the .yt-card__cover
// (thumbnail: https://i.ytimg.com/vi/<video id>/hqdefault.jpg) together.
(function () {
  document.querySelectorAll('.yt-card__cover').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var video = btn.getAttribute('data-yt-video');
      if (!video) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + video + '?autoplay=1&rel=0';
      iframe.title = btn.getAttribute('data-yt-title') || 'YouTube video';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.replaceWith(iframe);
    });
  });
})();

// Sitewide EN/ES toggle. Sets data-lang on <body>;
// styles.css shows/hides the matching .lang-en / .lang-es elements.
// Remembers the visitor's choice for next time via localStorage.
(function () {
  var buttons = document.querySelectorAll('[data-lang-btn]');
  if (!buttons.length) return;

  function setLang(lang) {
    document.body.setAttribute('data-lang', lang);
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-btn') === lang));
    });
    try { localStorage.setItem('iii-lang', lang); } catch (e) {}
  }

  var saved;
  try { saved = localStorage.getItem('iii-lang'); } catch (e) {}
  setLang(saved === 'es' ? 'es' : 'en');

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-btn')); });
  });
})();

(function () {
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
    menu.inert = !open;
    if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
  }

  menu.inert = true;
  toggle.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('menu-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setOpen(false); toggle.focus();
    }
  });
})();
