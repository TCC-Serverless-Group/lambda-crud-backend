import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export function validateSupabaseToken(token) {

  if (!JWT_SECRET) {
    throw new Error("SUPABASE_JWT_SECRET não configurado");
  }
  
  if (!token) {
    throw new Error("Token ausente");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    if (payload.role !== "authenticated") { // if not authenticated user
        throw new Error("Usuário não autenticado");
    }
    return {
      user: {
        id: payload.sub
      },
      email: payload.email,
      role: payload.role
    };
  } catch (err) {
    throw new Error("Token inválido: ");
  }
}