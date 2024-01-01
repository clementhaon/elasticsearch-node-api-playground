const express = require('express')
const app = express()
const port = 8080
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();
const fs = require('fs');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');


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

    console.log('client', client);

    return client;
  } catch (error) {
    console.log('error connection elasticsearch', error);
  }
}
const client = connection();

app.get('/init-fake-data', async (req, res) => {
  try {
    //Init file path
    const filePath = resolve('./merge-mock-data-final-20.json');
    // Read file
    const contents = await readFile(filePath, { encoding: 'utf8' });
    //Json parse
    const data = JSON.parse(contents);
    //check index exist
    const existingIndexes = await getExistingIndexes();
    console.log('existingIndexes', existingIndexes);
    //Check data
    if (!data || !Array.isArray(data)) return res.status(500).send({ success: false, error: 'data is empty' });
    // Process data asynchronously
    // await processAsyncData(data);
    // // Bulk insert data
    // const body = data.flatMap(doc => [{ index: { _index: 'test', _id: doc.id } }, doc]);
    // const { body: bulkResponse } = await client.bulk({ refresh: true, body });
    // return length data
    return res.status(200).send({ success: true, length: data.length });
  } catch (error) {
    console.log('init-fake-data', error);
    return res.status(500).send({ success: false, error: error?.message ? error.message : error ? error : 'error' });
  }
});

// Function to process data asynchronously
async function processAsyncData(data) {
  const batchSize = 100; // Number of items to process in each batch

  // Function to process a batch of data
  async function processBatch(startIndex) {
    for (let i = startIndex; i < Math.min(startIndex + batchSize, data.length); i++) {
      console.log(`Processing item ${i}`);
    }
  }

  // Process data in batches asynchronously
  const numBatches = Math.ceil(data.length / batchSize);
  for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
    await processBatch(batchIndex * batchSize);
  }
}

async function getExistingIndexes() {
  try {
    const response = await client.cat.indices({
      format: 'json',
    });

    const existingIndexes = response.body.map((index) => index.index);
    console.log('Indexes existants :', existingIndexes);

    return existingIndexes;
  } catch (error) {
    console.error('Erreur lors de la récupération des indexes existants :', error.body);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
