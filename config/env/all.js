'use strict';
var config={};

config.providermapping={
    
    mapping:{
		provider:{
			properties:{
				country:{
					type:"string"
				},
				iso:{
					type:"string",
					index: "not_analyzed"	
				},
				mcc:{type:"integer"},
				net:{type:"integer"},
				brand:{
					type:"string"
				},
				name:{
					type:"string"
				},
					status:{type:"string",
					index: "not_analyzed"	
				},
				bands:{type:"string"},
				notes:{type:"string"}

				
			}
		}
    }

}
module.exports=config;