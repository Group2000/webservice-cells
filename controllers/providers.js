//providers.js

var config = require('../config/config');
var esClient = require('../config/elasticsearch').esClient;
var logger = require('../utils/logger');
var validator=require('validator');



var providerController={

// exports.providers=function(req,res){
// 	console.log('todo: Get distinct MNC/MCC');

// 	Measurement
// 	.aggregate()
// 	.group({_id:{mnc:'$mnc',mcc:'$mcc'}})
// 	.exec(function(err,results){
// 		var retvalues=[];
// 		results.forEach(function(prov){
// 			var newv={mnc:prov._id.mnc,mcc:prov._id.mcc,name:(prov._id.mcc  +"-"+prov._id.mnc)};

// 			providernames.forEach(function(name){
// 				if(newv.mnc===name.mnc && newv.mcc===name.mcc){
// 					newv.name=name.country + ": " + name.provider;
					
// 				}
// 			});
// 			retvalues.push(newv);
// 		});
// 		return res.json(retvalues);
// 	});
// };

	measurementProviders:function(req,res){
		//should return distinct list of providers for which measurements exist

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
		       	providers:{
		       		terms:{
		       			field:"provider",
		       			size: 30
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

	getProvider: function(req,res){
		var m = [];
		  
		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);

		  	}	
		}	

		  var size = req.params.size || 10;
		  
		  var q={
		  	explain:false,
		    query:{
		      filtered:{
		        filter:{
		          bool:{
		            must:m
		          }
		        }
		      }
		    },
		    size: size
		  }

		esClient.search({
	    	index:config.providers.index,
	    	type:config.providers.type,
		    body: q
		}).then(function(body) {
			res.send(body)
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},


	postProvider: function(req,res){

		var validated=true;
		var errors=[];
		
		delete(req.params.apiKey);	
		
		//Quick validation for input, rest is handled by elasticSearch
		if(req.params.mcc === 'undefined' || !validator.isInt(req.params.mcc,{min:0,max:999})) {
			validated=false;
			errors.push("Missing or invalid value for mcc (1-999)");
		}
		if(req.params.net === 'undefined'  || !validator.isInt(req.params.net,{min:0,max:999})) {
			validated=false;
			errors.push("Missing or invalid value for net (0-999)");
		}

		
		if(validated){
			//Create unique ID
			// var md5sum=crypto.createHash('md5');
			
	     	var id=req.params.mcc.toString()+'-' +req.params.net.toString();
	  //   	id=md5sum.update(id).digest("hex");
			
			esClient.index({
		    	index:config.providers.index,
		    	type:config.providers.type,
		    	body:req.params,
		    	id:id
		    },function(err,response){
	          	if(err)
	            	res.send(500,{error:err});
	            else
	            	res.send({result:'ok'});
				
		    });
		}
		else{
			logger.log('error','Validation Error in POST request');
			logger.log('error',JSON.stringify(errors));
			logger.log('error',JSON.stringify(req.params));
		     return res.send (400, {
	            status: 'JSON failed validation',
	            errors: errors
	        });
		}
		
	}


}

module.exports=providerController;