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

###Documented:
 - Initialization
 - get/set/del/update
 - watch changes on specific items/properties
 - watch generic changes on arrays/objects such as updated/deleted/added
 - unwatch changes
 -

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

It has the standard CRUD methods:

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

To unwatch, pass the `handle` to `unwatch` or `unwatchValue`

```js
store.unwatch(handle); // for handles created by watch
store.unwatchValue(handle); // for handles created by watchValue
```

LICENSE
=======

MIT
