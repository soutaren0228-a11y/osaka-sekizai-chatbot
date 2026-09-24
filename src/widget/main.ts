/**
 * 埋め込みウィジェット本体（Shadow DOMで描画。サイトのCSSと干渉しない）。
 *
 * <script src=".../widget.js" data-bot-id="..." async></script> の1行で読み込まれる。
 * このファイルはesbuildで独立したバンドル（public/widget.js）にビルドするため、
 * アプリ本体（@/lib/...）からは意図的に何もimportせず、必要な型はここに直接書いている
 * （公開ウィジェットのバンドルを小さく・独立させておくための判断。CLAUDE.md参照）。
 */

interface AppearanceConfig {
  colorPresetKey: string;
  customColor: string;
  position: "right" | "left";
  iconDataUrl: string | null;
  botName: string;
  launcherLabel: string;
  greeting: string;
  disclaimer: string;
  suggestions: string[];
}

const COLOR_PRESET_HEX: Record<string, string> = {
  navy: "#1F3A7A",
  green: "#1F7A4D",
  teal: "#0F766E",
  orange: "#C2410C",
  black: "#1C1C1A",
};

type ChatStatus = "answered" | "unanswered" | "refused" | "unavailable";

interface ChatDoneEvent {
  type: "done";
  status: ChatStatus;
  contact?: { phone: string; phoneHref: string; contactUrl: string };
}

function resolveAccentColor(config: AppearanceConfig): string {
  if (config.colorPresetKey === "custom") return config.customColor;
  return COLOR_PRESET_HEX[config.colorPresetKey] ?? COLOR_PRESET_HEX.navy;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${random}`;
}

function getApiOrigin(): string {
  const current = document.currentScript as HTMLScriptElement | null;
  const script =
    current ?? document.querySelector<HTMLScriptElement>('script[src*="widget.js"]');
  if (script?.src) {
    try {
      return new URL(script.src).origin;
    } catch {
      /* フォールバックへ */
    }
  }
  // 最終フォールバック（本来は到達しない想定）
  return window.location.origin;
}

async function init() {
  const apiOrigin = getApiOrigin();

  let config: AppearanceConfig;
  try {
    const res = await fetch(`${apiOrigin}/api/public/bot-config`);
    if (!res.ok) {
      console.error("[osaka-sekizai widget] 設定を取得できませんでした", res.status);
      return;
    }
    const json = await res.json();
    config = json.appearance as AppearanceConfig;
  } catch (err) {
    console.error("[osaka-sekizai widget] 設定の取得に失敗しました", err);
    return;
  }

  const accent = resolveAccentColor(config);
  const host = document.createElement("div");
  host.style.all = "initial";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = buildStyles(accent) + buildMarkup(config, accent);

  const root = shadow.getElementById("root") as HTMLElement;
  const launcher = shadow.getElementById("launcher") as HTMLButtonElement;
  const panel = shadow.getElementById("panel") as HTMLElement;
  const closeButton = shadow.getElementById("close") as HTMLButtonElement;
  const messagesEl = shadow.getElementById("messages") as HTMLElement;
  const suggestionsEl = shadow.getElementById("suggestions") as HTMLElement;
  const form = shadow.getElementById("form") as HTMLFormElement;
  const input = shadow.getElementById("input") as HTMLTextAreaElement;
  const sendButton = shadow.getElementById("send") as HTMLButtonElement;

  root.classList.add(config.position === "left" ? "pos-left" : "pos-right");

  const conversationId = createId("conv");
  let isSending = false;
  let hasUserMessage = false;
  let composing = false;

  addAssistantMessage(config.greeting);

  launcher.addEventListener("click", () => {
    panel.classList.add("open");
    launcher.classList.add("hidden");
  });
  closeButton.addEventListener("click", () => {
    panel.classList.remove("open");
    launcher.classList.remove("hidden");
  });

  for (const chip of config.suggestions.slice(0, 6)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = chip;
    button.style.backgroundColor = hexToRgba(accent, 0.1);
    button.style.borderColor = hexToRgba(accent, 0.3);
    button.style.color = accent;
    button.addEventListener("click", () => sendMessage(chip));
    suggestionsEl.appendChild(button);
  }

  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("compositionend", () => {
    composing = false;
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !composing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    void sendMessage(text);
  });

  function addUserMessage(text: string) {
    hasUserMessage = true;
    suggestionsEl.style.display = "none";
    const bubble = document.createElement("div");
    bubble.className = "bubble user";
    bubble.style.backgroundColor = accent;
    bubble.textContent = text;
    const row = document.createElement("div");
    row.className = "row user";
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addAssistantMessage(text: string): HTMLElement {
    const bubble = document.createElement("div");
    bubble.className = "bubble assistant";
    bubble.textContent = text;
    const row = document.createElement("div");
    row.className = "row assistant";
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function addContactButtons(
    bubble: HTMLElement,
    contact: NonNullable<ChatDoneEvent["contact"]>
  ) {
    const wrap = document.createElement("div");
    wrap.className = "contact";

    const call = document.createElement("a");
    call.href = contact.phoneHref;
    call.className = "contact-btn solid";
    call.style.backgroundColor = accent;
    call.textContent = `電話で問い合わせる（${contact.phone}）`;
    wrap.appendChild(call);

    const link = document.createElement("a");
    link.href = contact.contactUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "contact-btn outline";
    link.style.borderColor = accent;
    link.style.color = accent;
    link.textContent = "お問い合わせページを開く";
    wrap.appendChild(link);

    bubble.appendChild(wrap);
  }

  async function sendMessage(text: string) {
    if (isSending) return;
    isSending = true;
    sendButton.disabled = true;
    addUserMessage(text);
    const bubble = addAssistantMessage("");
    bubble.classList.add("typing");
    bubble.textContent = "…";

    try {
      const res = await fetch(`${apiOrigin}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, isTest: false, conversationId }),
      });
      if (!res.ok || !res.body) {
        bubble.classList.remove("typing");
        bubble.textContent = "エラーが発生しました。しばらくしてからお試しください。";
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.trim()) {
            const event = JSON.parse(line);
            if (event.type === "delta") {
              if (firstChunk) {
                bubble.classList.remove("typing");
                bubble.textContent = "";
                firstChunk = false;
              }
              full += event.text;
              bubble.textContent = full;
              messagesEl.scrollTop = messagesEl.scrollHeight;
            } else if (event.type === "done") {
              const doneEvent = event as ChatDoneEvent;
              if (
                (doneEvent.status === "unanswered" || doneEvent.status === "refused") &&
                doneEvent.contact
              ) {
                addContactButtons(bubble, doneEvent.contact);
              }
            } else if (event.type === "error") {
              bubble.classList.remove("typing");
              bubble.textContent = event.message || "エラーが発生しました。";
            }
          }
          newlineIndex = buffer.indexOf("\n");
        }
      }
    } catch {
      bubble.classList.remove("typing");
      bubble.textContent = "通信に失敗しました。しばらくしてからお試しください。";
    } finally {
      isSending = false;
      sendButton.disabled = false;
    }
  }

  void hasUserMessage;
}

function buildMarkup(config: AppearanceConfig, accent: string): string {
  const icon = config.iconDataUrl
    ? `<img src="${config.iconDataUrl}" alt="" class="avatar-img" />`
    : `<div class="avatar" style="background-color:${accent}">石</div>`;

  return `
    <div id="root">
      <button id="launcher" type="button" style="background-color:${accent}">
        <span aria-hidden="true">💬</span>${escapeHtml(config.launcherLabel)}
      </button>
      <div id="panel" role="dialog" aria-label="${escapeHtml(config.botName)}">
        <div class="header">
          <div class="header-left">
            ${icon}
            <span class="bot-name">${escapeHtml(config.botName)}</span>
          </div>
          <button id="close" type="button" aria-label="チャットを閉じる">✕</button>
        </div>
        <div id="messages"></div>
        <div id="suggestions"></div>
        <form id="form">
          <label for="input" class="sr-only">質問を入力</label>
          <textarea id="input" rows="1" maxlength="500" placeholder="ご質問を入力してください"></textarea>
          <button id="send" type="submit">送信</button>
        </form>
        <p class="disclaimer">${escapeHtml(config.disclaimer)}</p>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function buildStyles(accent: string): string {
  return `
    <style>
      * { box-sizing: border-box; }
      #root {
        position: fixed;
        bottom: 20px;
        z-index: 2147483000;
        font-family: "Zen Kaku Gothic New", "Hiragino Sans", sans-serif;
      }
      #root.pos-right { right: 20px; }
      #root.pos-left { left: 20px; }
      #launcher {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 56px;
        padding: 0 20px;
        border: none;
        border-radius: 999px;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      }
      #launcher.hidden { display: none; }
      #panel {
        display: none;
        flex-direction: column;
        position: fixed;
        inset: 0;
        background: #fff;
      }
      #panel.open { display: flex; }
      @media (min-width: 640px) {
        #panel {
          position: static;
          width: 380px;
          height: 600px;
          margin-bottom: 12px;
          border-radius: 14px;
          border: 1px solid #e3e0d6;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          overflow: hidden;
        }
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e3e0d6;
      }
      .header-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .avatar, .avatar-img {
        width: 36px; height: 36px; border-radius: 999px;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 700; font-size: 13px; flex-shrink: 0;
        object-fit: cover;
      }
      .bot-name { font-weight: 700; font-size: 14px; color: #1c1c1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #close {
        width: 40px; height: 40px; border: none; background: transparent;
        border-radius: 999px; cursor: pointer; color: #5c5b56; font-size: 16px;
      }
      #close:hover { background: #f6f5f1; }
      #messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .row { display: flex; }
      .row.user { justify-content: flex-end; }
      .row.assistant { justify-content: flex-start; }
      .bubble {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      .bubble.user { color: #fff; }
      .bubble.assistant { background: #eef1f9; color: #1c1c1a; border: 1px solid #e3e0d6; }
      .bubble.typing { color: #5c5b56; }
      #suggestions { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px; }
      .chip {
        height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid;
        font-size: 12px; font-weight: 500; cursor: pointer; background: none;
      }
      #form { display: flex; align-items: flex-end; gap: 8px; padding: 12px; border-top: 1px solid #e3e0d6; }
      #input {
        flex: 1; min-height: 44px; max-height: 112px; resize: none;
        border: 1px solid #e3e0d6; border-radius: 10px; padding: 10px 12px;
        font-size: 14px; font-family: inherit;
      }
      #send {
        height: 44px; padding: 0 16px; border: none; border-radius: 10px;
        background-color: ${accent}; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer;
      }
      #send:disabled { opacity: 0.4; cursor: not-allowed; }
      .disclaimer { padding: 0 16px 12px; font-size: 11px; color: #5c5b56; line-height: 1.5; }
      .contact { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); }
      .contact-btn {
        display: flex; align-items: center; justify-content: center;
        height: 44px; border-radius: 10px; font-size: 13px; font-weight: 500;
        text-decoration: none;
      }
      .contact-btn.solid { color: #fff; }
      .contact-btn.outline { border: 1px solid; background: #fff; }
      .sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
      }
    </style>
  `;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init());
} else {
  void init();
}
