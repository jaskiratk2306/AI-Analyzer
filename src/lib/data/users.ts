import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

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

type AuthStore = {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
};

const STORE_FILE = process.env.NODE_ENV === "production"
  ? "/tmp/ai-analyzer-auth.json"
  : path.join(process.cwd(), ".tmp", "ai-analyzer-auth.json");

function ensureStoreFile() {
  const dir = path.dirname(STORE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(STORE_FILE)) {
    writeFileSync(STORE_FILE, JSON.stringify({ users: {}, sessions: {} }, null, 2));
  }
}

function loadStore(): AuthStore {
  ensureStoreFile();
  try {
    return JSON.parse(readFileSync(STORE_FILE, "utf8")) as AuthStore;
  } catch {
    return { users: {}, sessions: {} };
  }
}

function saveStore(store: AuthStore) {
  ensureStoreFile();
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

export function createUser(email: string, password: string, name: string) {
  const store = loadStore();
  const normalizedEmail = email.toLowerCase();
  if (store.users[normalizedEmail]) return null;

  const record: UserRecord = {
    email: normalizedEmail,
    password,
    name,
    isSubscriber: false,
    searchCount: 0,
  };

  store.users[normalizedEmail] = record;
  saveStore(store);
  return record;
}

export function getUserByEmail(email: string) {
  const store = loadStore();
  return store.users[email.toLowerCase()] ?? null;
}

export function verifyUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) return null;
  return user;
}

export function incrementSearchCount(email: string) {
  const store = loadStore();
  const user = store.users[email.toLowerCase()];
  if (!user) return null;
  user.searchCount += 1;
  saveStore(store);
  return user;
}

export function resetSearchCount(email: string) {
  const store = loadStore();
  const user = store.users[email.toLowerCase()];
  if (!user) return null;
  user.searchCount = 0;
  saveStore(store);
  return user;
}

export function subscribeUser(email: string) {
  const store = loadStore();
  const user = store.users[email.toLowerCase()];
  if (!user) return null;
  user.isSubscriber = true;
  saveStore(store);
  return user;
}

export function createSession(email: string) {
  const store = loadStore();
  const token = randomUUID();
  store.sessions[token] = {
    email: email.toLowerCase(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  saveStore(store);
  return token;
}

export function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const store = loadStore();
  const session = store.sessions[token];
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    delete store.sessions[token];
    saveStore(store);
    return null;
  }
  return store.users[session.email] ?? null;
}

export function deleteSession(token: string | undefined) {
  if (!token) return;
  const store = loadStore();
  delete store.sessions[token];
  saveStore(store);
}
