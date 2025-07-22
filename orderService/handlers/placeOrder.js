const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const axios = require("axios");
const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");
const { v4: uuid } = require("uuid");
const { sendOrderEmail } = require("../services/sendEmail");
const sqsClient = new SQSClient({ region: "ap-southeast-1" });
const sfnClient = new SFNClient({ region: "ap-southeast-1" });

exports.placeOrder = async (event) => {
  try {
    const email = event.requestContext.authorizer.jwt.claims.email;
    const { id, quantity } = JSON.parse(event.body);

    if (!id || !quantity || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "fields are required" }),
      };
    }

    const productResponse = await axios.get(
      `https://zi79iy56ld.execute-api.ap-southeast-1.amazonaws.com/approve-products` //URL to fetch approved products
    ); 
    const approvedProducts = productResponse.data.products || [];
    const product = approvedProducts.find((p) => p.id?.S === id);

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Product not found or not approved" }),
      };
    }

    const availableStock = parseInt(product.quantity?.N || "0");
    if (availableStock < quantity) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Insufficient stock available" }),
      };
    }

    const orderId = uuid();
    const orderPayload = {
      id: orderId,
      productId: id,
      quantity,
      email,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Send message to SQS
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(orderPayload),
      })
    );

    //This will tell AWS to start running your Step function(state machine) using the orderPayload
    //as the input

    await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: process.env.STEP_FUNCTION_ARN,
        input: JSON.stringify({ ...orderPayload, product }),
      })
    );
    //Send an order confirmation email to the user using AWS SES
    await sendOrderEmail(
      email,
      orderId,
      product.productName?.S || "Unknown Product", //fallback if product name is missing
      quantity,
      "we will notify you when it is shipped"
    );
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Order placed successfully",
        orderId,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
