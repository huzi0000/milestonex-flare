# MilestoneX — Project #3 Demo Recording Runbook

**Purpose:** Record one real end-to-end Coston2 project using two fresh MetaMask accounts, then edit the raw footage into a clear two-minute hackathon demo.

**Do not begin transactions until Update 19 is live and every preflight item below passes.**

## 1. What the demo proves

The recording must visibly prove:

1. A fresh client wallet connects on Coston2.
2. The client creates a real `$1.00` project for a different contractor address.
3. FTSOv2 produces the required FXRP quote.
4. The client approves test FXRP.
5. The client funds the deployed escrow.
6. The contractor account submits a delivery-evidence hash.
7. The client releases the milestone.
8. The contractor receives test FXRP.
9. Project #3 reaches `Completed` with `0 FXRP` remaining.
10. Four public Coston2 receipts are visible.

This is a two-account simulation controlled by the solo builder. Do not imply that the accounts are independent users.

## 2. Safety rules

- Use only the fresh **MilestoneX Demo Client** and **MilestoneX Demo Contractor** accounts.
- Use only free Coston2 faucet assets.
- Never display a seed phrase, private key, recovery phrase, password, QR export, `.env` file, or real-wallet account.
- Do not record account creation or faucet CAPTCHA screens.
- Close all unrelated browser tabs, email, social media, coursework, exchanges, and personal applications.
- Disable every wallet extension except MetaMask.
- Unpin unrelated extensions so only MetaMask is visible in the browser toolbar.
- Enable Windows Do Not Disturb and close messaging applications.
- Do not refresh or close the lifecycle page after Project #3 begins; the current browser session preserves the four receipt hashes for the final proof card.
- Never click a transaction button twice.

## 3. Required balances before recording

### MilestoneX Demo Client

Target:

- Approximately `100 C2FLR`
- `10 FXRP`

Request C2FLR and FXRP from:

https://faucet.flare.network/coston2

### MilestoneX Demo Contractor

Target:

- Approximately `100 C2FLR`
- `0 FXRP`

Request C2FLR only. Starting at zero makes the received payment obvious.

## 4. Account and browser preparation

1. In MetaMask, rename the fresh accounts exactly:
   - `MilestoneX Demo Client`
   - `MilestoneX Demo Contractor`
2. Save each public address in Notepad with the correct label.
3. Confirm the two public addresses are different.
4. Confirm MetaMask shows **Coston2**.
5. Make **MilestoneX Demo Client** the active account.
6. Open MetaMask → Connected sites and disconnect `milestonex-flare.vercel.app` if old accounts are still authorized.
7. During the new connection prompt, authorize only the two demo accounts. Keep Demo Client active.
8. Open one clean Chrome window with only these tabs:
   - `https://milestonex-flare.vercel.app/`
   - `https://milestonex-flare.vercel.app/lifecycle.html`
   - `https://milestonex-flare.vercel.app/deploy.html`
9. Use dark theme on every MilestoneX page.
10. Set Chrome zoom to `100%`.
11. Hide the bookmarks bar with `Ctrl + Shift + B`.
12. Maximize Chrome and enable automatic taskbar hiding if possible.

## 5. OBS setup on Windows

Use **OBS Display Capture**, not Browser Capture or Window Capture. Display Capture is required because MetaMask confirmation windows may otherwise be omitted.

### Video settings

Open OBS → Settings → Video:

- Base Canvas: match the laptop display
- Output Resolution:
  - `1920×1080` if the display is 1080p, or
  - `1280×720` if the display is 1366×768
- Common FPS: `30`

Open Settings → Output → Recording:

- Recording format: `MKV`
- Encoder: available hardware H.264 encoder, or software H.264
- Recording quality: High Quality / medium file size
- Microphone: muted unless intentionally narrating live

After recording, use OBS → File → **Remux Recordings** to convert MKV to MP4.

### Scene setup

1. Create a scene named `MilestoneX Demo`.
2. Add **Display Capture**.
3. Fit the display to canvas.
4. Confirm the cursor is captured.
5. Do not add webcam unless intentionally desired.

### Mandatory capture test

Before any transaction:

1. Start a ten-second test recording.
2. Open MetaMask normally.
3. Close MetaMask.
4. Stop recording.
5. Play the test file.
6. Confirm both Chrome and the MetaMask window are visible and readable.
7. Confirm no private or unrelated information appears.
8. Delete the test recording.

Do not create Project #3 until this capture test succeeds.

## 6. Exact Project #3 data

Click **Start new test project** only when it shows:

```text
Next #3
```

If it shows another number, stop and verify the chain before continuing.

Use these exact fields:

### Project title

```text
MilestoneX Demo Website Delivery
```

### Contractor public address

Paste the complete public address of **MilestoneX Demo Contractor** from Notepad. Do not type it manually.

Verify:

- It begins with `0x`.
- It contains 40 hexadecimal characters after `0x`.
- It is not the Demo Client address.
- Its first and final characters match MetaMask.

### Test milestone value

```text
1.00
```

### Evidence note

```text
MilestoneX Project 3 website delivery completed and reviewed on Coston2 on August 6, 2026.
```

This note contains no private client content. MilestoneX hashes it locally and commits only the hash.

## 7. Raw recording sequence

Record the complete workflow continuously. Waiting periods will be removed during editing.

### Shot A — product opening

1. Start on the homepage hero.
2. Hold for three seconds.
3. Slowly show:
   - Product headline
   - `Deployed contracts`
   - `Live FTSOv2 pricing`
   - `Real test FXRP`
4. Click **Explore verified lifecycle**.
5. Show the completed proof briefly.

### Shot B — start Project #3

1. In **Live Contract State**, confirm `Next #3`.
2. Click **Start new test project** once.
3. Confirm the page resets to the six-step workflow.
4. The status should be `None` and Project should show `#3`.

### Shot C — connect the Demo Client

1. Confirm Demo Client is active in MetaMask.
2. Click **Connect wallet**.
3. If MetaMask asks which accounts to expose, select only the two demo accounts.
4. Keep Demo Client active.
5. Confirm the page identifies it as **Client account**.
6. Confirm the displayed balance is approximately `10 FXRP` and sufficient C2FLR.

Stop if the page says Unknown account or Contractor account.

### Shot D — create the project

1. Enter the exact title.
2. Paste the exact Demo Contractor public address.
3. Enter `1.00`.
4. Hold for two seconds so viewers can read the values.
5. Click **Create project on Coston2** once.
6. In MetaMask verify:
   - Network: Coston2
   - Active account: Demo Client
   - Interacting contract ends in `78EE`
   - Cost is C2FLR gas; no FXRP should move at creation
7. Confirm.
8. Wait for MilestoneX to show Project `#3`, client, contractor, and `$1.00`.

Do not refresh during confirmation.

### Shot E — approve test FXRP

1. Show the live FTSOv2 quote and XRP/USD price.
2. Click **Approve test FXRP** once.
3. In MetaMask verify:
   - Active account: Demo Client
   - Asset: test FXRP
   - Spender: MilestoneX escrow ending `78EE`
   - Approval is bounded around the quote plus the 1% maximum
4. Confirm.
5. Wait until MilestoneX marks FXRP approved.

Approval gives permission; it does not fund the project yet.

### Shot F — fund the escrow

1. Click **Fund protected escrow** once.
2. In MetaMask verify:
   - Network: Coston2
   - Active account: Demo Client
   - Contract ends in `78EE`
3. Confirm.
4. Wait until the page shows the quoted FXRP as protected and Status `Funded`.
5. Hold the funded state for two seconds.

### Shot G — switch to Demo Contractor

1. Open MetaMask's account selector.
2. Select **MilestoneX Demo Contractor**.
3. Return to MilestoneX.
4. Click **Refresh active MetaMask account**.
5. Confirm the page says **Contractor account**.
6. Confirm contractor FXRP is still `0` before release, if the faucet was prepared as directed.

### Shot H — submit evidence

1. Replace the evidence text with the exact Project #3 evidence note.
2. Hold for two seconds.
3. Click **Hash & submit evidence** once.
4. In MetaMask verify:
   - Active account: Demo Contractor
   - Network: Coston2
   - Contract ends in `78EE`
5. Confirm.
6. Wait until the page shows **Evidence hash committed**.
7. Briefly show the resulting hash.

### Shot I — switch back to Demo Client

1. Open MetaMask's account selector.
2. Select **MilestoneX Demo Client**.
3. Return to MilestoneX.
4. Click **Refresh active MetaMask account**.
5. Confirm the page says **Client account**.

### Shot J — release payment

1. Click **Release milestone payment** once.
2. In MetaMask verify:
   - Active account: Demo Client
   - Network: Coston2
   - Contract ends in `78EE`
3. Confirm.
4. Wait without refreshing.
5. The page should show:
   - `LIFECYCLE COMPLETE`
   - `COMPLETED PROJECT #3`
   - Project value `$1.00`
   - The actual funded FXRP amount
   - The same amount released
   - `0 FXRP` remainder
   - Four receipt cards
   - Six completed progress checks
6. Hold the completed proof for at least five seconds.
7. Slowly move the cursor across the four receipt cards without opening them.

### Shot K — show the contractor payment

If the raw recording remains stable:

1. Switch MetaMask to Demo Contractor.
2. Click **Refresh active MetaMask account** only if the completed proof remains visible.
3. Show the contractor's increased FXRP balance.
4. Do not leave or reload the page.

This step is optional because the release receipt and proof card already establish payment.

### Shot L — supporting proof

After Project #3 footage is safely recorded:

1. Open the main application Activity page.
2. Show the existing eight verified Project #1 and #2 receipts for two seconds.
3. Open the Deployment page.
4. Show `3 / 3` deployed contracts and the published manifest.
5. Do not redeploy anything.
6. End the raw recording.

## 8. Expected MetaMask confirmations

There are exactly five required transaction confirmations:

1. Create project — Demo Client
2. Approve test FXRP — Demo Client
3. Fund escrow — Demo Client
4. Submit evidence — Demo Contractor
5. Release milestone — Demo Client

Wallet connection and account switching are not transactions.

## 9. If something goes wrong

### MetaMask opens on the wrong network

Cancel. Switch to Coston2. Return to MilestoneX and retry only if no transaction was submitted.

### Wrong account is active

Cancel. Select the required Demo Client or Demo Contractor account. Click Refresh active MetaMask account.

### Transaction submitted but UI still says waiting

Do not click again. Wait at least one minute. Use the visible transaction hash or MetaMask Activity to check Coston2 Explorer. If confirmed, click only the page's refresh-state control.

### User rejects a transaction

The transaction did not occur. Verify the correct role/network and retry once.

### Insufficient FXRP

Stop. Do not lower safety checks or use real assets. Confirm the Demo Client received faucet FXRP.

### Insufficient C2FLR

Stop and request free C2FLR from the official faucet.

### Quote/slippage failure

Refresh the live state and approve the newly quoted amount. Do not repeatedly submit the same funding action.

### Browser or RPC error after a confirmed transaction

Do not repeat the transaction. Preserve the raw recording and send the public transaction hash for verification.

## 10. Editing the raw footage

Use Clipchamp or another editor with a 16:9 timeline.

### Import

- Raw OBS recording
- `milestonex-video-intro-1920x1080.png`
- `milestonex-video-outro-1920x1080.png`

### Final timeline target

| Time | Visual |
|---|---|
| 0:00–0:02 | MilestoneX intro card |
| 0:02–0:11 | Homepage problem and product promise |
| 0:11–0:19 | Open lifecycle and start Project #3 |
| 0:19–0:31 | Connect client and show project fields |
| 0:31–0:42 | Create transaction and resulting Project #3 state |
| 0:42–0:57 | FTSOv2 quote, approve, and fund |
| 0:57–1:10 | Switch contractor and submit evidence |
| 1:10–1:23 | Switch client and release payment |
| 1:23–1:42 | Completed Project #3 metrics and four receipts |
| 1:42–1:51 | Real Activity receipts |
| 1:51–1:58 | Three deployed contracts |
| 1:58–2:00 | MilestoneX outro card |

Cut:

- Long block-confirmation waits
- Repeated mouse movement
- MetaMask loading spinners after confirmation
- Mistakes, hesitation, and unrelated browser chrome

Do not cut away the wallet account, Coston2 network, transaction intent, resulting state, or final receipt proof.

## 11. Suggested captions

Use short captions rather than paragraphs:

1. `A client creates a USD-denominated milestone.`
2. `FTSOv2 calculates the required test FXRP.`
3. `The client approves and locks FXRP in escrow.`
4. `The contractor commits a delivery-evidence hash.`
5. `The client releases the completed milestone.`
6. `FXRP settles to the contractor on Coston2.`
7. `Project complete · 0 FXRP remaining · public receipts.`

## 12. Optional narration draft

> I'm Huzaifa, the solo builder of MilestoneX. Remote clients hesitate to prepay, while contractors hesitate to deliver before payment. MilestoneX turns test FXRP into programmable project escrow on Flare. Here, a fresh client creates a one-dollar milestone for a separate contractor wallet. FTSOv2 converts that USD value into the required FXRP. The client approves and funds the deployed escrow. The contractor then switches accounts and commits a delivery-evidence hash. After reviewing the evidence, the client releases payment. Project number three is complete, the contractor receives the exact FXRP amount, and zero FXRP remains assigned to the project. Every action has a public Coston2 receipt. The oracle adapter, EIP-712 funding forwarder, and milestone escrow are deployed and verified, while eighteen automated tests cover authorization, replay protection, pricing, rounding, cancellation, and accounting. MilestoneX makes cross-border project payments transparent and programmable with Flare.

Replace no numbers in narration unless they match the final onchain result.

## 13. Export and upload

- Container: MP4
- Video: H.264
- Audio: AAC if narration is used
- Frame rate: 30 fps
- Resolution: 1080p preferred; 720p acceptable for a 1366×768 display
- Duration: 1:45–2:05
- File name: `milestonex-flare-demo.mp4`

Watch the exported file from beginning to end before uploading.

Recommended YouTube visibility: **Unlisted**, not Private.

Suggested title:

```text
MilestoneX — Programmable FXRP Milestone Payments on Flare | Coston2 Demo
```

Suggested description:

```text
MilestoneX turns test FXRP into programmable milestone escrow for global project work. This demo shows a real two-account Coston2 lifecycle: project creation, FTSOv2 pricing, FXRP approval and funding, contractor evidence, client release, contractor payment, and public receipts.

Live app: https://milestonex-flare.vercel.app/
Lifecycle proof: https://milestonex-flare.vercel.app/lifecycle.html
GitHub: https://github.com/huzi0000/milestonex-flare

Built by Huzaifa as a solo entry for Flare Summer Signal — Bounty 1: Interoperable Asset Products. Testnet only; no real funds. Both demo accounts are controlled by the solo builder to simulate the client and contractor roles.
```

## 14. After recording

Do not create another project.

Send:

- Project ID (`3` expected)
- Final completed-page screenshot
- Raw/final transaction hashes if available
- Final MP4 or unlisted video link

Project #3 will then be independently machine-verified and added to the final submission evidence.
