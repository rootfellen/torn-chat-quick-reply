# Torn Chat Quick Reply 💬

A free userscript for [Torn](https://www.torn.com) that lets you reply to someone in chat without typing their name out.

**Shift+click** a person's name in Torn's chatbox to insert `@Name ` into that chat's message box, ready to type. A plain click still opens their profile, exactly like it already does — nothing about the normal click changes.

## What it does

Inside Torn's chatbox (global, faction, company — wherever it shows up):

- **Shift+click a sender's name** → `@Name ` is inserted at the end of that chat's message box and the box is focused, cursor at the end.
- A small **"Replying to Name" chip** appears above the message box so it's obvious a reply is queued up. Click its ✕ to dismiss it, or just send/clear your message — it disappears on its own.
- **Plain click** on a name still opens their profile, same as today. This script only adds a Shift+click behaviour; it never removes or changes the existing one.
- Works correctly even with **multiple chat channels open at once** — the mention always lands in the same channel the message was posted in, not whichever one happens to be on top.
- Hover a sender's name and you'll see a tooltip reminding you it's Shift+click to reply.

It never sends anything. It only ever fills in the text box you're about to type into yourself — sending the message is still entirely up to you.

## Install

### Desktop browser (Chrome, Firefox, Edge, Safari)

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open **[torn-chat-quick-reply.user.js](https://raw.githubusercontent.com/rootfellen/torn-chat-quick-reply/main/torn-chat-quick-reply.user.js)**. Your manager will offer to install it.
3. Open any page with the chatbox visible (which is nearly every Torn page) and try Shift+clicking a name in chat.

Updates install automatically through your userscript manager.

### Torn PDA (mobile)

TBA

## Is it allowed?

Yes. Torn's scripting rules allow scripts that use data from a page you loaded yourself and are currently viewing, as long as they make no extra non-API requests and never automate actions (each input from you results in at most one action).

This script:

- ✅ makes **zero** network requests (to Torn or anywhere else)
- ✅ needs **no API key**
- ✅ only reads the sender name already shown on your screen
- ✅ never sends, submits, or clicks anything on your behalf — Shift+click only fills in a text box
- ✅ never changes Torn's existing click-to-profile behaviour

## Privacy & security

Nothing is collected, stored, or sent anywhere — the script is entirely stateless. See [SECURITY.md](SECURITY.md) for details, and the script is a single readable file if you'd like to check it yourself.

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
