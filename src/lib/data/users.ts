import { randomUUID } from "crypto";

type UserRecord = {
  email: string;
  password: string;
  name: string;
  isSubscriber: boolean;
  searchCount: number;
};

type SessionRecord = {
  email: string;
  expiresAt: number;
};

const users = new Map<string, UserRecord>();
const sessions = new Map<string, SessionRecord>();

export function createUser(email: string, password: string, name: string) {
  if (users.has(email.toLowerCase())) return null;

  const record: UserRecord = {
    email: email.toLowerCase(),
    password,
    name,
    isSubscriber: false,
    searchCount: 0,
  };

  users.set(record.email, record);
  return record;
}

export function getUserByEmail(email: string) {
  return users.get(email.toLowerCase()) ?? null;
}

export function verifyUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) return null;
  return user;
}

export function incrementSearchCount(email: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  user.searchCount += 1;
  return user;
}

export function resetSearchCount(email: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  user.searchCount = 0;
  return user;
}

export function subscribeUser(email: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  user.isSubscriber = true;
  return user;
}

export function createSession(email: string) {
  const token = randomUUID();
  sessions.set(token, {
    email: email.toLowerCase(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  return token;
}

export function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return getUserByEmail(session.email);
}

export function deleteSession(token: string | undefined) {
  if (!token) return;
  sessions.delete(token);
}
