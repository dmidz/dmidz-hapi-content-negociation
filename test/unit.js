
const Path = require('path')
	// , dutils = require( 'dmidz-utils')
	// , Promise = require('bluebird')
	, App = require( '../lib')
	, Lab = require('lab')
	, lab = exports.lab = Lab.script()
	, plugin_route_prefix = '/myprefix'
	;

lab.experiment('dmidz-app', function(){

	lab.before(function( done ){

		app.initialize().then( function(){
			done();
		});

	});

	//_________ tests
	lab.test('initialize with no errors, having routes.', function( done ){
		const routes = app.server.getAllRoutes();
		Lab.expect( routes ).to.be.an.array();
		Lab.expect( routes ).to.have.length( 2 );
		done();
	});

	lab.test('plugin route with prefix', function(){
		return app.server.inject( {
			url : plugin_route_prefix+'/hello'
			, method : 'get'
		} ).then( function( res ){
			Lab.expect( res.statusCode ).to.equal( 200 );
			Lab.expect( res.result ).to.be.an.object();
			Lab.expect( res.result.title ).to.be.equal('homepage');
		});
	});
});

