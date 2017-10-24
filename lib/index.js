const Promise = require('bluebird')
	, dutils = require('dmidz-utils')
	, Negotiator = require('negotiator')
;

function ContentNegociation( server, options ) {
	const me = this;
	me.options = dutils.mixin({//__ default options
		//__ set default as first of avail_types, so it will be taken when no request header Accept
		avail_types : ['application/json','text/html', 'text/plain']
		, view_error : 'error'
		, getViewsPayload : null//__ default view payload for all routes
	}, options, true );

	me.server = server;

	me.server.ext('onPreHandler', function(request, reply){
		if(!request.app.view_payload){
			request.app.view_payload = {};
			if( check(me.options.getViewsPayload, 'f'))   request.app.view_payload = me.options.getViewsPayload( request );
		}
		reply.continue();
	});


	me.server.ext('onPreResponse', function(request, reply){
		if( dutils.get( request, 'response.headers.location' ) || request.response.variety == 'stream' )   return reply.continue();

		const negotiator = new Negotiator( request );
		// console.log('request', request.headers );
		let media_type = negotiator.mediaType( me.options.avail_types );

		let is_view = media_type == 'text/html';

		if( is_view && !reply.view ){
			console.warn(new Error('view wanted but reply.view is undefined, check vision plugin is registered.'));
			// me.server.logger.warn('view wanted but reply.view is undefined, check vision plugin is registered.');
			is_view = false;
			media_type = 'application/json';
		}

		let res = null;
		new Promise(function(resolve, reject){
			if(request.response.isBoom)    return reject( request.response );
			resolve( request.response.source );
		}).then(function( payload ){

			if(request.response.headers && request.response.headers['content-type'])    return reply.continue();

			let handled = true;
			switch(media_type){
				case 'text/html' :
					let view = request.app.view || request.route.settings.app.view;
					if(check(view,'f')) view = view( request );

					// __ insert payload in sub object
					let data = payload;
					payload = request.app.view_payload || {};
					payload.data = data;

					res = reply.view( view, payload );
					break;
				case 'application/json' :
					res = reply( payload );
					break;
				default : handled = false; break;
			}
			if(handled){
				if( request.response.headers )  res.headers = request.response.headers;
				return res;
			}else{
				reply.continue();
			}
		}).catch(function( err ){
			let payload = dutils.get(err, 'output.payload', err );
			if(is_view){
				res = reply.view( me.options.view_error, payload );
			}else{
				res = reply( payload );
			}
			if( res.code )    res.code( err.output.payload.statusCode );
			return res;
		});

	});

}

//__________ exports
exports.register = function( server, options, next ){
	new ContentNegociation( server, options );
	next();
};

exports.register.attributes = {
	name: 'dmidz-hapi-content-negociation',
	version: '1.0.0'
};
