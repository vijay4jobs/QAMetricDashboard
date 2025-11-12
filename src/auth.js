import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const users = [{ id:1, email: 'admin@example.com', passwordHash: bcrypt.hashSync('password', 8) }];

export function authMiddleware(req,res,next){
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'missing auth header' });
  const token = h.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    next();
  } catch(e){
    res.status(401).json({ error: 'invalid token' });
  }
}

export function login(req,res){
  const { email, password } = req.body;
  const u = users.find(x=>x.email===email);
  if(!u) return res.status(401).json({ error: 'invalid credentials'});
  if(!bcrypt.compareSync(password, u.passwordHash)) return res.status(401).json({ error: 'invalid credentials'});
  const token = jwt.sign({ id: u.id, email: u.email }, process.env.JWT_SECRET||'dev_secret', { expiresIn: '8h' });
  res.json({ token });
}
