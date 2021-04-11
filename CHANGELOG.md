# [7.0.0](https://github.com/homer0/jimpex/compare/6.1.2...7.0.0) (2021-04-11)


### Bug Fixes

* drop support for Node 10 ([f6267fc](https://github.com/homer0/jimpex/commit/f6267fc9d3f6c00cd917303ce9c79b95298b8464))


### BREAKING CHANGES

* This package no longer supports Node 10.

## [6.1.2](https://github.com/homer0/jimpex/compare/6.1.1...6.1.2) (2021-01-25)


### Bug Fixes

* hardcode the class type ([0103222](https://github.com/homer0/jimpex/commit/0103222e009b98cc970ae48df980ef9b2b4d36e8))
* remove src folder on types ([e2ffc41](https://github.com/homer0/jimpex/commit/e2ffc41240a2076dfb877e8412998e0c0abd991b))

## [6.1.1](https://github.com/homer0/jimpex/compare/6.1.0...6.1.1) (2021-01-25)


### Bug Fixes

* use the right path to the types ([2b36039](https://github.com/homer0/jimpex/commit/2b36039d14bc2a9edefce39a48628b0db6e14101))

# [6.1.0](https://github.com/homer0/jimpex/compare/6.0.1...6.1.0) (2021-01-25)


### Features

* add type definitions ([b496f00](https://github.com/homer0/jimpex/commit/b496f00c4a99718a37a4ef9e13844d732364a22e))

## [6.0.1](https://github.com/homer0/jimpex/compare/6.0.0...6.0.1) (2020-12-01)


### Bug Fixes

* prevent the utils folder from being ignored ([3b76d86](https://github.com/homer0/jimpex/commit/3b76d86cdbe7b2804faa7778565249a489033908))

# [6.0.0](https://github.com/homer0/jimpex/compare/5.2.0...6.0.0) (2020-11-28)


### Bug Fixes

* avoid loading external confing from the function ([e075ea7](https://github.com/homer0/jimpex/commit/e075ea77e456c56f6f2455839dad508a8b8039a4))
* make Jimpex a normal class ([bc3c3d2](https://github.com/homer0/jimpex/commit/bc3c3d2a29c4676d50dabf3e8fb455dbf134d0ff))
* make port and callback null on listen() and start() ([873ad7a](https://github.com/homer0/jimpex/commit/873ad7a425973bd9ac08f4451712faf14af6a448))
* make the boot parameter an option ([a178d5b](https://github.com/homer0/jimpex/commit/a178d5b662832b70a88573f220a3c451ca353bfc))
* make the forceHTTPS middleware parameter a dictionary of options. ([cdd6679](https://github.com/homer0/jimpex/commit/cdd6679d521fb244d68a4a0145683760e967df07))
* merge gateway controller provider parameters into a single one ([8436c96](https://github.com/homer0/jimpex/commit/8436c9666d2be4d8b9cbe38054dbcdd57bad1375))
* merge statics controller provider parameters into a single one ([d041e30](https://github.com/homer0/jimpex/commit/d041e3044d6affd14092a9f779f13cc8c6fcd041))
* update dependencies ([20ddea1](https://github.com/homer0/jimpex/commit/20ddea1e1c37712d3b95460fda483ad3a80b474c))
* use has() for try() ([cc9b93a](https://github.com/homer0/jimpex/commit/cc9b93a34a92ac6ff9cc127b3feedd3e72e8156a))


### Features

* add a function to construct a Jimpex instance ([208e365](https://github.com/homer0/jimpex/commit/208e3656048289a04750d171c22753cd1da06f5e))
* add HTTPS support regardless of HTTP/2 ([06992c1](https://github.com/homer0/jimpex/commit/06992c1e67ed80767d8ec86278ba9060dafbcc24))
* add init methods ([b794c50](https://github.com/homer0/jimpex/commit/b794c50f60e91802eeceaba87659d30779be909f))
* add proxy mode ([a26523c](https://github.com/homer0/jimpex/commit/a26523c0e0f4f7272e9673530ca66038f10c9b60))
* add support for controller providers ([ffce389](https://github.com/homer0/jimpex/commit/ffce38950bbafbd161cc8dd44bfbfa6518c26863))
* add support for HTTP/2 ([ca7ae6e](https://github.com/homer0/jimpex/commit/ca7ae6e883308da03103d226b2bc70fed5b24e80))
* add support for middleware providers ([ec61feb](https://github.com/homer0/jimpex/commit/ec61feb0eb5c8ba0f24e8b9a2de3c775319f18f1))
* add the options to configure spdy ([15e588d](https://github.com/homer0/jimpex/commit/15e588d6c10ccc433b26e127dfcb950a17ec9f6e))
* allow the config to be sent as a parameter ([6c409ab](https://github.com/homer0/jimpex/commit/6c409aba908a22134acb9a84c17e74c9b55f7af5))
* make the gateway controller a controller provider ([0e74362](https://github.com/homer0/jimpex/commit/0e743629f14cc42624e86faf46252928854205ae))
* use the Jimple wrappers from wootils ([fc444fb](https://github.com/homer0/jimpex/commit/fc444fba0ca7c80a19ca222d2e19ae2d84cc3f13))


### BREAKING CHANGES

* fn is now null by default on start() and port and fn are both null on listen()
* The file app/index now exports the class Jimpex as a 'named export'.
* `Jimpex`'s constructor `boot` parameter was transformed
into an option.
* The `forceHTTPS` middleware creator's `ignoredRoutes` parameter has been
replaced with an object with a property `ignoredRoutes`.
* The `gatewayController` controller creator's `middleware` parameter no
longer exists; it's now part of the `options` parameter.
* The `staticsController` controller creator's `middleware` parameter no
longer exists; it's now part of the `options` parameter.
