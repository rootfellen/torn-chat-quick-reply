# Changelog

## 1.1.0 (2026-09-30)

- Added **press-and-hold** on touch devices (Torn PDA included) as the equivalent of Shift+click — there's no Shift key on a touchscreen, so a brief hold on a sender's name now does the same thing a desktop Shift+click does. A quick tap still opens the profile, unchanged.
- The chip now also clears when a reply is sent via a long-press, same as it does for Enter/the send button.
- Test suite grown to 32 browser tests to cover the new touch behaviour.

## 1.0.0 (2026-09-30)

First public release.

- Shift+click a sender's name in Torn's chatbox to insert "@Name " into that chat's message box and focus it
- A small "Replying to Name" chip appears above the message box so it's obvious a reply is queued up; shift+clicking more names before sending adds them to the same chip
- Click the chip's ✕ to dismiss it, or just send your message — it clears itself the moment you actually send (pressing Enter or clicking the send button), with a value-based fallback check in case a message gets sent some other way
- Plain click is untouched — still opens the person's profile as usual
- Works correctly with several chat channels open at once (mention and chip always land in the channel the message was in)
- Hover tooltip on sender names hints at the Shift+click behaviour
- No API key, no network requests, no local storage, no data collected
- Dev tooling: ESLint (blocks network APIs and HTML injection), 28 browser tests, GitHub Actions CI
