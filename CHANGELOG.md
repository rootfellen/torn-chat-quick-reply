# Changelog

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
