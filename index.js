import { createTask } from './src/createTask.js';
import { getTask } from './src/getTask.js';
import { updateTask } from './src/updateTask.js';
import { deleteTask } from './src/deleteTask.js';
import { listTasks } from './src/listTask.js';

export const handler = async (event) => {
  const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,POST,PUT',
        'Content-Type': 'application/json'
    };
  try {
    const { httpMethod, pathParameters, body } = event;

    switch (httpMethod) {
      case "OPTIONS":
        return { statusCode: 200, headers: headers, };
      case "POST":
        return response(201, await createTask(JSON.parse(body)),headers);
      case "GET":
        if (pathParameters?.id)
          return response(200, await getTask(pathParameters.id),headers);
        return response(200, await listTasks(),headers);

      case "PUT":
        return response(
          200,
          await updateTask(pathParameters.id, JSON.parse(body)),
          headers
        );

      case "DELETE":
        return response(200, await deleteTask(pathParameters.id),headers);

      default:
        return response(400, { message: "Unsupported method" },headers);
    }
  } catch (err) {
    console.error(err);
    return response(500, { message: "Internal server error", error: err.message },headers);
  }
};

const response = (statusCode, body,headers) => ({
  statusCode,
  headers: headers,
  body: JSON.stringify(body)
});
