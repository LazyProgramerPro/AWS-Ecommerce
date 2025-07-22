const {
  DynamoDBClient,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
// const { sendOrderEmail } = require("../services/sendEmail");

const client = new DynamoDBClient({ region: "ap-southeast-1" });

exports.handler = async (event) => {
  try {
    const { id, email, quantity, product } = event;

    await client.send(
      new UpdateItemCommand({
        TableName: process.env.DYNAMO_TABLE,
        Key: {
          id: { S: id },
        },
        UpdateExpression: "set #s = :newStatus",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":newStatus": { S: "shipping" },
        },
      })
    );
    //Send an order confirmation email to the user using AWS SES
    // await sendOrderEmail(
    //   email,
    //   id,
    //   product.productName?.S || "Unknown Product", //fallback if product name is missing
    //   quantity,
    //   `${product.productName?.S} now shipping`
    // );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Order ${id} status updated to processing`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
