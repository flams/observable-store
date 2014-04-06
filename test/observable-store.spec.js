/**
* @license observable-store https://github.com/flams/observable-store
*
* The MIT License (MIT)
*
* Copyright (c) 2014 Olivier Scherrer <pode.fr@gmail.com>
*/
var Store = require("../index"),
    Observable = require("watch-notify"),
    compareNumbers = require("compare-numbers");

describe("Store", function () {

    it("should be an object with a constructor", function () {
        expect(typeof Store).toBe("function");
    });

    describe("CRUD methods", function () {

        var store = null;

        beforeEach(function () {
            store = new Store();
        });

        it("should set values of any type", function () {
            var obj = {},
                arr = [],
                func = function () {};

            store.set("test");
            expect(store.has("test")).toBe(true);
            expect(store.get("test")).toBeUndefined();
            store.set("test", null);
            expect(store.get("test")).toBe(null);
            store.set("test", obj);
            expect(store.get("test")).toBe(obj);
            store.set("test", arr);
            expect(store.get("test")).toBe(arr);
            store.set("test", func);
            expect(store.get("test")).toBe(func);
            store.set("test", "yes");
            expect(store.get("test")).toBe("yes");
        });


        it("should return undefined if a value doesn't exist", function () {
            expect(store.get("has not")).toBeUndefined();
        });

        it("should update a value if it already exists", function () {
            store.set("test", true);
            expect(store.set("test", false)).toBe(true);
            expect(store.get("test")).toBe(false);
        });

        it("should return false if name is not set", function () {
            expect(store.set()).toBe(false);
        });

        it("should delete a value", function () {
            store.set("test", true);
            expect(store.del("test")).toBe(true);
            expect(store.has("test")).toBe(false);
            expect(store.del("fake")).toBe(false);
        });

        it("should update a value", function () {
            expect(store.update()).toBe(false);
            expect(store.update("name", true)).toBe(false);
            store.set("name");
            expect(store.update("name")).toBe(true);
            expect(store.get("name")).toBeUndefined();
            store.set("name", {
                prop1: "val1",
                prop2: "val2"
            });
            expect(store.update("name", "prop1", "value1")).toBe(true);
            expect(store.get("name").prop1).toBe("value1");

        });

        it("should allow for returning a JSON version of the store", function () {
            var values = {
                    key1: "value1",
                    key2: "value2"
                },
                json;
            store.reset(values);
            json = JSON.parse(store.toJSON());
            expect(json.key1).toBe("value1");
            expect(json.key2).toBe("value2");
            expect(Object.getOwnPropertyNames(json).length).toBe(2);
        });

        it("should allow for deleting multiple indexes at once", function () {
            // I'd like to keep [2, 7, 10] in the end
            var indexes = [0, 9, 12, 4, 5, 6, 8, 1, 11, 3];
            store.reset([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            spyOn(indexes, "sort").andCallThrough();
            spyOn(indexes, "reverse").andCallThrough();
            spyOn(indexes, "forEach").andCallThrough();

            expect(store.delAll()).toBe(false);
            expect(store.delAll({})).toBe(false);
            expect(store.delAll(indexes)).toBe(true);

            expect(indexes.sort.mostRecentCall.args[0]).toBe(compareNumbers.desc);
            expect(indexes.forEach.mostRecentCall.args[0]).toBe(store.del);
            expect(indexes.forEach.mostRecentCall.args[1]).toBe(store);

            expect(store.get(0)).toBe(2);
            expect(store.get(1)).toBe(7);
            expect(store.get(2)).toBe(10);

        });

        it("should dump its data", function () {
            store.reset({a:10});
            expect(store.dump().a).toBe(10);
        });

    });

    describe("observable", function () {

        var store = null,
            storeObservable = null;

        beforeEach(function () {
            store = new Store();
            storeObservable = store.getStoreObservable();
        });

        it("should implement an Observable", function () {
            expect(storeObservable instanceof Observable).toBe(true);
        });

        it("should have a function to watch the store", function () {
            var spy = jasmine.createSpy(),
                name = "value",
                scope = {};

            spyOn(storeObservable, "watch").andCallThrough();

            expect(store.watch(name, spy, scope)).toBeTruthy();
            expect(storeObservable.watch.wasCalled).toBe(true);
            expect(storeObservable.watch.mostRecentCall.args[0]).toBe(name);
            expect(storeObservable.watch.mostRecentCall.args[1]).toBe(spy);
            expect(storeObservable.watch.mostRecentCall.args[2]).toBe(scope);
        });

        it("should notify on set", function () {
            spyOn(storeObservable, "notify");

            store.set("test");
            expect(storeObservable.notify.wasCalled).toBe(true);
            expect(storeObservable.notify.mostRecentCall.args[0]).toBe("added");
            expect(storeObservable.notify.mostRecentCall.args[1]).toBe("test");
            expect(storeObservable.notify.mostRecentCall.args[2]).toBeUndefined();
        });

        it("should notify with new value on set", function () {
            spyOn(storeObservable, "notify");

            store.set("test");
            store.set("test", "newValue");
            expect(storeObservable.notify.wasCalled).toBe(true);
            expect(storeObservable.notify.mostRecentCall.args[0]).toBe("updated");
            expect(storeObservable.notify.mostRecentCall.args[1]).toBe("test");
            expect(storeObservable.notify.mostRecentCall.args[2]).toBe("newValue");
        });

        it("should notify with old value too on set", function () {
            spyOn(storeObservable, "notify");

            store.set("test", "oldValue");
            store.set("test", "newValue");

            expect(storeObservable.notify.mostRecentCall.args[3]).toBe("oldValue");
        });

        it("should notify on update", function () {
            store.set("test", { prop: "value"});

            spyOn(storeObservable, "notify");

            store.update("test", "prop", "newValue");
            expect(storeObservable.notify.wasCalled).toBe(true);
            expect(storeObservable.notify.mostRecentCall.args[0]).toBe("updated");
            expect(storeObservable.notify.mostRecentCall.args[1]).toBe("prop");
            expect(storeObservable.notify.mostRecentCall.args[2]).toBe("newValue");
        });

        it("should provide value when said available", function () {
            var callback = function () {
                callback.ret = store.get("test");
            };
            store.watch("added", callback);
            store.set("test", "yes");

            expect(callback.ret).toBe("yes");
        });

        it("should notify on del", function () {
            spyOn(storeObservable, "notify");

            store.set("test");
            store.del("test");
            expect(storeObservable.notify.wasCalled).toBe(true);
            expect(storeObservable.notify.mostRecentCall.args[0]).toBe("deleted");
            expect(storeObservable.notify.mostRecentCall.args[1]).toBe("test");
            expect(storeObservable.notify.mostRecentCall.args[2]).toBeUndefined();
        });

        it("can unwatch value", function () {
            spyOn(storeObservable, "unwatch");

            handler = store.watch("added", function(){});
            store.unwatch(handler);

            expect(storeObservable.unwatch.wasCalled).toBe(true);
            expect(storeObservable.unwatch.mostRecentCall.args[0]).toBe(handler);
        });

    });

    describe("value observable", function () {
        var store = null,
            storeObservable = null;

        beforeEach(function () {
            store = new Store();
            valueObservable = store.getValueObservable();
        });

        it("should implement an Observable", function () {
            expect(valueObservable instanceof Observable).toBe(true);
        });

        it("should have a function to watch the value", function () {
            var spy = jasmine.createSpy(),
                name = "value",
                scope = {};

            spyOn(valueObservable, "watch").andCallThrough();

            expect(store.watchValue(name, spy, scope)).toBeTruthy();
            expect(valueObservable.watch.wasCalled).toBe(true);
            expect(valueObservable.watch.mostRecentCall.args[0]).toBe(name);
            expect(valueObservable.watch.mostRecentCall.args[1]).toBe(spy);
            expect(valueObservable.watch.mostRecentCall.args[2]).toBe(scope);
        });

        it("should notify on set", function () {
            spyOn(valueObservable, "notify");

            store.set("test");
            expect(valueObservable.notify.wasCalled).toBe(true);
            expect(valueObservable.notify.mostRecentCall.args[0]).toBe("test");
            expect(valueObservable.notify.mostRecentCall.args[1]).toBeUndefined();
            expect(valueObservable.notify.mostRecentCall.args[2]).toBe("added");
        });

        it("should notify with new value on set", function () {
            spyOn(valueObservable, "notify");

            store.set("test");
            store.set("test", "newValue");
            expect(valueObservable.notify.wasCalled).toBe(true);
            expect(valueObservable.notify.mostRecentCall.args[0]).toBe("test");
            expect(valueObservable.notify.mostRecentCall.args[1]).toBe("newValue");
            expect(valueObservable.notify.mostRecentCall.args[2]).toBe("updated");
        });

        it("should notify with old value too on set", function () {
            spyOn(valueObservable, "notify");

            store.set("test", "oldValue");
            store.set("test", "newValue");

            expect(valueObservable.notify.mostRecentCall.args[3]).toBe("oldValue");
        });

        it("should notify on update", function () {
            var item = { prop: "value"};
            store.set("test", item);

            spyOn(valueObservable, "notify");

            store.update("test", "prop", "newValue");
            expect(valueObservable.notify.wasCalled).toBe(true);
            expect(valueObservable.notify.mostRecentCall.args[0]).toBe("test");
            expect(valueObservable.notify.mostRecentCall.args[1]).toBe(item);
            expect(valueObservable.notify.mostRecentCall.args[2]).toBe("updated");
        });

        it("should provide value when said available", function () {
            var callback = function () {
                callback.ret = store.get("test");
            };
            store.watchValue("test", callback);
            store.set("test", "yes");

            expect(callback.ret).toBe("yes");
        });

        it("should notify on del", function () {
            spyOn(valueObservable, "notify");

            store.set("test");
            store.del("test");
            expect(valueObservable.notify.wasCalled).toBe(true);
            expect(valueObservable.notify.mostRecentCall.args[0]).toBe("test");
            expect(valueObservable.notify.mostRecentCall.args[1]).toBeUndefined();
            expect(valueObservable.notify.mostRecentCall.args[2]).toBe("deleted");
        });

        it("can unwatch value", function () {
            spyOn(valueObservable, "unwatch");

            handler = store.watchValue("added", function(){});
            store.unwatchValue(handler);

            expect(valueObservable.unwatch.wasCalled).toBe(true);
            expect(valueObservable.unwatch.mostRecentCall.args[0]).toBe(handler);
        });


    });

    describe("initialization", function () {
        it("can be initialized with an object", function () {
            var func = function () {};

            var store = new Store({x: 10, y: 20, z:func});
            expect(store.get("x")).toBe(10);
            expect(store.get("y")).toBe(20);
            expect(store.get("z")).toBe(func);
        });

        it("can be initialized with an array", function () {
            var store = new Store([1, 2, "yes"]);
            expect(store.get(0)).toBe(1);
            expect(store.get(1)).toBe(2);
            expect(store.get(2)).toBe("yes");
        });

    });

    describe("count", function () {

        var store = null;

        beforeEach(function () {
            store = new Store();
        });

        it("should return the right number of items", function () {
            expect(store.count()).toBe(0);
            store.set("value1");
            expect(store.count()).toBe(1);
            store.set("value2");
            store.set("value3");
            expect(store.count()).toBe(3);
            store.del("value3");
            expect(store.count()).toBe(2);
            store.del("value2");
            store.del("value1");
            store.del("test");
            expect(store.count()).toBe(0);
        });

        it("should return the right number of items when init with data", function () {
            var initValue = {x:10, y: 20},
                store = new Store(initValue);

            expect(store.count()).toBe(2);
        });
    });

    describe("looping", function () {

        var store = null,
            data = {
                "key1": "value1",
                "key3": 3,
                "key2": {}
            };

        beforeEach(function () {
            store = new Store(data);
        });

        it("should allow for looping through it", function () {
            store.loop(function (val, idx) {
                expect(store.get(idx)).toBe(val);
            });
        });

        it("should allow for looping in a given scope", function () {
            var thisObj = {},
                funcThisObj = null;
            store.loop(function () {
                funcThisObj = this;
            }, thisObj);

            expect(funcThisObj).toBe(thisObj);
        });

    });

    describe("ordering", function () {
        var store = null;

        beforeEach(function () {
            store = new Store([0, 1, 2, 3]);
        });

        it("should be working with arrays as data", function () {
            expect(store.get(0)).toBe(0);
            expect(store.get(3)).toBe(3);
            expect(store.count()).toBe(4);
        });

        it("should be updatable", function () {
            expect(store.set(0, 10)).toBe(true);
            expect(store.get(0)).toBe(10);
        });

        it("should loop in the correct order", function () {
            var i = 0;
            store.loop(function (val, idx) {
                expect(idx).toBe(i++);
            });
        });

    });


    describe("StoreAlteration", function () {
        var store = null,
            initialData = null;

        beforeEach(function () {
            initialData = [0, 1, 2, 3];
            store = new Store(initialData);
        });

        it("should give access to Array's functions", function () {
            spyOn(Array.prototype, "pop").andCallThrough();
            spyOn(Array.prototype, "sort").andCallThrough();
            spyOn(Array.prototype, "splice").andCallThrough();
            store.alter("pop");
            store.alter("sort");
            store.alter("splice", 1, 2);
            expect(Array.prototype.pop.wasCalled).toBe(true);
            expect(Array.prototype.sort.wasCalled).toBe(true);
            expect(Array.prototype.splice.wasCalled).toBe(true);
            expect(Array.prototype.splice.mostRecentCall.args[0]).toBe(1);
            expect(Array.prototype.splice.mostRecentCall.args[1]).toBe(2);
        });

        it("should advertise on changes", function () {
            var spy1 = jasmine.createSpy(),
                spy2 = jasmine.createSpy();

            store.watch("updated", spy1);
            store.watch("deleted", spy2);

            store.alter("splice", 1, 2);

            expect(spy1.wasCalled).toBe(true);
            expect(spy2.wasCalled).toBe(true);
            expect(spy1.callCount).toBe(1);
            expect(spy2.callCount).toBe(2);
            expect(spy1.mostRecentCall.args[0]).toBe(1);
            expect(spy1.mostRecentCall.args[1]).toBe(3);
            spy2.calls.forEach(function (call) {
                // Don't know how to write this test better
                //  call.args[0] should equal 2 or 3
                expect(call.args[0] >= 2).toBe(true);
                expect(call.args[1]).toBeUndefined();
            });
        });

        it("should return false if the function doesn't exist", function () {
            expect(store.alter("doesn't exist")).toBe(false);
        });


        it("should call Array.splice on del if init'd with an array", function () {
            store.reset([0, 1, 2, 3]);
            spyOn(Array.prototype, "splice").andCallThrough();
            expect(store.del(1)).toBe(true);
            expect(Array.prototype.splice.wasCalled).toBe(true);
            expect(Array.prototype.splice.mostRecentCall.args[0]).toBe(1);
            expect(Array.prototype.splice.mostRecentCall.args[1]).toBe(1);
            expect(store.get(0)).toBe(0);
            expect(store.get(1)).toBe(2);
        });

        it("should notify only once on del", function () {
            var spy = jasmine.createSpy();
            store.reset([0, 1, 2, 3]);
            store.watch("deleted", spy);
            store.del(1);
            expect(spy.callCount).toBe(1);
        });

        it("should have a proxy function that access the inner store's methods", function () {
            var data = store.dump();
            spyOn(data, "slice");

            store.proxy("slice", 0, 1);
            expect(data.slice.wasCalled).toBe(true);
            expect(data.slice.mostRecentCall.args[0]).toBe(0);
            expect(data.slice.mostRecentCall.args[1]).toBe(1);

            expect(store.proxy("nofunc")).toBe(false);
        });

        it("should publish an altered event when the store is altered", function () {
            var observable = store.getStoreObservable(),
                oldData = store.dump();

            spyOn(observable, "notify");
            store.alter("splice", 0);

            expect(observable.notify.mostRecentCall.args[0]).toBe("altered");
            expect(observable.notify.mostRecentCall.args[1]).toBe(store.dump());
            expect(observable.notify.mostRecentCall.args[2]).toEqual([0,1,2,3]);
        });

    });

    describe("StoreComputed", function () {

        var store = null;

        beforeEach(function () {
            store = new Store();
        });

        it("should have a function to compute a property from other properties", function () {
            var spy = jasmine.createSpy();
            expect(store.compute()).toBe(false);
            expect(store.compute("name")).toBe(false);
            expect(store.compute("name", ["property1", "property2"])).toBe(false);
            expect(store.compute("name", ["property1", "property2"], spy)).toBe(true);
            expect(store.compute("name", ["property1", "property2"], spy)).toBe(false);
        });

        it("should set the property", function () {
            spyOn(store, "set");
            var spy = jasmine.createSpy().andReturn(1337);
            store.compute("name", ["property", "property"], spy);

            expect(store.set).toHaveBeenCalled();
            expect(store.set.mostRecentCall.args[0]).toBe("name");
            expect(store.set.mostRecentCall.args[1]).toBe(1337);
        });

        it("should execute the callback in the given scope", function () {
            var spy = jasmine.createSpy(),
                scope = {};

            store.compute("name", ["property1", "property2"], spy, scope);

            expect(spy.mostRecentCall.object).toBe(scope);
        });

        it("should update the computed property when one of the initial property changes", function () {
            store.set("property1", 336);
            store.set("property2", 1000);
            var spy = jasmine.createSpy().andReturn(1337);
            store.compute("name", ["property1", "property2"], spy);

            store.set("property1", 337);

            expect(spy.callCount).toBe(2);

            expect(store.get("name")).toBe(1337);
        });

        it("should have a function to tell if a property is computed", function () {
            var spy = jasmine.createSpy();

            expect(store.isCompute("name")).toBe(false);

            store.compute("name", ["property1", "property2"], spy);

            expect(store.isCompute("name")).toBe(true);

        });

        it("should have a function for removing a computed property", function () {
            expect(store.removeCompute("name")).toBe(false);

            var spy = jasmine.createSpy();
            store.compute("name", ["property1", "property2"], spy);

            expect(store.removeCompute("name")).toBe(true);
        });

        it("should remove the observers", function() {
            var spy = jasmine.createSpy(),
                scope = {};

            spyOn(store, "watchValue").andReturn(1337);
            spyOn(store, "unwatchValue");

            store.compute("name", ["property"], spy, scope);

            store.removeCompute("name");

            expect(store.unwatchValue).toHaveBeenCalled();
            expect(store.unwatchValue.mostRecentCall.args[0]).toBe(1337);
        });

    });

    describe("StoreReset", function () {
        var store = null,
            initialData = {a:10},
            resetData = {b:20};

        beforeEach(function () {
            store = new Store(initialData);
        });

        it("should allow for complete data reset", function () {
            expect(store.reset(resetData)).toBe(true);
            expect(store.has("a")).toBe(false);
            expect(store.get("b")).toBe(20);
        });

        it("should only reset if data is object or array", function () {
            expect(function () {
                store.reset();
            }).not.toThrow();

            expect(store.reset()).toBe(false);
            expect(store.get("a")).toBe(10);
        });

        it("should advertise for every modified value", function () {
            var spyA = jasmine.createSpy(),
                spyB = jasmine.createSpy();

            store.watch("deleted", spyA);
            store.watch("added", spyB);
            store.reset(resetData);
            expect(spyA.wasCalled).toBe(true);
            expect(spyA.mostRecentCall.args[0]).toBe("a");
            expect(spyA.mostRecentCall.args[1]).toBeUndefined();
            expect(spyA.callCount).toBe(1);
            expect(spyB.mostRecentCall.args[0]).toBe("b");
            expect(spyB.mostRecentCall.args[1]).toBe(20);
            expect(spyB.callCount).toBe(1);
        });

        it("should publish an event when the store is resetted", function () {
            var observable = store.getStoreObservable(),
                oldData = store.dump();

                spyOn(observable, "notify");

            store.reset({});

            expect(observable.notify.mostRecentCall.args[0]).toBe("resetted");
            expect(observable.notify.mostRecentCall.args[1]).toBe(store.dump());
            expect(observable.notify.mostRecentCall.args[2]).toEqual({ a: 10 });
        });
    });

    describe("StoreIsolation", function () {

        var dataSet = null,
            store1 = null,
            store2 = null;

        beforeEach(function () {
            dataSet = {a: 10, b: 20};
            store1 = new Store(dataSet);
            store2 = new Store(dataSet);
        });

        it("shouldn't share data sets that are identical", function () {
            store1.set("shared", "yes");
            expect(store2.get("shared")).toBeUndefined();
        });

        it("shouldn't share observers", function () {
            var spyAdded = jasmine.createSpy(),
                spyUpdated = jasmine.createSpy();

            store1.watch("added", spyAdded);
            store2.set("shared");
            expect(spyAdded.wasCalled).toBe(false);
            expect(spyUpdated.wasCalled).toBe(false);
        });

        it("should have the same behaviour on reset", function () {
            store1.reset(dataSet);
            store2.reset(dataSet);
            store1.set("shared", "yes");
            expect(store2.get("shared")).toBeUndefined();

            var spyAdded = jasmine.createSpy(),
            spyUpdated = jasmine.createSpy();

            store1.watch("added", spyAdded);
            store2.set("shared");
            expect(spyAdded.wasCalled).toBe(false);
            expect(spyUpdated.wasCalled).toBe(false);
        });

    });


});
