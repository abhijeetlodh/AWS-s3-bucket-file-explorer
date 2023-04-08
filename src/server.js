// Server-Side JavaScript Code for S3 Bucket File Explorer


const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

// Load environment variables from .env file
dotenv.config();

// Create an instance of the S3 service
const s3 = new AWS.S3();

// Create a Multer-S3 instance for handling file uploads
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { originalName: file.originalname });
    },
    key: (req, file, cb) => {
      cb(null, `${Date.now().toString()}-${file.originalname}`);
    }
  })
});

// Create an Express app
const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

// GET endpoint for getting the contents of a directory within the S3 bucket
app.get('/api/directory', async (req, res) => {
  try {
    const path = req.query.path || '';
    const data = await s3.listObjectsV2({ Bucket: process.env.S3_BUCKET_NAME, Prefix: path }).promise();
    const contents = data.Contents.map(item => ({
      name: item.Key.replace(path, ''),
      type: item.Key.endsWith('/') ? 'directory' : 'file',
      lastModified: item.LastModified,
      key: item.Key
    }));
    const result = { path, contents };
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET endpoint for downloading a file from the S3 bucket
app.get('/api/file', async (req, res) => {
  try {
    const key = req.query.key;
    const data = await s3.getObject({ Bucket: process.env.S3_BUCKET_NAME, Key: key }).promise();
    res.attachment(key);
    res.send(data.Body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST endpoint for uploading a file to the S3 bucket
app.post('/api/file', upload.single('file'), async (req, res) => {
  try {
    res.json({ message: 'File uploaded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE endpoint for deleting a file from the S3 bucket
app.delete('/api/file', async (req, res) => {
  try {
    const key = req.query.key;
    await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: key }).promise();
    res.json({ message: `File '${key}' deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}.`));
