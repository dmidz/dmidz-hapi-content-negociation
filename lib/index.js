const Promise = require('bluebird')
	, dutils = require('dmidz-utils')
	, Negotiator = require('negotiator')
	// , Path = require('path')
	// , Boom = require('boom')
	// , Bunyan = require('bunyan')
	// , bformat = require('bunyan-format')
	// , formatOut = bformat({ outputMode: 'json' })
;

function ContentNegociation( server, options ) {
	const me = this;
	me.options = dutils.mixin({//__ default options
		avail_types : ['text/html', 'text/plain', 'application/json']
		, dir_views: 'views'
	}, options, true );

	me.server = server;

	me.server.ext('onPostHandler', function(request, reply){
		const negotiator = new Negotiator( request );
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
					let view = '_default';
					if( request.route.settings.app.view ){
						view = request.route.settings.app.view;
						if(check(view,'f')) view = view( request );
					}
					// view = Path.join( me.options.dir_views, view );

					// __ insert payload in sub object
					let data = payload;
					payload = request.app.view_ctx || {};
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
				res = reply.view( 'error', payload );
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
