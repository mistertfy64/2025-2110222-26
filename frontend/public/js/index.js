const API_BASE =
  window.location.protocol + "//" + window.location.hostname + ":22222";

const SESSIONS_KEY = "two_current_session";
const SIDEBAR_STATE_KEY = "two_sidebar_collapsed";
const MAXIMUM_LENGTH = 1024;

// DOM refs
const sessionsListEl = document.getElementById("sessions-list");
const newChatBtn = document.getElementById("new-chat");
const messageLog = document.getElementById("message-log");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send-message");

let currentSessionId = localStorage.getItem(SESSIONS_KEY) || null;
let sessionsCache = []; // local cache of sessions list
let typingIndicatorEl = null; // active typing indicator entry

// Initialization
async function init() {
  bindUI();
  await loadSessions();
  // if we have a saved session, try to select it; otherwise pick the latest or create new
  if (currentSessionId) {
    // if saved session not present in fetched list, still try to load it
    await selectSession(currentSessionId);
  } else if (sessionsCache.length > 0) {
    await selectSession(sessionsCache[0].sessionId);
  } else {
    await createNewSession();
  }
  document.getElementById(
    "character"
  ).src = `./assets/images/emotions/two-neutral.webp`;
}

function bindUI() {
  // Sidebar collapse/expand toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggle-sidebar");
  const characterWrapper = document.getElementById("character-wrapper");
  const collapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
  if (collapsed) {
    sidebar.classList.add("collapsed");
    characterWrapper?.classList.add("zoomed");
    if (toggleBtn) toggleBtn.textContent = "⟩⟩";
    toggleBtn?.setAttribute("title", "Expand sidebar");
    toggleBtn?.setAttribute("aria-label", "Expand sidebar");
  }
  toggleBtn?.addEventListener("click", () => {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed ? "1" : "0");
    if (isCollapsed) {
      characterWrapper?.classList.add("zoomed");
    } else {
      characterWrapper?.classList.remove("zoomed");
    }
    if (toggleBtn) toggleBtn.textContent = isCollapsed ? "⟩⟩" : "⟨⟨";
    toggleBtn?.setAttribute(
      "title",
      isCollapsed ? "Expand sidebar" : "Collapse sidebar"
    );
    toggleBtn?.setAttribute(
      "aria-label",
      isCollapsed ? "Expand sidebar" : "Collapse sidebar"
    );
  });

  // Mobile overlay open/close
  const mobileToggle = document.getElementById("mobile-sidebar-toggle");
  const scrim = document.getElementById("sidebar-scrim");
  const openOverlay = () => {
    document.body.classList.add("sidebar-overlay-open");
    if (mobileToggle) {
      mobileToggle.setAttribute("aria-expanded", "true");
      mobileToggle.setAttribute("aria-label", "Close sidebar");
      mobileToggle.textContent = "×";
    }
  };
  const closeOverlay = () => {
    document.body.classList.remove("sidebar-overlay-open");
    if (mobileToggle) {
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.setAttribute("aria-label", "Open sidebar");
      mobileToggle.textContent = "☰";
    }
  };
  mobileToggle?.addEventListener("click", () => {
    if (document.body.classList.contains("sidebar-overlay-open")) {
      closeOverlay();
    } else {
      openOverlay();
    }
  });
  scrim?.addEventListener("click", closeOverlay);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 992) {
      closeOverlay();
    }
  });

  newChatBtn.addEventListener("click", async () => {
    await createNewSession();
  });

  sendBtn.addEventListener("click", handleSendClicked);

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClicked();
    }
  });
}

// Session list
async function loadSessions() {
  try {
    const res = await fetch(`${API_BASE}/api/sessions`);
    if (!res.ok) throw new Error("Failed to load sessions");
    const list = await res.json();
    // Expect array of session objects
    sessionsCache = Array.isArray(list) ? list : [];
    renderSessionsList();
  } catch (err) {
    console.warn("Could not fetch sessions:", err);
    // fallback: empty list
    sessionsCache = [];
    renderSessionsList();
  }
}

function renderSessionsList() {
  sessionsListEl.innerHTML = "";
  if (!sessionsCache.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.innerText = "No sessions yet — click New Chat";
    sessionsListEl.appendChild(li);
    return;
  }

  sessionsCache.forEach((s) => {
    const li = document.createElement("li");
    li.className = "session-item";
    if (s.sessionId === currentSessionId) li.classList.add("active");
    li.dataset.sessionId = s.sessionId;

    const title = document.createElement("div");
    title.className = "session-title";
    // show name
    title.innerText = s.name || `Unnamed Chat`;

    const mark = document.createElement("div");
    mark.classList.add("circle");
    mark.style.marginLeft = "4px";
    mark.style.backgroundColor = s.color || "#1a1a1a";
    title.appendChild(mark);

    const meta = document.createElement("div");
    meta.className = "session-meta";
    meta.innerText = s.updatedAt
      ? formatToLocalDateTime(new Date(s.updatedAt))
      : s.createdAt
      ? formatToLocalDateTime(new Date(s.createdAt))
      : "";

    const modify = document.createElement("div");
    modify.className = "session-modify-text";
    modify.innerText = "Modify";
    modify.addEventListener("click", (event) => {
      event.stopPropagation();
      openSessionModificationMenu(s.sessionId);
    });
    meta.appendChild(modify);

    li.appendChild(title);
    li.appendChild(meta);

    li.addEventListener("click", async () => {
      await selectSession(s.sessionId);
    });

    sessionsListEl.appendChild(li);
  });
}

// Select / create session
async function selectSession(sessionId) {
  currentSessionId = sessionId;
  localStorage.setItem(SESSIONS_KEY, sessionId);
  // Close mobile overlay after selecting a session
  if (window.innerWidth <= 992) {
    document.body.classList.remove("sidebar-overlay-open");
    document.getElementById("mobile-sidebar-toggle")?.setAttribute(
      "aria-expanded",
      "false"
    );
  }
  // update UI active class
  Array.from(document.querySelectorAll(".session-item")).forEach((el) => {
    el.classList.toggle("active", el.dataset.sessionId === sessionId);
  });

  // fetch history
  await fetchAndRenderHistory(sessionId);

  // also reset character pose
  document.getElementById(
    "character"
  ).src = `./assets/images/emotions/two-neutral.webp`;
}

async function createNewSession() {
  try {
    const res = await fetch(`${API_BASE}/api/sessions`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to create session");
    const data = await res.json();
    const sid = data.sessionId;
    // add to local cache (top)
    sessionsCache = [
      {
        sessionId: sid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        meta: {}
      },
      ...sessionsCache
    ];
    renderSessionsList();
    await selectSession(sid);
    messageInput.value = "";
    messageInput.focus();
  } catch (err) {
    console.error("createNewSession error:", err);
    alert("Unable to create new session. See console.");
  }
}

// Fetch & render history
async function fetchAndRenderHistory(sessionId) {
  // messageLog.innerHTML = ""; // clear while loading
  // showEmptyState("Loading conversation…");

  try {
    const res = await fetch(
      `${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/messages`
    );
    if (!res.ok) throw new Error("Failed to fetch messages");
    const payload = await res.json();
    const messages = payload.messages || [];
    renderMessages(messages);
  } catch (err) {
    console.error("fetchAndRenderHistory error:", err);
    showEmptyState("Unable to load messages");
  }
}

function renderMessages(messages = []) {
  messageLog.innerHTML = "";

  if (!messages.length) {
    showEmptyState("This chat is empty. Say hello!");
    return;
  }

  messages.forEach((m) => {
    appendMessageToLog(m);
  });

  scrollToBottom();
}

// Sending Messages
async function addUserMessage(currentSessionId, message) {
  try {
    // Disable input while sending
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // ✅ Optimistically append user message immediately
    if (message) {
      const data = {
        content: message,
        role: "user"
      };
      appendMessageToLog(data);
      scrollToBottom();
    }

    // Send request to backend
    const res = await fetch(`${API_BASE}/api/addusermessages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: currentSessionId, message })
    });

    if (!res.ok) {
      throw new Error("Failed to save user message");
    }

    const data = await res.json();

    // 🔄 Re-fetch from server to keep UI consistent
    // await loadSessions();
    // await fetchAndRenderHistory(currentSessionId);

    // Put cursor back into input box
    messageInput.focus();
    messageInput.value = "";
  } catch (err) {
    console.error("Error sending message:", err);
    alert("Failed to send message. See console.");
  } finally {
    // Re-enable input + button
    messageInput.disabled = false;
    sendBtn.disabled = false;
  }
}

async function handleSendClicked() {
  console.log("Handle click is running");
  const raw = messageInput.value || "";
  const message = raw.trim();
  if (!message) return;
  if (message.length > MAXIMUM_LENGTH) {
    alert("Message too long");
    return;
  }
  // ensure we have a session
  if (!currentSessionId) {
    await createNewSession();
  }

  // indicate generating state on character immediately
  const characterEl = document.getElementById("character");
  characterEl.classList.add("generating");

  // optimistically append user's message
  // console.log("Added new message", message);
  // const messageObject = {
  //   content: message,
  //   role: "user",
  //   createdAt: new Date().toISOString()
  // };
  // appendMessageToLog(messageObject);
  addUserMessage(currentSessionId, message);
  // We can then immediately remove the empty state text, if it still exists as we
  // already know there is already a message (our first message, from us.)
  if (document.getElementsByClassName("empty-state").length > 0) {
    document.getElementsByClassName("empty-state")[0].remove();
  }

  // await loadSessions(); // update list (maybe new updatedAt)
  // await fetchAndRenderHistory(currentSessionId);
  // show typing indicator after rendering current history
  // showTypingIndicator();
  console.log("Re Render the chat");
  messageInput.value = "";
  scrollToBottom();
  messageInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: currentSessionId, message })
    });

    if (!res.ok) {
      throw new Error("LLM request failed");
    }

    const data = await res.json();
    const replyText = data?.reply?.message ?? "";
    // remove typing indicator before rendering the final reply
    hideTypingIndicator();
    const emotion = getEmotionClassification(data.reply.emotion);
    // swap src
    characterEl.src = `./assets/images/emotions/two-${emotion}.webp`;
    // animate appearance
    characterEl.classList.remove("pop-in");
    // force reflow to restart animation if same class used consecutively
    void characterEl.offsetWidth;
    characterEl.classList.add("pop-in");

    // Show simulated streaming of the assistant message.
    const options = {
      sent: data?.reply?.timings?.sent,
      forcedThinkingDuration: data?.reply?.timings?.thinkingDuration
    };
    await typewriterAssistantMessage(replyText, options);

    // We don't really need to re-"sync" anything here
    // but we can remove the empty state as a hacky workaround,
    // because we already know the chat isn't empty anymore.
    // -mistertfy64

    // await loadSessions(); // update list (maybe new updatedAt)
    // await fetchAndRenderHistory(currentSessionId);

    // place cursor back on input
    messageInput.focus();
  } catch (err) {
    console.error("Error sending message:", err);
    alert("Failed to send message. See console.");
  } finally {
    // ensure typing indicator is gone in any case
    hideTypingIndicator();
    // stop generating animation regardless of success
    characterEl.classList.remove("generating");
    messageInput.disabled = false;
    sendBtn.disabled = false;
  }
}

// UI helpers
function appendMessageToLog(messageObject) {
  const entry = createMessageHTML(messageObject);
  messageLog.appendChild(entry);
}

function createMessageHTML(messageObject) {
  const text = messageObject.content;
  const type = roleToType(messageObject.role);

  const entry = document.createElement("div");
  entry.classList.add("entry");
  if (type === "self") entry.classList.add("entry--self");

  const avatar = createAvatar(type);
  const article = createMessageBubble(text, type);
  const time = createTimestamp(messageObject);

  entry.appendChild(avatar);
  entry.appendChild(article);
  entry.appendChild(time);

  return entry;
}

function createAvatar(type) {
  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.classList.add(type === "self" ? "avatar--self" : "avatar--response");
  return avatar;
}

function createMessageBubble(msg, type) {
  const article = document.createElement("article");
  article.classList.add("message");
  article.classList.add(
    type === "self" ? "message--self" : "message--response"
  );
  article.innerText = msg;
  return article;
}

function createTimestamp(messageObject) {
  const dateFallback = new Date();

  if (roleToType(messageObject.role) === "self") {
    return createSimpleTimestamp(messageObject);
  }

  const timestampObject = document.createElement("div");
  timestampObject.classList.add("timestamp--complicated");
  const briefTimestamp = createBriefTimestamp(messageObject, dateFallback);
  const detailedTimestamp = createDetailedTimestamp(
    messageObject,
    dateFallback
  );
  timestampObject.appendChild(briefTimestamp);
  timestampObject.appendChild(detailedTimestamp);
  return timestampObject;
}

function createSimpleTimestamp(messageObject, dateFallback = new Date()) {
  const date = messageObject.createdAt ?? dateFallback;
  const timestampObject = document.createElement("div");
  timestampObject.classList.add("timestamp--simple");
  timestampObject.innerText = formatToTimeOfDay(date);
  return timestampObject;
}

function createBriefTimestamp(messageObject, dateFallback = new Date()) {
  const createdAt = messageObject.createdAt;
  const briefTimestamp = document.createElement("span");
  briefTimestamp.classList.add("timestamp__brief");
  if (createdAt) {
    const d = new Date(createdAt);
    briefTimestamp.innerText = formatToTimeOfDay(d);
  } else {
    briefTimestamp.innerText = formatToTimeOfDay(dateFallback);
  }
  return briefTimestamp;
}

function createDetailedTimestamp(messageObject, dateFallback = new Date()) {
  const createdAt = messageObject.createdAt;
  const detailedTimestamp = document.createElement("span");
  const thinkingDuration = messageObject?.timings?.thinkingDuration;
  detailedTimestamp.classList.add("timestamp__detailed");
  if (createdAt) {
    detailedTimestamp.innerText += formatToLocalDateTime(createdAt);
  } else {
    detailedTimestamp.innerText += formatToLocalDateTime(dateFallback);
  }
  detailedTimestamp.innerText += " (thought for ";
  if (thinkingDuration) {
    detailedTimestamp.innerText += formatToDuration(thinkingDuration);
  } else {
    detailedTimestamp.innerText += "some time";
  }
  detailedTimestamp.innerText += ")";
  return detailedTimestamp;
}

function showEmptyState(text) {
  messageLog.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function formatToTimeOfDay(date) {
  if (typeof date === "string") date = new Date(date);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function formatToLocalDateTime(d) {
  if (!d) return "";
  if (typeof d === "string") d = new Date(d);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function formatToDuration(time) {
  if (typeof time !== "number") {
    // this particular string for consistency :)
    return "some time";
  }
  if (time < 1000) {
    return `${Math.floor(time)}ms`;
  }
  return `${Math.floor(time / 1000)}s`;
}

function roleToType(role) {
  if (!role) return "response";
  if (role === "user") return "self";
  if (role === "assistant") return "response";
  return "response";
}

function shortId(id) {
  if (!id) return "";
  return id.slice(0, 8);
}

function scrollToBottom() {
  setTimeout(() => {
    messageLog.scrollTop = messageLog.scrollHeight + 200;
  }, 50);
}

// Lightweight typing indicator with three animated dots
// This function isn't even used it seems...
function showTypingIndicator() {
  if (typingIndicatorEl) return; // already shown

  const entry = document.createElement("div");
  entry.classList.add("entry");

  const avatar = createAvatar("response");

  const bubble = document.createElement("article");
  bubble.classList.add("message", "message--response");
  const dots = document.createElement("span");
  dots.classList.add("typing");
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("span");
    d.classList.add("typing__dot");
    dots.appendChild(d);
  }
  bubble.appendChild(dots);

  const time = document.createElement("div");
  time.classList.add("timestamp--simple");
  time.innerText = "";

  entry.appendChild(avatar);
  entry.appendChild(bubble);
  entry.appendChild(time);

  typingIndicatorEl = entry;
  messageLog.appendChild(entry);
  scrollToBottom();
}

function hideTypingIndicator() {
  if (typingIndicatorEl && typingIndicatorEl.parentNode) {
    typingIndicatorEl.parentNode.removeChild(typingIndicatorEl);
  }
  typingIndicatorEl = null;
}

// Simulated streaming: typewriter effect for assistant reply
function typewriterAssistantMessage(text, opts = {}) {
  const speed = Math.max(8, Math.min(24, opts.speed || 16)); // ms per tick
  const chunk = Math.max(1, Math.min(6, opts.chunk || 2));

  return new Promise((resolve) => {
    const entry = document.createElement("div");
    entry.classList.add("entry");

    const avatar = createAvatar("response");

    const bubble = document.createElement("article");
    bubble.classList.add("message", "message--response");
    const span = document.createElement("span");
    bubble.appendChild(span);

    const time = createTimestamp({
      createdAt: new Date(),
      role: "assistant",
      timings: {
        sent: opts.sent,
        thinkingDuration: opts.forcedThinkingDuration
      }
    });

    entry.appendChild(avatar);
    entry.appendChild(bubble);
    entry.appendChild(time);

    messageLog.appendChild(entry);
    scrollToBottom();

    let i = 0;
    const content = String(text || "");
    const len = content.length;
    if (len === 0) {
      resolve();
      return;
    }
    const timer = setInterval(() => {
      i = Math.min(len, i + chunk);
      span.textContent = content.slice(0, i);
      scrollToBottom();
      if (i >= len) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

function escapeHtml(s) {
  return (s || "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

init();
