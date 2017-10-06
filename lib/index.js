const dutils = require('dmidz-utils')
	;


function Module( options ) {
	const me = this;
	me.options = dutils.mixin({//__ default options
	}, options, true );

}

Module.prototype = {
	initialize : function(){

	}
};

//__________ exports
module.exports = Module;
