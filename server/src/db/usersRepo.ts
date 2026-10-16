import bcrypt from 'bcryptjs';
import { getDb } from './index.js';
import { permissionsForRole, type Role } from '../auth/permissions.js';
import type { Page } from './types.js';

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

export interface UserWithSecret extends User {
  passwordHash: string;
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  role: Role;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  'id, email, password_hash, display_name, role, is_active, created_at, updated_at';

const PASSWORD_ROUNDS = 12;

function toUser(row: UserRow, includeSecret = false): User | UserWithSecret {
  const base: User = {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    permissions: permissionsForRole(row.role),
  };

  return includeSecret ? { ...base, passwordHash: row.password_hash } : base;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_ROUNDS);
}

/** Comparacion en tiempo constante contra el hash almacenado. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);

  const info = getDb()
    .prepare(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES (?, ?, ?, ?)`,
    )
    .run(input.email.trim().toLowerCase(), passwordHash, input.displayName.trim(), input.role);

  const created = findUserById(Number(info.lastInsertRowid));
  if (!created) throw new Error('No se pudo crear el usuario');
  return created;
}

export function findUserById(id: number): User | null {
  const row = getDb().prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id) as
    | UserRow
    | undefined;
  return row ? (toUser(row) as User) : null;
}

export function findUserByEmail(email: string): UserWithSecret | null {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM users WHERE email = ? COLLATE NOCASE`)
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? (toUser(row, true) as UserWithSecret) : null;
}

export function countUsersByRole(role: Role): number {
  const row = getDb().prepare('SELECT COUNT(*) AS total FROM users WHERE role = ?').get(role) as {
    total: number;
  };
  return row.total;
}

export function emailExists(email: string): boolean {
  const row = getDb().prepare('SELECT 1 AS found FROM users WHERE email = ? COLLATE NOCASE').get(
    email.trim().toLowerCase(),
  ) as { found: number } | undefined;
  return Boolean(row);
}

export interface ListUsersOptions {
  search?: string;
  role?: Role;
  page: number;
  limit: number;
}

export function listUsers(options: ListUsersOptions): Page<User> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (options.search) {
    clauses.push('(email LIKE ? OR display_name LIKE ?)');
    const pattern = `%${options.search.toLowerCase()}%`;
    params.push(pattern, pattern);
  }

  if (options.role) {
    clauses.push('role = ?');
    params.push(options.role);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const { total } = getDb()
    .prepare(`SELECT COUNT(*) AS total FROM users ${where}`)
    .get(...params) as { total: number };

  const offset = (options.page - 1) * options.limit;
  const rows = getDb()
    .prepare(`SELECT ${COLUMNS} FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, options.limit, offset) as UserRow[];

  const totalPages = Math.ceil(total / options.limit);

  return {
    items: rows.map((row) => toUser(row) as User),
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasMore: offset + rows.length < total,
  };
}

export interface UpdateUserInput {
  displayName?: string;
  role?: Role;
  isActive?: boolean;
}

export function updateUser(id: number, input: UpdateUserInput): User | null {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.displayName !== undefined) {
    fields.push('display_name = ?');
    params.push(input.displayName.trim());
  }
  if (input.role !== undefined) {
    fields.push('role = ?');
    params.push(input.role);
  }
  if (input.isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(input.isActive ? 1 : 0);
  }

  if (fields.length === 0) return findUserById(id);

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const info = getDb()
    .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
    .run(...params);

  return info.changes > 0 ? findUserById(id) : null;
}

export function deleteUser(id: number): boolean {
  return getDb().prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
}

export async function updatePassword(id: number, plainPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(plainPassword);
  const info = getDb()
    .prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(passwordHash, id);
  return info.changes > 0;
}

export function usersByRole(): Array<{ role: Role; total: number }> {
  return getDb()
    .prepare('SELECT role, COUNT(*) AS total FROM users GROUP BY role')
    .all() as Array<{ role: Role; total: number }>;
}