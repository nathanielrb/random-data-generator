// import { app, query } from 'mu';
import mu from 'mu';

var generator = require('/app/generate');

mu.app.get('/', function( req, res ) {
  res.send('Hello mu-javascript-template');
} );


mu.app.post('/generate', function(req, res) {
    console.log("starting...");
    generator.run(req);
    res.send('OK');
  // query( myQuery )
  //   .then( function(response) {
  //     res.send( JSON.stringify( response ) );
  //   })
  //   .catch( function(err) {
  //     res.send( "Oops something went wrong: " + JSON.stringify( err ) );
  //   });
} );
