'use strict'
var restify = require('restify');
var config = require('../config/config');
var measurementController=require('../controllers/measurement.js');
var providerController=require('../controllers/providers.js');
var devicesController=require('../controllers/devices.js');
var logger = require('../utils/logger');


function Routes(server) {
	
	var Models={
		Provider: {
			id:"Provider",
			properties:{
				country:{
					type:"string",
					description: "Name of Country (english)"
				},
				iso:{
					type:"string",
					description: "ISO code of country"	
				},
				mcc : {
					type:'integer',
					description:'Mobile Country Code.'
				},
				net : {
					type:'integer',
					description:'For GSM, UMTS and LTE this is the MNC.'
				},
				brand:{
					type:"string",
					description:'Brand name of Provider'	
				},
				name:{
					type:"string",
					description:'Full name for provider'
				},
				status:{
					type:"string",
					description:'Current status for provider'
				},
				bands:{
					type:"string",
					description:'Descriptions of Bands/Radio use by provider'
				},
				notes:{
					type:"string",
					description:'Additional notes'
				}
			}
		},
		Providers: {
			id:"Providers",
			properties:{
				key:{
					type:"string",
					description: "MCC-NET for provider"
				},
				doc_count:{
					type:"string",
					description: "Number of measurements from this provider"	
				}

			}
		},

		Devices: {
			id:"Devices",
			properties:{
				key:{
					type:"string",
					description: "ID of celllogger type device"
				},
				doc_count:{
					type:"string",
					description: "measurements from this device"	
				}
			}
		},

		Device_properties: {
			id:"Device_properties",
			properties:{
				key:{
					type:"string",
					description: "ID of celllogger type device"
				},
				doc_count:{
					type:"string",
					description: "measurements from this device"	
				}
			}
		},

		Count: {
			id:"Count",
			properties:{

				total:{
					type:'integer',
					description:'Total number of measurements in ES database'
				}

			}
		},

		Coverage : {
			id:"Coverage",
			properties:{

				aggregations:{
					type:'string',
					description:'Elasticsearch Buckets'
				}

			}
		},
		Cell : {
			id:"Cell",
			properties :{
				radio : {
					type:'string',
					description:'Network type: One of the string GSM, UMTS or LTE.'
				},
				mcc : {
					type:'integer',
					description:'Mobile Country Code.'
				},
				net : {
					type:'integer',
					description:'For GSM, UMTS and LTE this is the MNC.'
				},
				area : {
					type:'integer',
					description:'For GSM and UMTS this is the LAC, for LTE this is the TAC.'
				},
				cell : {
					type:'integer',
					description:'For GSM and LTE this is the cell ID, for UMTS this is the UTRAN cell id which is the concatenation of 2 bytes of radio network controller code(RNC) and 2 bytes of cell id.'
				},
				unit: {
					type:'integer',
					description:'for UMTS this is the primary scrambling code (PSC), for LTE this is the physical cell id (PCI). For GSM this field is left empty.'
				},
			    location: { 
			    	type:'array',
			    	description:'Location of the cell or measurement'
			    },
			    band: {
					type:'integer',
					description:'Frequency band for Radio'
			    },
			    channel:{
			    	type:"integer",
			    	description:'Channel for Cell'
				},
				hdop:{
					type:"float",
					description:'Horizontal Dillution of Precision'
				},
				sattellites:{
					type:"integer",
					description:'Number of GNSS Sattellites in view for measurement'	
				},
				serving:{
					type:"boolean",
					description:'Measurement ad serving cell or neighbour'	
				},
				altitude:{
					type:"integer",
					description:'Altitude of measurement'	
				},
			    azimuth: {
					type:'integer',
					description:'Azimuth for cell'
			    },
			    beamwidth: {
					type:'integer',
					description:'Beamwidth of cell'
			    },
			    measurement:{
			    	type:'boolean',
			    	description:'Defines if it\'s a cell location (FALSE) or a measurement(true)'
			    },
			    signal: {
					type:'integer',
					description:'Signal strength of cell at location'
			    },
			    timestamp:{
			    	type:'date',
					description:'Date/time for measurement or source data'	
			    },
			    source: {
			    	type:'string', 
			    	description:'Type definition for source (i.e. Vodafone,KPN,Celllogger,OpenCellId)'
			    },
			    source_id: {
			    	type:'string',
			    	description:'Additional Source information (i.e. Cellogger ID, filename)'	
				}


			}
		}

	}

	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name,
			models:Models,
			swagger: {
				summary: 'Find Cell',
				notes: 'GET route for cell_measurements',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Measurement data',
            			responseModel:'Cell'
            		}
            	]
			},
			validation: {
				queries:{
					mcc:{isRequired:false,isInt:true},
					net:{isRequired:false,isInt:true},
					area:{isRequired:false,isInt:true},
					cell:{isRequired:false,isInt:true},
					unit: {isRequired:false,isInt:true},
					radio:{isRequired:false,isIn:['GSM','UMTS','LTE']},
					band:{isRequired:false,isInt:true},
					channel:{isRequired:false,isInt:true},
					timestamp:{isRequired:false,isDate:true},
					source:{isRequired:false},
					measurement:{isRequired:false,isBoolean:true},
					serving:{isRequired:false,isBoolean:true},
					size:{isRequired:false,isInt:true,description:'Max number of hits to return'}
				}
			}
		},
		measurementController.getCell
	);

	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name+'/details',
			models:Models,
			swagger: {
				summary: 'Get Cell Details based on uuid',
				notes: 'GET route for cell_measurements',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Measurement data',
            			responseModel:'Cell'
            		}
            	]
			},
			validation: {
				queries:{
					uuid:{isRequired:true},
				}
			}
		},
		measurementController.getCellDetails
	);

	server.get(

		{
			url: '/v1/' + config.service.name +'/coverage',
			models:Models,
			swagger: {
				summary: 'Find coverage of measurements in area',
				notes: 'GET route for measurement coverage',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Coverage',
            			responseModel:'Coverage'
            		}
            	]
			},
			validation: {
				queries:{
					top_right:{isRequired:true,description:'Lat,Lon of top right corner of bbox'},
					bottom_left:{isRequired:true,description:'Lat,Lon of bottom left corner of bbox'},
					timestamp:{isRequired:false},
					geohashPrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Geohash precision value: between 1 (~ 5000 x 5000 km) and 12 (~ 4 x 2 cm). Default value=8 (~ 40 x 20 m)'},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getMeasurementCoverage
	);

	server.get(

		{
			url: '/v1/' + config.service.name +'/cells',
			models:Models,
			swagger: {
				summary: 'Find cell coverage for location',
				notes: 'GET route for location coverage',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Coverage',
            			responseModel:'Cell'
            		}
            	]
			},
			validation: {
				queries:{
					lat:{isRequired:true,description:'Lat of location'},
					lng:{isRequired:true,description:'Lng of location'},
					timestamp:{isRequired:false},
					geohashPrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Geohash precision value: between 1 (~ 5000 x 5000 km) and 12 (~ 4 x 2 cm). Default value=8 (~ 40 x 20 m)'},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getCellsAtLocation
	);



	server.get(

		{
			url: '/v1/' + config.service.name +'/measurementcount',
			models:Models,
			swagger: {
				summary: 'Find number of measurements in database',
				notes: 'GET route for measurement count',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Coverage',
            			responseModel:'Count'
            		}
            	]
			},
			validation: {
				queries:{
					timestamp:{isRequired:false},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getMeasurementCount
	);

	server.get(

		{
			url: '/v1/' + config.service.name +'/measurementcellcount',
			models:Models,
			swagger: {
				summary: 'Find number of unique cells in measurements',
				notes: 'GET route for unqiue cell count',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Coverage',
            			responseModel:'Count'
            		}
            	]
			},
			validation: {
				queries:{
					timestamp:{isRequired:false},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getMeasurementCellCount
	);

	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name +'/cellcoverage',
			models:Models,
			swagger: {
				summary: 'Find Cell coverage based on measurements',
				notes: 'GET route for cell coverage',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Coverage',
            			responseModel:'Coverage'
            		}
            	]
			},
			validation: {
				queries:{
					// mcc:{isRequired:false,isInt:true},
					// net:{isRequired:false,isInt:true},
					// area:{isRequired:false,isInt:true},
					uuid:{isRequired:false},
					radio:{isRequired:false,isIn:['GSM','UMTS','LTE']},
					timestamp:{isRequired:false,isDate:true},
					serving:{isRequired:false,isBoolean:true},
					geohashPrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Geohash precision value: between 1 (~ 5000 x 5000 km) and 12 (~ 4 x 2 cm). Default value=8 (~ 40 x 20 m)'},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getCellCoverage
	);



	server.get(
		{
			url: '/v1/' + config.service.name +'/test/:mcc/:net/:area/:cell',
			models:Models,
			swagger: {
				summary: 'Find Cell by MCC/NET/AREA/CELL',
				notes: 'GET route for cell_measurements',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Cell Measurement data',
            			responseModel:'Cell'
            		}
            	]
			},
			validation: {
				resources:{
					mcc:{isRequired:true,isInt:true},
					net:{isRequired:true,isInt:true},
					area:{isRequired:true,isInt:true},
					cell:{isRequired:true,isInt:true},
				}
			}


		},
		measurementController.getCell
	);


	
	server.post(
		{
			url: '/v1/' + config.service.name ,
			
			swagger: {
	            summary: 'Add cell or measurement to Cell Database',
	            docPath: 'v1/' + config.service.name
		    },
		    models:Models,
		    validation: {
		    	//resources,queries,content
		    	content:{
			    	Cell:{ swaggerType:'Cell'},

		    	}
		        
		    }



		},
		measurementController.postCell
	);

	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name+'/provider',
			models:Models,
			swagger: {
				summary: 'Find Provider',
				notes: 'GET route for providers',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Provider Information',
            			responseModel:'Provider'
            		}
            	]
			},
			validation: {
				queries:{
					mcc:{isRequired:false,isInt:true},
					net:{isRequired:false,isInt:true},
					country:{isRequired:false}
				}
			}
		},
		providerController.getProvider
	);

	server.get(
		{
			url: '/v1/' + config.service.name+'/measurementproviders',
			models:Models,
			swagger: {
				summary: 'Find distinct providers within measurements (celllogger only!)',
				notes: 'GET route for distinct providers',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Provider Information',
            			responseModel:'Providers'
            		}
            	]
			}
		},
		providerController.measurementProviders
	);


	server.post(
		{
			url: '/v1/' + config.service.name +'/provider',
			
			swagger: {
	            summary: 'Add provider info to provider Database',
	            docPath: 'v1/' + config.service.name
		    },
		    models:Models,
		    validation: {
		    	//resources,queries,content
		    	content:{
			    	Provider:{ swaggerType:'Provider'},

		    	}
		        
		    }



		},
		providerController.postProvider
	);



	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name+'/devices',
			models:Models,
			swagger: {
				summary: 'Find devices',
				notes: 'GET route for devices',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Device Information',
            			responseModel:'Devices'
            		}
            	]
			},
			validation: {
				queries:{
					
				}
			}
		},
		devicesController.devices
	);


	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name+'/device/:source_id',
			models:Models,
			swagger: {
				summary: 'Find devices',
				notes: 'GET route for devices',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Device Information',
            			responseModel:'Device_properties'
            		}
            	]
			},
			validation: {
				resources:{
					source_id:{isRequired:true}
					
				}
			}
		},
		devicesController.deviceproperties
	);




}

module.exports.routes=Routes;