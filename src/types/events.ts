import type { Router, ExpressMiddlewareLike } from './express';
import type { Controller, Middleware } from '../utils';
import type { Jimpex } from '../app/jimpex';
/**
 * The base payload the events emitted by the application send.
 *
 * @template T  Extra properties beside the reference to the application.
 */
export type EventPayload<T = Record<string, unknown>> = {
  /**
   * A reference to the application.
   */
  app: Jimpex;
} & T;
/**
 * A dictionary with the events emitted by the application and their payloads.
 */
export interface JimpexEvents {
  /**
   * Called right before creating the server and calling `listen` on it.
   */
  beforeStart: EventPayload;
  /**
   * Called once the server confirmed that is listening.
   */
  start: EventPayload;
  /**
   * Called after the controllers and middlewares have been mounted.
   */
  afterStart: EventPayload;
  /**
   * Called after the `onStart` callback has been called.
   */
  afterStartCallback: EventPayload;
  /**
   * Called before closing the server instance.
   */
  beforeStop: EventPayload;
  /**
   * Called after the server instance has been closed.
   */
  afterStop: EventPayload;
  /**
   * Called every time a new route is mounted in the application.
   */
  routeAdded: EventPayload<{ route: string }>;
}
/**
 * The events emitted by the application.
 */
export type JimpexEventName = keyof JimpexEvents;
/**
 * The type of the payload sent by a specific event.
 *
 * @template EventName  The literal type of the event, to obtain the type of the
 *                      payload.
 */
export type JimpexEventPayload<EventName extends JimpexEventName> =
  JimpexEvents[EventName];
/**
 * A dictionary of the reducer events and their targets.
 */
export interface JimpexReducerEventTargets {
  /**
   * It gets called before mounting a router/middleware for a specific route.
   */
  controllerWillBeMounted: Router | ExpressMiddlewareLike;
  /**
   * It gets called before using a middleware without route.
   */
  middlewareWillBeUsed: ExpressMiddlewareLike;
}
/**
 * A dictionary of the payloads the reducer events the application uses.
 */
export interface JimpexReducerEventPayloads {
  /**
   * It gets called before mounting a router/middleware for a specific route.
   */
  controllerWillBeMounted: EventPayload<{
    /**
     * The route in which the controller will be mounted.
     */
    route: string;
    /**
     * A reference for the controller/middleware before being "connected".
     */
    controller: Controller | Middleware;
  }>;
  /**
   * It gets called before using a middleware without route.
   */
  middlewareWillBeUsed: EventPayload;
}
/**
 * The reducer events used by the application.
 */
export type JimpexReducerEventName = keyof JimpexReducerEventTargets;
/**
 * The type of the target of a specific reducer event.
 *
 * @template EventName  The literal type of the event, to obtain the type of the
 *                      target.
 */
export type JimpexReducerEventTarget<EventName extends JimpexReducerEventName> =
  JimpexReducerEventTargets[EventName];
/**
 * The type of the payload of a specific reducer event.
 *
 * @template EventName  The literal type of the event, to obtain the type of the
 *                      payload.
 */
export type JimpexReducerEventPayload<EventName extends JimpexReducerEventName> =
  JimpexReducerEventPayloads[EventName];
/**
 * The name of the events o reducer events emitted/used by the application.
 * This generic type exists because the listener for both types are added using the same
 * method.
 */
export type JimpexEventNameLike = JimpexEventName | JimpexReducerEventName;
/**
 * The definition of a listener for an event or a reducer event.
 *
 * @template EventName  The literal type of the event, to validate whether the
 *                      parameters should be for a reducer event or an event.
 */
export type JimpexEventListener<EventName extends JimpexEventNameLike> =
  EventName extends JimpexEventName
    ? (payload: JimpexEventPayload<EventName>) => void
    : EventName extends JimpexReducerEventName
    ? (
        target: JimpexReducerEventTarget<EventName>,
        payload: JimpexReducerEventPayload<EventName>,
      ) => JimpexReducerEventTarget<EventName>
    : never;
/**
 * The `events` service Jimpex uses.
 * This is an alternative declaration of the `EventsHub` class that uses the interfaces
 * and types from this project.
 */
export type Events = {
  /**
   * Adds a new event listener.
   *
   * @param event     The name of the event.
   * @param listener  The listener function.
   * @returns An unsubscribe function to remove the listener.
   * @template EventName  The literal type of the event, to generate the type of the
   *                      listener.
   * @example
   *
   *   const unsubscribe = events.on('afterStart', ({ app }) => {
   *     app.getLogger().info('Hello world!');
   *     unsubscribe();
   *   });
   *
   */
  on: <EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ) => () => boolean;
  /**
   * Adds an event listener that will only be executed once.
   *
   * @param event     The name of the event.
   * @param listener  The listener function.
   * @returns An unsubscribe function to remove the listener.
   * @template EventName  The literal type of the event, to generate the type of the
   *                      listener.
   * @example
   *
   *   events.once('afterStart', ({ app }) => {
   *     app.getLogger().info('Hello world!');
   *     unsubscribe();
   *   });
   *
   */
  once: <EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ) => () => boolean;
  /**
   * Emits an event and call all its listeners.
   *
   * @param event    The name of the events.
   * @param payload  Context information for the event.
   * @template EventName  The literal type of the event, to generate the type of the
   *                      payload.
   * @example
   *
   *   // Extend the interface to type the payload.
   *   interface JimpexEvents {
   *     myEvent: { message: string };
   *   }
   *   // Add the listener.
   *   events.on('myEvent', ({ message }) => {
   *     console.log('Event received:', message);
   *   });
   *   // Trigger the event.
   *   events.emit('myEvent', { message: 'Hello' });
   *   // prints "Event received: Hello"
   *
   */
  emit: <EventName extends JimpexEventName>(
    event: JimpexEventName,
    payload: JimpexEventPayload<EventName>,
  ) => void;
  /**
   * Asynchronously reduces a target using an event. It's like emit, but the event
   * listeners return a modified (or not) version of the `target`.
   *
   * @param event    The name of the event.
   * @param target   The variable to reduce with the reducers/listeners.
   * @param payload  Context information for the event.
   * @returns A version of the `target` processed by the listeners.
   * @template EventName  The literal type of the event, to generate the types of the
   *                      target and the payload.
   * @example
   *
   *   // Extend the interface to type the target.
   *   interface JimpexReducerEventTargets {
   *     myReducer: unknown[];
   *   }
   *   // Extend the interface to type the payload.
   *   interface JimpexReducerEventPayloads {
   *     myReducer: {
   *       message: string;
   *     };
   *   }
   *   // Add the reducer.
   *   events.on('myReducer', async (target, { message }) => {
   *     const data = await fetch('https://api.example.com/' + message);
   *     target.push(data);
   *     return target;
   *   });
   *   // Trigger the event.
   *   const result = await events.reduce('myReducer', [], { message: 'Hello' });
   *   // result would be a list of data fetched from the API.
   *
   */
  reduce: <EventName extends JimpexReducerEventName>(
    event: JimpexReducerEventName,
    target: JimpexReducerEventTarget<EventName>,
    payload: JimpexReducerEventPayload<EventName>,
  ) => Promise<JimpexReducerEventTarget<EventName>>;
  /**
   * Synchronously reduces a target using an event. It's like emit, but the events
   * listener return a modified (or not) version of the `target`.
   *
   * @param event    The name of the event.
   * @param target   The variable to reduce with the reducers/listeners.
   * @param payload  Context information for the event.
   * @returns A version of the `target` processed by the listeners.
   * @template EventName  The literal type of the event, to generate the types of the
   *                      target and the payload.
   * @example
   *
   *   // Extend the interface to type the target.
   *   interface JimpexReducerEventTargets {
   *     myReducer: string[];
   *   }
   *   // Extend the interface to type the payload.
   *   interface JimpexReducerEventPayloads {
   *     myReducer: {
   *       message: string;
   *     };
   *   }
   *   // Add the reducer.
   *   events.on('myReducer', (target, { message }) => {
   *     target.push(message);
   *     return target;
   *   });
   *   // Trigger the event.
   *   events.reduce('event', [], 'Hello');
   *   // returns ['Hello']
   *
   */
  reduceSync: <EventName extends JimpexReducerEventName>(
    event: JimpexReducerEventName,
    target: JimpexReducerEventTarget<EventName>,
    payload: JimpexReducerEventPayload<EventName>,
  ) => JimpexReducerEventTarget<EventName>;
};
