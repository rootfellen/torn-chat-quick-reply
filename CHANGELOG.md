# Changelog

## 1.5.0 (2026-09-30)

- A quote now ends with a small indented "↪" marking exactly where your own reply starts, instead of just a blank line, e.g.:
  ```
  ↪ 𝐌𝐚𝐝𝐠𝐨𝐝
  [Follow me for more life hacks]

      ↪   <type your reply here>
  ```
- That arrow is always "↪", even if you've toggled the mention style to "@Name" - it's a layout cue, not a mention. The indent uses non-breaking spaces so it isn't collapsed away in the sent message the way repeated regular spaces would be.
- Test suite grown to 43 browser tests.

## 1.4.0 (2026-09-30)

- Shift+click (or press-and-hold) on a message's *text*, instead of the sender's name, now quotes that whole message - inserts the sender's (bold-look) name on its own line, the message itself on the next line in brackets (truncated past ~120 characters), then a blank line to type your reply into, e.g.:
  ```
  ↪ 𝐌𝐚𝐝𝐠𝐨𝐝
  [Follow me for more life hacks]

  ```
- Quoting respects your chosen mention style (↪ Name vs @Name) and shows the same "Replying to..." chip as a plain mention.
- Note: Shift+click inside a chat message no longer extends a text selection there the way it normally would elsewhere on the page - that gesture is now reserved for quoting.
- Avatar clicks (Shift+click or long-press) continue to do nothing, same as before.
- Test suite grown to 42 browser tests to cover quoting, truncation, and the avatar-still-does-nothing edge case.

## 1.3.0 (2026-09-30)

- The name in a mention is now written in bold-look Unicode characters (e.g. "↪ 𝐆𝐢𝐧𝐑𝐮𝐦𝐦𝐲 ") so it stands out in the sent message for everyone reading chat - no markdown support needed, since it's genuinely different characters, not formatting. Only the name changes; the "↪"/"@" prefix and the rest of your message stay as typed.

## 1.2.0 (2026-09-30)

- Mentions now default to "↪ Name " instead of "@Name " — reads more clearly as "replying to"
- Added a small toggle in the "Replying to..." chip to switch between the "↪ Name" and "@Name" styles; it only affects new mentions from then on, and your choice is remembered next time (the one thing this script now stores locally — nothing else)

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
