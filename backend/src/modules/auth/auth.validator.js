import { body, validationResult } from 'express-validator';

// Standardized Error Handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required').trim().escape(),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .isString().withMessage('Phone number must be a string')
    .isLength({ min: 6, max: 32 }).withMessage('Phone number length is invalid'),
  body('inviteCode').optional().isString().trim(),
  validate
];

export const loginValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];