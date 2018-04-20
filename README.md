## vanilla-spa-router
#### Simple-to-use VanillaJS (SPA) Router

Probably you even no need to use this but it's ok :)

Advantages:
* NO dependencies
* NO conflicts
* NO overrides
* just include as source or module
* IE6+, Firefox 2+

### Installation
... as source `<script src="router.js"></script>`
... as module `yarn add vanilla-spa-router`

### API
Use `window._Router(ops)` or `new Router(ops)` to access to routing

#### Available options
* `mode: 'history'(default) or 'hash'` _Choose the way of routing_
* `base: '/'(default)` _Set base directory_

#### Methods
* `.init(ops)` _Rebind your options accordingly_
* `.start()` _Start working with router using **History API** or `#anchor`_
* `.use(String route, Function middleware)` _Subscribe for router updates for exact path with needed params_
  `middleware(Object data)` - Receives transformed data from path name. You can continue working straight with Router using `this` inside middleware
* `.navigate(String path)` _Replaces you to the needed location_