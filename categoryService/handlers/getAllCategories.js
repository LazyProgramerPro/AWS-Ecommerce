//Import required AWS SDK modules to interact with Dynamodb

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

//Initialize DynamoDb client with AWS Region

const dynamoDbClient = new DynamoDBClient({ region: "ap-southeast-1" });

//Lambda function to get all categories from Dynamodb

exports.getAllCategories = async () => {
  try {
    //Retrieve the DynamoDb table from the environment variables
    const tableName = process.env.DYNAMO_TABLE;

    //create a ScanCommand to fetch all Categories

    const scanCommand = new ScanCommand({
      TableName: tableName,
    });

    //Execute the scan Command
    const { Items } = await dynamoDbClient.send(scanCommand);

    //if no items are found , return an empty list
    if (!Items || Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "No Categories found" }),
      };
    }
    //Format the retreived categories  into a readable JSON response
    const categories = Items.map((item) => ({
      categoryName: item.categoryName.S,
      imageUrl: item.imageUrl.S,
    }));

    //return the list of categories

    return {
      statusCode: 200,
      body: JSON.stringify(categories),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
