const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const TABLE_NAME = "Users"; //DynamoDb table where users will be stored
//Initialize DynamoDb client with specified AWS Region

const dynamoClient = new DynamoDBClient({
  region: "ap-southeast-1", //AWS region where the Dynamodb table is located
});

//User Model class to represent a user and handle database operations

class UserModel {
  constructor(email, fullName) {
    this.userId = uuidv4(); //Generate a unique user ID
    this.email = email; //store the email  of the user
    this.fullName = fullName; //store the fullName  of the user
    this.state = ""; //default empty string for state
    this.city = ""; //default empty string for city
    this.locality = ""; //default empty string for locality
    this.createdAt = new Date().toISOString(); //store user creation timestamp
  }

  //save user data to DynamoDb

  async save() {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId: { S: this.userId },
        email: { S: this.email },
        fullName: { S: this.fullName },
        state: { S: this.state },
        city: { S: this.city },
        locality: { S: this.locality },
        createdAt: { S: this.createdAt },
      },
    };

    try {
      await dynamoClient.send(new PutItemCommand(params));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;
