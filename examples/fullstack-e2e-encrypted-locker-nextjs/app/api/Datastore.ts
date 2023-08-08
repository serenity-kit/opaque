import { Locker, RecoveryLockbox } from "../utils/locker";

export type SessionEntry = { userIdentifier: string; sessionKey: string };

export type RecoveryEntry = {
  recoveryLockbox: RecoveryLockbox;
  registrationRecord: string;
};

export interface Datastore {
  setUser(name: string, value: string): Promise<void>;
  getUser(name: string): Promise<string | null>;
  hasUser(name: string): Promise<boolean>;
  getLogin(name: string): Promise<string | null>;
  setLogin(name: string, value: string): Promise<void>;
  hasLogin(name: string): Promise<boolean>;
  removeLogin(name: string): Promise<void>;
  setSession(
    id: string,
    entry: SessionEntry,
    lifetimeInDays?: number
  ): Promise<void>;
  getSession(id: string): Promise<SessionEntry | null>;
  removeSession(id: string): Promise<void>;
  setLocker(name: string, entry: Locker): Promise<void>;
  getLocker(name: string): Promise<Locker | null>;
  setRecovery(name: string, entry: RecoveryEntry): Promise<void>;
  getRecovery(name: string): Promise<RecoveryEntry | null>;
  removeRecovery(name: string): Promise<void>;
  getRecoveryLogin(name: string): Promise<string | null>;
  setRecoveryLogin(name: string, value: string): Promise<void>;
  hasRecoveryLogin(name: string): Promise<boolean>;
  removeRecoveryLogin(name: string): Promise<void>;
}
