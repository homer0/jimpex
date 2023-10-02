# [9.0.0](https://github.com/homer0/jimpex/compare/8.0.0...9.0.0) (2023-10-02)


### Bug Fixes

* drop Node 16 support ([5e81112](https://github.com/homer0/jimpex/commit/5e81112bacea1f74f5250c6b12c6f1f94badee7f))
* update dependencies ([543e232](https://github.com/homer0/jimpex/commit/543e232bad8a13f67f380997209140c65b6292c4))


### BREAKING CHANGES

* Node 16 is not longer supported. Node 18.17 is the minimum required version now.

# [8.0.0](https://github.com/homer0/jimpex/compare/7.0.2...8.0.0) (2022-12-28)


### Bug Fixes

* add default obj to gateway ctrl options ([b0b08c9](https://github.com/homer0/jimpex/commit/b0b08c9e543c33f4a79140bd23304f23b2ab95d8))
* add missing call ([80ab14c](https://github.com/homer0/jimpex/commit/80ab14ca2416418705401f87ea8fa950e8f68734))
* add missing export ([b931583](https://github.com/homer0/jimpex/commit/b931583ad1394e016a7b78142a246cca698e0b45))
* add missing index ([f894408](https://github.com/homer0/jimpex/commit/f894408835426f2495af055d9c58b8c7cf054d47))
* add missing index files ([824ed67](https://github.com/homer0/jimpex/commit/824ed6770391ff210fd26b9ca1ce5302a588bb2f))
* add missing methods for the events type ([6f1802f](https://github.com/homer0/jimpex/commit/6f1802fb64dda572b4878b7541f6f35326de2072))
* add missing option ([790db2d](https://github.com/homer0/jimpex/commit/790db2db068e210470b29b99714880c363b94394))
* add options specific to the app path ([d910797](https://github.com/homer0/jimpex/commit/d9107975e04dd1d4280cc969e5ec0a546904e31c))
* avoid export groups ([7210845](https://github.com/homer0/jimpex/commit/721084568df35689afd56fc833bcf8776aed6c2b))
* bind fetch method ([da720ad](https://github.com/homer0/jimpex/commit/da720ad98ef8eb095aad0ae857d4986cb0d7d4b1))
* build all the files ([cf3166e](https://github.com/homer0/jimpex/commit/cf3166ec564d63225ce04c46de1b8877145cbdc0))
* change configuration to config everywhere ([e6da1ad](https://github.com/homer0/jimpex/commit/e6da1ad4af3aa53c526829d046c7b8b6ce7f47b9))
* change export name for Config and Logger types ([f3527f8](https://github.com/homer0/jimpex/commit/f3527f8cb8550ddeb8053251ea7388352daa0de6))
* check keys length ([37bdb81](https://github.com/homer0/jimpex/commit/37bdb81bc731bd948934ba579b7db8fc26078fdb))
* correct type name ([b1cb188](https://github.com/homer0/jimpex/commit/b1cb1886fd0c72124dcefc77cafa1baa3d11dbd0))
* depreacte Node 12 ([48f671e](https://github.com/homer0/jimpex/commit/48f671e4231019645e5eae5e2c670bbb354fc479))
* drop Node 14 support ([44d4e41](https://github.com/homer0/jimpex/commit/44d4e41d8420b84716d035f8e3d95f63a2e18b8e))
* evaluate options on register ([49fd361](https://github.com/homer0/jimpex/commit/49fd361241d18234918e201a5d625b7030e15334))
* export everything from services ([68fe93a](https://github.com/homer0/jimpex/commit/68fe93a92a680708915dcbe90daf80377654af11))
* export types for protected methods ([cd8651f](https://github.com/homer0/jimpex/commit/cd8651ff1ea7b470e5cce95c7156d043e0df4f8b))
* export types needed for overwrite ([32aa425](https://github.com/homer0/jimpex/commit/32aa42513529d11d6486fd7c966bd9cd900aa3df))
* get rid of the partial types ([45aca58](https://github.com/homer0/jimpex/commit/45aca585d1e59a9bb378d0a98c0c742aa260a837))
* make hasFolder false by default ([3e87cf2](https://github.com/homer0/jimpex/commit/3e87cf2129495afb3b525a31fb422939e2d0c428))
* make some types optional ([80766c4](https://github.com/homer0/jimpex/commit/80766c4b92ec676a1a16ab1ffa28018b9b6512f3))
* make the default config file optional ([d24b8ed](https://github.com/homer0/jimpex/commit/d24b8ed9ef6a4acfd344558f46c139b13f3a35e8))
* merge default config from options ([5f8447a](https://github.com/homer0/jimpex/commit/5f8447a9625d76355f67167e2e2986ee524d38a1))
* only import types ([0382966](https://github.com/homer0/jimpex/commit/03829668d72afd7a9b1f267a2614132272a20580))
* prefix all protected things with _ ([d7fbbc6](https://github.com/homer0/jimpex/commit/d7fbbc6e061ed01243ae6b6828cc116a026ab397))
* properly implement 'on' and 'once' ([f41e8cc](https://github.com/homer0/jimpex/commit/f41e8cc97e4a98b294c085a7af6f9edb8a57e75e))
* properly resolve parent path ([984f7c7](https://github.com/homer0/jimpex/commit/984f7c7ecc51930450be78f07501fa7c7e7583e5))
* register defautl services ([c06ccf3](https://github.com/homer0/jimpex/commit/c06ccf3850aff9eb99c0678b0f44182c12955215))
* remove fix for Node 14 ([72b1600](https://github.com/homer0/jimpex/commit/72b1600b771d134e3dd3da601bfa78df490938ae))
* remove promise with .then ([6b1406e](https://github.com/homer0/jimpex/commit/6b1406e0dea7adc0c2824d49e39a75f20bc42f9d))
* remove proxy option ([d93923c](https://github.com/homer0/jimpex/commit/d93923c2421f7fa92cb9b759dcd649339c25acd3))
* rename providers with the 'Provider' sufix ([c80d219](https://github.com/homer0/jimpex/commit/c80d21977f184373915d813c8a6c31cdbe45b67f))
* rename type ([d0cc7de](https://github.com/homer0/jimpex/commit/d0cc7def81be9f139ee95ad804f30ea06d4c00e8))
* replace appConfiguration with appConfig ([b71f4a9](https://github.com/homer0/jimpex/commit/b71f4a97cad75eee8f8c4c8cf949c7aa8cabba6f))
* restore reducer events ([d61ea55](https://github.com/homer0/jimpex/commit/d61ea55dbc534fb0891daf41d0bf983ea36a2f61))
* restore SendFile ([300c3cd](https://github.com/homer0/jimpex/commit/300c3cd4c251887a16eaad1db8ad9d3047f1d950))
* send instance on events ([2d405ee](https://github.com/homer0/jimpex/commit/2d405ee21c3455b4c1d326ce0c7fabf5cbea5b0a))
* set the app path to be the parent of the instance ([60d48b0](https://github.com/homer0/jimpex/commit/60d48b08b25dbc6fef0b7aedd57ae14f9d7d6e88))
* support middlewares on routes ([affbb14](https://github.com/homer0/jimpex/commit/affbb14511b052cbc1da83ffe5384b8332c7eaee))
* throw error if config is called before start ([4773e14](https://github.com/homer0/jimpex/commit/4773e14147e20f6ab0dc7c8025ae1ce277c528ba))
* throw error if the app path can't be found ([9ccc876](https://github.com/homer0/jimpex/commit/9ccc8764be9778698c9ef0e41bc08c7535781a2d))
* update all dependencies ([9a207a5](https://github.com/homer0/jimpex/commit/9a207a58b08072ccc72a342c93a3913c25a22e76))
* update import for fs ([98d88d4](https://github.com/homer0/jimpex/commit/98d88d46c30bf22c4df7012521a47bebe277da92))
* use 'inject'  to send dependecies ([797dcb5](https://github.com/homer0/jimpex/commit/797dcb59bd5f8486c01a2aa310d5f5e7d7d7c763))
* use consistent return ([b5b0a9b](https://github.com/homer0/jimpex/commit/b5b0a9b6ee51420f246dbdf4e3cbefe5cfb7bd5b))
* use interfaces for the events ([ad324fd](https://github.com/homer0/jimpex/commit/ad324fdc13e44b93c4d1ea75f160e085db308dbf))
* use statuses code dict to avoid a throw ([7fa7d07](https://github.com/homer0/jimpex/commit/7fa7d0763c4c3d84894015552108fe47287ed8b8))
* use the deferred to avoid parallel calls ([1f37cc9](https://github.com/homer0/jimpex/commit/1f37cc99970f210597571a737ce751cb9d75ef4c))
* validate status on response ([3f9339a](https://github.com/homer0/jimpex/commit/3f9339a2f778908f65b69099e9597850f25bec8f))


### Features

* add class base code ([35ba4c2](https://github.com/homer0/jimpex/commit/35ba4c2a14b0bc917afc040d0cc6220159f3483f))
* add getRouter method ([53f1147](https://github.com/homer0/jimpex/commit/53f1147df497456e6b5cfdadc3d4448556c6af72))
* add jimple resources ([eaa4584](https://github.com/homer0/jimpex/commit/eaa45847a7a22d1e47e31d056eb575e3d6433346))
* add method to list for events ([9e2a762](https://github.com/homer0/jimpex/commit/9e2a7626660f727311a8683a147cdee29395291c))


### BREAKING CHANGES

* Node 14 is not longer supported. Node 16 is the minimum required version now.
* All dep injections are now done with an 'inject' object.
* The signature of `sendFile` is now a single options object.
* The providers now have the 'Provider' suffix.
For example: `appError` is now `appErrorProvider`.
* Read the release migration guide, the signature of the events
has changed.
* Read the release migration guide, a lot of things related
to initialization were changed.
* This library is no longer compatible with Node 12

## [7.0.2](https://github.com/homer0/jimpex/compare/7.0.1...7.0.2) (2021-10-17)


### Bug Fixes

* update dependencies ([e74dc77](https://github.com/homer0/jimpex/commit/e74dc7743f9dccd233a89d550b15efd690b1f0cf))

## [7.0.1](https://github.com/homer0/jimpex/compare/7.0.0...7.0.1) (2021-09-06)


### Bug Fixes

* update dependencies ([b8460a1](https://github.com/homer0/jimpex/commit/b8460a1786221baa7089c41815857b9afcb0eeb2))

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
