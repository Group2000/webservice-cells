'use strict'


var config = require('../config/config');
var esClient = require('../config/elasticsearch').esClient;
var esIndex=require('../config/elasticsearch').indexName;
var logger = require('../utils/logger');


function getMeasurementDate(id,firstseen,callback){
	var ret={};
		var m = [];
		var term={term:{}};
  		term.term['source']='celllogger';
  		m.push(term);
  		term.term['source_id']=id;
  		m.push(term);
  		var order="desc";
  		if(firstseen)
  			order="asc";
		var q={
			size:1,
			sort:[
				{
					timestamp:{
						order:order
					}
				}
			],
		    query:{
		     	filtered:{
		        	filter:{
		          		bool:{
		            		must:m,
		          		}
		        	},
		        }
		    },
		    
		    aggs:{
		       	cells:{
		       		terms:{
		       			field:"source_id"
		       		}
		       	}	
		    }
		  };

		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {
			
			if(body.hits.hits[0])
				callback(body.hits.hits[0]._source.timestamp,body.hits.total)
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		   	callback();
		});
}




var devicesController={


	devices:function(req,res){
		var m = [];
		var term={term:{}};
  		term.term['source']='celllogger';
  		m.push(term);

		var q={
			size:0,
		    query:{
		     	filtered:{
		        	filter:{
		          		bool:{
		            		must:m,
		          		}
		        	},
		        }
		    },
		    
		    aggs:{
		       	cells:{
		       		terms:{
		       			field:"source_id"
		       		}
		       	}	
		    }
		  };
		// console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {
			res.send(body.aggregations);
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});
	},

	deviceproperties:function(req,res){
		var ret={};
		getMeasurementDate(req.params.source_id,false,function(lastseen,count){
			ret.lastseen=lastseen;
			ret.count=count;
			getMeasurementDate(req.params.source_id,true,function(firstseen,count){
				ret.firstseen=firstseen
				res.send(ret);
			})
		});
	},

}


module.exports=devicesController;
