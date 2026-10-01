// Browser tests: loads the script into a mock chat page (no real network) and checks behaviour.
// Run: npm test
const { chromium } = require('playwright');
const path = require('path');
const script = require('fs').readFileSync(path.join(__dirname, '..', 'torn-chat-quick-reply.user.js'), 'utf8');
const results = [];
const ok = (name, cond) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}`);

function chatMessage(name, xid, msgId) {
  return `<div class="virtualItem___eIUjo">
    <div class="root___EP_Dq first___icN1g">
      <div class="box___eWW6m">
        <span class="senderContainer___aAIZ2">
          <a data-label="avatar" href="/profiles.php?XID=${xid}" class="root___uxEGq avatar___DTfNY">AV</a>
          <a id="${msgId}:${xid}" href="/profiles.php?XID=${xid}" class="root___XpplE sender___WTwPI clickable___efRv1">${name}:</a>
        </span>
        <span class="root___XpplE body___HxuJg message___AI7N1">hello</span>
      </div>
    </div>
  </div>`;
}

function chatChannel(id, name, xid, msgId) {
  return `<div id="${id}" class="root___Ex8tg root___hrPnu visible___IVBmB">
    <div class="content___aMpKJ">
      <div class="root___v2RvA">${chatMessage(name, xid, msgId)}</div>
      <div class="root___aBCjE">
        <textarea class="textarea___JRbO5" placeholder="Type your message here..."></textarea>
        <button type="button" class="iconWrapper___DRSkm" disabled></button>
      </div>
    </div>
  </div>`;
}

const PAGE_HTML = `<!doctype html><html><body>
  <div id="chatRoot">
    ${chatChannel('global', 'masky', '2659704', 'cc256228-32a1-454a-916a-f30414416f02')}
    ${chatChannel('faction', 'bob', '999', 'dd111111-1111-1111-1111-111111111111')}
  </div>
  <div class="content-wrapper">
    <a href="/profiles.php?XID=555" id="outside-link" onclick="return false;">SomeoneElse</a>
  </div>
  <input id="chatbox-unrelated" type="text">
  </body></html>`;

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  // ------------------------------------------------------- insertion correctness
  {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.route('https://www.torn.com/**', r => r.fulfill({ contentType: 'text/html', body: PAGE_HTML }));
  await p.route('**/profiles.php**', r => r.fulfill({ contentType: 'text/html', body: '<html><body>profile</body></html>' }));
  await p.goto('https://www.torn.com/loader.php');
  await p.addScriptTag({ content: script });
  await p.waitForTimeout(30);

  let requests = 0;
  p.on('request', (req) => { if (req.url().includes('profiles.php')) requests++; });

  // --- shift+click on a sender name inserts "@Name " into that channel's own textarea ---
  await p.locator('#global a.sender___WTwPI').click({ modifiers: ['Shift'] });
  const globalVal1 = await p.locator('#global textarea').inputValue();
  ok('shift+click inserts "@Name " into the message box', globalVal1 === '@masky ');

  const factionVal1 = await p.locator('#faction textarea').inputValue();
  ok('the other channel\'s textarea is untouched', factionVal1 === '');

  // --- textarea is focused after insertion ---
  const isFocused = await p.evaluate(() => document.activeElement === document.querySelector('#global textarea'));
  ok('message box is focused after inserting the mention', isFocused);

  // --- shift+click in a different channel targets that channel's own textarea ---
  await p.locator('#faction a.sender___WTwPI').click({ modifiers: ['Shift'] });
  const factionVal2 = await p.locator('#faction textarea').inputValue();
  ok('shift+click in a second channel fills that channel\'s own box', factionVal2 === '@bob ');
  const globalVal2 = await p.locator('#global textarea').inputValue();
  ok('first channel\'s box still has only its own mention', globalVal2 === '@masky ');

  // --- clicking the same name again appends, with a separating space ---
  await p.locator('#global a.sender___WTwPI').click({ modifiers: ['Shift'] });
  const globalVal3 = await p.locator('#global textarea').inputValue();
  ok('a second shift+click appends another mention with a space between', globalVal3 === '@masky @masky ');

  // --- clicking the avatar picture (not the name) does nothing ---
  const beforeAvatarClick = await p.locator('#global textarea').inputValue();
  await p.locator('#global a[data-label="avatar"]').click({ modifiers: ['Shift'] });
  const afterAvatarClick = await p.locator('#global textarea').inputValue();
  ok('shift+clicking the avatar picture does not insert a mention', beforeAvatarClick === afterAvatarClick);

  // --- a profile link outside the chatbox is never touched ---
  await p.locator('#outside-link').click({ modifiers: ['Shift'] });
  const globalVal4 = await p.locator('#global textarea').inputValue();
  const factionVal4 = await p.locator('#faction textarea').inputValue();
  ok('a profile link outside the chatbox is ignored entirely', globalVal4 === globalVal3 && factionVal4 === '@bob ');

  ok('none of this ever made a request to profiles.php', requests === 0);

  // --- double injection guard: re-adding the script doesn't cause a double insert ---
  await p.evaluate(() => { document.querySelector('#global textarea').value = ''; });
  await p.addScriptTag({ content: script });
  await p.waitForTimeout(30);
  await p.locator('#global a.sender___WTwPI').click({ modifiers: ['Shift'] });
  const globalVal5 = await p.locator('#global textarea').inputValue();
  ok('double injection -> a single shift+click still inserts exactly one mention', globalVal5 === '@masky ');

  // --- hover hint ---
  await p.hover('#faction a.sender___WTwPI');
  const title = await p.locator('#faction a.sender___WTwPI').getAttribute('title');
  ok('hovering a sender name adds a Shift+click hint tooltip', /shift\+click/i.test(title || ''));
  }

  // ---------------------------------------------------------------- reply chip
  {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.route('https://www.torn.com/**', r => r.fulfill({ contentType: 'text/html', body: PAGE_HTML }));
  await p.route('**/profiles.php**', r => r.fulfill({ contentType: 'text/html', body: '<html><body>profile</body></html>' }));
  await p.goto('https://www.torn.com/loader.php');
  await p.addScriptTag({ content: script });
  await p.waitForTimeout(30);

  ok('no reply chip before any shift+click', (await p.$$('.tcqr-chip')).length === 0);

  await p.locator('#global a.sender___WTwPI').click({ modifiers: ['Shift'] });
  ok('a "Replying to Name" chip appears after shift+click', await p.locator('#global .tcqr-chip').textContent().then(t => /Replying to masky/.test(t)));
  ok('exactly one chip in the global channel (no stacking)', (await p.locator('#global .tcqr-chip').count()) === 1);
  ok('no chip leaked into the other channel', (await p.locator('#faction .tcqr-chip').count()) === 0);

  // clicking a different name in the same channel, before sending, ADDS it to
  // the same chip - it should list everyone queued up, not just the last click
  await p.evaluate(() => { document.querySelector('#global textarea').value = 'hi '; });
  const secondLink = await p.evaluateHandle(() => {
    const a = document.querySelector('#global a.sender___WTwPI').cloneNode(true);
    a.textContent = 'carol:';
    document.querySelector('#global .senderContainer___aAIZ2').appendChild(a);
    return a;
  });
  await secondLink.asElement().click({ modifiers: ['Shift'] });
  const chipTextAfterSecond = await p.locator('#global .tcqr-chip').textContent();
  ok('shift+clicking a second name adds them to the chip instead of replacing the first', /Replying to masky, carol/.test(chipTextAfterSecond));
  ok('still exactly one chip element (one line, not stacked)', (await p.locator('#global .tcqr-chip').count()) === 1);

  // clicking the SAME name again doesn't list it twice
  await p.locator('#global a.sender___WTwPI').first().click({ modifiers: ['Shift'] });
  const chipTextAfterRepeat = await p.locator('#global .tcqr-chip').textContent();
  ok('shift+clicking a name already on the chip does not duplicate it', chipTextAfterRepeat.match(/masky/g).length === 1);

  // dismiss via the close button
  await p.click('#global .tcqr-chip-close');
  ok('clicking the chip\'s close button removes it', (await p.locator('#global .tcqr-chip').count()) === 0);

  // reappears on the next shift+click, and clears itself once the box empties -
  // even when it's emptied the way Torn actually clears it after sending: a
  // React re-render setting .value directly, with NO "input" event at all.
  await p.locator('#global a.sender___WTwPI').first().click({ modifiers: ['Shift'] });
  ok('chip reappears on the next shift+click', (await p.locator('#global .tcqr-chip').count()) === 1);
  await p.evaluate(() => {
    const ta = document.querySelector('#global textarea');
    const proto = Object.getPrototypeOf(ta);
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(ta, ''); // no dispatchEvent - simulates React clearing it on send
  });
  await p.waitForTimeout(350); // longer than the chip's 250ms poll interval
  ok('chip clears itself once the box is emptied, even with no input event (simulates sending)', (await p.locator('#global .tcqr-chip').count()) === 0);

  // --- pressing Enter (the real way most people send) clears the chip right away ---
  await p.locator('#global a.sender___WTwPI').first().click({ modifiers: ['Shift'] });
  ok('chip showing again before the Enter test', (await p.locator('#global .tcqr-chip').count()) === 1);
  await p.locator('#global textarea').press('Enter');
  await p.waitForTimeout(30);
  ok('pressing Enter in the box clears the chip immediately', (await p.locator('#global .tcqr-chip').count()) === 0);

  // --- Shift+Enter (newline, not a send) must NOT clear the chip ---
  await p.locator('#global a.sender___WTwPI').first().click({ modifiers: ['Shift'] });
  await p.locator('#global textarea').press('Shift+Enter');
  await p.waitForTimeout(30);
  ok('shift+Enter (newline) does not clear the chip', (await p.locator('#global .tcqr-chip').count()) === 1);

  // --- clicking the send button clears the chip right away ---
  await p.locator('#faction a.sender___WTwPI').click({ modifiers: ['Shift'] });
  ok('faction chip showing before the send-button test', (await p.locator('#faction .tcqr-chip').count()) === 1);
  await p.evaluate(() => { document.querySelector('#faction button[class*="iconWrapper"]').disabled = false; });
  await p.click('#faction button[class*="iconWrapper"]');
  await p.waitForTimeout(30);
  ok('clicking the send button clears that channel\'s chip immediately', (await p.locator('#faction .tcqr-chip').count()) === 0);
  ok('the other channel\'s chip is unaffected by that send', (await p.locator('#global .tcqr-chip').count()) === 1);
  }

  // ------------------------------------------------------------- default click behaviour
  {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.route('https://www.torn.com/**', r => r.fulfill({ contentType: 'text/html', body: PAGE_HTML }));
  await p.route('**/profiles.php**', r => r.fulfill({ contentType: 'text/html', body: '<html><body>profile</body></html>' }));
  await p.goto('https://www.torn.com/loader.php');
  await p.addScriptTag({ content: script });
  await p.waitForTimeout(30);

  let requests = 0;
  p.on('request', (req) => { if (req.url().includes('profiles.php')) requests++; });

  // --- a plain click (no Shift) on a sender name is left completely alone: it still navigates ---
  await p.locator('#global a.sender___WTwPI').click();
  await p.waitForTimeout(50);
  ok('plain click on a sender name still navigates to their profile (unchanged)', requests > 0);
  }

  console.log(results.join('\n'));
  if (results.some((r) => r.startsWith('FAIL'))) process.exitCode = 1;
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
