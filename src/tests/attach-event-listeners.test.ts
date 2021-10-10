import { createMockInstance } from "../factories/create-mock-instance";

import { attachEventInterface } from "../functions/attach-event-interface";

test("it attaches listener state with a default namespace", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });

  expect(instance).toHaveProperty("listeners");

  const expected = {
    id: instance.listeners.id,
    map: new Map(),
  };
  expected.map.set("test", []);

  expect(instance.listeners).toEqual(expected);
});

test("it attaches listener state with a custom namespace", () => {
  const instance = attachEventInterface(
    createMockInstance(),
    { test: "syncMethod" },
    undefined,
    "myNamespace",
  );

  expect(instance).toHaveProperty("myNamespace");

  const expected = {
    id: instance.myNamespace.id,
    map: new Map(),
  };
  expected.map.set("test", []);

  expect(instance.myNamespace).toEqual(expected);
});

test("it attaches addEventListener and removeEventListener methods", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });

  expect(instance).toHaveProperty("addEventListener");
  expect(instance).toHaveProperty("removeEventListener");
  expect(typeof instance.addEventListener).toBe("function");
  expect(typeof instance.removeEventListener).toBe("function");
});

test("it calls an event listener attached to a synchronous method", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethod(1);

  expect(callback).toHaveBeenCalled();
});

test("it calls an event listener attached to an asynchronous method", (done) => {
  const instance = attachEventInterface(createMockInstance(), { test: "asyncMethod" });
  const callback = jest.fn(() => {
    done();
  });

  instance.addEventListener("test", callback);
  instance.asyncMethod(1);
});

test("it passes the return value of the method to the listener by default", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethod(1);

  expect(callback.mock.calls).toEqual([[1]]);
});

test("it passes no argument to the listener when onStart is true", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback, true);
  instance.syncMethod(1);

  expect(callback.mock.calls).toEqual([[]]);
});

test("it does not call an event listener which has been removed", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.syncMethod(1);

  instance.removeEventListener("test", callback);
  instance.syncMethod(1);

  expect(callback).toHaveBeenCalledTimes(1);
});

test("it returns the event interface instance from a selected circular method", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" }, [
    "circularMethod",
  ]);

  const result = instance.circularMethod();

  expect(result).toHaveProperty("listeners");
  expect(result).toHaveProperty("addEventListener");
  expect(result).toHaveProperty("removeEventListener");
});

test("it returns the event interface instance from a listener on a selected circular method", () => {
  const instance = attachEventInterface(createMockInstance(), { test: "circularMethod" }, [
    "circularMethod",
  ]);
  const callback = jest.fn();

  instance.addEventListener("test", callback);
  instance.circularMethod();

  expect(callback.mock.calls).toEqual([[instance]]);
});

test("it returns the original object from an unselected circular method", () => {
  const expected = createMockInstance();

  const instance = attachEventInterface(createMockInstance(), { test: "syncMethod" });

  const actual = instance.circularMethod();

  expect(JSON.stringify(actual)).toEqual(JSON.stringify(expected));
});

test("it throws an error if the listener namespace is already assigned", () => {
  const occupied = Object.assign(createMockInstance(), { listeners: "test" });

  expect(() => {
    attachEventInterface(occupied, { test: "syncMethod" });
  }).toThrow("The property listeners already exists on the provided object.");
});

test("it throws an error if the add/removeEventListener properties are already assigned", () => {
  const add = Object.assign(createMockInstance(), { addEventListener: "test" });
  const remove = Object.assign(createMockInstance(), { removeEventListener: "test" });

  expect(() => {
    attachEventInterface(add, { test: "syncMethod" });
  }).toThrow("The property addEventListener already exists on the provided object.");

  expect(() => {
    attachEventInterface(remove, { test: "syncMethod" });
  }).toThrow("The property removeEventListener already exists on the provided object.");
});
