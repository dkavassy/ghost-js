/*global require, describe, it, expect, spyOn, beforeEach */
'use strict';
var ghost = require('./ghost-server');

describe('Gets winners and losers in dictionary [asd, asgf, bsd]', function () {

    var trie_model, Node, actual_trie;

    beforeEach(function () {
        trie_model = new ghost.TrieModel([], 0);
        Node = trie_model._Node;
        actual_trie = new Node();

        // asd, asgf, bsd
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

        // Set the trie for TrieModel to the manually constructed one
        trie_model._trie = actual_trie;
    });

    it('for "a"', function () {
        spyOn(trie_model, '_isSubTrieWinnerOrLoser')
            .andCallFake(function (node, depth, losing) {

                if (node === actual_trie.a.s && depth === 2 && losing === 0) {
                    return {winning: true};
                }
            });

        expect(trie_model._getWinnersAndLosers(actual_trie.a, 1))
            .toEqual({'winners': ['s'], 'losers': []});
    });

    it('for "as"', function () {
        spyOn(trie_model, '_isSubTrieWinnerOrLoser')
            .andCallFake(function (node, depth, losing) {

                if (node === actual_trie.a.s.g && depth === 3 && losing === 1) {
                    return {winning: true};
                }

                if (node === actual_trie.a.s.d && depth === 3 && losing === 1) {
                    return {winning: false, length: 3};
                }
            });

        expect(trie_model._getWinnersAndLosers(actual_trie.a.s, 2))
            .toEqual({'winners': ['g'], 'losers': [{letter: 'd', length: 3}]});
    });

    it('for "b"', function () {
        spyOn(trie_model, '_isSubTrieWinnerOrLoser')
            .andCallFake(function (node, depth, losing) {

                if (node === actual_trie.b.s && depth === 2 && losing === 0) {
                    return {winning: true};
                }
            });

        expect(trie_model._getWinnersAndLosers(actual_trie.b, 1))
            .toEqual({'winners': ['s'], 'losers': []});
    });

    it('for "" (corner case)', function () {
        spyOn(trie_model, '_isSubTrieWinnerOrLoser')
            .andCallFake(function (node, depth, losing) {

                if (node === actual_trie.a && depth === 1 && losing === 1) {
                    return {winning: true};
                }

                if (node === actual_trie.b && depth === 1 && losing === 1) {
                    return {winning: false, length: 3};
                }
            });

        expect(trie_model._getWinnersAndLosers(actual_trie, 0))
            .toEqual({'winners': ['a'], 'losers': [{letter: 'b', length: 3}]});
    });

    it('for "bsd" (full word)', function () {
        spyOn(trie_model, '_isSubTrieWinnerOrLoser')
            .andReturn(null); // shouldn't be called

        expect(trie_model._getWinnersAndLosers(actual_trie.b.s.d, 3))
            .toEqual({'winners': [], 'losers': []});
    });
});

describe('Using dictionary [asd, asgf, bsd], gets candidates', function () {

    var trie_model, Node, actual_trie;

    beforeEach(function () {
        trie_model = new ghost.TrieModel([], 0);
        Node = trie_model._Node;
        actual_trie = new Node();

        // asd, asgf, bsd
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

        // Set the trie for TrieModel to the manually constructed one
        trie_model._trie = actual_trie;
    });

    it('for "a"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(actual_trie.a);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: ['s'], losers: []});

        expect(trie_model.getCandidatesFor('a'))
            .toEqual({winners: ['s'], losers: []});
    });

    it('for "as"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(actual_trie.a.s);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: ['g'], losers: [{letter: 'd', length: 3}]});

        expect(trie_model.getCandidatesFor('a'))
            .toEqual({winners: ['g'], losers: [{letter: 'd', length: 3}]});
    });

    it('for "asg"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(actual_trie.a.s.g);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: [], losers: [{letter: 'f', length: 4}]});

        expect(trie_model.getCandidatesFor('a'))
            .toEqual({winners: [], losers: [{letter: 'f', length: 4}]});
    });

    it('for "b"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(actual_trie.b);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: ['s'], losers: []});

        expect(trie_model.getCandidatesFor('a'))
            .toEqual({winners: ['s'], losers: []});
    });

    it('for "" (corner case)', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(actual_trie);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: ['a'], losers: [{letter: 'b', length: 3}]});

        expect(trie_model.getCandidatesFor('a'))
            .toEqual({winners: ['a'], losers: [{letter: 'b', length: 3}]});
    });

    it('for "asd", says "valid_word"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(actual_trie.a.s.d);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: [], losers: []});

        expect(trie_model.getCandidatesFor('asd')).toEqual({
            win: true,
            why: 'valid_word'
        });
    });

    it('for "asgf", says "valid_word"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(actual_trie.a.s.g.f);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: [], losers: []});

        expect(trie_model.getCandidatesFor('asgf')).toEqual({
            win: true,
            why: 'valid_word'
        });
    });


    it('for "asdf", says "no_word"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(null);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: [], losers: []});

        expect(trie_model.getCandidatesFor('asdf')).toEqual({
            win: true,
            why: 'no_word'
        });
    });

    it('for "asdf", says "no_word"', function () {
        spyOn(trie_model, '_findFragment')
            .andReturn(null);

        spyOn(trie_model, '_getWinnersAndLosers')
            .andReturn({winners: [], losers: []});

        expect(trie_model.getCandidatesFor('csdf')).toEqual({
            win: true,
            why: 'no_word'
        });
    });
});
