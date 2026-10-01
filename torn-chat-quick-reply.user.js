// ==UserScript==
// @name         Torn Chat Quick Reply
// @namespace    https://github.com/rootfellen/torn-chat-quick-reply
// @version      1.2.0
// @description  Shift+click (or press-and-hold on touch/PDA) a name in Torn's chatbox to insert a mention into that chat's message box, with a small "Replying to Name" chip (and a toggle for @Name vs the ↪ Name style) so it's obvious what's happening.
// @author       0o0o0
// @license      MIT
// @homepageURL  https://github.com/rootfellen/torn-chat-quick-reply
// @supportURL   https://github.com/rootfellen/torn-chat-quick-reply/issues
// @downloadURL  https://raw.githubusercontent.com/rootfellen/torn-chat-quick-reply/main/torn-chat-quick-reply.user.js
// @updateURL    https://raw.githubusercontent.com/rootfellen/torn-chat-quick-reply/main/torn-chat-quick-reply.user.js
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

/*
 * Torn Chat Quick Reply
 * ----------------------
 * Torn's chatbox (#chatRoot) shows each message's sender as a link to their
 * profile. A plain click (or a quick tap on touch) still opens that profile,
 * exactly like today - this script changes nothing about that. Holding Shift
 * while clicking the sender's name - or, with no keyboard at all on Torn PDA,
 * pressing and holding the name briefly - instead inserts a mention ("↪ Name "
 * by default, or "@Name " - see below) into that same chat channel's message
 * box and focuses it, so replying to someone doesn't mean typing their name
 * out by hand. A small "Replying to Name" chip appears above the box so it's
 * obvious a reply is queued up, with a x to dismiss it; it also clears itself
 * once the message is actually sent. The chip has its own small toggle to
 * flip between the "↪ Name" and "@Name" styles for mentions you queue up
 * from then on; the choice is remembered (in localStorage, nothing else is
 * ever stored) for next time.
 *
 * It never reads anything outside the chatbox, never makes a network
 * request, and never submits or sends anything - it only ever fills in the
 * one text box the person is about to type into themselves. One Shift+click
 * produces exactly one result: the mention text appears, nothing is sent.
 */

(function () {
  'use strict';

  if (window.__tcqrLoaded) return;
  window.__tcqrLoaded = true;

  const CHAT_ROOT_SELECTOR = '#chatRoot';
  const TEXTAREA_SELECTOR = 'textarea[placeholder="Type your message here..."]';

  /**
   * Torn's chat is a React app with a controlled <textarea>. Setting
   * `.value` directly leaves React's own state out of sync (the box would
   * visually show the new text only until the next re-render wipes it out).
   * Using the native setter and dispatching a real "input" event is the
   * standard way to update a controlled input from outside React, and it's
   * harmless on a plain, uncontrolled textarea too.
   */
  function setTextareaValue(textarea, value) {
    const proto = Object.getPrototypeOf(textarea);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value')
      || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    if (descriptor && typeof descriptor.set === 'function') {
      descriptor.set.call(textarea, value);
    } else {
      textarea.value = value;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * A sender's name is a plain, human-typed string in Torn (letters,
   * digits, spaces, a handful of punctuation marks) - it's rendered as text
   * content, never HTML, so a simple trim is all that's needed here.
   */
  function extractName(rawText) {
    return String(rawText || '').replace(/:\s*$/, '').trim();
  }

  /**
   * The sender name is an <a href="/profiles.php?XID=..."> sitting inside a
   * "senderContainer" wrapper alongside a separate avatar link. Matching on
   * that structure (not on Torn's build-hashed CSS class names, which
   * change on every deploy) is what keeps this working after Torn ships a
   * new chat build.
   */
  function findSenderLink(clicked) {
    const link = clicked.closest('a[href*="profiles.php?XID="]');
    if (!link) return null;
    if (link.dataset && link.dataset.label === 'avatar') return null;
    const container = link.closest('[class*="senderContainer"]');
    if (!container) return null;
    return link;
  }

  /**
   * Each open chat channel (global, faction, company, ...) has its own
   * message list and its own message textarea, both inside one shared
   * panel. Walking up from the clicked message to the nearest ancestor
   * that contains a matching textarea finds that channel's own box, even
   * with several channels open at once, without depending on any
   * particular id or class name for the panel itself.
   */
  function findChannelTextarea(fromNode) {
    let node = fromNode;
    while (node && node.nodeType === 1 && node !== document.body) {
      const textarea = node.querySelector(TEXTAREA_SELECTOR);
      if (textarea) return textarea;
      node = node.parentElement;
    }
    const root = document.querySelector(CHAT_ROOT_SELECTOR);
    return root ? root.querySelector(TEXTAREA_SELECTOR) : null;
  }

  // ------------------------------------------------------------ mention style
  const STYLE_STORAGE_KEY = 'tcqr_mention_style';
  const DEFAULT_MENTION_STYLE = 'arrow';
  const MENTION_GLYPH = { arrow: '↪', at: '@' };

  /** Never trust a raw localStorage read - fall back to the default on
   * anything but one of the two values this script actually writes. */
  function getMentionStyle() {
    let stored = null;
    try {
      stored = localStorage.getItem(STYLE_STORAGE_KEY);
    } catch (err) {
      stored = null; // private browsing, storage disabled, etc. - just use the default
    }
    return stored === 'arrow' || stored === 'at' ? stored : DEFAULT_MENTION_STYLE;
  }

  function setMentionStyle(style) {
    if (style !== 'arrow' && style !== 'at') return;
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, style);
    } catch (err) {
      // Storage unavailable - the choice just won't persist across reloads.
    }
  }

  function formatMention(name) {
    const style = getMentionStyle();
    // "@Name " sits tight against the name (the usual @mention convention);
    // "↪ Name " reads as its own word, so it gets a space after it.
    return style === 'at' ? ('@' + name + ' ') : (MENTION_GLYPH[style] + ' ' + name + ' ');
  }

  function insertMention(textarea, name) {
    const current = textarea.value || '';
    const needsSpace = current.length > 0 && !/\s$/.test(current);
    const mention = (needsSpace ? ' ' : '') + formatMention(name);
    const next = current + mention;
    setTextareaValue(textarea, next);
    textarea.focus();
    const pos = next.length;
    textarea.setSelectionRange(pos, pos);
  }

  // ---------------------------------------------------------- "replying to" chip
  const STYLE_ID = 'tcqr-style';
  const chipByTextarea = new WeakMap();
  // Every name queued up for a given box, in the order they were clicked. A
  // Set so shift+clicking the same name twice doesn't list it twice.
  const namesByTextarea = new WeakMap();
  // Tracked in a real Set (not just the WeakMaps above) so the poll below can
  // iterate every textarea that currently has a chip showing.
  const activeChipTextareas = new Set();

  // Belt-and-braces fallback: if the box ever ends up empty by some other
  // means (cleared by hand, a future Torn change, ...), the chip should not
  // linger. The direct listeners below are what actually catches "sent" in
  // practice - see the click/keydown handlers further down.
  setInterval(() => {
    activeChipTextareas.forEach((ta) => {
      if (!ta.isConnected || !ta.value.trim()) hideReplyChip(ta);
    });
  }, 250);

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .tcqr-chip{display:flex;align-items:center;justify-content:space-between;gap:8px;
        background:rgba(110,150,255,.14);border:1px solid rgba(110,150,255,.4);
        border-left:3px solid rgba(90,130,255,.9);border-radius:4px;
        padding:3px 8px;margin-bottom:4px;font-size:11px;line-height:1.5;
        color:inherit;font-family:inherit}
      .tcqr-chip-close{background:none;border:0;cursor:pointer;font-size:12px;
        color:inherit;opacity:.65;padding:0 2px;line-height:1;font-family:inherit}
      .tcqr-chip-close:hover{opacity:1}
      .tcqr-style-toggle{background:none;border:1px solid currentColor;border-radius:3px;
        cursor:pointer;font-size:11px;color:inherit;opacity:.65;padding:0 4px;
        line-height:1.6;font-family:inherit}
      .tcqr-style-toggle:hover{opacity:1}
      .tcqr-pressed{background:rgba(110,150,255,.25);border-radius:3px}
    `;
    document.head.appendChild(style);
  }

  function hideReplyChip(textarea) {
    const chip = chipByTextarea.get(textarea);
    if (chip && chip.parentElement) chip.parentElement.removeChild(chip);
    chipByTextarea.delete(textarea);
    namesByTextarea.delete(textarea);
    activeChipTextareas.delete(textarea);
  }

  /**
   * Shows a "Replying to ..." chip above the whole message-box row (not just
   * above the <textarea> itself), so it lands correctly whether that row
   * lays its textarea and send button out side-by-side or stacked. One chip
   * per channel: shift+clicking a second (or third, ...) name before sending
   * adds them to the same chip - "Replying to masky, bob" - instead of only
   * ever showing whichever name was clicked most recently.
   */
  function showReplyChip(textarea, name) {
    ensureStyle();
    activeChipTextareas.add(textarea);

    let names = namesByTextarea.get(textarea);
    if (!names) {
      names = new Set();
      namesByTextarea.set(textarea, names);
    }
    names.add(name);

    let chip = chipByTextarea.get(textarea);
    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'tcqr-chip';
      const text = document.createElement('span');
      chip.appendChild(text);

      // Lets you flip between "@Name" and "↪ Name" for replies you
      // queue up from here on - it only affects new mentions, not ones
      // already sitting in the box, and the choice is remembered next time.
      const styleBtn = document.createElement('button');
      styleBtn.type = 'button';
      styleBtn.className = 'tcqr-style-toggle';
      styleBtn.title = 'Switch mention style for new replies (@Name / ↪ Name)';
      styleBtn.textContent = MENTION_GLYPH[getMentionStyle()];
      styleBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const next = getMentionStyle() === 'arrow' ? 'at' : 'arrow';
        setMentionStyle(next);
        styleBtn.textContent = MENTION_GLYPH[next];
      });
      chip.appendChild(styleBtn);

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'tcqr-chip-close';
      closeBtn.title = 'Stop replying';
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', () => hideReplyChip(textarea));
      chip.appendChild(closeBtn);

      const row = textarea.parentElement;
      const anchorParent = (row && row.parentElement) || row;
      const anchorBefore = (row && row.parentElement) ? row : textarea;
      if (anchorParent) anchorParent.insertBefore(chip, anchorBefore);
      chipByTextarea.set(textarea, chip);
    }
    chip.firstChild.textContent = 'Replying to ' + Array.from(names).join(', ');
  }

  /**
   * Shared by Shift+click and the touch long-press below: finds the right
   * textarea for the sender that was just activated and queues the reply.
   * Returns true if a reply was actually queued, so a caller can decide
   * whether to swallow the triggering event.
   */
  function triggerReply(link) {
    const textarea = findChannelTextarea(link);
    if (!textarea) return false;
    const name = extractName(link.textContent);
    if (!name) return false;
    insertMention(textarea, name);
    showReplyChip(textarea, name);
    return true;
  }

  window.addEventListener('click', (e) => {
    // Swallow the "ghost" click that follows a successful long-press on
    // touch, so it doesn't also navigate to the profile right afterward.
    if (suppressNextClickOn && e.target.closest && e.target.closest('a') === suppressNextClickOn) {
      suppressNextClickOn = null;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!e.shiftKey) return; // plain click keeps Torn's own behaviour (opens the profile)
    const chatRoot = e.target.closest ? e.target.closest(CHAT_ROOT_SELECTOR) : null;
    if (!chatRoot) return;

    const link = findSenderLink(e.target);
    if (!link) return;

    if (triggerReply(link)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // ------------------------------------------------- touch (Torn PDA, tablets)
  // There's no Shift key on a touchscreen, so the equivalent gesture is a
  // brief press-and-hold: a quick tap still opens the profile (untouched,
  // same as a plain click), holding it down queues the reply instead.
  const LONG_PRESS_MS = 450;
  const MOVE_CANCEL_PX = 12;
  let pressTimer = null;
  let pressLink = null;
  let pressStart = null;
  let suppressNextClickOn = null;

  function cancelPress() {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    pressLink = null;
    pressStart = null;
  }

  window.addEventListener('touchstart', (e) => {
    const chatRoot = e.target.closest ? e.target.closest(CHAT_ROOT_SELECTOR) : null;
    if (!chatRoot) return;
    const link = findSenderLink(e.target);
    if (!link || !e.touches || !e.touches[0]) return;

    // Suppresses the native text-selection/callout menu a long press on a
    // link normally brings up, without touching anything else about it.
    if (!link.dataset.tcqrTouchReady) {
      link.dataset.tcqrTouchReady = '1';
      link.style.webkitTouchCallout = 'none';
      link.style.webkitUserSelect = 'none';
      link.style.userSelect = 'none';
    }

    pressLink = link;
    pressStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    pressTimer = setTimeout(() => {
      const target = pressLink;
      pressTimer = null;
      pressLink = null;
      pressStart = null;
      if (target && triggerReply(target)) {
        suppressNextClickOn = target;
        target.classList.add('tcqr-pressed');
        setTimeout(() => target.classList.remove('tcqr-pressed'), 180);
      }
    }, LONG_PRESS_MS);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!pressStart || !e.touches || !e.touches[0]) return;
    const dx = e.touches[0].clientX - pressStart.x;
    const dy = e.touches[0].clientY - pressStart.y;
    if (Math.sqrt(dx * dx + dy * dy) > MOVE_CANCEL_PX) cancelPress(); // scrolling, not holding
  }, { passive: true });

  window.addEventListener('touchend', cancelPress, true);
  window.addEventListener('touchcancel', cancelPress, true);

  // Torn sends a chat message either by pressing Enter in the box (Shift+Enter
  // makes a newline instead) or by clicking its send button. Reacting to
  // those two actions directly - not automating them, just noticing they
  // happened - is what actually clears the chip; the box's class names are
  // build-hashed like everything else in this chat, so "iconWrapper" is
  // matched as a substring rather than an exact class.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const ta = e.target;
    if (!(ta instanceof HTMLTextAreaElement) || !ta.matches(TEXTAREA_SELECTOR)) return;
    if (!activeChipTextareas.has(ta)) return;
    // Deferred a tick so Torn's own handler runs first; harmless either way.
    setTimeout(() => hideReplyChip(ta), 0);
  }, true);

  window.addEventListener('click', (e) => {
    const button = e.target.closest ? e.target.closest('button[class*="iconWrapper"]') : null;
    if (!button || !button.closest(CHAT_ROOT_SELECTOR)) return;
    const textarea = findChannelTextarea(button);
    if (textarea) setTimeout(() => hideReplyChip(textarea), 0);
  }, true);

  // A small hint so the Shift+click behaviour is discoverable, without
  // touching anything Torn already set on the element.
  window.addEventListener('mouseover', (e) => {
    const chatRoot = e.target.closest ? e.target.closest(CHAT_ROOT_SELECTOR) : null;
    if (!chatRoot) return;
    const link = findSenderLink(e.target);
    if (!link || link.dataset.tcqrHint) return;
    link.dataset.tcqrHint = '1';
    const name = extractName(link.textContent);
    if (name && !link.title) link.title = 'Shift+click (or press and hold) to reply to ' + name;
  }, true);
})();
