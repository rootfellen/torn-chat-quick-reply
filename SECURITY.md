# Security

## What this script can and can't do

- **No network access.** The script makes no requests to Torn or anywhere else. It has no `fetch`, `XMLHttpRequest` or `WebSocket` calls, and `@grant none` gives it no userscript-manager privileges. The linter blocks any network API from being added.
- **No API key.** It never asks for one and never reads one.
- **Reads only what's already on your screen.** It reads a chat sender's name from the message it's attached to, nothing else - no cash, stats, travel status, or anything else about your account.
- **Never acts for you.** Shift+click fills in the message box with `@Name ` and focuses it - that's the only thing it ever does. It never sends, submits, or clicks anything on your behalf, and a plain click keeps opening the person's profile exactly like it already does without this script.
- **No HTML injection.** The one thing it writes into the page is plain text into a `<textarea>`'s own value; it never uses `innerHTML`, `outerHTML` or `insertAdjacentHTML`. This is enforced by the linter.
- **Only active inside the chatbox.** The Shift+click behaviour only triggers on sender names inside Torn's chat widget (`#chatRoot`); it does nothing anywhere else on the page.
- **No stored settings, no local storage.** There's nothing to configure and nothing saved on your device - it's stateless.

## Verify it yourself

The whole script is one readable file: [`torn-chat-quick-reply.user.js`](torn-chat-quick-reply.user.js). Only install it from this repository or its official Greasy Fork page.

## Reporting a problem

Found a security issue? Please message [0o0o0 [4263920]](https://www.torn.com/profiles.php?XID=4263920) in Torn instead of opening a public issue.
