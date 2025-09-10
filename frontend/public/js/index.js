const messageLog = document.getElementById("message-log");
const sendMessageButton = document.getElementById("send-message");

// FIXME: temporary
const origin = window.location.origin.substring(
  0,
  window.location.origin.indexOf(":39393")
);

async function handleSendingMessage() {
  const message = document.getElementById("message").value;
  if (!validateMessage(message)) {
    console.warn("No message supplied. Not sending request.");
    return;
  }
  addMessage(message, "self");
  sendMessage();
}

function addMessage(message, type) {
  const html = createMessageHTML(message, type);
  messageLog.appendChild(html);
}

async function sendMessage() {
  const result = await fetch(origin + ":39399/api/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(createMessageObject())
  });
  const response = await result.json();
  addMessage(response.reply, "response");
}

function createMessageHTML(message, type) {
  const entry = document.createElement("div");
  entry.classList.add("entry");
  const avatar = createAvatar(type);
  const article = createMessageSemanticHTML(message, type);
  const time = createTimestamp();
  entry.appendChild(avatar);
  entry.appendChild(article);
  entry.appendChild(time);
  return entry;
}

function createAvatar(type) {
  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.classList.add(`avatar--${type}`);
  return avatar;
}

// TODO: Rename this function
function createMessageSemanticHTML(message, type) {
  const article = document.createElement("article");
  const messageContent = document.createElement("span");
  messageContent.innerText = message;
  article.appendChild(messageContent);
  article.classList.add("message");
  switch (type) {
    case "self": {
      article.classList.add("message--self");
      break;
    }
    case "response": {
      article.classList.add("message--response");
      break;
    }
  }
  return article;
}

function createMessageObject() {
  const object = {};
  const textarea = document.getElementById("message");
  object.message = textarea.value;
  return object;
}

function createTimestamp() {
  const timestamp = new Date();
  const time = document.createElement("span");
  time.classList.add("timestamp");
  time.innerText = formatToTimeOfDay(timestamp);
  return time;
}

function formatToTimeOfDay(timestamp) {
  const hh = timestamp.getHours().toString().padStart(2, "0");
  const mm = timestamp.getMinutes().toString().padStart(2, "0");
  const ss = timestamp.getSeconds().toString().padStart(2, "0");
  const time = `${hh}:${mm}:${ss}`;
  return time;
}

function validateMessage(message) {
  const formatted = message.trim();
  return formatted.length > 0;
}

sendMessageButton.addEventListener("click", handleSendingMessage);
