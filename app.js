import { app, query } from 'mu';

app.get('/', function( req, res ) {
  res.send('Hello mu-javascript-template');
} );


app.get('/generate', function( req, res ) {
    
  // query( myQuery )
  //   .then( function(response) {
  //     res.send( JSON.stringify( response ) );
  //   })
  //   .catch( function(err) {
  //     res.send( "Oops something went wrong: " + JSON.stringify( err ) );
  //   });
} );
