//Import necessary AWS SDK modules for DynamoDB

const {
  DynamoDBClient,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");

//Initilize the dynamoDB client with the specified AWS Region

const dynamoDbClient = new DynamoDBClient({ region: "ap-southeast-1" });

exports.updateCategoryImage = async (event) => {
  try {
    //Retrieve the table name from environment varaibles
    const tableName = process.env.DYNAMO_TABLE;
    //Extract the first record from the event
    const record = event.Records[0];

    //Get the s3 Bucket name from the event record
    const bucketName = record.s3.bucket.name;

    //extract the file name directly from the s3 event record
    const fileName = record.s3.object.key;

    //contruct the public url for the uploaded image
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    //Prepare the DynamoDB update command

    const updateItemCommand = new UpdateItemCommand({
      TableName: tableName,
      Key: { fileName: { S: fileName } },
      UpdateExpression: "SET imageUrl = :imageUrl", //update only the image url field
      ExpressionAttributeValues: {
        ":imageUrl": { S: imageUrl }, //Assign the new image url
      },
    });
    //Excute the update command to modify the item in dynamoDB

    await dynamoDbClient.send(updateItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "image Url updated successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
