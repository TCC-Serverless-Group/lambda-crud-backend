import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './db.js';

export const deleteTask = async (id) => {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id }
      })
    );
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      },
      body: JSON.stringify({ message: "Task deletada com sucesso" })
    };
  } catch (error) {
    console.error("Erro ao deletar task:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Erro interno ao deletar task" })
    };
  }
};
