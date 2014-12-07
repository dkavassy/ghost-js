/*global module */
'use strict';

var Game,
    TrieModel;

// Trie-based implementation
TrieModel = function (words, min_length) {

    // Trie to store the dictionary
    this._trie = new this._Node();
    // Expose for testing

    this._init(words, min_length);
};

TrieModel.prototype = {

    // Returns the constructor of the objects that represents nodes in our trie
    _Node: (function () {

        // Constructor
        var Node = function () {
            return this;
        };

        /**
         * Set this node as a leaf (end of word)
         */
        Node.prototype.setLeaf = function () {
            this.$ = 1;
        };

        /**
         * Is this node a leaf i.e. end of a word
         * @return {Boolean} true if leaf, false if not
         */
        Node.prototype.isLeaf = function () {

            if (this.$ !== undefined) {
                return true;
            }

            return false;
        };

        /**
         * Get branches starting from this node
         */
        Node.prototype.getBranches = function () {

            var prop,
                branches = [];

            for (prop in this) {
                // $ denotes the end so do not include it
                if (this.hasOwnProperty(prop) && prop !== '$') {
                    branches.push(prop);
                }
            }

            return branches;
        };

        // Return the constructor
        return Node;
    }()),

    /**
     * Init: builds the trie, requires an array of words
     * 
     * @param {Array}  words      Array of words
     * @param {Number} min_length Disregards any word in the list that are shorter
     */
    _init: function (words, min_length) {
        var trie = this._trie,
            cur_node = trie,
            i,
            j,
            word,
            letter,
            Node = this._Node;

        // Build a trie
        for (i in words) {
            if (words.hasOwnProperty(i)) {
                word = words[i].split('');

                // We only deal with words of min_length letters or longer
                if (word.length >= min_length) {

                    // Insert word into trie
                    for (j = 0; j < word.length; j += 1) {

                        letter = word[j];

                        if (cur_node.isLeaf()) { // is a leaf
                            // we already have a word at this point which is shorter
                            // we have no need for a longer word
                            // as the shorter word already completes it
                            break;
                        }

                        // If the letter node doesn't exists yet, create it
                        if (cur_node[letter] === undefined) {
                            cur_node[letter] = new Node(letter);
                        }

                        // Change to the node of the letter
                        cur_node = cur_node[letter];
                    }

                    // Mark end of word
                    cur_node.setLeaf();

                    // Reset to trie root
                    cur_node = trie;
                }
            }
        }
    },

    /**
     * Finds a word fragment in the trie and returns last node or null if not found
     * 
     * @param  {Array} fragment Word fragment as array of characters
     * @return {Node}  Last node of the word fragment or null if the word is not found
     */
    _findFragment: function (fragment) {
        var l,
            cnode = this._trie; // start from the root

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
    },

    /**
     * Looks for winning and completitons of the word from the given node
     * Based on iterative DFS
     *
     * @param {Node}   node   Node to start search at
     * @param {Number} depth  Current length of fragment
     * @param {Number} losing When would the computer be losing (word_length % no_players)
     * @return {Object} { winning: true when winning, false if losing,
     *                    length: max length of losing word in the subtrie when losing or null if winning }
     */
    _isSubTrieWinnerOrLoser: function (node, depth, losing) {
        var j, // iterator
            S = [], // stack for DFS
            visited = [], // visited elements for DFS
            max_losing_depth = 0, // Max length losing word's length
            node_data, // temp obj to store node along with depth
            branches; // temp array, branches starting from a node

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
                        length:  null // irrelevant
                    };
                }

                // Losing, it seems :( Calculate max length
                max_losing_depth = depth > max_losing_depth ? depth : max_losing_depth;
            }

            // If we haven't been here yet
            if (visited.indexOf(node) === -1) {

                // Mark as visited
                visited.push({
                    d: depth,
                    n: node
                });

                // Add neighbours to stack with corresponding depths
                branches = node.getBranches();
                for (j = 0; j < branches.length; j += 1) {
                    S.push({
                        d: depth + 1,
                        n: node[branches[j]]
                    });
                }
            }
        }

        // Return longest losing depth
        // (had there been a winning depth it would have been returned)
        return {
            winning: false,
            length:  max_losing_depth
        };
    },

    /**
     * Initiates a search for candidates in the subtrees and return winners and losers
     * with the max length of losing word in that subtree in the case of losers
     * 
     * @param  {Node}   node         Node to start at
     * @param  {Number} fragment_len Current depth in trie
     * @return {Object} {winners: ['x','y',...], losers: [{letter: 'a', length: 5},...]}
     */
    _searchSubtries: function (node, depth) {
        var i,
            letter,
            candidate,
            winners = [],
            losers = [],
            branches;

        // Enumerate subtries
        branches = node.getBranches();
        for (i = 0; i < branches.length; i += 1) {

            // Get a candidate from each subtree
            letter = branches[i];
            candidate = this._isSubTrieWinnerOrLoser(node[letter], depth + 1, (depth + 1) % 2);

            // Determine whether it would make the computer win or lose
            if (candidate.winning) {
                winners.push(letter);
            } else {
                losers.push({
                    letter: letter,
                    length: candidate.length
                });
            }
        }

        // Return a list of all winners and losers
        return {
            winners: winners,
            losers:  losers
        };
    },


    // Public interface

    /**
     * Gets winner candidate next letters for the given fragment
     * 
     * @param  {String} fragment Word fragment to search for
     * @return {Object}          Winners, longest losers
     */
    getCandidatesFor: function (fragment) {

        var cnode;

        // Filter out any empty strings

        // Find word fragment in trie, returns last node
        cnode = this._findFragment(fragment.split(''));

        if (cnode === null) {
            throw {
                letter: '',
                win:    'computer',
                reason: 'No word starts with these letters.'
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
        return this._searchSubtries(cnode, fragment.length);
    }
};

// Game object
Game = function (model) {
    this._model = model;
};

Game.prototype = {

    /**
     * Helper: goes through any array and returns the longest items
     * 
     * @param  {Array} items Array with variable-length items
     * @return {Array}       Array with the longest items
     */
    _filterLongest: function (items) {

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
    },

    // Public interface

    /**
     * Gets the next letter for the given word fragment
     * 
     * @param  {String} wordfrag The wordfragment we have so far
     * @return {Object}          The computer's choice and if winning
     */
    getNextLetter: function (wordfrag) {
        var all_candidates,
            winners = [], // winning candidates
            losers = [],  // loser candidates (longest of each subtrie)
            longest_losers = []; // maximum length losers

        // Get candidates from model
        try {
            all_candidates = this._model.getCandidatesFor(wordfrag);
        } catch (e) {
            return e;
        }

        // Shorter names
        winners = all_candidates.winners;
        losers  = all_candidates.losers;

        // If we've got any winners, select a winner
        if (winners.length) {
            return {
                letter: winners[Math.floor(Math.random() * winners.length)],
                win:    ''
            };
        }

        // No winners, select the longest loser
        //
        // Weed out short losers
        longest_losers = this._filterLongest(losers);

        // Return a random longest loser, with an optinal player win
        return {
            letter: longest_losers[Math.floor(Math.random() * longest_losers.length)].letter,
            // Does the longest loser complete the word? If so player wins
            win: (wordfrag.length === longest_losers[0].length - 1) ? 'human' : ''
        };
    }
};

module.exports = {
    Game: Game,
    TrieModel: TrieModel
};