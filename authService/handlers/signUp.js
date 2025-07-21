const UserModel = require('../models/UserModel');//Import the UserModel for database operations

//Import  the required AWS Cognito SDK

const {
  CognitoIdentityProviderClient,
  SignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

//Initialize Cognito client with specified AWS region

const client = new CognitoIdentityProviderClient({
  region: "ap-southeast-1", //Specify your AWS region
});

//Define Cognito App Client ID for user pool authentication

const CLIENT_ID = process.env.CLIENT_ID; //Replace with your actual Client ID
//Exported sign-up function to handle new user registration

exports.signUp = async (event) => {
  try {
    // Log the raw event body for debugging
    console.log('Raw event body:', event.body);
    
    // Check if event.body exists and is not empty
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ msg: "Request body is missing" }),
      };
    }

    // Parse the incoming request body to extract user data
    const { email, password, fullName } = JSON.parse(event.body);
    
    // Validate required fields
    if (!email || !password || !fullName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ msg: "Missing required fields: email, password, or fullName" }),
      };
    }

    //Configure parameters for Cognito  SignupCommand

    const params = {
      ClientId: CLIENT_ID, //Coginitor App Client ID
      Username: email, //User's emailas the username in coginito
      Password: password, // User's chosen password
      UserAttributes: [
        //Additinal  user attributes  for coginito
        { Name: "email", Value: email }, //Email attribute
        { Name: "name", Value: fullName }, // Fullname attribute
      ],
    };

    //Create the user in Cognito user pool
    const command = new SignUpCommand(params);
    //Execute the sign-up request
    await client.send(command);

    // Save user data to DynamoDB
    const newUser = new UserModel(email, fullName);
    await newUser.save();

    //Return success response to the client

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "Account created successfully, please check your email for verification link!" }),
    };
  } catch (error) {
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.error('JSON parsing error:', error.message);
      console.error('Problematic body:', event.body);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          msg: "Invalid JSON format in request body", 
          error: error.message 
        }),
      };
    }
    
    // Handle other errors (like Cognito errors)
    console.error('Sign-up error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ msg: "sign-up failed", error: error.message }),
    };
  }
};
