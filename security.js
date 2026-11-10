import jwt from 'jsonwebtoken';
import { pool } from './db.js';
export function signToken(user){ return jwt.sign({sub:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'2h',issuer:'volaconnect'}); }
export async function requireAuth(req,res,next){
 try { const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) return res.status(401).json({error:'Authentification requise'});
  const p=jwt.verify(h.slice(7),process.env.JWT_SECRET,{issuer:'volaconnect'}); const {rows}=await pool.query('SELECT id,email,full_name,role,is_active FROM users WHERE id=$1',[p.sub]);
  if(!rows[0]||!rows[0].is_active) return res.status(401).json({error:'Compte indisponible'}); req.user=rows[0]; next();
 } catch { return res.status(401).json({error:'Session invalide ou expirée'}); }
}
export const allowRoles=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({error:'Accès non autorisé'});
export async function audit(req,action,entityType=null,entityId=null,metadata={}){ await pool.query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,ip,user_agent,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)',[req.user?.id||null,action,entityType,entityId,req.ip,req.get('user-agent'),metadata]); }
