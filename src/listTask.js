import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from "./db.js";

export const listTasks = async () => {
    try {
        const result = await docClient.send(
          new ScanCommand({ TableName: process.env.DYNAMODB_TABLE })
        );
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
