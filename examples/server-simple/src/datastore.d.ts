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
  getSession(id: string): Promise<SessionData>;
  setSession(id: string, session: SessionData);
  clearSession(id: string): Promise<void>;
}
