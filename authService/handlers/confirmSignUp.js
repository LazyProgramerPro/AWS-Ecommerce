const {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

//Initialize Cognito client with specified AWS region

const client = new CognitoIdentityProviderClient({
  region: "ap-southeast-1", //Specify your AWS region
});

//Define Cognito App Client ID for user pool authentication

const CLIENT_ID = process.env.CLIENT_ID; //Replace with your actual Client ID

exports.confirmSignUp = async (event) => {
  const { email, confirmationCode } = JSON.parse(event.body);

  const params = {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: confirmationCode,
  };
  try {
    const command = new ConfirmSignUpCommand(params);

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "User successfully confirmed!" }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        msg: "confirmation failed",
        error: error.message,
      }),
    };
  }
};
