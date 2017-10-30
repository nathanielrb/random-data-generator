var request = require('request');
var uuidv4 = require('uuid/v4');

module.exports = {
    /*
      Sends a query and returns the response body
      TODO: Add Error handling etc.
      TODO: Add JSON support

      # Example Use
      ```
      var query = "SELECT * WHERE { ?s ?p ?o .}";
      var endpoint = "http://db/sparql";

      var result = getQuery(query, endpoint);
      ```
    */
    getQuery: function(query, sparqlEndpoint) {
        sparqlEndpoint = typeof sparqlEndpoint !== 'undefined' ? sparqlEndpoint : 'http://database:8890/sparql';
        var encoded_query = encodeURIComponent(query);
        request({
            url: sparqlEndpoint + '?query=' + encoded_query,
            headers: {
                'mu-session-id': 'session0'
            }
        }, function (error, response, body) {
            return body;
        });
    },

    /*
      returns the data formatted as a SPARQL compliant literal
      TODO: add remaining types

      # Example Use
      ## String
      ```
      formatAsSPARQLType("test", "string", {});
      ```
      ```
      > "\"test\""
      ```
    */
    formatAsSPARQLType: function(data, format, options) {
        if(format === "string") {
            return "\"" + data + "\"";
        }

        if(format === "date") {
            return "\"" + data + "\"^^xsd:date";
        }

        if(format === "number") {
            return data;
        }
    },

    /*
      Takes an javascript object (hash) and uses the resourceClass, resourceBase and properties
      to turn that object into a query that can be written to the triple store.

      Then the functions returns a hash with the UUID and the URI for the newly created object
      (this is important for creating relations).

      # Example Use
      ```
      var data = {
        name: "John Snow",
        birthDate: new Date("01-01-1995")
      };
      var resourceClass = "http://game-of-thrones.com/types/Character";
      var resourceBase = "http://game-of-thrones.com/characters/";
      var properties = [
      {
        key: "name",
        predicate: "http://xmlns.com/foaf/0.1/name",
        type: {
          type: "string",
          options: {}
        }
      },
      {
        key: "birthDate",
        predicate: "http://mu.semte.ch/vocabularies/ext/birthDate",
        type: {
          type: "date",
          options: {}
        }
      }];
      writeObjectToStore(data, resourceClass, resourceBase, properties);
      ```
      The result of this call will put John Snow in the triple store, with the type character, a mu uuid and the passed properties.
      The return value will be a hash containing the URI and the UUID for John Snow.
    */
    writeObjectToStore: function(data, resourceClass, resourceBase, properties) {
        var uuid = data.uuid || uuidv4();
        var uri = data.uri || "<" + resourceBase + uuid + ">";

        var query = "INSERT DATA { GRAPH " + "<http://mu.semte.ch/application> { ";
        query += uri + " a <" + resourceClass + ">; ";
        query += "<http://mu.semte.ch/vocabularies/core/uuid> \"" +  uuid + "\";";

        var relations = properties.filter(function(property) {
            return property.type.type === "relation";
        });

        var properties = properties.filter(function(property) {
            return property.type.type !== "relation";
        });

        var property, predicate, key, type, options, value;
        for(property in properties) {
            predicate = properties[property]['predicate'];
            key = properties[property]['key'];
            type = properties[property]['type']['type'];
            options = properties[property]['type']['options'];
            value = this.formatAsSPARQLType(data[key], type, options);

            query += "<" + predicate + "> " + value + ";"
        }
        
        var relation, rel;
        for(relation in relations) {
            var relationKey = relations[relation].key;
            var relationPredicate = relations[relation].predicate;
            var relationProperties = relations[relation].type.options;
            var relationData = data[relationKey];

            for(rel in relationData) {
                // relation is an existing object
                if(relationData[rel].uri)
                    var relationIdentifiers = relationData[rel];
                // create new object
                else
                    var relationIdentifiers = this.writeObjectToStore(relationData[rel],
                                                                      relationProperties.relationClass,
                                                                      relationProperties.relationBase,
                                                                      relationProperties.relationProperties
                                                                     );

                query +=  " <" + relationPredicate + "> " + relationIdentifiers.uri + "; ";
            }
        }

        query += " } }";

        this.getQuery(query);

        return {
            uuid: uuid,
            uri: uri
        };
    }
};
