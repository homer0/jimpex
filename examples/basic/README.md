# Jimpex basic example

This is a very small app with one service, one middleware, and one controller.

## Service

The `DateService` only has a `now()` method and returns a new instance of `Date`.

## Middleware

Every time there's an incoming request, the middleware uses the data obtained from the service, to log a message.

## Controller

The controller, mounted on `/date`, has two routes:

- `/` returns the current date.
- `/info` returns the current date and the current time.

## Other Jimpex features

If you read the `app.ts` file, you'll se a few other features of Jimpex:

### Health controller

This controller is mounted in the root route and just returns a `200` status code.

### Fast HTML middleware

This middleware serves a `404.html` file whenever a request is made for a route that has no controller/middleware mounted.
