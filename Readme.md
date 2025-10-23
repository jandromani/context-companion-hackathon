# Context Companion - Chrome AI Challenge 2025

**Category:** `Best Hybrid AI Application (Chrome Extension)`
**APIs:** `Gemini 2.5 Flash-Lite`, `Summarizer`, `Translator`, `Writer`, `Rewriter`, `Proofreader`

![Screenshot of Context Companion in action](https://i.imgur.com/Tuw3pZl.png)
*(Replace this URL with an actual screenshot of your extension)*

---

## 🎥 Demo Video (Under 3 Minutes)

**[LINK TO YOUR YOUTUBE OR VIMEO VIDEO HERE!]**

*(This is the most important part of your submission. Make sure it clearly shows the hybrid logic: a simple task running on-device (if possible) and the 'Bias' task running on the cloud.)*

---

## 🚀 How to Install (For the Judges)

You can try the extension in 1 minute:

1.  Click the green **"<> Code"** button at the top of this page.
2.  Select **"Download ZIP"**.
3.  Unzip the file on your computer.
4.  Open Google Chrome and navigate to the URL: `chrome://extensions`
5.  Turn on **"Developer mode"** in the top-right corner.
6.  Click **"Load unpacked"**.
7.  Select the folder you just unzipped.
8.  You're done! Pin the 🎯 extension icon and open any news article to begin.

---

## ✨ What It Does (Key Features)

**Context Companion** is an AI assistant that lives in your Chrome Side Panel, capable of analyzing any webpage with a single click.

* **Complex Analysis (Cloud ☁️):**
    * **Bias Analysis:** Uses an advanced prompt in our worker to detect bias (`neutral`, `left`, `right`), assign a credibility score, and extract the 3 literal quotes that prove it.
    * **AI Summary:** Generates a concise summary of the article.
    * **Content Generation:** Writes a headline, a 2-sentence summary, and a tweet based on the article.

* **Text Tools (Hybrid 🔒/☁️):**
    * **Neutral Rewrite:** Rewrites text to remove emotional or biased language.
    * **Translate:** Translates text into multiple languages.
    * **Proofread:** Corrects grammar and spelling.

* **Interactive Evidence (Try this!)**
    * After running a bias analysis, go to the **"🎯 Evidence"** tab.
    * Click the **"🎯 Evidence"** button in the toolbar.
    * The extension will **automatically highlight in yellow** the bias-proving quotes *inside the webpage you are reading*.

---

## 🏆 Why It's the "Best Hybrid Application"

This extension isn't just a simple *fallback*. It was designed with an **intelligent routing logic** to get the best of both worlds:

### 1. Privacy & Speed (On-Device 🔒)

* **What:** Simple, private tasks like `Translate`, `Rewrite`, and `Proofread`.
* **How:** If Chrome (Dev/Canary) has the Nano APIs enabled (`window.ai` is available), these tasks run **100% on-device**.
* **Why:** It's instant, works offline, and the text from your private email or DM never leaves your machine.

### 2. Power & Complexity (Cloud Worker ☁️)

* **What:** Complex tasks like our custom `Bias Analysis` and `Content Generation`.
* **How:** These tasks are **always** routed to our Cloudflare worker, which runs `gemini-2.5-flash-lite` with advanced, structured-JSON prompts.
* **Why:** Gemini Nano cannot handle this level of prompt complexity (like returning structured JSON with analysis and quotes). This allows us to offer a killer feature that on-device APIs can't.

### 3. Resilience (The Fallback)

* If `window.ai` is *not* available (like in stable Chrome), the "Hybrid Mode" is disabled, and **all tasks** are securely routed through the Cloud Worker.
* **Result:** The extension **works for 100% of users** but provides an *enhanced* (faster, more private) experience for users with on-device AI.

---

## 🛠️ Tech Stack & Notes

* **Manifest V3:** Using the `chrome.sidePanel` API.
* **No Bundlers:** 100% Vanilla JS, HTML, and CSS. No `npm`, no `node_modules`.
* **Frontend:** `sidepanel.js` handles all UI logic, the hybrid routing, and communication with other scripts.
* **Backend:** A **Cloudflare Worker** (`worker.js`) acts as a secure proxy to the Gemini API.
* **Content Script:** `content.js` is injected programmatically to extract readable text from the page and to highlight the evidence.

### Optional: Testing On-Device Mode

If you have Chrome Canary/Dev and want to see the hybrid logic in action:

1.  Go to `chrome://flags`
2.  **Enable** `#prompt-api-for-gemini-nano`.
3.  **Enable** `#optimization-guide-on-device-model` (and download the model if prompted).
4.  Restart Chrome.
5.  Now, when you use the extension, you will see simple tasks (like "Translate") show the `🔒 Chrome` icon instead of `☁️ Cloud`.

---

## 🔐 Security & Privacy

* **Private by Default:** The extension prioritizes on-device execution whenever possible.
* **Secure Proxy:** When using Cloud Mode, requests are sent to our worker (`https://cc-gemini-proxy.alejandrobgn.workers.dev/`).
* **Zero Logs:** The worker is **stateless**. It **does not store, log, or save** any text that is sent for analysis. It only acts as a secure bridge to the Gemini API.
* **Strict CSP:** The `manifest.json` and `sidepanel.html` use a Content Security Policy (CSP) that only allows connections to our own worker domain.

---

## 📄 License

MIT