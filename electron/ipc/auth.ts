import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { getDb } from "../db/pglite";

type Role = "owner" | "cashier";

type User = {
  id: number;
  username: string;
  role: Role;
};

let currentUser: User | null = null;

export function registerAuthIpc() {
  ipcMain.handle("auth:login", async (_event: IpcMainInvokeEvent, { username, password }: { username: string; password: string }) => {
    const db = await getDb();

    const result = await db.query<{ id: number; username: string; password_hash: string; role: Role }>(
      "SELECT id, username, password_hash, role FROM users WHERE username = $1",
      [username]
    );

    const row = result.rows[0];

    if (!row || row.password_hash !== password) {
      throw new Error("Invalid username or password");
    }

    currentUser = { id: row.id, username: row.username, role: row.role };
    return currentUser;
  });

  ipcMain.handle("auth:getCurrentUser", async () => {
    return currentUser;
  });

  ipcMain.handle("auth:logout", async () => {
    currentUser = null;
    return true;
  });
}
