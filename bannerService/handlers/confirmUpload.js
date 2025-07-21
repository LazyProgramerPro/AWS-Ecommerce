//Import necessary AWS SDK modules for dynamoDB
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

//Initialize Dynamo Client with the specified AWS region
const dynamoDbClient = new DynamoDBClient({
  region: "ap-southeast-1",
});

//lambda function to confirm file uplaod and store file metadata in dynamoDb
exports.confirmUpload = async (event) => {
  try {
    //Retrieve environment variables for table and bucket names
    const tableName = process.env.DYNAMO_TABLE;
    const bucketName = process.env.BUCKET_NAME;

    //Extract file details from S3 event notification
    const record = event.Records[0]; //Get first record
    //Extract the file Name  from s3 event
    const fileName = record.s3.object.key;
    //Construct the public Url  for  the uploaded  file
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    //https://banner-images-famous-macaulay-dev-123-new.s3.ap-southeast-1.amazonaws.com/banner1.png

    //Prepare the file metedata to upload in DynamoDB
    const putItemCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        fileName: { S: fileName },
        imageUrl: { S: imageUrl },
        uploadedAt: { S: new Date().toISOString() },
      },
    });

    //Save file metedata to DynamoDB for  tracting and retrieval
    await dynamoDbClient.send(putItemCommand);

    //return a success response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "File uploaded & confirmed" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
