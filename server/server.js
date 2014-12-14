/*global require, console */
'use strict';
var Hapi = require('hapi'),
    fs   = require('fs'),
    ghost = require('./ghost-server.js'),
    host = 'localhost',
    port = 8000,
    server,
    words,
    game;

// Initialise server
server = new Hapi.Server(host, port);

// Synchronous read - we won't start he game until it's loaded
// Could be rewritten with a Stream to save memory
/*jslint node: true, stupid: true */
words = fs.readFileSync('word.lst').toString().split('\n');

// Start new game, min word length is 4
game = new ghost.Game(new ghost.TrieModel(words, 4));

// Let the garbage collector free up memory
words = null;

// Add route
/*jslint unparam: true, node: true */
server.route({
    method: 'GET',
    path:   '/nextletter/{word}',
    handler: function (request, reply) {

        var response = reply(JSON.stringify(
            game.getNextLetter(request.params.word)
        ));

        response.type('application/json');
        response.header('Access-Control-Allow-Origin', '*');
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});