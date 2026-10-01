# Torn Chat Quick Reply 💬

A free userscript for [Torn](https://www.torn.com) that lets you reply to someone in chat without typing their name out.

**Shift+click** (desktop) or **press and hold** (touch, including Torn PDA) a person's name in Torn's chatbox to insert `↪ Name ` into that chat's message box, ready to type. A plain click or quick tap still opens their profile, exactly like it already does — nothing about the normal click changes.

## What it does

Inside Torn's chatbox (global, faction, company — wherever it shows up):

- **Shift+click a sender's name** (desktop) → `↪ Name ` is inserted at the end of that chat's message box and the box is focused, cursor at the end.
- **Press and hold a sender's name** (touch devices, Torn PDA) does the same thing — there's no Shift key on a touchscreen, so a brief hold is the equivalent gesture. A quick tap still opens the profile.
- A small **"Replying to Name" chip** appears above the message box so it's obvious a reply is queued up. Shift+click or hold more names before sending and they're all added to the same chip. The chip also has a small **style toggle** to switch new mentions between `↪ Name` and `@Name` — your choice is remembered next time. Click the chip's ✕ to dismiss it, or just send your message — it clears itself the moment you actually send.
- **Plain click/tap** on a name still opens their profile, same as today. This script only adds the reply gesture; it never removes or changes the existing one.
- Works correctly even with **multiple chat channels open at once** — the mention always lands in the same channel the message was posted in, not whichever one happens to be on top.
- Hover a sender's name and you'll see a tooltip reminding you how to reply.

It never sends anything. It only ever fills in the text box you're about to type into yourself — sending the message is still entirely up to you.

## Install

### Desktop browser (Chrome, Firefox, Edge, Safari)

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open **[torn-chat-quick-reply.user.js](https://raw.githubusercontent.com/rootfellen/torn-chat-quick-reply/main/torn-chat-quick-reply.user.js)**. Your manager will offer to install it.
3. Open any page with the chatbox visible (which is nearly every Torn page) and try Shift+clicking a name in chat.

Updates install automatically through your userscript manager.

### Torn PDA (mobile)

1. In Torn PDA, open **Settings → Advanced browser settings → User scripts**.
2. Add a new script and paste in the contents of `torn-chat-quick-reply.user.js`.
3. Set injection time to **End**, save.
4. In chat, press and hold a name briefly to reply — a quick tap still opens their profile as usual.

## Is it allowed?

Yes. Torn's scripting rules allow scripts that use data from a page you loaded yourself and are currently viewing, as long as they make no extra non-API requests and never automate actions (each input from you results in at most one action).

This script:

- ✅ makes **zero** network requests (to Torn or anywhere else)
- ✅ needs **no API key**
- ✅ only reads the sender name already shown on your screen
- ✅ never sends, submits, or clicks anything on your behalf — the reply gesture only fills in a text box
- ✅ never changes Torn's existing click-to-profile behaviour

## Privacy & security

Nothing is collected or sent anywhere. The only thing saved locally is your `↪ Name` vs `@Name` style preference, in your browser's own `localStorage` — nothing else. See [SECURITY.md](SECURITY.md) for details, and the script is a single readable file if you'd like to check it yourself.

## Troubleshooting

| Problem | Fix |
|---|---|
| Shift+click does nothing | Make sure you're actually holding Shift down while clicking directly on the name text (not the avatar picture), and that the script is enabled in your userscript manager. |
| The mention landed in the wrong chat tab | [Open an issue](https://github.com/rootfellen/torn-chat-quick-reply/issues) with a screenshot — Torn occasionally changes its chat markup, and the matching logic may need an update. |
| Plain click stopped opening profiles | This script never touches plain clicks, so this shouldn't happen. Try disabling other chat-related userscripts one at a time to find a conflict. |

## Development

```bash
npm install
npx playwright install chromium
npm run check   # lint + browser tests
```

Players don't need any of this. It's only for working on the script.

## Feedback and contributions

Bug reports and ideas are welcome in [Issues](https://github.com/rootfellen/torn-chat-quick-reply/issues), or message me in Torn: **[0o0o0](https://www.torn.com/profiles.php?XID=4263920)**. Pull requests are welcome too, as long as changes stay within Torn's scripting rules (no automated actions, no extra requests).

## License

[MIT](LICENSE). Free to use, share and modify.

Made by **0o0o0** in Torn.
