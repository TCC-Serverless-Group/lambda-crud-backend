import { supabaseClient } from "./db.js";

export const listTasks = async (userId) => {
    try {
        
        const { result } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .range(0, 9);  // Paginação (primeiros 10 itens)
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
          },
          body: JSON.stringify(result.Items || [])
        };
      } catch (error) {
        console.error("Erro ao listar tasks:", error);
  
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ error: "Erro interno ao listar tasks" })
        };
      }
};
