
const Lab = require('lab')
	, lab = exports.lab = Lab.script()
	, Hapi = require('hapi')
	;

lab.experiment('dmidz-hapi-content-negociation', function(){

	//__ server
	const server = new Hapi.Server();

	const some_property = 'property from default payload'
		,another_property = 'Yo!';

	lab.before(function( ){
		//__ connections
		server.connection( {
			host: 'localhost'
			, port : process.env.port || 3000
		} );


		server.route( [
			{
				method: 'GET'
				, path: '/a'
				, config : {
					app:{ view:'my_view' },
					handler: function (request, reply) {
						return reply({ title: 'Welcome', content:'Hello !' });
					}
				}
			}
			,{
				method: 'GET'
				, path: '/b'
				, config : {
					handler: function (request, reply) {
						request.app.view = 'my_view';
						request.app.view_payload.another_property = another_property;
						return reply({ title: 'Welcome', content:'Hello !' });
					}
				}
			}
			,{
				method: 'GET'
				, path: '/d'
				, config : {
					handler: function (request, reply) {
						request.app.view = 'my_view';
						reply( new Error('Here is a terrible error !') );
					}
				}
			}
		] );

		return server.register( {
			register : require( 'vision' )
		}).then(function(){
			const views_options = {
				engines: {
					pug: {
						module : require('pug')// can set specific engine options here
					}
				}
				// ,allowAbsolutePaths : true
				,isCached : false// use true in prod
				,relativeTo: __dirname
				,path: 'views'
			};

			return server.views( views_options );

		}).then(function(){
			return server.register( {
				register : require( '../lib' )
				, options: { getViewsPayload:function(){
					return { some_property:some_property }
				}}
			} );
		}).then(function(){
			return server.initialize();
		});

	});

	//_________ tests
	lab.test('default Accept application/json', function( ){
		return server.inject({
			method : 'GET', url : '/a'
		}).then( function(res){
			Lab.expect( res.statusCode ).to.equal( 200 );
			Lab.expect( res.result ).to.be.an.object();
			Lab.expect( res.result.title ).to.equal('Welcome');
			Lab.expect( res.result.content ).to.equal('Hello !');
			Lab.expect( res.payload.indexOf(some_property) ).to.equal(-1);
			// console.log('res', res );
		});
	});

	lab.test('view with Accept text/html and with default view payload', function( ){
		return server.inject({
			method : 'GET', url : '/a'
			, headers : { Accept : 'text/html' }
		}).then( function(res){
			Lab.expect( res.statusCode ).to.equal( 200 );
			Lab.expect( res.headers['content-type'].indexOf('text/html') ).to.not.equal( -1 );
			Lab.expect( res.result.indexOf('<!DOCTYPE html>') ).to.not.equal(-1);
			Lab.expect( res.result.indexOf(some_property) ).to.not.equal(-1);
		});
	});

	lab.test('view set in request.app.view and with request.view_payload property', function( ){
		return server.inject({
			method : 'GET', url : '/b'
			, headers : { Accept : 'text/html' }
		}).then( function(res){
			// console.log('res', res.result );
			Lab.expect( res.statusCode ).to.equal( 200 );
			Lab.expect( res.headers['content-type'].indexOf('text/html') ).to.not.equal( -1 );
			Lab.expect( res.result.indexOf('<!DOCTYPE html>') ).to.not.equal(-1);
			Lab.expect( res.result.indexOf(another_property) ).to.not.equal(-1);
		});
	});

	lab.test('view error 404', function( ){
		return server.inject({
			method : 'GET', url : '/c'
			, headers : { Accept : 'text/html' }
		}).then( function(res){
			// console.log('res', res.result );
			Lab.expect( res.statusCode ).to.equal( 404 );
			Lab.expect( res.headers['content-type'].indexOf('text/html') ).to.not.equal( -1 );
		});
	});

	lab.test('view error 500', function( ){
		return server.inject({
			method : 'GET', url : '/d'
			, headers : { Accept : 'text/html' }
		}).then( function(res){
			// console.log('res', res.result );
			Lab.expect( res.statusCode ).to.equal( 500 );
			Lab.expect( res.headers['content-type'].indexOf('text/html') ).to.not.equal( -1 );
		});
	});
});

