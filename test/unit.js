
const Lab = require('lab')
	, lab = exports.lab = Lab.script()
	, Hapi = require('hapi')
	// , Path = require('path')
	// , dutils = require( 'dmidz-utils')
	// , Promise = require('bluebird')
	;

lab.experiment('dmidz-hapi-content-negociation', function(){

	//__ server
	let server = new Hapi.Server();


	lab.before(function( done ){
		//__ connections
		server.connection( {
			host: 'localhost'
			, port : process.env.port || 3000
		} );

		server.route( [{//_ home
			method: 'GET'
			, path: '/'
			, config : {
				handler: function (request, reply) {
					return reply({ title: 'homepage', content:'Hello !' });
				}
			}
		}] );

		server.initialize().then(function(){
			done();
		});
	});

	//_________ tests
	lab.test('TODO test', function( done ){
		done();
	});

});

