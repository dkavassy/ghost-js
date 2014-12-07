/*global require, exports */
'use strict';
var ghost = require('./ghost-server');

// TrieModel.init
exports.test_init = function (test) {
    var words = ['a', 'b'],
        trie = new ghost.TrieModel(words, 1),
        Node,
        trie2;

    test.deepEqual(trie,
        {
            '_trie': {
                'a': {
                    '$': 1
                },
                'b': {
                    '$': 1
                }
            }
        }, 'Simple 1 letter trie');

    words = ['as', 'ad', 'b'];
    trie = new ghost.TrieModel(words, 2);

    test.deepEqual(trie,
        {
            '_trie': {
                'a': {
                    's': {
                        '$': 1
                    },
                    'd': {
                        '$': 1
                    }
                }
            }
        }, '2 letter branching trie');

    words = ['as', 'ada', 'b'];
    trie = new ghost.TrieModel(words, 2);

    test.deepEqual(trie,
        {
            '_trie': {
                'a': {
                    's': {
                        '$': 1
                    },
                    'd': {
                        'a': {
                            '$': 1
                        }
                    }
                }
            }
        }, '2 letter branching trie with 3 letter word');

    words = ['asd', 'asg', 'acd', 'af'];
    trie = new ghost.TrieModel(words, 3);

    test.deepEqual(trie,
        {
            '_trie': {
                'a': {
                    's': {
                        'd': {
                            '$': 1
                        },
                        'g': {
                            '$': 1
                        }
                    },
                    'c': {
                        'd': {
                            '$': 1
                        }
                    }
                }
            }
        }, '3 letter branching tree');

    words = ['asgf', 'asd', 'bsd'];
    trie = new ghost.TrieModel(words, 3);
    Node = trie._Node;
    trie2 = new Node();
    trie2.a = new Node();
    trie2.a.s = new Node();
    trie2.a.s.d = new Node();
    trie2.a.s.d.setLeaf();

    trie2.a.s.g = new Node();
    trie2.a.s.g.f = new Node();
    trie2.a.s.g.f.setLeaf();

    trie2.b = new Node();
    trie2.b.s = new Node();
    trie2.b.s.d = new Node();
    trie2.b.s.d.setLeaf();

    test.deepEqual(trie, {'_trie': trie2}, 'Trie built by hand');

    test.done();
};

// TrideModel._findFragment()
exports.test_findFragment = function (test) {
    var words = ['asd', 'asg', 'acd', 'af'],
        trie_model = new ghost.TrieModel(words, 3);

    test.deepEqual(trie_model._findFragment(['a', 's', 'g', 'f']), null, 'Word not found');
    test.deepEqual(trie_model._findFragment(['a', 's', 'g']), {'$': 1}, 'End of word found');
    test.deepEqual(trie_model._findFragment(['a', 's']),
        {
            'd': {'$': 1},
            'g': {'$': 1}
        }, 'Word fragment found');

    test.deepEqual(trie_model._findFragment([]), trie_model._trie);

    // Corner case: empty string
    test.deepEqual(trie_model._findFragment(['']), trie_model._trie);
    test.deepEqual(trie_model._findFragment(['a', '']), trie_model._trie.a);

    test.done();
};

// TrieModel._isSubTrieWinnerOrLoser()
exports.test_isSubTrieWinnerOrLoser = function (test) {
    var words = ['asgf', 'asd', 'bsd'],
        trie_model = new ghost.TrieModel(words, 3),
        Node = trie_model._Node,
        actual_trie = new Node(),
        node;

    actual_trie.a = new Node();
    actual_trie.a.s = new Node();
    actual_trie.a.s.d = new Node();
    actual_trie.a.s.d.setLeaf();

    actual_trie.a.s.g = new Node();
    actual_trie.a.s.g.f = new Node();
    actual_trie.a.s.g.f.setLeaf();

    actual_trie.b = new Node();
    actual_trie.b.s = new Node();
    actual_trie.b.s.d = new Node();
    actual_trie.b.s.d.setLeaf();

    // a, s, g
    node = actual_trie.a.s.g;
    test.deepEqual(trie_model._isSubTrieWinnerOrLoser(node, 3, 0), {'winning': false, 'length': 4});

    node = actual_trie.a.s.d;
    test.deepEqual(trie_model._isSubTrieWinnerOrLoser(node, 3, 0), {'winning': true, 'length': null});

    node = actual_trie.a;
    test.deepEqual(trie_model._isSubTrieWinnerOrLoser(node, 1, 0), {'winning': true, 'length': null});

    node = actual_trie.b.s;
    test.deepEqual(trie_model._isSubTrieWinnerOrLoser(node, 2, 0), {'winning': true, 'length': null});

    node = actual_trie.a.s;
    test.deepEqual(trie_model._isSubTrieWinnerOrLoser(node, 2, 0), {'winning': true, 'length': null});

    test.done();
};

// TrieModel._searchSubtries()
exports.test_searchSubtries = function (test) {
    var words = ['asgf', 'asd', 'bsd'];
    var trie_model = new ghost.TrieModel(words, 3);
    var Node = trie_model._Node;
    var actual_trie = new Node();
    actual_trie.a = new Node();
    actual_trie.a.s = new Node();
    actual_trie.a.s.d = new Node();
    actual_trie.a.s.d.setLeaf();

    actual_trie.a.s.g = new Node();
    actual_trie.a.s.g.f = new Node();
    actual_trie.a.s.g.f.setLeaf();

    actual_trie.b = new Node();
    actual_trie.b.s = new Node();
    actual_trie.b.s.d = new Node();
    actual_trie.b.s.d.setLeaf();

    test.deepEqual(trie_model._searchSubtries(actual_trie.a, 1), {'winners': ['s'], 'losers': []});

    test.deepEqual(trie_model._searchSubtries(actual_trie.a.s, 2), {'winners': ['g'], 'losers': [{letter: 'd', length: 3}]});

    test.deepEqual(trie_model._searchSubtries(actual_trie.b, 1), {'winners': ['s'], 'losers': []});

    // corner case, 0 length
    test.deepEqual(trie_model._searchSubtries(actual_trie, 0), {'winners': ['a'], 'losers': [{letter: 'b', length: 3}]});

    test.done();
};

// TrieModel.getCandidatesFor()
exports.testGetCandidatesFor = function (test) {
    var words = ['asgf', 'asd', 'bsd'],
        trie_model = new ghost.TrieModel(words, 3),
        Node = trie_model._Node,
        actual_trie = new Node(),
        error;

    actual_trie.a = new Node();
    actual_trie.a.s = new Node();
    actual_trie.a.s.d = new Node();
    actual_trie.a.s.d.setLeaf();

    actual_trie.a.s.g = new Node();
    actual_trie.a.s.g.f = new Node();
    actual_trie.a.s.g.f.setLeaf();

    actual_trie.b = new Node();
    actual_trie.b.s = new Node();
    actual_trie.b.s.d = new Node();
    actual_trie.b.s.d.setLeaf();

    test.deepEqual(trie_model.getCandidatesFor('a'), {winners: ['s'], losers: []});
    test.deepEqual(trie_model.getCandidatesFor('as'), {winners: ['g'], losers: [{letter: 'd', length: 3}]});

    // corner case 0 length
    test.deepEqual(trie_model.getCandidatesFor(''), {winners: ['a'], losers: [{letter: 'b', length: 3}]});

    try {
        trie_model.getCandidatesFor('asd');
    } catch (err) {
        error = err;
    }
    test.deepEqual(error, {letter: '',
                    win:    'computer',
                    reason: 'You have completed a valid word.'});

    try {
        trie_model.getCandidatesFor('asgf');
    } catch (err) {
        error = err;
    }
    test.deepEqual(error, {letter: '',
                    win:    'computer',
                    reason: 'You have completed a valid word.'});

    try {
        trie_model.getCandidatesFor('asdf');
    } catch (err) {
        error = err;
    }
    test.deepEqual(error, {letter: '',
                    win:    'computer',
                    reason: 'No word starts with these letters.'});

    try {
        trie_model.getCandidatesFor('csdf');
    } catch (err) {
        error = err;
    }
    test.deepEqual(error, {letter: '',
                    win:    'computer',
                    reason: 'No word starts with these letters.'});

    test.deepEqual(trie_model.getCandidatesFor('asg'), {winners: [], losers: [{letter: 'f', length: 4}]});
    test.deepEqual(trie_model.getCandidatesFor('b'), {winners: ['s'], losers: []});

    test.done();
};

// Game._filterLongest()
exports.test_filterLongest = function (test) {
    var game = new ghost.Game();

    test.deepEqual(game._filterLongest([]), []);
    test.deepEqual(game._filterLongest(['asgf', 'a', 'asd', 'asdf']), ['asgf', 'asdf']);
    test.deepEqual(game._filterLongest(['asgf', 'asdf']), ['asgf', 'asdf']);

    test.done();
};

// Game.getNextLetter()
exports.testGetNextLetter = function (test) {
    var words = ['asgf', 'asd', 'bsd', 'csdfgh', 'cdml'];
    var trie_model = new ghost.TrieModel(words, 2);
    var game = new ghost.Game(trie_model);

    // Chooses winning
    test.deepEqual(game.getNextLetter('as'), {letter: 'g', win: ''}, 'Computer chooses winning letter');
    // Chooses longest losing
    test.deepEqual(game.getNextLetter('c'), {letter: 's', win: ''}, 'Computer chooses longest losing');
    //Computer wins, word completed
    test.deepEqual(game.getNextLetter('bsd'), {letter: '', win: 'computer',
        reason: 'You have completed a valid word.'}, 'Computer wins, word completed');
    //Computer wins, no such word
    test.deepEqual(game.getNextLetter('z'), {letter: '', win: 'computer',
        reason: 'No word starts with these letters.'}, 'Computer wins, no such word');
    // Human wins
    test.deepEqual(game.getNextLetter('csdfg'), {letter: 'h', win: 'human'}, 'Cumputer completes word, human wins');

    test.done();
};
