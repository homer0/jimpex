import type { Router, ExpressMiddleware } from './express';
import type { Controller } from '../utils';

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
  EventName extends 'routeAdded' ? { route: string } : undefined;

export type JimpexReducerEventName = 'controllerWillBeMounted' | 'middlewareWillBeUsed';
export type JimpexReducerEventTarget<EventName extends JimpexReducerEventName> =
  EventName extends 'controllerWillBeMounted'
    ? Router | ExpressMiddleware
    : EventName extends 'middlewareWillBeUsed'
    ? ExpressMiddleware
    : undefined;
export type JimpexReducerEventPayload<EventName extends JimpexReducerEventName> =
  EventName extends 'controllerWillBeMounted'
    ? { route: string; controller: Controller }
    : undefined;

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
