// Amazon S3 JavaScript Code for S3 Bucket File Explorer


const AWS = require('aws-sdk');

// Create an instance of the S3 service
const s3 = new AWS.S3();

// Function for getting the contents of a directory within the S3 bucket
async function getDirectoryContents(bucketName, path='') {
    try {
      const data = await s3.listObjectsV2({ Bucket: bucketName, Prefix: path }).promise();
      const contents = data.Contents.map(item => ({
        name: item.Key.replace(path, ''),
        type: item.Key.endsWith('/') ? 'directory' : 'file',
        lastModified: item.LastModified,
        key: item.Key
      }));
      return { path, contents };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  
  // Function for uploading a file to the S3 bucket
  async function uploadFile(bucketName, file) {
    try {
      const params = {
        Bucket: bucketName,
        Key: `${Date.now().toString()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      };
      await s3.upload(params).promise();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  
  // Function for deleting a file from the S3 bucket
  async function deleteFile(bucketName, key) {
    try {
      await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  
  module.exports = {
    getDirectoryContents,
    uploadFile,
    deleteFile
  };
  