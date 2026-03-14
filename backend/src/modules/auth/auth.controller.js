/**
 * Auth controller - thin HTTP layer, delegates to auth.service.
 */
import * as authService from './auth.service.js';
import { AUTH_ERRORS } from '../../config/constants.js';

export const register = async (req, res) => {
  const { email, password, fullName, phone, inviteCode } = req.body;
  try {
    const { user, token } = await authService.registerUser({
      email,
      password,
      fullName,
      phone,
      inviteCode,
    });
    res.status(201).json({
      message: 'Welcome to Ganesha Seva! 🐘 Om Gan Ganapataye Namaha',
      token,
      user,
    });
  } catch (err) {
    const statusCode = [AUTH_ERRORS.USER_EXISTS, AUTH_ERRORS.INVALID_INVITE].includes(err.message)
      ? 400
      : 500;
    console.error('Register failed:', err.message);
    res.status(statusCode).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await authService.loginUser({ email, password });
    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    const statusCode = err.statusCode ?? 500;
    if (statusCode === 500) {
      console.error('Login error:', err);
    }
    res.status(statusCode).json({
      error: err.statusCode ? err.message : AUTH_ERRORS.LOGIN_FAILED,
    });
  }
};

export const me = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Me endpoint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
