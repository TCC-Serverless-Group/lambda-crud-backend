import { supabaseClient } from "./db.js";

export const getTask = async (id, userId) => {
  try {

    const { data: result } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      },
      body: JSON.stringify(result.task)
    };
  } catch (error) {
    console.error("Erro ao obter task:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Erro interno ao obter task" })
    };
  }
};
