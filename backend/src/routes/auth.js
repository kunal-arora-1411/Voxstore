const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');

const router = express.Router();

const authSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
});

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    const token = signToken(user);

    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.flatten() });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.flatten() });
    next(err);
  }
});

module.exports = router;
