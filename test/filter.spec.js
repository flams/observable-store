/**
 * @license observable-store https://github.com/flams/observable-store
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
 */
var Store = require("../index");

describe("Given an array-like Store with a filter function", function () {
    var store;

    beforeEach(function () {
        store = new Store([5, 10, 15, 20]);
        store.filter(function (item) {
            return item > 10;
        });
    });

    describe("When looping over the array", function () {
        var items = [];
        beforeEach(function () {
            store.loop(function (item, index) {
                items[index] = item;
            });
        });

        it("Then only loops over the items that match the filter", function () {
            expect(items[0]).toBe(15);
            expect(items[1]).toBe(20);
        });
    });

});
