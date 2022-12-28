import type { Router, ExpressMiddlewareLike } from './express';
import type { Controller, Middleware } from '../utils';
import type { Jimpex } from '../app/jimpex';

type EventPayload<T = Record<string, unknown>> = {
  app: Jimpex;
} & T;

export type JimpexLifeCycleEvent =
  | 'beforeStart'
  | 'start'
  | 'afterStart'
  | 'afterStartCallback'
  | 'beforeStop'
  | 'stop'
  | 'afterStop';
export type JimpexActionEvent = 'routeAdded';
export type JimpexEventName = JimpexLifeCycleEvent | JimpexActionEvent;
export type JimpexEventPayload<EventName extends JimpexEventName> =
  EventName extends 'routeAdded' ? EventPayload<{ route: string }> : EventPayload;

export type JimpexReducerEventName = 'controllerWillBeMounted' | 'middlewareWillBeUsed';
export type JimpexReducerEventTarget<EventName extends JimpexReducerEventName> =
  EventName extends 'controllerWillBeMounted'
    ? Router | ExpressMiddlewareLike
    : EventName extends 'middlewareWillBeUsed'
    ? ExpressMiddlewareLike
    : undefined;

export type JimpexReducerEventPayload<EventName extends JimpexReducerEventName> =
  EventName extends 'controllerWillBeMounted'
    ? EventPayload<{ route: string; controller: Controller | Middleware }>
    : EventPayload;

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
};
