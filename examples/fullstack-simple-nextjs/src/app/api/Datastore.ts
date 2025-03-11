export interface Datastore {
  setUser(name: string, value: string): Promise<void>;
  getUser(name: string): Promise<string | null>;
  hasUser(name: string): Promise<boolean>;
  getLogin(name: string): Promise<string | null>;
  setLogin(name: string, value: string): Promise<void>;
  hasLogin(name: string): Promise<boolean>;
  removeLogin(name: string): Promise<void>;
}
