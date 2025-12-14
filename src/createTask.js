import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./db.js";
import { randomUUID } from 'crypto';


export const createTask = async (data, userId) => {
  try {
    const task = {
      id: randomUUID(),
      ...data,
      userId: userId,
      createdAt: new Date().toISOString()
    };
    await docClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: task
      })
    );
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
