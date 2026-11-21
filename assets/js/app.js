/* Bndit.xyz — profile page behaviours
   (fuzzy username, typewriter, enter overlay, tooltips, copy address,
    click sound, animated tab title, view counter) */
(function () {
  'use strict';

  var ENTER_ATTR = 'data-user-page-enter-transition';
  var OVERLAY_HIDE_CLASS = 'BND__da-7d43e412-1de3c2c1-729cfd30';
  var PROFILE_SHOW_CLASS = 'BND__72-a2da0947-e98f2d63-2031c99c';

  var html = document.documentElement;
  var body = document.body;
  var overlay = document.getElementById('enter-overlay');
  var profile = document.getElementById('profile-container');
  var video = document.getElementById('bg-video');
  var canvas = document.getElementById('username-canvas');

  /* ---------------------------------------------------------------- *
   * Scroll lock while the entry overlay is up (mirrors the original)
   * ---------------------------------------------------------------- */
  html.setAttribute(ENTER_ATTR, 'active');

  /* ---------------------------------------------------------------- *
   * Fuzzy canvas username
   * ---------------------------------------------------------------- */
  function initFuzzy() {
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var text = 'Bandit';
    var fontSize = 36;
    var fontWeight = 500;
    var color = '#fff';
    var fontFamily = window.getComputedStyle(canvas).fontFamily || 'sans-serif';
    var font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;

    // Off-screen canvas used to measure the text exactly like the original.
    var measure = document.createElement('canvas');
    var mctx = measure.getContext('2d');
    if (!mctx) return;

    mctx.font = font;
    mctx.textBaseline = 'alphabetic';

    var metrics = mctx.measureText(text);
    var left = metrics.actualBoundingBoxLeft || 0;
    var right = metrics.actualBoundingBoxRight != null ? metrics.actualBoundingBoxRight : metrics.width;
    var ascent = metrics.actualBoundingBoxAscent != null ? metrics.actualBoundingBoxAscent : fontSize;
    var descent = metrics.actualBoundingBoxDescent != null ? metrics.actualBoundingBoxDescent : fontSize * 0.2;

    var textWidth = Math.ceil(left + right);
    var textHeight = Math.ceil(ascent + descent);
    var width = textWidth + 10;

    // Render the crisp text once into a source canvas.
    var source = document.createElement('canvas');
    source.width = width;
    source.height = textHeight;

    var sctx = source.getContext('2d');
    if (!sctx) return;

    sctx.font = font;
    sctx.textBaseline = 'alphabetic';
    sctx.fillStyle = color;
    sctx.fillText(text, 5 - left, ascent);

    // Size the visible canvas the same way the original component does.
    canvas.width = width;
    canvas.height = textHeight;
    canvas.style.marginLeft = '-5px';
    canvas.style.marginBottom = '7px';

    var intensity = 0.15;
    var raf = 0;

    function frame() {
      ctx.clearRect(-30, -30, width + 60, textHeight + 60);

      // Draw the text row by row with a small random horizontal offset.
      for (var y = 0; y < textHeight; y++) {
        var offset = Math.floor(intensity * (Math.random() - 0.5) * 30);
        ctx.drawImage(source, 0, y, width, 1, offset, y, width, 1);
      }

      raf = window.requestAnimationFrame(frame);
    }

    frame();

    // Pause the loop when the tab is hidden (small battery/CPU bonus).
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
      } else {
        window.cancelAnimationFrame(raf);
        frame();
      }
    });
  }

  function startFuzzy() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(initFuzzy, initFuzzy);
    } else {
      initFuzzy();
    }
  }

  /* ---------------------------------------------------------------- *
   * Typewriter description
   * ---------------------------------------------------------------- */
  function initTypewriter() {
    var wrapper = document.querySelector('.Typewriter__wrapper');
    if (!wrapper) return;

    var strings = [
      'Status can't be purchased.',
      'print("Hello, Larp!")...'
    ];

    var typeDelay = 120;    // 600 / speed (5)
    var deleteDelay = 100;  // 600 / deleteSpeed (6)
    var pauseFor = 900;

    var stringIndex = 0;
    var charIndex = 0;
    var deleting = false;

    function tick() {
      var current = strings[stringIndex];

      if (!deleting) {
        charIndex += 1;
        wrapper.textContent = current.slice(0, charIndex);

        if (charIndex >= current.length) {
          deleting = true;
          window.setTimeout(tick, pauseFor);
          return;
        }

        window.setTimeout(tick, typeDelay);
        return;
      }

      charIndex -= 1;
      wrapper.textContent = current.slice(0, charIndex);

      if (charIndex <= 0) {
        deleting = false;
        stringIndex = (stringIndex + 1) % strings.length;
        window.setTimeout(tick, typeDelay);
        return;
      }

      window.setTimeout(tick, deleteDelay);
    }

    window.setTimeout(tick, typeDelay);
  }

  /* ---------------------------------------------------------------- *
   * Tooltips
   * ---------------------------------------------------------------- */
  var isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function attachTooltip(anchor, tooltip, options) {
    if (!anchor || !tooltip) return;

    options = options || {};
    var placement = options.placement || 'top';
    var offset = typeof options.offset === 'number' ? options.offset : 10;
    var maxWidth = typeof options.maxWidth === 'number' ? options.maxWidth : 260;
    var delay = 25 + (isMobile ? 30 : 0);

    tooltip.style.setProperty('--tooltip-max-width', maxWidth + 'px');

    var timer = null;
    var visible = false;

    function clearTimer() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function position() {
      var a = anchor.getBoundingClientRect();
      var t = tooltip.getBoundingClientRect();
      var top = a.top - t.height - offset;
      var left = a.left + a.width / 2 - t.width / 2;

      if (placement === 'bottom') top = a.bottom + offset;
      else if (placement === 'left') { top = a.top + a.height / 2 - t.height / 2; left = a.left - t.width - offset; }
      else if (placement === 'right') { top = a.top + a.height / 2 - t.height / 2; left = a.right + offset; }

      var maxLeft = Math.max(8, window.innerWidth - t.width - 8);
      var maxTop = Math.max(8, window.innerHeight - t.height - 8);

      tooltip.style.top = (t.height >= window.innerHeight ? 8 : clamp(top, 8, maxTop)) + 'px';
      tooltip.style.left = (t.width >= window.innerWidth ? 8 : clamp(left, 8, maxLeft)) + 'px';
    }

    function show() {
      if (html.getAttribute(ENTER_ATTR) === 'active') return;
      clearTimer();
      position();
      tooltip.setAttribute('data-visible', 'true');
      visible = true;
      window.addEventListener('resize', position);
      window.addEventListener('scroll', position, true);
    }

    function scheduleShow() {
      if (html.getAttribute(ENTER_ATTR) === 'active') return;
      clearTimer();
      if (delay <= 0) {
        show();
      } else {
        timer = window.setTimeout(function () {
          timer = null;
          show();
        }, delay);
      }
    }

    function hide() {
      clearTimer();
      tooltip.setAttribute('data-visible', 'false');
      visible = false;
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    }

    anchor.addEventListener('mouseenter', scheduleShow);
    anchor.addEventListener('mouseleave', hide);
    anchor.addEventListener('focusin', scheduleShow);
    anchor.addEventListener('focusout', hide);

    anchor.addEventListener('touchstart', function (event) {
      if (html.getAttribute(ENTER_ATTR) === 'active') return;
      event.stopPropagation();
      if (visible) hide();
      else show();
    }, { passive: true });

    anchor.__tooltip = {
      show: show,
      hide: hide,
      isVisible: function () { return visible; },
      tooltip: tooltip
    };
  }

  function initTooltips() {
    var uid = document.getElementById('tip-uid');
    var premium = document.getElementById('tip-premium');
    var imagehost = document.getElementById('tip-imagehost');
    var location = document.getElementById('tip-location');
    var copy = document.getElementById('tip-copy');
    var nitro = document.getElementById('tip-nitro');
    var views = document.getElementById('tip-views');

    // UID tooltip wraps the username canvas.
    if (canvas && canvas.parentElement) {
      attachTooltip(canvas.parentElement, uid, { offset: 0 });
    }

    // Badge tooltips (crown = Premium, star = Image Host).
    var badgeWrapper = document.querySelector('.BND__9e-35c1a1d5-dab8c907-5fd2e2c7');
    if (badgeWrapper) {
      var badges = badgeWrapper.querySelectorAll(':scope > .BND__ba-7f5364ea-c3a36c5d-b0f3d011');
      if (badges[0]) attachTooltip(badges[0], premium);
      if (badges[1]) attachTooltip(badges[1], imagehost);
    }

    // Location
    var locationAnchor = document.querySelector('.BND__c9-c79d2a8a-e67dc9c3-53182f6b');
    if (locationAnchor) attachTooltip(locationAnchor, location);

    // Discord Nitro badge in the presence card.
    var nitroAnchor = document.querySelector('.BND__8f-a51d486a-31d0c10a-089d3a3a');
    if (nitroAnchor) attachTooltip(nitroAnchor, nitro);

    // Profile view counter.
    var viewsAnchor = document.getElementById('views-trigger');
    if (viewsAnchor) attachTooltip(viewsAnchor, views);

    // Bitcoin / copy address (second social entry).
    var socials = document.querySelectorAll(
      '.BND__d7-fb8c6083-4dc99f7b-a375925f > .BND__8b-14239d9a-1d4a3e5a-6c1a2be6'
    );
    var bitcoin = socials[1];
    if (bitcoin && copy) {
      attachTooltip(bitcoin, copy);

      bitcoin.style.cursor = 'pointer';
      bitcoin.addEventListener('click', function (event) {
        event.preventDefault();
        copyAddress();
      });

      bitcoin.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          copyAddress();
        }
      });
    }

    function copyAddress() {
      var address = 'bc1qlf6cexdxzyuczj8jfw6vrf8kwzr6tn422nn2lm';
      var done = function (ok) {
        if (!ok) return;
        copy.textContent = 'Copied';
        var info = bitcoin.__tooltip;
        if (info && !info.isVisible()) info.show();
        window.setTimeout(function () {
          copy.textContent = 'Copy Address';
        }, 2000);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(address).then(function () {
          done(true);
        }, function () {
          done(fallbackCopy(address));
        });
      } else {
        done(fallbackCopy(address));
      }
    }

    function fallbackCopy(value) {
      try {
        var area = document.createElement('textarea');
        area.value = value;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.focus();
        area.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        return ok;
      } catch (error) {
        return false;
      }
    }

    // Tapping anywhere else dismisses an open touch tooltip. (The anchor's own
    // touchstart handler stops propagation, so this only runs for elsewhere.)
    document.addEventListener('touchstart', function () {
      [uid, premium, imagehost, location, copy, nitro, views].forEach(function (tip) {
        if (tip) tip.setAttribute('data-visible', 'false');
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- *
   * Profile view counter
   *
   * There is no backend here, so views live in localStorage and are
   * throttled per browser: the first visit seeds the counter at 24,682,
   * and a returning visitor adds a view at most once every 24 hours
   * (after the page has stayed visible for a few seconds). Repeated
   * refreshes, tabs left open, or reload spam never inflate it.
   * ---------------------------------------------------------------- */
  function initViews() {
    var countEl = document.getElementById('view-count');
    if (!countEl) return;

    var BASE = 24682;
    var KEY = 'bndit.xyz.views.v1';
    var COOLDOWN = 24 * 60 * 60 * 1000; // one counted view per browser per day
    var SETTLE_MS = 3000;               // count only real, visible visits

    function render(value) {
      countEl.textContent = Number(value).toLocaleString('en-US');
    }

    function load() {
      try {
        var raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || typeof data.count !== 'number' || !isFinite(data.count)) return null;
        if (typeof data.last !== 'number' || !isFinite(data.last)) data.last = 0;
        return data;
      } catch (error) {
        return null;
      }
    }

    function save(data) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
      } catch (error) {
        /* storage unavailable (private mode etc.) — view count stays static */
      }
    }

    var now = Date.now();
    var data = load();

    if (!data) {
      // First time this browser sees the page: the baseline already counts
      // as the starting number, so seed without adding anything.
      save({ count: BASE, last: now });
      render(BASE);
      return;
    }

    render(data.count);

    // Ignore clock rollbacks and anyone still inside the cooldown window.
    if (now < data.last) return;
    if (now - data.last < COOLDOWN) return;

    var timer = null;

    function disarm() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function arm() {
      if (timer !== null || document.visibilityState !== 'visible') return;
      timer = window.setTimeout(function () {
        timer = null;
        var current = load();
        if (!current) return;
        var stamp = Date.now();
        if (stamp < current.last) return;
        if (stamp - current.last < COOLDOWN) return;
        var next = current.count + 1;
        save({ count: next, last: stamp });
        render(next);
        countEl.classList.remove('profile-views-bump');
        // restart the tiny highlight animation
        void countEl.offsetWidth;
        countEl.classList.add('profile-views-bump');
      }, SETTLE_MS);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') arm();
      else disarm();
    });

    arm();
  }

  /* ---------------------------------------------------------------- *
   * Click sound (crisp_click.ogg, volume 0.6, pooled like the original)
   * ---------------------------------------------------------------- */
  /* ---------------------------------------------------------------- *
   * Live Discord presence
   *
   * Pulls the real status (dot colour, avatar, activity line) from
   * Lanyard and paints it into the same markup the page was built
   * with, so nothing about the layout changes. If the request fails
   * (offline, API down) the snapshot that shipped with the page is
   * left exactly as it was.
   * ---------------------------------------------------------------- */
  function initPresence() {
    var USER_ID = '1147335818147528855';
    var API = 'https://api.lanyard.rest/v1/users/' + USER_ID;
    var POLL_MS = 20000;

    var avatarEl = document.getElementById('presence-avatar');
    var statusEl = document.getElementById('presence-status');
    var nameEl = document.getElementById('presence-name');
    var activityEl = document.getElementById('presence-activity');
    if (!activityEl) return;

    var LOCAL_AVATAR = 'assets/media/discord-avatar.webp';
    var LOCAL_EMOJI = 'assets/media/discord-emoji.webp';
    var ICONS = {
      online: 'assets/media/online.png',
      idle: 'assets/media/idle.png',
      dnd: 'assets/media/dnd.png',
      offline: 'assets/media/offline.png',
      streaming: 'assets/media/streaming.png'
    };
    var EMOJI_CLASS = 'BND__af-f98dcbae-9a104b1d-0e19c85f';
    var LINE_CLASS = 'BND__29-07f9604e-f4d8e0d9-ad473a5c BND__bb-dbea1d0f-c486c18b-7eadd2ba';
    var WRAP_CLASS = 'BND__0a-c73bda7f-ec73c2af-ec6abbe5';
    var LABELS = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing' };

    // Snapshot markup, restored whenever there is nothing live to show.
    var snapshot = activityEl.innerHTML;
    var last = { status: '', avatar: '', activity: '' };

    function node(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    }

    function paintStatus(status) {
      if (!statusEl) return;
      var src = ICONS[status] || ICONS.offline;
      if (last.status === src) return;
      last.status = src;
      statusEl.src = src;
    }

    function paintAvatar(user) {
      if (!avatarEl || !user || !user.avatar) return;
      var url = 'https://cdn.discordapp.com/avatars/' + USER_ID + '/' + user.avatar + '.webp?size=128';
      if (last.avatar === url) return;
      last.avatar = url;
      var probe = new Image();
      probe.onload = function () {
        if (last.avatar === url) avatarEl.src = url;
      };
      probe.onerror = function () {
        if (last.avatar === url) {
          last.avatar = '';
          avatarEl.src = LOCAL_AVATAR;
        }
      };
      probe.src = url;
    }

    function gameImage(activity) {
      var assets = activity.assets || {};
      var image = assets.large_image || assets.small_image;
      if (!image || typeof image !== 'string') return null;
      if (image.indexOf('mp:') === 0) return 'https://media.discordapp.net/' + image.slice(3);
      if (image.indexOf('spotify:') === 0) return 'https://i.scdn.co/image/' + image.split(':')[2];
      if (activity.application_id) {
        return 'https://cdn.discordapp.com/app-assets/' + activity.application_id + '/' + image + '.png';
      }
      return null;
    }

    function icon(src, alt) {
      var img = node('img', EMOJI_CLASS);
      img.alt = alt || '';
      img.onerror = function () { img.src = LOCAL_EMOJI; };
      img.src = src;
      return img;
    }

    function line(parts, imageUrl) {
      var wrap = node('span', WRAP_CLASS);
      var row = node('span', LINE_CLASS);
      if (imageUrl) row.appendChild(icon(imageUrl));
      parts.forEach(function (part) {
        var span = node('span', null, part.text);
        if (part.label) span.style.color = 'var(--presenceUsernameColor)';
        row.appendChild(span);
        if (part.label) row.appendChild(document.createTextNode(' '));
      });
      wrap.appendChild(row);
      return wrap;
    }

    function renderActivity(data) {
      var activities = data.activities || [];
      var custom = null;
      var playing = null;
      for (var i = 0; i < activities.length; i++) {
        var a = activities[i];
        if (!a) continue;
        if (a.type === 4 && a.state) { custom = a; break; }
        if (!playing && a.type !== 4) playing = a;
      }

      if (data.listening_to_spotify && data.spotify) {
        var s = data.spotify;
        var artist = (s.artist || '').replace(/;/g, ',');
        return line([
          { label: true, text: 'Listening to' },
          { text: s.song + (artist ? ' by ' + artist : '') }
        ], s.album_art_url || null);
      }

      if (custom) {
        var emoji = custom.emoji;
        if (emoji && emoji.id) {
          return line([{ text: custom.state }],
            'https://cdn.discordapp.com/emojis/' + emoji.id + (emoji.animated ? '.gif' : '.png') + '?size=32');
        }
        var prefix = emoji && emoji.name ? emoji.name + ' ' : '';
        return line([{ text: prefix + custom.state }], null);
      }

      if (playing) {
        return line([
          { label: true, text: LABELS[playing.type] || 'Playing' },
          { text: playing.name }
        ], gameImage(playing));
      }

      return null;
    }

    function paintActivity(data) {
      var rendered = renderActivity(data);
      var key = rendered ? rendered.textContent : 'snapshot';
      if (last.activity === key) return;
      last.activity = key;
      if (rendered) {
        activityEl.innerHTML = '';
        activityEl.appendChild(rendered);
      } else {
        activityEl.innerHTML = snapshot;
      }
    }

    function liveStatus(data) {
      var activities = data.activities || [];
      for (var i = 0; i < activities.length; i++) {
        if (activities[i] && activities[i].type === 1) return 'streaming';
      }
      return data.discord_status || 'offline';
    }

    function paint(data) {
      paintStatus(liveStatus(data));
      paintAvatar(data.discord_user);
      if (nameEl && data.discord_user && data.discord_user.username) {
        nameEl.textContent = data.discord_user.username;
      }
      paintActivity(data);
    }

    var busy = false;
    function poll() {
      if (busy || document.hidden) return;
      busy = true;
      fetch(API, { cache: 'no-store' })
        .then(function (res) { return res.json(); })
        .then(function (body) {
          if (body && body.success && body.data) paint(body.data);
        })
        .catch(function () {
          /* offline / API unreachable: keep the snapshot */
        })
        .then(function () { busy = false; });
    }

    poll();
    window.setInterval(poll, POLL_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) poll();
    });
    window.addEventListener('online', poll);
  }

  function initClickSound() {
    var src = 'assets/media/crisp_click.ogg';
    var pool = [];
    var index = 0;

    try {
      for (var i = 0; i < 4; i++) {
        var audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.6;
        pool.push(audio);
      }
    } catch (error) {
      return;
    }

    document.addEventListener('click', function (event) {
      if (event.button !== 0) return;
      var audio = pool[index];
      index = (index + 1) % pool.length;
      if (!audio) return;
      try {
        audio.pause();
        audio.currentTime = 0;
        var playing = audio.play();
        if (playing && typeof playing.catch === 'function') playing.catch(function () {});
      } catch (error) {
        /* ignore playback failures */
      }
    });
  }

  /* ---------------------------------------------------------------- *
   * Animated tab title (drawn one character at a time, 380ms)
   * ---------------------------------------------------------------- */
  function initAnimatedTitle() {
    var name = 'Bandit';
    var index = 0;
    var forward = true;

    window.setInterval(function () {
      if (index === name.length) forward = false;
      if (index === 0) forward = true;

      index = forward ? index + 1 : index - 1;

      var slice = index === 0 ? '' : name.slice(0, index);
      document.title = '@' + slice;
    }, 380);
  }

  /* ---------------------------------------------------------------- *
   * Entry overlay
   * ---------------------------------------------------------------- */
  var hasEntered = false;

  function enterPage() {
    if (hasEntered) return;
    hasEntered = true;

    if (overlay) {
      overlay.classList.add(OVERLAY_HIDE_CLASS);
      overlay.style.pointerEvents = 'none';

      window.setTimeout(function () {
        overlay.style.display = 'none';
      }, 650);
    }

    html.removeAttribute(ENTER_ATTR);
    body.style.overflow = '';
    html.style.overflow = '';

    if (profile) profile.classList.add(PROFILE_SHOW_CLASS);

    if (video) {
      video.volume = 0.25;
      try {
        var playing = video.play();
        if (playing && typeof playing.catch === 'function') playing.catch(function () {});
      } catch (error) {
        /* ignore autoplay failures */
      }
    }
  }

  function initEnter() {
    if (overlay) {
      overlay.addEventListener('click', enterPage);
    }

    // Safety net: if the overlay is missing, reveal the profile immediately.
    if (!overlay && profile) {
      html.removeAttribute(ENTER_ATTR);
      profile.classList.add(PROFILE_SHOW_CLASS);
    }
  }

  /* ---------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------- */
  startFuzzy();
  initTypewriter();
  initTooltips();
  initViews();
  initPresence();
  initClickSound();
  initAnimatedTitle();
  initEnter();
})();
