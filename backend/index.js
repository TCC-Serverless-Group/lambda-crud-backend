import { route } from './router.js';
import { validateSupabaseToken } from "./validateToken.js";

function applyCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Token',
    'Access-Control-Allow-Methods': 'OPTIONS,DELETE,GET,HEAD,POST,PUT',
    'Content-Type': 'application/json'
  };
}

export const handler = async (event) => {
  const corsHeaders = applyCorsHeaders();

  try {
    const { httpMethod, pathParameters, body, headers, path } = event;

    const token = headers.Token || headers.token || {};

    if (httpMethod == "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    let data = validateSupabaseToken(token);

    const result = await route({
      method: event.httpMethod,
      path: event.path,
      body: event.body ? JSON.parse(event.body) : {},
      userId: data.user.id,
    });

    return {
      statusCode: result.statusCode,
      headers: corsHeaders,
      body: JSON.stringify(result.body),
    };
  } catch (err) {
    console.error("Erro na Lambda:", err);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal server error",
        error: err.message,
      }),
    };
  }

};
