const express = require('express')
const app = express()
const port = 8080
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();
const fs = require('fs');

app.get('/', (req, res) => {
  res.send('Hello World!')
})
const connection = () => {
  try {
    const client = new Client({
      node: 'https://localhost:9200',
      auth: {
        username: 'elastic',
        password: process.env.ELASTIC_PASSWORD
      },
      tls: {
        ca: fs.readFileSync(process.env.PATH_CA_ELASTIC),
        rejectUnauthorized: false
      }
    });
    console.log('connection elasticsearch success');
    return client;
  } catch (error) {
    console.log('error connection elasticsearch', error);
  }
}
const client = connection();

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
