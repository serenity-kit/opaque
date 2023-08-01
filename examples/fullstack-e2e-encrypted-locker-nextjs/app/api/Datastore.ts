export type SessionEntry = { userIdentifier: string; sessionKey: string };

export type LockerEntry = {
  ciphertext: string;
  nonce: string;
};

export interface Datastore {
  setUser(name: string, value: string): Promise<void>;
  getUser(name: string): Promise<string | null>;
  hasUser(name: string): Promise<boolean>;
  getLogin(name: string): Promise<string | null>;
  setLogin(name: string, value: string): Promise<void>;
  hasLogin(name: string): Promise<boolean>;
  removeLogin(name: string): Promise<void>;
  setSession(id: string, entry: SessionEntry): Promise<void>;
  getSession(id: string): Promise<SessionEntry | null>;
  removeSession(id: string): Promise<void>;
  setLocker(name: string, entry: LockerEntry): Promise<void>;
  getLocker(name: string): Promise<LockerEntry | null>;
}
