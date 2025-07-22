//Import the Required AWS SDK modules to interact with SES
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

//Initialize the AWS SES client  with our AWS Region
const sesClient = new SESClient({ region: "ap-southeast-1" });

//Export the SendOrderEmail  function directly
exports.sendOrderEmail = async (
  toEmail,
  orderId,
  productName,
  quantity,
  content
) => {
  //Construct the email parameters

  const emailParams = {
    Source: "thuongtt@vnext.vn", //Sender's email address (must be verified in SES)
    Destination: {
      ToAddresses: [toEmail], //Recipient's email address
    },
    Message: {
      Subject: {
        Data: "Your Order Confirmation",
      },
      Body: {
        Text: {
          Data: `Thank you for your order\n\nOrder ID ${orderId}\nProduct: ${productName}\n ${content}.`,
        },
      },
    },
  };

  try {
    //Create the send command and execute it

    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);
  } catch (error) {
    throw new Error(error.message || "Error Unknown");
  }
};
