<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Observable store](#observable-store)
- [Installation](#installation)
- [How to use](#how-to-use)
	- [Initialization](#initialization)
	- [Standard CRUD methods](#standard-crud-methods)
	- [Watch changes on specific property/item](#watch-changes-on-specific-propertyitem)
	- [Watch changes on generic events such as added/updated/deleted](#watch-changes-on-generic-events-such-as-addedupdateddeleted)
	- [Unwatch changes](#unwatch-changes)
	- [Using an array's native mutative methods](#using-an-arrays-native-mutative-methods)
	- [Using an array's accessor methods.](#using-an-arrays-accessor-methods)
	- [Computed properties](#computed-properties)
	- [Store reset](#store-reset)
	- [Store utilities](#store-utilities)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Observable store
=============

An observable data store with dirty checking and computed properties.

Installation
============

```bash
npm install observable-store
```

How to use
==========

Require observable-store:

```js
var Store = require("observable-store");
```

## Initialization
It can be initialized with or without data. When initialized with data, a shallow clone is done first.

```js
// Without data, an object based store:
var store = new Store({});

// Without data, an array base store:
var store = new Store([]);

// With an array
var store = new Store(["array", "of", "items"]);

// With an object
var store = new Store({
  property1: "object",
  property2: "with",
  property3: "data"
});
```
## Standard CRUD methods

```js
store.get(0); // "array";
store.get("property1"); // "object"

store.set(0, "new value"); // set or update the value
store.set("property1", "new value"); // set or update the value

store.del(0); // remove an item for the array
store.del("property1"); // remove the property from the array

// several items can be removed at once too
store.delAll(["property1", "property2"]);
```

## Watch changes on specific property/item
The point of proxying accessing objects/arrays is that it can trigger events on what's changing. Examples of watching changes on specific properties or items:

```js
var handle = store.watchValue("property1", function onPropertyUpdated(newValue, action, oldValue) {
  // newValue == "new value";
  // action == "updated"
  // oldValue == "object"
}, scope /* optional */);

store.set("property1", "new value");
```

```js
var handle = store.watchValue(0, function onItemUpdated(newValue, action, oldValue) {
    // newValue is undefined
    // action == "deleted"
    // oldValue == "array"
}, scope /* optional */);

store.del(0);
```

```js
var handle = store.watchValue(3, function onItemUpdated(newValue, action, oldValue) {
    // newValue == "new value"
    // action == "added"
    // oldValue is undefined
}, scope /* optional */);

store.set(3, "new value");
```

## Watch changes on generic events such as added/updated/deleted

You can also watch generic events on the whole array/object to know when a new item or property is added, updated or deleted. The following examples are for an object-based store but work the same way with arrays.

```js
var handle = store.watch("added", function onPropertyAdded(propertyName, value) {
    // propertyName == "newProperty"
    // value == "new value"
}, scope /* optional */);

store.set("newProperty", "new value");
```

```js
var handle = store.watch("updated", function onPropertyUpdated(propertyName, newValue, oldValue) {
    // propertyName == "newProperty"
    // newValue == "updated value"
    // oldValue == "new value"
}, scope /* optional */);

store.set("newProperty", "updated value");
```

```js
var handle = store.watch("deleted", function onPropertyDeleted(propertyName, newValue, oldValue) {
    // propertyName == "newProperty"
    // newValue is undefined
    // oldValue == "updated value"
});

store.del("newProperty");
```

## Unwatch changes

To unwatch, pass the `handle` to `unwatch` or `unwatchValue`

```js
store.unwatch(handle); // for handles created by watch
store.unwatchValue(handle); // for handles created by watchValue
```

## Using an array's native mutative methods

The data store has a method for accessing the array's native mutative methods to mutate the data store. When the changes have been made, the data store does a dirty check to figure out the changes and publish events accordingly. This example would also work with other methods than `splice` like `pop`, `push`, `shift`, `unshift`, `sort`, `reverse`.

```js
// Let's remove item 0 and 1 from this store
var store = new Store([0, 1, 2, 3]);

store.watch("updated", function () {
    // this will be triggered two times:
    // The first item will be updated to 2
    // The second item will be updated to 3
});

store.watch("deleted", function () {
    // This will be triggered two times:
    // The first 3rd item will be deleted
    // The fourth item will be deleted
});

// For array-based stores
store.alter("splice", 0, 1); // returns [0, 1];
```

## Using an array's accessor methods.

While `alter` would work in these cases too, using `proxy` instead doesn't trigger the dirty checking, so `proxy` is as fast as the native method itself. Other accessor methods are: `concat`, `join`, `slice`, `toString`, `toLocalString`, `indexOf`, `lastIndexOf`.

```js
var store = new Store([0, 1, 2, 3]);

store.proxy("join", "|"); // returns "0|1|2|3";
```

## Computed properties

The data store can also create computed properties out of other properties:

```js
var store = new Store({
	"firstname": "John",
	"lastname": "Doe"
});

store.compute("name", ["firstname", "lastname"], function (firstname, lastname) {
	return this.get(firstname) + " " + this.get(lastname);
}, store /* optional */);

store.get("name"); // "John Doe"

store.isCompute("name"); // true

store.removeComputed("name");
```

A computed property can also be watched upon:

```js
// will be triggered if firstname or lastname changes
store.watchValue("name", function () { ... });

store.set("firstname", "Jim");
```

## Store reset

The store can be reused and its data reset. When calling reset, the store will do a diff with the previous data and publish the relevant events.

```js
// Will set the internal data and publish events for everything that has been changed/updated/added
store.reset({ ... });
```

## Store utilities

```js
store.toJSON(); // will serialize the data

store.dump(); // will return the internal structure

store.loop(function (value, key, object) {
	// do something with each value/key
	// object === store.dump();
}, scope /* optional */);
```


LICENSE
=======

MIT
