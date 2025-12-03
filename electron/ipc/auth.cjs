const { ipcMain } = require("electron");

let currentUser = null;

function registerAuthIpc(db) {
  ipcMain.handle("auth:login", (_event, { username, password }) => {
    const row = db
      .prepare("SELECT username, role FROM users WHERE username = ? AND password = ?")
      .get(username, password);

    if (!row) {
      currentUser = null;
      return { success: false, message: "Invalid credentials" };
    }

    currentUser = row;
    return { success: true };
  });

  ipcMain.handle("auth:getCurrentUser", () => ({ user: currentUser }));

  ipcMain.handle("auth:logout", () => {
    currentUser = null;
    return { success: true };
  });

  ipcMain.handle("auth:register", (_event, { username, password, role }) => {
    const existing = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);

    if (existing) {
      return { success: false, message: "Username already exists" };
    }

    const insert = db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    );

    insert.run(username, password, role || "cashier");

    return { success: true };
  });
}

module.exports = { registerAuthIpc };
