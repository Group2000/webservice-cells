__Cell webservice voor Service Framework in NodeJS__

De webservice maakt gebruik van Restify als basis (gebaseerd op het skeleton framework), en registreerd automatisch middels zookeeper in het services Framework. Swagger is geintegreerd voor documentatie.

__Resources:__
De volgende externe modules worden gebruikt

* Node-restify-Swagger	(Code aangepast voor gebruik binnen netwerk)
* Node-restify-Validation
* Node-uuid
* Node-zookeeper-client
* Restify
* Elasticsearch

__Structuur:__

* index.js: initialisatie van webservice
* config: bevat vonfiguratie bestanden voor development en productie omgeving: maakt gebruik van NODE_ENV variabele
* routes: kan meerdere bestanden bevatten, worden automatisch geladen. Iedere route verwijst naar een handler in de controllers folder. 
* controllers: Bevat de logica voor de webservice, controllers moeten in de route files worden geladen
* node_modules: Externe modules


__Development:__
Voor development is het gebruik van nodemon aan te raden
(npm install -g nodemon)


__Deployment:__
