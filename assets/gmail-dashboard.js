/* CBFX Hub — Gmail dashboard helper
 * Single source of truth for wizard "Copy + Open Gmail" behavior.
 *
 * Usage:
 *   cbfxSendViaGmail({
 *     to:      'bids@chicken-bone.com',
 *     cc:      'producer@chicken-bone.com',   // optional
 *     subject: '[Bid Request] Show — Client — Due ...',
 *     body:    'plain text body',
 *     toastEl: document.getElementById('copyConfirm')  // optional, falls back to lookup
 *   });
 *
 *   cbfxCopyEmail({ to, cc, subject, body, toastEl })
 *
 * Behavior:
 *   - Copies "To: ...\nSubject: ...\n\nBODY" to clipboard
 *   - Opens Gmail compose in new tab (fs=1&tf=cm)
 *   - Shows green "✓ Copied to clipboard" toast if #copyConfirm exists
 *   - Falls back to execCommand on browsers without async clipboard
 */
(function (global) {
  'use strict';

  function buildGmailUrl(opts) {
    var url = 'https://mail.google.com/mail/?view=cm&fs=1&tf=1';
    if (opts.to)      url += '&to='  + encodeURIComponent(opts.to);
    if (opts.cc)      url += '&cc='  + encodeURIComponent(opts.cc);
    if (opts.subject) url += '&su='  + encodeURIComponent(opts.subject);
    if (opts.body)    url += '&body=' + encodeURIComponent(opts.body);
    return url;
  }

  function buildClipboardText(opts) {
    var lines = [];
    if (opts.to)      lines.push('To: ' + opts.to);
    if (opts.cc)      lines.push('Cc: ' + opts.cc);
    if (opts.subject) lines.push('Subject: ' + opts.subject);
    if (lines.length) lines.push('');           // blank separator only if there are headers
    lines.push(opts.body || '');
    return lines.join('\n');
  }

  function showToast(toastEl) {
    var el = toastEl || document.getElementById('copyConfirm');
    if (!el) return;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      ta.style.left     = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      console.warn('[cbfx] clipboard fallback failed', e);
      return false;
    }
  }

  function copyText(text, toastEl) {
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(function () { showToast(toastEl); })
        .catch(function () { if (fallbackCopy(text)) showToast(toastEl); });
    }
    if (fallbackCopy(text)) showToast(toastEl);
    return Promise.resolve();
  }

  function cbfxCopyEmail(opts) {
    return copyText(buildClipboardText(opts), opts && opts.toastEl);
  }

  function cbfxSendViaGmail(opts) {
    opts = opts || {};
    var text = buildClipboardText(opts);
    var url  = buildGmailUrl(opts);
    // Copy first so the user has a clipboard fallback in case the Gmail tab is blocked.
    var done = copyText(text, opts.toastEl);
    // Open Gmail in a new tab regardless of clipboard outcome.
    // popup blockers: window.open must run in the same tick as the user gesture,
    // so we don't wait on the clipboard promise.
    var win = global.open(url, '_blank', 'noopener');
    if (!win) {
      // Popup blocked — surface a warning in console; toast still shows copy success
      console.warn('[cbfx] Gmail popup blocked. Body is copied to clipboard.');
    }
    return done;
  }

  global.cbfxSendViaGmail = cbfxSendViaGmail;
  global.cbfxCopyEmail    = cbfxCopyEmail;
  global.cbfxGmailUrl     = buildGmailUrl;   // expose for debugging / dashboards
})(typeof window !== 'undefined' ? window : this);
