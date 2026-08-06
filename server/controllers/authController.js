import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import PendingUser from '../models/PendingUser.js';
import DeletedAccount from '../models/DeletedAccount.js';
import { sendOtpEmail } from '../utils/emailService.js';

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const sendTokenCookie = async (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  const profile = await Profile.findOne({ userId: user._id });
  const onboardingCompleted = profile ? profile.onboardingCompleted : false;
  const username = profile ? profile.username : '';

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    onboardingCompleted,
    username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    status: 'success',
    token,
    user: userResponse,
  });
};

const generateUniqueUsername = async (fullName) => {
  let baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!baseUsername) baseUsername = 'user';
  let username = baseUsername;
  let counter = 1;
  let exists = await Profile.findOne({ username });
  while (exists) {
    username = `${baseUsername}${counter}`;
    exists = await Profile.findOne({ username });
    counter++;
  }
  return username;
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'All fields (Name, Email, Password, Confirm Password) are required.',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'fail', message: 'Please enter a valid email address.' });
    }

    if (password.length < 8)
      return res.status(400).json({ status: 'fail', message: 'Password must be at least 8 characters long.' });
    if (!/[A-Z]/.test(password))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one uppercase letter.' });
    if (!/[a-z]/.test(password))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one lowercase letter.' });
    if (!/[0-9]/.test(password))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one number.' });
    if (!/[^A-Za-z0-9]/.test(password))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one special character.' });

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified !== false) {
        return res.status(400).json({
          status: 'fail',
          message: 'An account with this email already exists. Please log in.',
        });
      }
      await User.deleteOne({ _id: existingUser._id });
      await Profile.deleteOne({ userId: existingUser._id });
    }

    // Check if email previously belonged to a permanently deleted account.
    const wasDeleted = await DeletedAccount.findOne({ email: normalizedEmail });

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await PendingUser.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: name.trim(),
        email: normalizedEmail,
        password,
        otp,
        otpExpiry,
      },
      { upsert: true, returnDocument: 'after' }
    );

    await sendOtpEmail(normalizedEmail, otp, 'verification');

    const successMessage = wasDeleted
      ? 'OTP sent! Notice: This email previously belonged to a permanently deleted account. Previous data cannot be restored. Verify your OTP to create a new account.'
      : 'OTP sent! Please check your email and verify your OTP to create your account.';

    res.status(200).json({
      status: 'success',
      message: successMessage,
      email: normalizedEmail,
      wasDeletedAccount: !!wasDeleted,
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during registration. Please try again.' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: 'fail', message: 'Email and OTP are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const pending = await PendingUser.findOne({ email: normalizedEmail });

    if (!pending) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing && existing.isVerified) {
        return res.status(400).json({ status: 'fail', message: 'This account is already verified. Please log in.' });
      }
      return res.status(404).json({ status: 'fail', message: 'No pending registration found for this email. Please register again.' });
    }

    if (new Date() > new Date(pending.otpExpiry)) {
      return res.status(400).json({ status: 'fail', message: 'OTP has expired. Please request a new OTP.' });
    }

    if (pending.otp !== otp.toString().trim()) {
      return res.status(400).json({ status: 'fail', message: 'Invalid OTP. Please check your email and try again.' });
    }

    const newUser = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      isVerified: true,
      accountStatus: 'active',
    });

    const username = await generateUniqueUsername(pending.name);
    await Profile.create({ userId: newUser._id, username });

    await PendingUser.deleteOne({ _id: pending._id });

    res.status(201).json({
      status: 'success',
      message: 'Email verified and account created successfully! You can now log in.',
    });
  } catch (error) {
    console.error('[AUTH] OTP verification error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during OTP verification. Please try again.' });
  }
};

/**
 * @desc    Resend OTP for pending registration
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const pending = await PendingUser.findOne({ email: normalizedEmail });

    if (!pending) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing && existing.isVerified) {
        return res.status(400).json({ status: 'fail', message: 'This account is already verified. Please log in.' });
      }
      return res.status(404).json({ status: 'fail', message: 'No pending registration found for this email. Please register again.' });
    }

    const otp = generateOtp();
    pending.otp = otp;
    pending.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await pending.save();

    await sendOtpEmail(normalizedEmail, otp, 'verification');

    res.status(200).json({
      status: 'success',
      message: 'A new OTP has been sent to your email address.',
    });
  } catch (error) {
    console.error('[AUTH] Resend OTP error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error while resending OTP. Please try again.' });
  }
};

/**
 * @desc    Login user (verified accounts only)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      // Check if registration is pending OTP verification
      const pending = await PendingUser.findOne({ email: normalizedEmail });
      if (pending) {
        return res.status(403).json({
          status: 'unverified',
          message: 'Please verify your email before logging in.',
          email: normalizedEmail,
        });
      }
      return res.status(401).json({ status: 'fail', message: 'No account found with this email address. Please check your email or sign up.' });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ status: 'fail', message: 'Your account is suspended. Please contact support.' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        status: 'unverified',
        message: 'Please verify your email before logging in.',
        email: user.email,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect password. Please check your password and try again.' });
    }

    await sendTokenCookie(user, 200, res);
  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during login. Please try again.' });
  }
};

/**
 * @desc    Logout user by clearing HttpOnly token cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res) => {
  try {
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error during logout. Please try again.' });
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const onboardingCompleted = profile ? profile.onboardingCompleted : false;
    const username = profile ? profile.username : '';

    res.status(200).json({
      status: 'success',
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        accountStatus: req.user.accountStatus,
        onboardingCompleted,
        username,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error while checking auth session.' });
  }
};

/**
 * @desc    Forgot Password — send reset OTP to email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Email address is required.' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'fail', message: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Security: always return success to prevent email enumeration
    const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry');
    if (user && user.isVerified !== false) {
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      await sendOtpEmail(normalizedEmail, otp, 'reset');
    }

    res.status(200).json({
      status: 'success',
      message: 'If this email is registered, a password reset OTP has been sent.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('[AUTH] Forgot password error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error. Please try again.' });
  }
};

/**
 * @desc    Verify password reset OTP → returns a short-lived reset token
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: 'fail', message: 'Email and OTP are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'No account found with this email address.' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ status: 'fail', message: 'No active OTP found. Please request a new password reset.' });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ status: 'fail', message: 'OTP has expired. Please request a new password reset.' });
    }

    if (user.otp !== otp.toString().trim()) {
      return res.status(400).json({ status: 'fail', message: 'Invalid OTP. Please check and try again.' });
    }

    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      status: 'success',
      message: 'OTP verified. Please set your new password.',
      resetToken,
    });
  } catch (error) {
    console.error('[AUTH] Verify reset OTP error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during OTP verification. Please try again.' });
  }
};

/**
 * @desc    Reset Password using the reset token issued after OTP verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ status: 'fail', message: 'Reset token, new password, and confirm password are all required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ status: 'fail', message: 'Password reset session has expired. Please start over.' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ status: 'fail', message: 'Invalid reset token.' });
    }

    if (newPassword.length < 8)
      return res.status(400).json({ status: 'fail', message: 'Password must be at least 8 characters long.' });
    if (!/[A-Z]/.test(newPassword))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one uppercase letter.' });
    if (!/[a-z]/.test(newPassword))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one lowercase letter.' });
    if (!/[0-9]/.test(newPassword))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one number.' });
    if (!/[^A-Za-z0-9]/.test(newPassword))
      return res.status(400).json({ status: 'fail', message: 'Password must contain at least one special character.' });

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
    }

    const user = await User.findById(decoded.id).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User account not found.' });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[AUTH] Reset password error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during password reset. Please try again.' });
  }
};
