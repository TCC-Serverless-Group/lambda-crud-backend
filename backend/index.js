import { createTask } from './src/createTask.js';
import { getTask } from './src/getTask.js';
import { updateTask } from './src/updateTask.js';
import { deleteTask } from './src/deleteTask.js';
import { listTasks } from './src/listTask.js';
import { route } from './router.js';
import { validateSupabaseToken } from "./validateToken.js";

function applyCorsHeaders() {
  return headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,POST,PUT',
        'Content-Type': 'application/json'
    };
}

export const handler = async (event) => {
    const headers = applyCorsHeaders();

    const { httpMethod, pathParameters, body , header, path } = event;
    
    if (httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: headers, body: ""};
    }

    let data = validateSupabaseToken(header.token);
    const result = await route({
        method: event.httpMethod,
        path: event.path,
        body: event.body ? JSON.parse(event.body) : {},
        headers,
        userId: auth.user.id,
      });

      return {
        statusCode: result.statusCode,
        headers: headers,
        body: JSON.stringify(result.body),
      };
    };
