import { attachEventInterface } from "./attach-event-interface";

import { createPropertyError, createTypeError } from "../factories/create-error";

import { chainIfPromise } from "../utils/chain-if-promise";

import {
  Constructor,
  InferPrototype,
  ReservedProperties,
  ListenerBinding,
  KeyOfCirculars,
  KeyOfBuilders,
  EventInterfaceConstructor,
} from "../types";

export function augmentEventInterface<
  C extends Constructor,
  L extends ListenerBinding<InferPrototype<C>>,
  Ci extends KeyOfCirculars<InferPrototype<C>> | undefined,
  B extends KeyOfBuilders<C> | undefined,
  N extends string = "listeners",
>(
  constructor: C extends Constructor<ReservedProperties<N>> ? never : C,
  listeners: L,
  circulars?: Exclude<Ci, undefined>[],
  builders?: Exclude<B, undefined>[],
  namespace = "listeners" as N,
): EventInterfaceConstructor<C, L, Ci, B, N> {
  class AugmentedConstructor extends constructor {
    constructor(...args: any) {
      super(...args);
      attachEventInterface(this as any, listeners, circulars, namespace);
    }
  }

  builders?.forEach((key) => {
    if (!(key in AugmentedConstructor)) {
      throw new Error(createPropertyError(key, "constructor", true));
    }

    const original = AugmentedConstructor[key];

    if (typeof original !== "function") {
      throw new Error(createTypeError(key, "function", typeof original));
    }

    AugmentedConstructor[key] = ((...args: []) => {
      return chainIfPromise(original(...args), (res: any) => {
        return attachEventInterface(res, listeners, circulars, namespace);
      });
    }) as C[Exclude<B, undefined>];
  });

  return AugmentedConstructor as EventInterfaceConstructor<C, L, Ci, B, N>;
}
