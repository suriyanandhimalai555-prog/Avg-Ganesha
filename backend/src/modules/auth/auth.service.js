/**
 * Auth service - business logic for authentication.
 * Decoupled from HTTP layer (controller) and DB details.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../shared/db.js';
import { authConfig } from '../../config/index.js';
import { AUTH_ERRORS, INVITE_PREFIX, INVITE_CODE_LENGTH } from '../../config/constants.js';

function generateInviteCode() {
  return INVITE_PREFIX + Math.random().toString(36).substring(2, 2 + INVITE_CODE_LENGTH).toUpperCase();
}

/**
 * Register a new user. Returns { user, token } or throws.
 */
export async function registerUser({ email, password, fullName, phone, inviteCode }) {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedFullName = fullName?.trim();
  const normalizedPhone = phone?.trim();
  const normalizedInviteCode = inviteCode?.trim().toUpperCase();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userCheck = await client.query('SELECT 1 FROM users WHERE email = $1', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      throw new Error(AUTH_ERRORS.USER_EXISTS);
    }

    let inviterId = null;
    if (normalizedInviteCode) {
      const inviterCheck = await client.query(
        'SELECT id FROM users WHERE invite_code = $1',
        [normalizedInviteCode]
      );
      if (inviterCheck.rows.length > 0) {
        inviterId = inviterCheck.rows[0].id;
      } else {
        throw new Error(AUTH_ERRORS.INVALID_INVITE);
      }
    }

    const salt = await bcrypt.genSalt(authConfig.bcryptRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newInviteCode = generateInviteCode();

    const newUserRes = await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, invite_code, invited_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, full_name, phone_number, invite_code, invite_count, created_at`,
      [normalizedEmail, hashedPassword, normalizedFullName, normalizedPhone, newInviteCode, inviterId]
    );
    const newUser = newUserRes.rows[0];

    if (inviterId) {
      await client.query(
        'UPDATE users SET invite_count = invite_count + 1 WHERE id = $1',
        [inviterId]
      );
    }

    await client.query('COMMIT');

    const token = signToken({ id: newUser.id, role: newUser.role });
    const user = toUserDto(newUser);
    return { user, token };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Login with email/password. Returns { user, token } or throws.
 */
export async function loginUser({ email, password }) {
  if (!authConfig.jwtSecret) {
    const err = new Error(AUTH_ERRORS.SERVER_CONFIG);
    err.statusCode = 500;
    throw err;
  }

  const normalizedEmail = email?.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id, email, password_hash, role, full_name, phone_number AS phone, invite_code, invite_count, created_at
     FROM users WHERE email = $1`,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    const err = new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    err.statusCode = 400;
    throw err;
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    err.statusCode = 400;
    throw err;
  }

  const token = signToken({ id: user.id, role: user.role });
  return { user: toUserDto(user), token };
}

/**
 * Get user by ID (for /me endpoint).
 */
export async function getUserById(id) {
  const result = await pool.query(
    `SELECT id, email, role, full_name, phone_number AS phone, invite_code, invite_count, created_at FROM users WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return toUserDto(result.rows[0]);
}

function signToken(payload) {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.accessTokenExpiry,
  });
}

function toUserDto(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    phone: row.phone || row.phone_number || null,
    inviteCode: row.invite_code,
    inviteCount: row.invite_count ?? 0,
    createdAt: row.created_at,
  };
}
