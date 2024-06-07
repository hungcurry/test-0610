require('dotenv').config();
const express = require('express');
const path = require('path');
const port = process.env.PORT || 80;
const publicPath = process.env.PUBLIC_PATH || '/dev/m-cloud';

const app = express();

app.use(publicPath, express.static(path.join(__dirname, publicPath)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}, publicPath ${publicPath}, __dirname ${__dirname}`);
});