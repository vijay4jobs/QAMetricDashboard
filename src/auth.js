import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getDb } from './db.js';
import crypto from 'crypto';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const SESSION_EXPIRY_HOURS = 24;

// Login handler
export async function login(req, res) {
  const { username, password, projectId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const db = await getDb();
    
    // Find user by username or email
    const user = await db.get(
      `SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1`,
      [username, username]
    );

    if (!user) {
      console.log(`Login failed: User not found for username/email: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log(`Login failed: Password mismatch for user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Login successful for user: ${username} (role: ${user.role})`);

    // Determine scoped project for non-admins
    let scopedProjectId = null;
    if (user.role !== 'admin') {
      if (!projectId) {
        return res.status(400).json({ error: 'Project selection is required for non-admin users' });
      }
      const project = await db.get(`SELECT id FROM projects WHERE id = ?`, [projectId]);
      if (!project) {
        return res.status(400).json({ error: 'Selected project not found' });
      }
      scopedProjectId = Number(projectId);
    } else if (projectId) {
      // Admin may optionally scope to a project on login
      const project = await db.get(`SELECT id FROM projects WHERE id = ?`, [projectId]);
      if (project) {
        scopedProjectId = Number(projectId);
      }
    }

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Save session to database
    await db.run(
      `INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)`,
      [user.id, sessionToken, expiresAt.toISOString()]
    );

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, sessionToken, projectId: scopedProjectId || null },
      JWT_SECRET,
      { expiresIn: `${SESSION_EXPIRY_HOURS}h` }
    );

  res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        projectId: scopedProjectId || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Register handler
export async function register(req, res) {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const userRole = role && ['admin', 'individual', 'qa', 'viewer'].includes(role) ? role : 'viewer';

  try {
    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.get(
      `SELECT id FROM users WHERE username = ? OR email = ?`,
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.run(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, userRole]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.lastID || result.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Logout handler
export async function logout(req, res) {
  try {
    const headerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null;
    const cookieToken = req.cookies?.auth_token || null;
    const token = headerToken || cookieToken;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDb();

    // Delete session
    await db.run(
      `DELETE FROM sessions WHERE session_token = ?`,
      [decoded.sessionToken]
    );

    res.clearCookie('auth_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Authentication middleware
export async function authMiddleware(req, res, next) {
  const headerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null;
  const cookieToken = req.cookies?.auth_token || null;
  const token = headerToken || cookieToken;
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  // Basic JWT format validation (should have 3 parts separated by dots)
  if (typeof token !== 'string' || token.trim() === '' || token.split('.').length !== 3) {
    // Silently reject malformed tokens without logging to reduce noise
    return res.status(403).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDb();

    // Verify session exists and is not expired
    const session = await db.get(
      `SELECT s.*, u.username, u.role, u.is_active 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.session_token = ? AND s.expires_at > datetime('now')`,
      [decoded.sessionToken]
    );

    if (!session || !session.is_active) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      projectId: decoded.projectId ?? null
    };

    next();
  } catch (err) {
    // Only log non-malformed token errors to reduce noise
    if (err.name !== 'JsonWebTokenError' || err.message !== 'jwt malformed') {
      console.error('Auth middleware error:', err);
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Role-based authorization middleware
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
