const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const OtpChallenge = require('../models/OtpChallenge');
const { sendOtpEmail } = require('../services/mailer');

const router = express.Router();

const signToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Signup (user)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, password required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, role: 'user' });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login (user)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email, password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Login (admin)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email, password required' });

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(401).json({ error: 'Invalid admin credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid admin credentials' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// Me (protected)
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// Login with OTP: start
router.post('/login/start', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email, password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const challenge = await OtpChallenge.create({
      email,
      userId: user._id,
      type: 'login',
      code: otp,
      expiresAt,
    });

    await sendOtpEmail(email, otp, 'Login');

    res.json({ challengeId: challenge._id.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to start login' });
  }
});

// Login with OTP: verify
router.post('/login/verify', async (req, res) => {
  try {
    const { challengeId, code } = req.body || {};
    if (!challengeId || !code) return res.status(400).json({ error: 'challengeId and code required' });

    const challenge = await OtpChallenge.findById(challengeId);
    if (!challenge || challenge.type !== 'login') return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.consumed) return res.status(400).json({ error: 'Challenge already used' });
    if (challenge.expiresAt < new Date()) return res.status(400).json({ error: 'Code expired' });
    if (challenge.code !== code) return res.status(401).json({ error: 'Invalid code' });

    challenge.consumed = true;
    await challenge.save();

    const user = await User.findById(challenge.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to verify login' });
  }
});

// Forgot password: start (send OTP)
router.post('/password/reset/start', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const challenge = await OtpChallenge.create({
      email,
      userId: user._id,
      type: 'reset',
      code: otp,
      expiresAt,
    });

    await sendOtpEmail(email, otp, 'Password Reset');

    res.json({ challengeId: challenge._id.toString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to start password reset' });
  }
});

// Forgot password: verify (set new password)
router.post('/password/reset/verify', async (req, res) => {
  try {
    const { challengeId, code, newPassword } = req.body || {};
    if (!challengeId || !code || !newPassword) {
      return res.status(400).json({ error: 'challengeId, code, newPassword required' });
    }

    const challenge = await OtpChallenge.findById(challengeId);
    if (!challenge || challenge.type !== 'reset') return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.consumed) return res.status(400).json({ error: 'Challenge already used' });
    if (challenge.expiresAt < new Date()) return res.status(400).json({ error: 'Code expired' });
    if (challenge.code !== code) return res.status(401).json({ error: 'Invalid code' });

    const user = await User.findById(challenge.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = newPassword;
    await user.save();

    challenge.consumed = true;
    await challenge.save();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;