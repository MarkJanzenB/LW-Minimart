export {};

declare global {
  interface Window {
    api: {
      auth: {
        login: (username: string, password: string) => Promise<{
          id: number;
          username: string;
          role: "owner" | "cashier";
        }>;
        getCurrentUser: () => Promise<{
          id: number;
          username: string;
          role: "owner" | "cashier";
        } | null>;
        logout: () => Promise<boolean>;
      };
    };
  }
}
