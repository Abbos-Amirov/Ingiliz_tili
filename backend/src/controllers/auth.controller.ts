import { RequestHandler } from "express";
import { User } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { verifyGoogleIdToken } from "../services/googleAuth.service";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: String(email).toLowerCase(),
      passwordHash,
      displayName: displayName || "",
    });
    const token = signToken({ id: String(user._id), role: user.role as "user" | "admin" });
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.passwordHash || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken({ id: String(user._id), role: user.role as "user" | "admin" });
    res.json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const googleLogin: RequestHandler = async (req, res, next) => {
  try {
    const { credential } = req.body ?? {};
    if (!credential) {
      res.status(400).json({ error: "credential is required" });
      return;
    }
    const profile = await verifyGoogleIdToken(credential);

    let user = await User.findOne({ googleId: profile.googleId });
    if (!user) {
      // Link to an existing password-based account with the same email
      // instead of creating a duplicate user.
      user = await User.findOne({ email: profile.email });
      if (user) {
        user.googleId = profile.googleId;
        await user.save();
      } else {
        user = await User.create({
          email: profile.email,
          googleId: profile.googleId,
          displayName: profile.displayName,
        });
      }
    }

    const token = signToken({ id: String(user._id), role: user.role as "user" | "admin" });
    res.json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const adminLogin: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || user.role !== "admin" || !user.passwordHash || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }
    const token = signToken({ id: String(user._id), role: "admin" });
    res.json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id).select("-passwordHash");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
