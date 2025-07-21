//Import required AWS SDK modules to interact with DynamoDb

const {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
//Initialize the DynamoDb client with AWS Region

const dynamoDbClient = new DynamoDBClient({ region: "ap-southeast-1" });
const snsClient = new SNSClient({ region: "ap-southeast-1" });
//Define the clean up function to remove outdated categories

exports.cleanupCategories = async () => {
  try {
    //Get the DynamoDb table name from the environment variables

    const tableName = process.env.DYNAMO_TABLE;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    //Calculate the timestamp for one hour ago(to filter outdated categories)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    //Create a scan command to find categories that are:
    //older than one hour(createdAt < oneHourAgo)
    //that do not have an image Url field
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression:
        "createdAt < :oneHourAgo AND attribute_not_exists(imageUrl)",
      ExpressionAttributeValues: {
        ":oneHourAgo": { S: oneHourAgo }, // Bind the the timestamp for filtering
      },
    });

    //Execute the scan command to retrieve matching  items from the database
    const { Items } = await dynamoDbClient.send(scanCommand);

    //if no items are found, return a sucesss response indicating  no clean up was needed
    if (!Items || Items.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No categories found for cleanup" }),
      };
    }

    //intialize a counter to track the number of deleted categories
    let deletedCount = 0;

    //Iterate over each outdated category and delete it from the database
    for (const item of Items) {
      //Create a delete command  using the category unique identifier(fileName)
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: { fileName: { S: item.fileName.S } }, //Delete using  the primary key
      });

      //Execute the deleted operation
      await dynamoDbClient.send(deleteCommand);
      deletedCount++; //Increament the count of deleted items
    }

    //send an SNS noticafication after deleting categories
    const snsMessage = `Cleanup completed. Deleted ${deletedCount} outdated categories`;

    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Message: snsMessage,
        Subject: "Category cleanup Notification",
      })
    );

    //return a success response with the total number of deleted categories
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Clean up completed", deletedCount }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
