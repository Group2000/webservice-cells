'use strict'


var config = require('../config/config');
var esClient = require('../config/elasticsearch').esClient;
var esIndex=require('../config/elasticsearch').indexName;
var logger = require('../utils/logger');
var validator=require('validator');
var crypto = require('crypto');
var geohash=require('ngeohash');



function getBestMeasurement(req, callback){
	req.params.measurement=true;

	var timestamp;
	if (req.params.timestamp != undefined && req.params.timestamp != "")
		timestamp = req.params.timestamp;
	else
		timestamp = new Date().getTime();


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
	  	size:0,
	    query:{
	      filtered:{
	        filter:{
	          bool:{
	            must:m
	          }
	        }
	      }
	    },
	    aggs:{
	    	distinctcells:{
	    		terms:{
	    			field:'uuid',
	    			size:0
	    		},
		       		aggs:{
		       			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			},
		       			mcc:{
		       				max:{
		       					field:'mcc'
		       				}
		       			},
		       			net:{
		       				max:{
		       					field:'net'
		       				}
		       			},
		       			area:{
		       				max:{
		       					field:'area'
		       				}
		       			},
		       			cell:{
		       				max:{
		       					field:'cell'
		       				}
		       			},
		       			uuid:{
		       				terms:{
		       					field:'uuid'
		       				}
		       			},
		       			radio:{
		       				terms:{
		       					field:'radio'
		       				}
		       			},
		       			source:{
		       				terms:{
		       					field:'source'
		       				}
		       			}

		       		}
	    	}
	    }
	  }

	esClient.search({
    	index:config.elasticsearch.index,
    	type:config.elasticsearch.type,
	    body: q
	}).then(function(body) {

		var measurements=[];
		body.aggregations.distinctcells.buckets.forEach(function(cell){
			var pCell={
				mcc:cell.mcc.value,
				net:cell.net.value,
				area:cell.area.value,
				cell:cell.cell.value,
				key:cell.uuid.buckets[0].value,
				timestamp:cell.lastSeen.value,
				maxSignal:cell.maxSignal.value,
				measurement:true,
				source:cell.source.buckets[0].key,
				radio:cell.radio.buckets[0].key,
				uuid:cell.uuid.buckets[0].key
			}
			measurements.push(pCell);

		});

		callback(measurements);
		
	}, function(error) {
	    logger.log('error',error.message);
	    logger.log('info',q);
	});


}

var measurementController={


	getCellCoverage:function(req,res){
// measurement:true
		// best signal strength
		// serving cells/ neigbour cells
		// days from date?
		var datePrecision=parseInt(req.params.datePrecision) || 100;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	

		}

		var m = [];
		req.params.measurement=true;
		var precision=parseInt(req.params.geohashPrecision) || 8;
		m.push({range:range});
		
		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  		case 'geohashPrecision':

		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);

		  	}	
		}	
		
		var q={
			size:0,
		    query:{
		     	filtered:{
		        	filter:{
		          		bool:{
		            		must:m
		            		
		          		}
		          		
		          		
		        	}
		        }
		    },
    
       		
					
   			
			aggs:{
		       	cellgrid:{
		       		geohash_grid:{
		       			field:"location",
		       			precision:precision
			

		       		},
		       		aggs:{
		       			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			}
		       			,
		       			uuid:{
		       				terms:{
		       					field:"uuid"
		       				}
		       			}
		       		}
		       	}	
		    }
		  }
		
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {

			
			body.geohash_precision=precision;
			body.start_date=startDate;
			body.end_date=endDate;
			body.aggregations.cellgrid.buckets.forEach(function(bucket){
				bucket.maxSignal=bucket.maxSignal.value;
				bucket.firstSeen=bucket.firstSeen.value;
				bucket.lastSeen=bucket.lastSeen.value;
				
				bucket.uuid=bucket.uuid.buckets[0].value;
			})
			res.send(body);
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});


	},

	getMeasurementCount:function(req,res){
		var datePrecision=parseInt(req.params.datePrecision) || 10000;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	
		}

		var m = [];
		m.push({range:range});
		m.push({term:{measurement:true}});
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
		    }
		  };
		// console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {

			var ret={};
			ret.total=body.hits.total;


			res.send(ret);
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},

	getMeasurementCellCount:function(req,res){


		var datePrecision=parseInt(req.params.datePrecision) || 100;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		var m = [];
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	
		}

		if(req.params.top_right&&req.params.bottom_left){
			var tr=req.params.top_right;
			var bl=req.params.bottom_left;//.split(',');

			var errors=[];
			var validated=true;
			if(tr[0] === 'undefined' || !validator.isFloat(tr[0],{min:-90,max:90})) {
				validated=false;
				errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
			}
			if(tr[1] === 'undefined' || !validator.isFloat(tr[1],{min:-180,max:180})) {
				validated=false;
				errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
			}
			if(bl[0] === 'undefined' || !validator.isFloat(bl[0],{min:-90,max:90})) {
				validated=false;
				errors.push("Missing or invalid value for tbottom_right (-90 - 90, -180 - 180)");
			}
			if(bl[1] === 'undefined' || !validator.isFloat(bl[1],{min:-180,max:180})) {
				validated=false;
				errors.push("Missing or invalid value for bottom_right (-90 - 90, -180 - 180");
			}

			if(!validated){
			logger.log('error','Validation Error in GET request');
			     return res.send (400, {
		            status: 'Request failed validation',
		            errors: errors
		        });
			}

			m.push({
  			geo_bounding_box:{
  				location:{
						top_right:[parseFloat(tr[1]),parseFloat(tr[0])],
						bottom_left:[parseFloat(bl[1]),parseFloat(bl[0])]
					}
				}
			});		
			
		}

		
		m.push({range:range});
		m.push({term:{measurement:true}});

		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  		case 'geohashPrecision':
		  		case 'bottom_left':
		  		case 'top_right':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);
		  	}	
		}	

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
		       		cardinality:{
		       			field:"uuid"
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

	getMeasurementCoverage: function(req,res){

		var tr=req.params.top_right;
		var bl=req.params.bottom_left;//.split(',');

		var errors=[];
		var validated=true;
		if(tr[0] === 'undefined' || !validator.isFloat(tr[0],{min:-90,max:90})) {
			validated=false;
			errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
		}
		if(tr[1] === 'undefined' || !validator.isFloat(tr[1],{min:-180,max:180})) {
			validated=false;
			errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
		}
		if(bl[0] === 'undefined' || !validator.isFloat(bl[0],{min:-90,max:90})) {
			validated=false;
			errors.push("Missing or invalid value for tbottom_right (-90 - 90, -180 - 180)");
		}
		if(bl[1] === 'undefined' || !validator.isFloat(bl[1],{min:-180,max:180})) {
			validated=false;
			errors.push("Missing or invalid value for bottom_right (-90 - 90, -180 - 180");
		}

		if(!validated){
		logger.log('error','Validation Error in GET request');
		     return res.send (400, {
	            status: 'Request failed validation',
	            errors: errors
	        });
		}

		var datePrecision=parseInt(req.params.datePrecision) || 365;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	

		}

		var m = [];
		req.params.measurement=true;
		var precision=parseInt(req.params.geohashPrecision) || 8;
		m.push({range:range});
  		m.push({
  			geo_bounding_box:{
  				location:{
						top_right:[parseFloat(tr[1]),parseFloat(tr[0])],
						bottom_left:[parseFloat(bl[1]),parseFloat(bl[0])]
					}
				}
			});		
		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  		case 'geohashPrecision':
		  		case 'bottom_left':
		  		case 'top_right':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);
		  	}	
		}	
		
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
		       	cellgrid:{
		       		geohash_grid:{
		       			field:"location",
		       			precision:precision
		       		},
		       		aggs:{
		       			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			}
		       		}
		       	}	
		    }
		  }
		// console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {

			
			body.geohash_precision=precision;
			body.start_date=startDate;
			body.end_date=endDate;

			res.send(body);
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},

	getCellDetails:function(req,res){
		var m=[]
		var term={
			term:{
				uuid:req.params.uuid
			}
		};
		m.push(term);
		var q={
		  	explain:false,
		  	size:0,
		    query:{
		      filtered:{
		        filter:{
		          bool:{
		            must:m
		          }
		        }
		      }
		    },
		    aggs:{
		    	distinctsource:{
		    		terms:{
		    			field:'source',
		    			size:100
		    		},
		    		aggs:{
		    			topsignalhit:{
		    				top_hits:{
		    					sort:[
		    						{
		    							
		    							signal:{order:'desc'},
		    							timestamp:{order:'desc'}

		    						}
		    					],

		    					size:1
		    				}
		    			},
		    			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			}


		    		}

		    	}
		    }
		}
		//console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {
			res.send(body);
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},

	getCell: function(req,res){

		//curl -X GET https://localhost:3000/cellmeasurements-dev?mcc=204
		var timestamp;
		if (req.params.timestamp != undefined && req.params.timestamp != "")
			timestamp = req.params.timestamp;
		else
			timestamp = new Date().getTime();
		req.params.measurement=false;

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
		        },
		        query:{
		          function_score:{
		            functions:[
		            	{
		            		exp:{
		            			timestamp:{
		            				origin:parseFloat(timestamp),
		            				scale:"7d",
		            				offset:"7d",
		            				decay:0.98	//about 1 year to get to zero
		            			}

		            		}
		            	}
		            
		            ]
		          }
		        }
		      }
		    },
		    size: size
		  }

		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {

			getBestMeasurement(req,function(measurements){
				
				var ret=[]
				ret=ret.concat(measurements);
				if(body.hits.total==0){
					res.send(ret);
				}else{
					
					for(var i = 0; i < body.hits.hits.length; i++){
						body.hits.hits[i]._source._score=body.hits.hits[i]._score;
						body.hits.hits[i]._source._id=body.hits.hits[i]._id;
						ret.push(body.hits.hits[i]._source);
					}
					res.send(ret);
						
					
				}
			});
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},


	getCellsAtLocation:function(req,res){

		var datePrecision=parseInt(req.params.datePrecision) || 100;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	

		}

		var m = [];
		//req.params.measurement=true;
		var precision=parseInt(req.params.geohashPrecision) || 7;

		
  		m.push({
  			geohash_cell:{
  				location:{
			  			lat:parseFloat(req.params.lat),
			  			lon:parseFloat(req.params.lng)
					},
			  		precision:precision
				}
			});		

		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'lat':
		  		case 'geohashPrecision':
		  		case 'lng':
		  		case 'serving':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);

		  	}
		}
		
		 var q={
		 	size:0,
		 	query:{
			  	filtered:{
		        	filter:{
		          		bool:{
		            		must:m
		          		}
		        	},
			  	}
		  	},
			 aggs:{
		       	cells:{
		       		terms:{
		       			field:"uuid",
		       			size:1000
		       		},
		       		aggs:{
		       			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			},
		       			mcc:{
		       				max:{
		       					field:'mcc'
		       				}
		       			},
		       			net:{
		       				max:{
		       					field:'net'
		       				}
		       			},
		       			area:{
		       				max:{
		       					field:'area'
		       				}
		       			},
		       			cell:{
		       				max:{
		       					field:'cell'
		       				}
		       			},
		       			radio:{
		       				terms:{
		       					field:'radio'
		       				}
		       			},
		       			measurement:{
			       			terms:{
		       					field:'measurement'
		       				}
		       			},
		       			
		       			source:{
		       				terms:{
		       					field:'source'
		       				}
		       			},
		       			uuid:{
		       				terms:{
		       					field:'uuid'
		       				}
		       			}

		       		}
		       	}	
		    }
		  }
		

		//console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {
			//console.log(body);
			var ret={}
			ret.geohashes=[];
			ret.geohashes.push({key:geohash.encode(parseFloat(req.params.lat),parseFloat(req.params.lng),precision)});
			ret.results=body.aggregations.cells.buckets
			ret.results.forEach(function(result){
				result.mcc=result.mcc.value;
				result.net=result.net.value;
				result.area=result.area.value;
				result.cell=result.cell.value;
				result.maxSignal=result.maxSignal.value;
				result.timestamp=result.lastSeen.value;
				result.firstSeen=result.firstSeen.value;
				result.radio=result.radio.buckets[0].key;
				result.source=result.source.buckets[0].key;
				//result.source='measurement';
				result.measurement=result.measurement.buckets[0].key;
				result.uuid=result.uuid.buckets[0].key;
			});


			res.send(ret);
			

		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

		
	},

	postCell: function(req,res){

		var validated=true;
		var errors=[];
		
		delete(req.params.apiKey);	
		
		//Quick validation for input, rest is handled by elasticSearch
		if(req.params.mcc === 'undefined' || !validator.isInt(req.params.mcc,{min:1,max:999})) {
			validated=false;
			errors.push("Missing or invalid value for mcc (1-999)");
		}
		if(req.params.net === 'undefined'  || !validator.isInt(req.params.net,{min:1,max:999})) {
			validated=false;
			errors.push("Missing or invalid value for net (1-999)");
		}
		if(req.params.area === 'undefined'  || !validator.isInt(req.params.net,{min:1,max:65536})) {
			validated=false;
			errors.push("Missing or invalid value for area (1-65536)");
		}
		if(req.params.cell === 'undefined' || !validator.isInt(req.params.net,{min:1})) {
			validated=false;
			errors.push("Missing or invalid value for cell (1)");
		}

		if(req.params.location === 'undefined' || !Array.isArray(req.params.location) || req.params.location.length<2 ) {
			validated=false;
			errors.push("Missing or invalid value for Location [lat,lon]");
		}
		else{
		 if(!validator.isFloat(req.params.location[0],{min:-180,max:180}) || !validator.isFloat(req.params.location[1],{min:-90,max:90})){
		 	validated=false;
			errors.push("Invalid value for Location [(-180 - 180),(-90 - 90)]");	
		 }	
		}


		//Add timestamp if needed

		if(!req.params.timestamp) {
			req.params.timestamp=new Date().getTime();
		}
		
		if(!req.params.uuid) {
			req.params.uuid=req.params.mcc.toString() +'-'+ req.params.net.toString() +'-'+ (req.params.area || 0).toString()+'-'+req.params.cell.toString();
		}
		if(!req.params.provider) {
			req.params.provider=req.params.mcc.toString() +'-'+ req.params.net.toString();
		}


		if(validated){
			//Create unique ID
			var md5sum=crypto.createHash('md5');
			
		    	var id=req.params.mcc.toString()+req.params.net.toString()+(req.params.area||0).toString() +req.params.cell.toString()+req.params.location[0].toString()+req.params.location[1].toString()+req.params.timestamp.toString();
	    	id=md5sum.update(id).digest("hex");
			
			esClient.index({
		    	index:config.elasticsearch.index,
		    	type:config.elasticsearch.type,
		    	id:id,
		    	body:req.params,
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

module.exports=measurementController;
