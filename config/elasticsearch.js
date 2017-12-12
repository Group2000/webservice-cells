//elasticsearch.js
'use strict';
var elasticsearch=require("elasticsearch");
var config = require('./config');
var logger = require('../utils/logger');

var  esClient = new elasticsearch.Client({
	hosts:config.elasticsearch.hosts,
	apiVersion: '2.4'
});

function checkEsServer(esClient){
	esClient.ping({
		requestTimeout:1000
	}).then(function(response){
		
		esClient.indices.exists({index:config.elasticsearch.index},function(err,response,status){
			if(response===true){
				logger.log('status',"Connected to Elasticsearch cluster");
				if(config.elasticsearch.deleteIndex){
					deleteIndex();
				}
			}
			else
			{
				if(config.elasticsearch.createIndex){
					createIndex();
				}
			}
		})

		//provider database
		esClient.indices.exists({index:config.providers.index},function(err,response,status){
			if(response===true){
				logger.log('status',"Provider Database exists");
				if(config.providers.deleteIndex){
					deleteProviderIndex();
				}
			}
			else
			{
				if(config.providers.createIndex){
					createProviderIndex();
				}
			}
		})

	},function(error){
		console.log("ES cluster down");
		process.exit(0);
	});
}

function deleteIndex(){
	
	esClient.indices.delete({index: config.elasticsearch.index}, function(err,response,status){
		if(!err){
			logger.log('info',"Index"+ config.elasticsearch.index +"deleted");
			if(config.elasticsearch.createIndex){
				createIndex();
			}		
		}
    });
	
	
}

function createIndex(){
    esClient.indices.create({index: config.elasticsearch.index}, function(err,response,status){
                logger.log('info', "Index " +config.elasticsearch.index + " created");
                esClient.indices.putMapping({
                        index:config.elasticsearch.index,
                        type:config.elasticsearch.type,
                        body:config.elasticsearch.mapping,
                        },function(err,response,status){
                                logger.log('info', "Mapping created for " + config.elasticsearch.type)
                });
        });

}

function deleteProvidersIndex(){
	
	esClient.indices.delete({index: config.providers.index}, function(err,response,status){
		if(!err){
			logger.log('info',"Index"+ config.providers.index +"deleted");
			if(config.providers.createIndex){
				createProviderIndex();
			}		
		}
    });
	
	
}


function createProviderIndex(){
    esClient.indices.create({index: config.providers.index}, function(err,response,status){
		logger.log('info', "Index " +config.providers.index + " created");
		esClient.indices.putMapping({
			index:config.providers.index,
			type:config.providers.type,
			body:config.providermapping.mapping,
			},function(err,response,status){
				logger.log('info', "Mapping created for " + config.providers.type)
		});
  	});
     
}


checkEsServer(esClient);
exports.indexName=config.elasticsearch.index;
exports.Type=config.elasticsearch.index;

exports.elasticsearch = elasticsearch;
exports.esClient = esClient;
