import { route } from './router.js';
import { validateSupabaseToken } from "./validateToken.js";

function applyCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Token');
}

export const handler = async (req, res) => {

  applyCorsHeaders(res);
  
  try {

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const token = String(req.headers.token);
    
    let data = validateSupabaseToken(token); // valida o token e retorna o payload do usuário, se válido
    const userId = data?.user?.id;

    const path = req.path;

    const result = await route({
      method: req.method,
      path: path,
      body: req.body ? req.body : {},
      userId: userId,
    });

    return res.status(result.statusCode).json(JSON.stringify(result.body));
  } catch (err) {
    applyCorsHeaders(res);
    console.error(err);
    return res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
};
