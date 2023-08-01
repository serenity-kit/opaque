declare namespace ServerSimple {
  interface SessionData {
    userIdentifier: string;
    sessionKey: string;
  }

  interface Datastore {
    setUser(name: string, value: string): Promise<void>;
    getUser(name: string): Promise<string | null>;
    hasUser(name: string): Promise<boolean>;
    getLogin(name: string): Promise<string | null>;
    setLogin(name: string, value: string): Promise<void>;
    hasLogin(name: string): Promise<boolean>;
    removeLogin(name: string): Promise<void>;
    getSession(id: string): Promise<SessionData | null>;
    setSession(id: string, session: SessionData, lifetimeInDays?: number);
    clearSession(id: string): Promise<void>;
  }
}
