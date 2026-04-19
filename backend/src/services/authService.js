import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createUser, findUserByEmail, findUserById, listUsers } from '../db/repositories/userRepository.js';

function issueAuthToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: '7d'
  });
}

function toAuthPayload(user, token) {
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
}

export async function bootstrapSuperAdminIfMissing() {
  const existing = await findUserByEmail('admin@chillzone.local');
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
  await createUser({
    email: 'admin@chillzone.local',
    passwordHash,
    role: 'super_admin',
    createdBy: 'system'
  });
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new Error('Invalid credentials');
  }

  return toAuthPayload(user, issueAuthToken(user));
}

export async function signup({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  if (!normalizedEmail) {
    throw new Error('Email is required');
  }
  if (rawPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const created = await createUser({
    email: normalizedEmail,
    passwordHash,
    role: 'moderator',
    createdBy: 'self_signup'
  });

  return toAuthPayload(created, issueAuthToken(created));
}

export async function adminCreateUser({ actorId, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const created = await createUser({ email, passwordHash, role, createdBy: actorId });

  return {
    id: created.id,
    email: created.email,
    role: created.role,
    createdBy: created.created_by,
    createdAt: created.created_at
  };
}

export async function me(userId) {
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}

export async function adminListUsers() {
  const users = await listUsers();
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdBy: u.created_by,
    createdAt: u.created_at
  }));
}
