async function openSessionModificationMenu(sessionID) {
  const data = await fetch(`${API_BASE}/api/sessions/${sessionID}`);
  const dataJSON = await data.json();
  initializeModificationDialog(dataJSON);
  const dialog = document.getElementById("modification-menu");
  dialog.showModal();
}

function initializeModificationDialog(dataJSON) {
  document.getElementById("modification-menu__session-to-change").value =
    dataJSON.sessionId;
  document.getElementById("modification-menu__new-chat-name").value =
    dataJSON?.name ?? "";
  document.getElementById("modification-menu__new-chat-color").value =
    dataJSON?.color ?? "#1a1a1a";
  // ...
  document
    .getElementById("modification-menu__confirm-button")
    .addEventListener("click", setNewChatSettings);
  document
    .getElementById("modification-menu__close-button")
    .addEventListener("click", destroyModificationDialog);
  document
    .getElementById("modification-menu__delete-text")
    .addEventListener("click", openSessionDeletionMenu);
}

// TODO: Add feedback on fetch success/fail (Do something with `result`)
async function setNewChatSettings() {
  const sessionID = document.getElementById(
    "modification-menu__session-to-change"
  ).value;
  const newName = document.getElementById(
    "modification-menu__new-chat-name"
  ).value;
  const newColor = document.getElementById(
    "modification-menu__new-chat-color"
  ).value;
  const result = await fetch(`${API_BASE}/api/sessions/${sessionID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newName: newName, newColor: newColor })
  });
  destroyModificationDialog();
  // TODO: can we find a better way to do this
  window.location.reload();
}

// This is here so no one overwrites a chat session info "on accident"
function destroyModificationDialog() {
  document.getElementById("modification-menu__session-to-change").value = "";
  document.getElementById("modification-menu__new-chat-name").value = "";
  document.getElementById("modification-menu__new-chat-color").value =
    "#1a1a1a";
  document
    .getElementById("modification-menu__confirm-button")
    .removeEventListener("click", setNewChatSettings);
  document
    .getElementById("modification-menu__close-button")
    .removeEventListener("click", destroyModificationDialog);
  const dialog = document.getElementById("modification-menu");
  dialog.close();
}

async function openSessionDeletionMenu() {
  // this comes first, so we know what we are deleting.
  const sessionIDToDelete = document.getElementById(
    "modification-menu__session-to-change"
  ).value;
  document.getElementById("deletion-menu__session-to-delete").value =
    sessionIDToDelete;
  destroyModificationDialog();
  const dialog = document.getElementById("deletion-menu");
  dialog.showModal();
  document
    .getElementById("deletion-menu__close-button")
    .addEventListener("click", destroyDeletionDialog);
  document
    .getElementById("deletion-menu__confirm-button")
    .addEventListener("click", deleteSession);
}

async function deleteSession() {
  const sessionID = document.getElementById(
    "deletion-menu__session-to-delete"
  ).value;
  const result = await fetch(`${API_BASE}/api/sessions/${sessionID}`, {
    method: "DELETE"
  });
  if (!result.ok) {
    alert("Failed to delete session.");
    return;
  }
  destroyDeletionDialog();
  // TODO: can we find a better way to do this as well
  window.location.reload();
}

// This is here so no one DELETES a chat session info "on accident"
function destroyDeletionDialog() {
  document
    .getElementById("deletion-menu__confirm-button")
    .removeEventListener("click", deleteSession);
  document
    .getElementById("deletion-menu__close-button")
    .removeEventListener("click", destroyDeletionDialog);
  document.getElementById("deletion-menu__session-to-delete").value = "";
  const dialog = document.getElementById("deletion-menu");
  dialog.close();
}
