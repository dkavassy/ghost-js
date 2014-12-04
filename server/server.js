/*
 * Ghost v0.2
 */
/*global require, console */
(function () {
    "use strict";

    var Hapi = require('hapi'),
        fs   = require('fs'),
        server,
        words,
        Game,
        Trie;

    // Initialise server
    server = new Hapi.Server('localhost', 8000);

    // Synchronous read - we won't start he game until it's loaded
    // Could be rewritten with a Stream to save memory
    /*jslint node: true, stupid: true */
    words = fs.readFileSync('word.lst').toString().split('\n');

    // Trie-based implementation
    Trie = (function (words) {

        // Node constructor to represent nodes in our trie
        function Node(letter) {
            // letter
            this.lt = letter;
            // children
            this.ch = [];
        }

        /**
         * Is this node a leaf i.e. completes word
         * @return {Boolean} true if leaf, false if not
         */
        Node.prototype.isLeaf = function () {

            if (this.$ !== undefined) {
                return true;
            }

            return false;
        };

        // Trie to store the dictionary
        var trie = new Node();

        /**
         * Init: builds the trie, requires a word list
         */
        (function () {
            var cur_node = trie,
                i,
                j,
                word,
                letter;

            // Build a trie
            for (i in words) {
                if (words.hasOwnProperty(i)) {
                    word = words[i].split('');

                    // We only deal with words of 4 letter or longer
                    if (word.length >= 4) {

                        // Insert word into trie
                        for (j = 0; j < word.length; j += 1) {

                            letter = word[j];

                            if (cur_node.isLeaf()) { // is a leaf
                                // we already have a word at this point which is shorter
                                // we have no need for a longer word
                                // as the shorter word already completes it
                                break;
                            }

                            if (cur_node[letter] === undefined && j < words.length - 1) {
                                cur_node[letter] = new Node(letter);
                                cur_node.ch.push(letter);
                            }

                            cur_node = cur_node[letter];
                        }

                        // Mark end of word
                        cur_node.$ = 1;

                        // Reset to trie root
                        cur_node = trie;
                    }
                }
            }
        }());

        /**
         * Finds a word fragment in the trie and return last node or null if not found
         * 
         * @param  {Array} fragment Word fragment as array of characters
         * @return {Node}  Last node
         */
        function findFragment(fragment) {
            var l,
                cnode = trie;

            // Take a copy
            fragment = fragment.slice(0);

            // Find the word in the trie
            l = fragment.shift();

            while (l) {

                // Word not found!
                if (cnode[l] === undefined) {
                    return null;
                }

                cnode = cnode[l];

                l = fragment.shift();
            }

            // Return last node
            return cnode;
        }

        /**
         * Looks for winning and completitons of the word from the given node
         *  Based on iterative DFS
         *
         * @param {Node}   node   Node to start search at
         * @param {Number} depth  Current length of fragment
         * @param {Number} losing When would the computer be losing (word_length % no_players)
         * @return {Object} 2 props: winning: true when winning,
         *                    len: max length in the subtrie when losing
         */
        function getSubtrieCandidate(node, depth, losing) {
            var j, // iterator
                S = [], // stack for DFS
                visited = [], // visited elements for DFS
                max_losing_depth = 0, // Max length losing word's length
                node_data; // temp obj to store node along with depth

            // Insert it into the stack along with depth
            S.push({
                d: depth,
                n: node
            });

            // While we have elements left in the stack
            while (S.length) {
                // Get last element out and inspect its neightbours
                node_data = S.pop();
                node  = node_data.n;
                depth = node_data.d;

                // End of a a word - check if it would be a win
                // otherwise calculate the max length of a losing word
                if (node.isLeaf()) {

                    if (depth % 2 !== losing) {
                        // Winning
                        return {
                            winning: true,
                            len:     null // irrelevant
                        };
                    }

                    // Losing, it seems :( Calculate max length
                    max_losing_depth = depth > max_losing_depth
                            ? depth : max_losing_depth;
                }

                // If we haven't been here yet
                if (visited.indexOf(node) === -1) {

                    // Mark as visited
                    visited.push({
                        d: depth,
                        n: node
                    });

                    // Add neighbours to stack with corresponding depths
                    for (j = 0; j < node.ch.length; j += 1) {
                        S.push({
                            d: depth + 1,
                            n: node[node.ch[j]]
                        });
                    }
                }
            }

            // Return longest losing depth
            // (had there been a winning depth it would have been returned)
            return {
                winning: false,
                len:     max_losing_depth
            };
        }

        /**
         * Initiate a search for candidates in the subtrees
         * 
         * @param  {Node}   node         Node to start at
         * @param  {Number} fragment_len Current depth in trie
         * @return {Object}              All winners and losers
         */
        function searchSubtries(node, depth) {
            var i,
                letter,
                candidate,
                winners = [],
                losers = [];

            // Enumerate subtries
            for (i = 0; i < node.ch.length; i += 1) {

                // Get a candidate from each subtree
                letter = node.ch[i];
                candidate = getSubtrieCandidate(node[letter], depth + 1, (depth + 1) % 2);

                // Determine whether it would make the computer win or lose
                if (candidate.winning) {
                    winners.push(letter);
                } else {
                    losers.push({
                        letter: letter,
                        length: candidate.len
                    });
                }
            }

            // Return a list of all winners and losers
            return {
                winners: winners,
                losers:  losers
            };
        }

        // Public interface
        return {

            /**
             * Get candidate next letters for the given fragment
             * 
             * @param  {Array} fragment Word fragment as an array
             * @return {Object}         Winners, longest losers
             */
            getCandidatesFor: function (fragment) {

                var cnode;

                // Find word fragment in trie, returns last node
                cnode = findFragment(fragment);

                if (cnode === null) {
                    throw {
                        letter: '',
                        win:    'computer',
                        reason: 'No English word starts with these letters.'
                    };
                }

                // Word completed!
                if (cnode.isLeaf()) {
                    throw {
                        letter: '',
                        win:    'computer',
                        reason: 'You have completed a valid word.'
                    };
                }

                // Get candidates from all sub-tries
                return searchSubtries(cnode, fragment.length);
            }
        };

    }(words));

    // Game object
    Game = (function (model) {

        /**
         * Helper: goes through any array and return the longest items
         * 
         * @param  {Array} items Array with variable-length items
         * @return {Array}       Array with the longest items
         */
        function filterLongest(items) {

            var i,
                longest = [],
                maxlen = 0;

            for (i = 0; i < items.length; i += 1) {
                maxlen = items[i].length > maxlen ? items[i].length : maxlen;
            }

            for (i = 0; i < items.length; i += 1) {
                if (items[i].length === maxlen) {
                    longest.push(items[i]);
                }
            }

            return longest;
        }

        return {
            /**
             * Get the next letter for the given word fragment
             * 
             * @param  {String} wordfrag The wordfragment we have so far
             * @return {String}          The computer's choice
             */
            getNextLetter: function (wordfrag) {
                var fragment = wordfrag.split(''),
                    all_candidates,
                    winners = [], // winning candidates
                    losers = [],  // loser candidates (longest of each subtrie)
                    longest_losers = []; // maximum length losers

                // Get candidates from model
                try {
                    all_candidates = model.getCandidatesFor(fragment);
                } catch (e) {
                    return e;
                }

                winners = all_candidates.winners;
                losers  = all_candidates.losers;

                // If we've got any winners, select a winner
                if (winners.length) {
                    return {
                        letter: winners[Math.floor(Math.random() * winners.length)],
                        win:    null
                    };
                }

                // No winners, select the longest loser
                //
                // Weed out short losers
                longest_losers = filterLongest(losers);

                // Return a random longest loser, with an optinal player win
                return {
                    letter: longest_losers[Math.floor(Math.random() * losers.length)].letter,
                    // Does the longest loser complete the word? If so player wins
                    win: (fragment.length === longest_losers[0].length - 1) ? 'human' : null
                };
            }
        };
    }(Trie)); // pass trie as the model

    // Let the garbage collector free up memory
    words = null;

    // Add route
    /*jslint unparam: true, node: true */
    server.route({
        method: 'GET',
        path:   '/nextletter/{word}',
        handler: function (request, reply) {

            var response = reply(JSON.stringify(
                Game.getNextLetter(request.params.word)
            ));

            response.type('application/json');
            response.header('Access-Control-Allow-Origin', '*');
        }
    });

    server.start(function () {
        console.log('Server running at:', server.info.uri);
    });
}());