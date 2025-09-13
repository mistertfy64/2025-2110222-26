const API_BASE = "http://localhost:39399"; //change later if needed

const SESSIONS_KEY = "hatsune_current_session";
const MAXIMUM_LENGTH = 1024;

// DOM refs
const sessionsListEl = document.getElementById("sessions-list");
const newChatBtn = document.getElementById("new-chat");
const messageLog = document.getElementById("message-log");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send-message");

let currentSessionId = localStorage.getItem(SESSIONS_KEY) || null;
let sessionsCache = []; // local cache of sessions list

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
}

function bindUI() {
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
  // update UI active class
  Array.from(document.querySelectorAll(".session-item")).forEach((el) => {
    el.classList.toggle("active", el.dataset.sessionId === sessionId);
  });

  // fetch history
  await fetchAndRenderHistory(sessionId);
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
  messageLog.innerHTML = ""; // clear while loading
  showEmptyState("Loading conversation…");

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
    console.log(m);
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

    // ✅ Optimistically append user message immediately
    // if (data.message) {
    //   appendMessageToLog(data.message);
    //   scrollToBottom();
    // }

    // 🔄 Re-fetch from server to keep UI consistent
    await loadSessions();
    await fetchAndRenderHistory(currentSessionId);

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

  // optimistically append user's message
  console.log("Added new message",message);
  appendMessageToLog(message, "self", new Date().toISOString());
  addUserMessage(currentSessionId,message);
  // await loadSessions(); // update list (maybe new updatedAt)
  await fetchAndRenderHistory(currentSessionId);
  console.log("Re Render the chat")
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
    // Prefer to re-fetch full history (keeps UI consistent with server)
    await loadSessions(); // update list (maybe new updatedAt)
    await fetchAndRenderHistory(currentSessionId);

    // place cursor back on input
    messageInput.focus();
  } catch (err) {
    console.error("Error sending message:", err);
    alert("Failed to send message. See console.");
  } finally {
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
