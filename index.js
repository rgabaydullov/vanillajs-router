;(function(window, decodeURIComponent, history, module) {
    'use strict';

    var _defaultOps = {
        modeHistory: 'history',
        modeHash: 'hash',
        base: '/',
        routes: []
    };

    var REGEXP_ROUTES = {
        PARENT_DIR: '\\/[^\\/]*$',
        PARAM: ':.[^\/]*',
        PARAM_STRICT: '([\\w\\d\\-\\.][^\\/]*)',
        QUERY: '\\?(.[^#(.*)]*)'
    };

    var _routerApi = {
        _before: new Function(),
        _after: new Function(),
        start: function(onStart) {
            try { onStart() } catch(e) {}

            this.navigate(this.getQuery());
        },
        navigate: function(mode, base, path, query, callback) {
            var href = [
                this._filter(mode, base, path),
                this._setGetQuery(query)
            ].join('');

            switch(mode) {
                case _defaultOps.modeHistory:
                    history.pushState(null, null, href);
                    break;
                case _defaultOps.modeHash:
                    window.location.href = href;
                    break;
            }

            try { callback() } catch(e) {}
        },
        bind: function(routes, route, middleware) {
            route = this._trimSlashes(route);

            if(!!(middleware && middleware.constructor && middleware.call && middleware.apply) == false) {
                return
            }
            var _this = this,
                _reMatchParam = new RegExp(REGEXP_ROUTES.PARAM),
                _toMatch = new RegExp([
                    '^',
                    (!!route ? route.replace(_reMatchParam, REGEXP_ROUTES.PARAM_STRICT) : '\\/?'),
                    '\\??(.[^\\/]*)',
                    '$'
                ].join(''));

            routes.push({
                toMatch: _toMatch,
                callback: function(match) {
                    match = _this._trimSlashes(_this._clear(match));
                    return middleware.call(this, _this._routeData(match, route))
                }
            })
        },
        emit: function() {
            var _this = this,
                query = this.getQuery(),
                routes = this.routes;
            routes.forEach(function(route) {
                if(!!query.match(route.toMatch)) {
                    return route.callback.call(_this, query)
                }
            });
        },
        _listen: function(mode, base, callback) {
            var _this = this,
                previousQuery = this._getQuery(mode, base, true),
                _listenTimeout = setTimeout(function() {
                    clearTimeout(_listenTimeout);

                    var currentQuery = _this._getQuery(mode, base, true);

                    if(previousQuery != currentQuery) {
                        try { callback() } catch(e) {}
                    }

                    _this._listen.call(_this, mode, base, callback)
                }, 100);
        },
        _getBase: function(base) {
            base = this._trimSlashes(base);

            return (!!base
                ? [ '/', base, '/' ]
                : [ '/' ]).join('')
        },
        _getQuery: function(mode, base, noGetQuery) {
            noGetQuery = noGetQuery || false;
            var location = '';

            switch(mode) {
                case _defaultOps.modeHistory:
                    location = this._trimSlashes(decodeURIComponent([
                        window.location.pathname,
                        (noGetQuery ? '' : window.location.search)
                    ].join('')));
                    location = base == '/' ? location : location.replace(base, '');
                    break;
                case _defaultOps.modeHash:
                    var match = window.location.href.match(/#(.*)$/);
                    location = this._clear(!!match ? match[1] : '');
                    break;
            }
            return !!location ? location : '/'
        },
        _setGetQuery: function(data) {
            if(!!data == false) { return '' }
            var query = [],
                keys = Object.keys(data);

            keys.forEach(function(key) {
                var value = data[key];

                query.push([
                    key, value
                ].join('='));
            });
            query = query.join('&');
            return !!query ? '?'+ query : ''
        },
        _routeData: function(route, pattern) {
            var _reMatchParam = new RegExp(REGEXP_ROUTES.PARAM),
                _reMatchQuery = new RegExp(REGEXP_ROUTES.QUERY);

            var _dir = route.replace(new RegExp(REGEXP_ROUTES.PARENT_DIR), '').replace(/\?(.*)$/, ''),
                _param = route.replace(_reMatchQuery, '').match(new RegExp(pattern.replace(_reMatchParam, REGEXP_ROUTES.PARAM_STRICT), 'i')),
                _query = route.match(_reMatchQuery);

            return {
                dir: !!_dir ? this._trimSlashes(_dir) : '/',
                param: !!_param && !!_param[1] ? _param[1] : '',
                query: !!_query ? this._mapQuery(_query[1]) : {}
            }
        },
        _mapQuery: function(query) {
            var result = {},
                _query = query.split('&');

            _query.forEach(function(row) {
                var _row = row.split('=');

                if(!_row.length) { return }

                var key = _row[0],
                    value = _row[1];

                result[key] = value;
            });

            return result
        },
        _filter: function(mode, base, href) {
            return (mode == _defaultOps.modeHistory
                ? [ base, this._trimSlashes(href) ]
                : [ window.location.href.replace(/#(.*)$/, ''), '#', base, this._trimSlashes(this._clear(href)) ]).join('')
        },
        _clear: function(path) {
            return !!path ? path.toString().replace(/^#/, '') : ''
        },
        _trimSlashes: function(path) {
            return !!path ? path.toString().replace(/^\/*|\/*$/g, '') : ''
        }
    };

    function Router() {
        var _this = this;

        this.base = _defaultOps.base;
        this.mode = 'history' in window ? _defaultOps.modeHistory: _defaultOps.modeHash;
        this.routes = _defaultOps.routes;
        this.init = function(ops) {
            ops = ops || {};
            var _mode = ops.mode || this.mode,
                _base = _routerApi._getBase.call(_routerApi, ops.base);

            if(this.mode != ops.mode) {
                this.mode = _mode == 'history' && !!history.pushState ? _mode : _defaultOps.modeHash;
            }
            this.base = _base;

            _routerApi._listen.call(_routerApi, this.mode, this.base, _boundEmit);

            return this
        };
        this.start = function() {
            _routerApi.start.call(this, _boundEmit);
            return this
        };
        this.navigate = function(path, query) {
            _routerApi.navigate.call(_routerApi, this.mode, this.base, path, query);
            return this
        };
        this.use = function(route, middleware) {
            _routerApi.bind.call(_routerApi, this.routes, route, middleware);
            return this
        };
        this.getQuery = function() {
            return _routerApi._getQuery.call(_routerApi, this.mode, this.base)
        };

        function _boundEmit() {
            return _routerApi.emit.call(_this)
        }
    }

    window._Router = function(ops) {
        return (new Router()).init(ops)
    };

    module.exports = Router;

    return Router
})(window, window.decodeURIComponent, window.history, (typeof module == 'undefined' ? {} : module));