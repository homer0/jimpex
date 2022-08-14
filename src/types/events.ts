import type { Router, ExpressMiddlewareLike } from './express';
import type { Controller, Middleware } from '../utils';
import type { Jimpex } from '../app/jimpex';

export type EventPayload<T = Record<string, unknown>> = {
  app: Jimpex;
} & T;

export interface JimpexEvents {
  beforeStart: EventPayload;
  start: EventPayload;
  afterStart: EventPayload;
  afterStartCallback: EventPayload;
  beforeStop: EventPayload;
  stop: EventPayload;
  afterStop: EventPayload;
  routeAdded: EventPayload<{ route: string }>;
}

export type JimpexEventName = keyof JimpexEvents;
export type JimpexEventPayload<EventName extends JimpexEventName> =
  JimpexEvents[EventName];

export interface JimpexReducerEventTargets {
  controllerWillBeMounted: Router | ExpressMiddlewareLike;
  middlewareWillBeUsed: ExpressMiddlewareLike;
}

export interface JimpexReducerEventPayloads {
  controllerWillBeMounted: EventPayload<{
    route: string;
    controller: Controller | Middleware;
  }>;
  middlewareWillBeUsed: EventPayload;
}

export type JimpexReducerEventName = keyof JimpexReducerEventTargets;
export type JimpexReducerEventTarget<EventName extends JimpexReducerEventName> =
  JimpexReducerEventTargets[EventName];
export type JimpexReducerEventPayload<EventName extends JimpexReducerEventName> =
  JimpexReducerEventPayloads[EventName];

export type JimpexEventNameLike = JimpexEventName | JimpexReducerEventName;

export type JimpexEventListener<EventName extends JimpexEventNameLike> =
  EventName extends JimpexEventName
    ? (payload: JimpexEventPayload<EventName>) => void
    : EventName extends JimpexReducerEventName
    ? (
        target: JimpexReducerEventTarget<EventName>,
        payload: JimpexReducerEventPayload<EventName>,
      ) => JimpexReducerEventTarget<EventName>
    : never;

export type Events = {
  on: <EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ) => () => boolean;
  once: <EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ) => () => boolean;
  emit: <EventName extends JimpexEventName>(
    event: JimpexEventName,
    payload: JimpexEventPayload<EventName>,
  ) => void;
  reduce: <EventName extends JimpexReducerEventName>(
    event: JimpexReducerEventName,
    target: JimpexReducerEventTarget<EventName>,
    payload: JimpexReducerEventPayload<EventName>,
  ) => Promise<JimpexReducerEventTarget<EventName>>;
  reduceSync: <EventName extends JimpexReducerEventName>(
    event: JimpexReducerEventName,
    target: JimpexReducerEventTarget<EventName>,
    payload: JimpexReducerEventPayload<EventName>,
  ) => JimpexReducerEventTarget<EventName>;
};
