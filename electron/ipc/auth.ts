import type Database from "better-sqlite3";
import { ipcMain } from "electron";

let currentUser: { id: number; username: string; role: "owner" | "cashier" } | null = null;

export function registerAuthIpc(db: Database.Database) {
  ipcMain.handle("auth:login", (_event, { username, password }) => {
    const row = db
      .prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?")
      .get(username, password) as { id: number; username: string; role: "owner" | "cashier" } | undefined;

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
      .get(username) as { id: number } | undefined;

    if (existing) {
      return { success: false, message: "Username already exists" };
    }

    const insert = db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    );

    insert.run(username, password, role ?? "cashier");

    return { success: true };
  });

  ipcMain.handle("auth:hasOwner", () => {
    const owner = db
      .prepare("SELECT id FROM users WHERE role = 'owner' LIMIT 1")
      .get() as { id: number } | undefined;

    return { hasOwner: !!owner };
  });

  ipcMain.handle("auth:initializeOwner", (_event, { username, password }) => {
    const owner = db
      .prepare("SELECT id FROM users WHERE role = 'owner' LIMIT 1")
      .get() as { id: number } | undefined;

    if (owner) {
      return { success: false, message: "Owner already exists" };
    }

    const existingUsername = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username) as { id: number } | undefined;

    if (existingUsername) {
      return { success: false, message: "Username already in use" };
    }

    const insert = db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'owner')"
    );

    insert.run(username, password);

    return { success: true };
  });
}
