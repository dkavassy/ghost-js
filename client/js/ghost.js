/*global console, angular */
(function () {
    'use strict';

    var app,
        api_url = 'http://localhost:8000/nextletter/';

    // Game module
    app = angular.module('ghost', []);

    // Game controller
    app.controller('GhostController', ['$http', function ($http) {

        // the word so far
        this.word   = '';

        // the player's choice
        this.letter = '';

        // who won? message to the player
        this.status = '';

        // has the game ended?
        this.end = false;

        var ghost = this;

        // Handle user submissons
        this.submitLetter = function () {

            // Add user's choice
            ghost.word += ghost.letter;

            // Send the player's choice appended to the current fragment
            $http.get(api_url + ghost.word)
                .success(function (data) {

                    // Update word with computer's choice
                    ghost.word += data.letter;

                    // Reset player's choice
                    ghost.letter = '';

                    // Has anyone won? If so, update the status and end indicator
                    if (data.win !== null) {
                        if (data.win === 'computer') {
                            ghost.status = 'Computer wins! ' + data.reason;
                        } else if (data.win === 'human') {
                            ghost.status = 'Player wins!';
                        }

                        ghost.end = true;
                    }

                    //// Debug
                    // console.log(data);
                })
                .error(function () {
                    console.error('Error');
                });
        };

        // Clear the word, the status and start a new game
        this.newGame = function () {
            ghost.word   = '';
            ghost.status = '';
            ghost.end    = false;
        };
    }]);

}());