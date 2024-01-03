const express = require('express')
const app = express()
const port = 8080
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();
const fs = require('fs');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
app.use(express.json());

app.get('/api', (req, res) => {
  res.send('Hello World!')
})
const connection = () => {
  try {
    const client = new Client({
      node: process.env.ELASTIC_URL,
      auth: {
        username: 'elastic',
        password: process.env.ELASTIC_PASSWORD
      },
    });
    return client;
  } catch (error) {
    console.log('error connection elasticsearch', error);
  }
}
const client = connection();

app.get('/api/init-fake-data', async (req, res) => {
  try {
    //check index exist
    const indexName = 'test';
    // create index
    await createIndex(indexName);
    //Init file path
    const filePath = resolve('./merge-mock-data-final-20.json');
    // Read file
    const contents = await readFile(filePath, { encoding: 'utf8' });
    //Json parse
    const data = JSON.parse(contents);
    //Check data
    if (!data || !Array.isArray(data)) return res.status(500).send({ success: false, error: 'data is empty' });
    //get existing indexes
    await getExistingIndexes();
    // Process data asynchronously
    await processAsyncData(data);
    return res.status(200).send({ success: true, length: data.length });
  } catch (error) {
    console.log('init-fake-data', error);
    return res.status(500).send({ success: false, error: error?.message ? error.message : error ? error : 'error' });
  }
});

//webservice search with body request post with column to match and value to match
app.post('/api/search', async (req, res) => {
  try {
    //search
    const { column, value } = req.body;
    //if column or value is empty
    if (!value) return res.status(500).send({ success: false, error: 'column or value is empty' });
    let result;
    if (!column) {
      result = await client.search({
        index: 'test',
        query: {
          query_string: {
            query: `*${value}*`,
            fields: ["first_name", "last_name", "address", "car", "country"],
          }
        },
        size: 100
      })
    } else {
      result = await client.search({
        index: 'test',
        query: {
          match: {
            [column]: value
          }
        },
        size: 100
      })
    }
    return res.status(200).send({ success: true, data:result.hits.hits ? result.hits.hits : [] });
  } catch (error) {
    console.log('search', error);
    return res.status(500).send({ success: false, error: error?.message ? error.message : error ? error : 'error' });
  }
});

//webservice return all data on index test with pagination with query param page and size
app.get('/api/get-all', async (req, res) => {
  try {
    //get query param
    const { page, size } = req.query;

    //if page or size is empty init default value
    const pageInit = page ? parseInt(page) : 1;
    const sizeInit = size ? parseInt(size) : 1000;

    //search
    const result = await client.search({
      index: 'test',
      from: (pageInit - 1) * sizeInit,
      size: sizeInit,
      sort: [
        { id: { order: 'asc' } }
      ],
      body: {
        query: {
          match_all: {}
        }
      }
    })
    return res.status(200).send({ success: true, data:result.hits.hits ? result.hits.hits : [] });
  } catch (error) {
    console.log('search', error);
    return res.status(500).send({ success: false, error: error?.message ? error.message : error ? error : 'error' });
  }
});


// Function to process data asynchronously
async function processAsyncData(data) {
  const batchSize = 1000; // Number of items to process in each batch

  // Function to process a batch of data
  async function processBatch(startIndex) {
    let batchData = [];
    for (let i = startIndex; i < Math.min(startIndex + batchSize, data.length); i++) {
      batchData.push(data[i]);
    }
    //bulk create
    const body = batchData.flatMap(doc => [{ index: { _index: 'test', _id: doc.id } }, doc]);
    const { body: bulkResponse } = await client.bulk({ refresh: true, body });
    console.log('bulkResponse', bulkResponse);
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
    console.log('Index already exist: ', response);
    return response;
  } catch (error) {
    console.error('Error getExistingIndexes :', error.body ? error.body : error);
    throw error;
  }
}

async function createIndex(indexName) {
  try {
    const response = await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
        },
      },
    });

    console.log('Index créé :', response.body);
    return response.body;
  } catch (error) {
    console.error('Error createIndex :', error.body ? error.body : error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
