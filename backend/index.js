import { createTask } from './src/createTask.js';
import { getTask } from './src/getTask.js';
import { updateTask } from './src/updateTask.js';
import { deleteTask } from './src/deleteTask.js';
import { listTasks } from './src/listTask.js';
import { validateSupabaseToken } from "./validateToken.js";

function applyCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Token');
}

export const handler = async (req, res) => {

  applyCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  const token = String(req.headers.token);
  
  try {
    
    let data = validateSupabaseToken(token); // valida o token e retorna o payload do usuário, se válido
    const userId = data?.user?.id;

    const path = req.path;

    if (req.method === "POST" && path === "/tasks/save") {
      return res.status(201).json(await createTask(req.body, userId));
    }

    if (req.method === "GET" && path === "/tasks/list") {
      return res.status(200).json(await listTasks(userId));
    }

    if (req.method === "GET" && path.startsWith("/tasks/get/")) {
      const id = path.split("/").pop();
      return res.status(200).json(await getTask(id, userId));
    }

    if (req.method === "PUT" && path.startsWith("/tasks/put/")) {
      const id = path.split("/").pop();
      return res.status(204).json(await updateTask(id, req.body, userId));
    }

    if (req.method === "DELETE" && path.startsWith("/tasks/delete/")) {
      const id = path.split("/").pop();
      return res.status(204).json(await deleteTask(id, userId));
    }

    return res.status(404).json({ message: "Rota não encontrada" });
  } catch (err) {
    applyCorsHeaders(res);
    console.error(err);
    return res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
};
