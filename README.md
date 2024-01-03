# elasticsearch-node-api-playground

This Node.js project integrates Elasticsearch and Kibana for efficient data storage and visualization, respectively. Nginx is used as a reverse proxy, and Certbot automates the process of obtaining and renewing Let's Encrypt SSL certificates. The data is generated using Mockaroo and multiplied to create one million objects stored in an Elasticsearch index.

Documentation : 

Install Elasticsearch and Kibana on Docker : 
 - https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html

Elasticsearch JavaScript Client :
 - https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html

Docker init on Node.js : 
 - https://docs.docker.com/engine/reference/commandline/init/

Nginx Certbot : 
 - https://phoenixnap.com/kb/letsencrypt-docker

Generate Data : 
- https://mockaroo.com/

Exemple .env : 

ELASTIC_PASSWORD=""
ELASTIC_URL="" >>.env
CERTBOT_DOMAIN=""
CERTBOT_DOMAIN_WWW=""
NODE_TLS_REJECT_UNAUTHORIZED = "0"

This project is set up for continuous deployment with Buddyworks. The deployment workflow is configured to deploy changes to your specified environment automatically.

Start with docker compose up -d --build