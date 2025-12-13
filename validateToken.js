import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export function validateSupabaseToken(token) {
  
  if (!token) {
    throw new Error("Token ausente");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "authenticated") { // if not authenticated user
        return res.status(403).send("Não autorizado");
    }
    return payload; // user
  } catch (err) {
    throw new Error("Token inválido: " + err.message);
  }
}