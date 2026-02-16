import { supabaseClient } from "./db.js";

export const createTask = async (data, userId) => {
  try {
    const task = {
      descricao: data.descricao,
      userId: userId
    };

    await supabaseClient.from('tasks')
    .insert( task )
    .select()
    .single();

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      },
      body: JSON.stringify(task)
    };
  } catch (error) {
    console.error("Erro ao cadastrar task:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Erro interno ao cadastrar tasks" })
    };
  }
};
