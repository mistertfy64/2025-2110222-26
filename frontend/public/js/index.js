const messageLog = document.getElementById("message-log");
const sendMessageButton = document.getElementById("send-message");

// FIXME: temporary
const origin = window.location.origin.substring(
  0,
  window.location.origin.indexOf(":39393")
);

async function handleSendingMessage() {
  const message = document.getElementById("message").value;
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
  addMessage(response.message, "response");
}

function createMessageHTML(message, type) {
  const entry = document.createElement("div");
  entry.classList.add("entry");
  const avatar = createAvatar(type);
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
  entry.appendChild(avatar);
  entry.appendChild(article);
  return entry;
}

function createAvatar(type) {
  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.classList.add(`avatar--${type}`);
  return avatar;
}

function createMessageObject() {
  const object = {};
  const textarea = document.getElementById("message");
  object.message = textarea.value;
  return object;
}

sendMessageButton.addEventListener("click", handleSendingMessage);
