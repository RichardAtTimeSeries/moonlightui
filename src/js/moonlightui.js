/* Extend it with moonlight ui functions */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(root.jQuery);
    }
}(this, function ($) {
    var callbacks = [],
        modules = {},
        actions = [],
        routes = [],
        debugMode = false,
        labelLib = 'MOONLIGHTUI - ',
        tempModule,
        routerInit = false,
        viewHistory = [],
        lastView = '',
        config = {},
        errorHandlers = [];

    $.fn.extend({
        /* MOONLIGHTUI - System */
        checkRoute: function() {
            function parseQuerystring(query) {
                var pairs = query.split('&');
                var result = {};
                pairs.forEach(function(pair) {
                    pair = pair.split('=');
                    result[pair[0]] = decodeURIComponent(pair[1] || '');
                });
                return JSON.parse(JSON.stringify(result));
            }
            if (window.location.hash !== '') {
                var url = window.location.hash.replace('#!','').replace('#',''),
                    queryObject = false;
                if (url.indexOf('?') !== -1) {
                    var query = url.split('?');
                    queryObject = parseQuerystring(query[1]);
                    url = query[0];
                }
                console.log(labelLib + 'Found url: ' + url);
                for (var i = 0; i < routes.length; i++) {
                    if (routes[i].url === url) {
                        var view = $ml().getView(routes[i].module,routes[i].name);
                        if (typeof view !== 'undefined') {
                            $("a[href^=\\#\\!]").off();
                            if (typeof view.__cachedOptions !== 'undefined' && view.__cachedOptions !== false) {
                                view.render(function () {}, view.__cachedOptions, ((queryObject !== false) ? queryObject : undefined));
                            } else {
                                view.render(function () {}, undefined, ((queryObject !== false) ? queryObject : undefined));
                            }
                        }
                        break;
                    }
                }
            }
        },
        onready: function(cb) {
            var self = this;
            if (debugMode) {
                console.info(labelLib + 'We are initializing the onready.');
            }
            if (routerInit === false) {
                //let this snippet run before your hashchange event binding code
                if(!window.HashChangeEvent){
                    (function () {
                        var lastURL = document.URL;
                        window.addEventListener("hashchange", function (event) {
                            Object.defineProperty(event, "oldURL", {
                                enumerable: true,
                                configurable: true,
                                value: lastURL
                            });
                            Object.defineProperty(event, "newURL", {
                                enumerable: true,
                                configurable: true,
                                value: document.URL
                            });
                            lastURL = document.URL;
                        });
                    }());
                }
                window.onhashchange = self.checkRoute;
                routerInit = true;
            }
            $(document).ready(function() {
                $("a[href^=\\#\\!]").on('click', self.checkRoute);
            });
            jsPlumb.ready(cb);
        },
        url: window.location,
        debug: function(setAs) {
            debugMode = setAs;
        },
        viewReady: function(module, view) {
            if (debugMode) {
                console.info(labelLib + 'Triggered viewReady for module: ' + module + ' view: ' + view);
            }
            if (modules[module].views[view].__template === false) {
                return false;
            } else {
                return true;
            }
        },
        viewsReady: function(cb) {
            if (debugMode) {
                console.info(labelLib + 'Triggered viewsReady.');
            }
            $.each( modules, function( module, value ) {
                $.each( modules[module].views, function( name, view ) {
                    if (modules[module].views[name].__template === false) {
                        if (typeof cb !== 'undefined') {
                            cb(false);
                        } else {
                            return false;
                        }
                    }
                });
            }).promise().done(function(){
                if (typeof cb !== 'undefined') {
                    cb(true);
                } else {
                    return true;
                }
            });
        },
        /* MOONLIGHTUI - Interaction from modules and controller */
        removeSelect: function(){
            if (debugMode) {
                console.info(labelLib + 'Remove select.');
            }
            $(this).each(function(){
                $(this).removeClass('selected');
            });
        },
        addSelect: function(){
            if (debugMode) {
                console.info(labelLib + 'Add select.');
            }
            $(this).each(function(){
                $(this).addClass('selected');
            });
        },
        removeHidden: function(){
            if (debugMode) {
                console.info(labelLib + 'Remove hidden.');
            }
            $(this).each(function(){
                $(this).removeClass('hidden');
            });
        },
        addHidden: function(){
            if (debugMode) {
                console.info(labelLib + 'Add hidden.');
            }
            $(this).each(function(){
                $(this).addClass('hidden');
            });
        },
        removeErrorInput: function(){
            if (debugMode) {
                console.info(labelLib + 'Remove error input.');
            }
            $(this).each(function(){
                $(this).removeClass('error-input');
            });
        },
        addErrorInput: function(){
            if (debugMode) {
                console.info(labelLib + 'Add error input.');
            }
            $(this).each(function(){
                $(this).addClass('error-input');
            });
        },
        scrollToElement: function(){
            if (debugMode) {
                console.info(labelLib + 'Scroll to element');
            }
            $(this).get(0).scrollIntoView();
        },
        registerCallback: function(identifier, fn) {
            if (debugMode) {
                console.info(labelLib + 'Register a callback. Identifier: ' + identifier);
            }
            callbacks[identifier] = fn;
        },
        actions: function(){
            if (debugMode) {
                console.info(labelLib + 'Attach actions.');
            }
            function findModuleAndController(element, fnc)
            {
                var controller = $(element).closest('[data-ml-controller]').data('ml-controller');
                var module = $(element).closest('[data-ml-module]').data('ml-module');
                if (typeof modules[module] === 'undefined') {
                    console.warn(labelLib + 'Module "' + module + '" is not defined');
                    return true;
                }
                if (typeof modules[module].controllers[controller] === 'undefined') {
                    console.warn(labelLib + 'Controller "' + controller + '" on module "' + module + '" is not defined');
                    return true;
                } else {
                    if (typeof modules[module].controllers[controller][fnc] === 'undefined') {
                        console.warn(labelLib + 'Controller "' + controller + '" on module "' + module + '" with function "' + fnc + '" is not defined');
                        return true;
                    }
                }
                return false;
            }
            this.each(function(){
                $(this).on('click', function(event){
                    var tabAction = $(this).data('ml-action'),
                        controller = $(this).closest('[data-ml-controller]').data('ml-controller'),
                        module = $(this).closest('[data-ml-module]').data('ml-module');
                    var error = findModuleAndController(this, tabAction);
                    if (debugMode) {
                        console.info(labelLib + 'Click event executed for module: ' + module + ' controller: ' + controller + ' action: ' + tabAction);
                    }
                    if (error === false) {
                        if (tabAction.indexOf(',') !== -1) {
                            var tabActions = tabAction.split(',');
                            for (var i = 0; i < tabActions.length; i++) {
                                modules[module].controllers[controller][tabActions[i]](this, event);
                            }
                        } else {
                            modules[module].controllers[controller][tabAction](this, event);
                        }
                    } else {
                        console.warn(labelLib + error);
                    }
                });
            });
        },
        /* MOONLIGHTUI - Configuration */
        config: function(cfg) {
            if (typeof cfg === 'undefined') {
                return config;
            } else {
                config = cfg;
            }
            return this;
        },
        getConfig: function(name) {
            return config[name];
        },
        /* MOONLIGHTUI - State */
        setState: function(name, value) {
            switch(name) {
                case "callbacks":
                    callbacks = value;
                    break;
                case "modules":
                    for (var cm in modules) {
                        if (modules.hasOwnProperty(cm)) {
                            for (var m in value) {
                                if (value.hasOwnProperty(m) && cm === m) {
                                    modules[m] = value[m];
                                }
                            }
                        }
                    }
                    break;
                case "actions":
                    actions = value;
                    break;
                case "routes":
                    actions = value;
                    break;
                case "debugMode":
                    debugMode = value;
                    break;
                case "tempModule":
                    tempModule = value;
                    break;
                case "routerInit":
                    routerInit = value;
                    break;
                case "viewHistory":
                    viewHistory = value;
                    break;
                case "lastView":
                    lastView = value;
                    break;
            }
            return this;
        },
        mlsettings: function () {
            return this.state();
        },
        state: function() {
            return {
                callbacks: callbacks,
                modules: modules,
                actions: actions,
                routes: routes,
                debugMode: debugMode,
                tempModule: tempModule,
                routerInit: routerInit,
                viewHistory: viewHistory,
                lastView: lastView,
                config: config
            };
        },
        /* MOONLIGHTUI - Services */
        getService: function(parent, name)
        {
            if (typeof modules[parent].services[name] !== 'undefined') {
                if (debugMode) {
                    console.info(labelLib + 'Get controller: ' + name);
                }
                return modules[parent].services[name];
            }
        },
        service: function(name, service) {
            var module = tempModule.slice(0);
            if (typeof modules[module].services[name] === 'undefined') {
                if (debugMode) {
                    console.info(labelLib + 'Created service: ' + name);
                }
                var sv = service();
                sv.__module = module;
                sv.__original = service();
                sv.__attached = {};
                sv.__history = [];
                sv.get = function(name) {
                    return this[name];
                };
                sv.set = function(name, value) {
                    this.__history.push({ name: value });
                    this[name] = value;
                    var capitalizeName = name.charAt(0).toUpperCase() + name.slice(1);
                    this.emit('on' + capitalizeName + 'Change', value);
                };
                sv.attach = function(name, cb) {
                    if (typeof this.__attached[name] === 'undefined') {
                        this.__attached[name] = [];
                        this.__attached[name].push(cb);
                    }
                };
                sv.emit = function(name, obj) {
                    if (typeof this.__attached[name] !== 'undefined') {
                        for (var i = 0; i < this.__attached[name].length; i++) {
                            this.__attached[name][i](obj);
                        }
                    }
                };
                modules[tempModule].services[name] = sv;
            }
            return this;
        },
        /* MOONLIGHTUI - Error handlers to handle each error from moonlight UI. */
        __activateErrorHandlers: function(err) {
            for(var p in errorHandlers) {
                if (errorHandlers.hasOwnProperty(p)) {
                    errorHandlers[p](err);
                }
            }
        },
        error: function(cb) {
            errorHandlers.push(cb);
            return this;
        },
        /* MOONLIGHTUI - MVC mechanism */
        module: function(name) {
            tempModule = name;
            if (typeof modules[name] === 'undefined') {
                if (debugMode) {
                    console.info(labelLib + 'Created module: ' + name);
                }
                modules[name] = {
                    controllers: {},
                    models: {},
                    views: {},
                    services: {}
                };
            }
            return this;
        },
        controller: function(name, controller) {
            var ctrl = controller(),
                module = tempModule.slice(0);
            ctrl.__module = module;
            modules[tempModule].controllers[name] = ctrl;
            if (debugMode) {
                console.info(labelLib + 'Created controller: ' + name);
            }
            return this;
        },
        view: function(name, view, render) {
            var vw = view(),
                engine = this,
                module = tempModule.slice(0),
                routeSet = false;
            if (typeof vw.routeURL !== 'undefined' && vw.routeURL !== '') {
                for(var i = 0; i < routes.length; i++) {
                    if (routes[i].url === vw.routeURL) {
                        console.error(labelLib + 'Already have a route configured with: ' + routes[i].url + ' in module ' + routes[i].module + ' in view ' + routes[i].view);
                        routeSet = true;
                        break;
                    }
                }
                if (routeSet === false) {
                    routes.push({
                        'url': vw.routeURL,
                        'module': module,
                        'name': name
                    });
                }
            }
            function toQueryString(obj) {
                var parts = [];
                for (var i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
                    }
                }
                return parts.join("&");
            }
            vw.__name = name;
            vw.__error = '';
            vw.__module = module;
            vw.__template = false;
            vw.__containerId = false;
            vw.__container = false;
            vw.__models = false;
            vw.__initialized = false;
            vw.__cached = '';
            vw.__cachedOptions = false;
            vw.__usecached = false;
            vw.__run = false;
            vw.__render = function(html) {
                return html;
            };
            vw.setContainer = function(id) {
                modules[module].views[name].container = id;
                modules[module].views[name].__container = $(modules[module].views[name].container);
            };
            vw.refresh = function() {
                if (debugMode) {
                    console.info(labelLib + 'Refreshing module: ' + module + ' view: ' + name);
                }
                modules[module].views[name].__container.html(modules[module].views[name].__cached);
                if (modules[module].views[name].__initialized === true) {
                    engine.reenergize(modules[module].views[name].container);
                } else {
                    engine.energize(modules[module].views[name].container);
                }
            };
            vw.reset = function() {
                if (debugMode) {
                    console.info(labelLib + 'Reset module: ' + module + ' view: ' + name);
                }
                modules[module].views[name].__container.html('');
            };
            vw.useCache = function(value){
                vw.__usecached = value;
            };
            vw.renderCached = function(cb) {
                if (debugMode) {
                    console.info(labelLib + 'Render module: ' + module + ' view: ' + name);
                }
                modules[module].views[name].__container = $(modules[module].views[name].container);
                modules[module].views[name].__container.html('<div class="col ml-progress-indicator progress-indicator s12 m12 l12"><div class="progress"><div class="indeterminate"></div></div></div>');
                if (typeof cb === "undefined") {
                    modules[module].views[name].__container = $(modules[module].views[name].container);
                    modules[module].views[name].__container.html(modules[module].views[name].__cached);
                    if (modules[module].views[name].__initialized === true) {
                        engine.reenergize(modules[module].views[name].container);
                    } else {
                        engine.energize(modules[module].views[name].container);
                    }
                } else {
                    modules[module].views[name].__container = $(modules[module].views[name].container);
                    modules[module].views[name].__container.html(modules[module].views[name].__cached);
                    if (modules[module].views[name].__initialized === true) {
                        engine.reenergize(modules[module].views[name].container);
                    } else {
                        engine.energize(modules[module].views[name].container);
                    }
                    cb(modules[module].views[name].__template, modules[module].views[name].__container);
                }
            };
            vw.run = function(cb) {
                this.__run = cb;
            };
            vw.render = function(cb, postParams, getParams) {
                lastView = name;
                viewHistory.push(name);
                if (debugMode) {
                    console.info(labelLib + 'Render module: ' + module + ' view: ' + name);
                }
                if (typeof options !== 'undefined') {
                    vw.__cachedOptions = options;
                }
                if (vw.__usecached === true && modules[module].views[name].__cached !== '') {
                    vw.renderCached(cb);
                } else {
                    modules[module].views[name].__container = $(modules[module].views[name].container);
                    if (typeof $(modules[module].views[name].__container).children('.ml-buffer.ml-buffer-hide')[0] === 'undefined') {
                        $(modules[module].views[name].__container).html('<div class="ml-buffer ml-buffer-one ml-buffer-show"></div><div class="ml-buffer ml-buffer-two ml-buffer-hide"></div>');
                    }
                    if (typeof cb === "undefined") {
                        modules[module].views[name].__container = $(modules[module].views[name].container);
                        $(modules[module].views[name].__container).children('.ml-buffer-hide').html(modules[module].views[name].__render(modules[module].views[name].__template));
                        var bufferShow = $(modules[module].views[name].__container).children('.ml-buffer-show');
                        var bufferHide = $(modules[module].views[name].__container).children('.ml-buffer-hide');
                        $(bufferShow).removeClass('ml-buffer-show').addClass('ml-buffer-hide');
                        $(bufferHide).removeClass('ml-buffer-hide').addClass('ml-buffer-show');
                        engine.deenergize(bufferShow);
                        $(bufferShow).html('');
                        if (modules[module].views[name].__initialized === true) {
                            engine.reenergize(modules[module].views[name].container);
                        } else {
                            engine.energize(modules[module].views[name].container);
                        }
                        if (modules[module].views[name].__run !== false) {
                            modules[module].views[name].__run();
                        }
                    } else {
                        if (typeof $('.ml-progress-indicator-container .ml-progress-indicator')[0] === 'undefined') {
                            $('.ml-progress-indicator-container').append('<div class="col ml-progress-indicator progress-indicator s12 m12 l12"><div class="progress"><div class="indeterminate"></div></div></div>');
                        }
                        $(modules[module].views[name].__container).children('.ml-buffer-show').append('<div class="ml-progress-overlap"></div>');
                        modules[module].views[name].__loadTemplate(function () {
                            modules[module].views[name].__container = $(modules[module].views[name].container);
                            $(modules[module].views[name].__container).children('.ml-buffer-hide').html(modules[module].views[name].__render(modules[module].views[name].__template));
                            var bufferShow = $(modules[module].views[name].__container).children('.ml-buffer-show');
                            var bufferHide = $(modules[module].views[name].__container).children('.ml-buffer-hide');
                            $(bufferShow).removeClass('ml-buffer-show').addClass('ml-buffer-hide');
                            $(bufferHide).removeClass('ml-buffer-hide').addClass('ml-buffer-show');
                            engine.deenergize(bufferShow);
                            $(bufferShow).html('');
                            modules[module].views[name].__cached = modules[module].views[name].__container.html();
                            if (modules[module].views[name].__initialized === true) {
                                engine.reenergize(modules[module].views[name].container);
                            } else {
                                engine.energize(modules[module].views[name].container);
                            }
                            if (modules[module].views[name].__run !== false) {
                                modules[module].views[name].__run();
                            }
                            $('.progress-indicator').remove();
                            cb(modules[module].views[name].__template, modules[module].views[name].__container);
                        }, postParams, getParams);
                    }
                }
            };
            vw.__loadTemplate = function(cb, postParams, getParams) {
                var queryString = false;
                if (typeof getParams !== 'undefined') {
                    queryString = toQueryString(getParams);
                }
                if (typeof modules[module].views[name].templateURL !== 'undefined') {
                    var ajaxOptions = {
                        url: modules[module].views[name].templateURL + ((queryString !== false) ? '?' + queryString : ''),
                        type: 'GET'
                    };
                    if (typeof postParams !== 'undefined' && typeof postParams.data !== 'undefined') {
                        ajaxOptions.type = 'POST';
                        ajaxOptions.data = {
                            data: postParams.data
                        };
                        if (typeof config.csrf_token !== 'undefined') {
                            ajaxOptions.data._token = config.csrf_token;
                        }
                    }
                    $.ajax(ajaxOptions).done(function(data){
                        if (debugMode) {
                            console.info(labelLib + 'Loadtemplate completed module: ' + module + ' view: ' + name);
                        }
                        modules[module].views[name].__template = data;
                        if (typeof cb !== "undefined") {
                            cb(data);
                        } else {
                            return data;
                        }
                    }).fail(function(data){
                        console.warn(labelLib + 'We cant load template with url: ' + this.templateURL);
                        engine.__activateErrorHandlers(data);
                        if (typeof cb !== "undefined") {
                            cb("");
                        } else {
                            return "";
                        }
                    });
                }
                if (typeof this.template !== 'undefined') {
                    if (debugMode) {
                        console.info(labelLib + 'Set the template from a string module: ' + module + ' view: ' + name + ' template: ' + this.template);
                    }
                    modules[module].views[name].__template = this.template;
                    if (typeof cb !== "undefined") {
                        cb(this.template);
                    } else {
                        return this.template;
                    }
                }
                return this.__template;
            };
            vw.__loadModels = function(cb) {
                if (typeof this.models !== 'undefined') {
                    if (debugMode) {
                        console.info(labelLib + 'Load models on view: ' + module + ' view: ' + name + ' models: ');
                        console.info(this.models);
                    }
                    modules[module].views[name].__models = this.models;
                }
                cb();
            };
            modules[module].views[name] = vw;
            if (debugMode) {
                console.info(labelLib + 'Created view: ' + name);
            }
            return this;
        },
        model: function(name, model) {
            // Instantiate new model
            var mdl = model(),
                engine = this,
                module = tempModule.slice(0);

            function searchFor(param, key, nameOfObject) {
                var value = param[key];
                $('[data-ml-module="' + mdl.__module + '"').find('[data-ml-model="' + mdl.__name + '.' + nameOfObject + '.' + key + '"]').each(function () {
                    if ($(this).is(":checkbox")) {
                        if (value === 1) {
                            $(this).prop('checked', true);
                        } else {
                            $(this).prop('checked', false);
                        }
                    }
                    if ($(this).is("input") ||
                        $(this).is("textarea") ||
                        $(this).is("select") ||
                        $(this).is(":radio")) {
                        $(this).val(param[key]);
                    } else {
                        $(this).html(param[key]);
                    }
                });
            }

            // We get the model not the settings.
            if (model() instanceof Array)
            {
                mdl = model()[1];
            }

            // Attach new variables and new functions. Will override existing functions.
            mdl.__settings = (model() instanceof Array) ? model()[0] : false;
            mdl.__fields = (model() instanceof Array) ? model()[1] : model();
            mdl.__name = name;
            mdl.__engine = engine;
            mdl.__error = '';
            mdl.__module = module;
            mdl.__mapTo = false;
            mdl.__parseQuery = function(url, obj) {
                for (var p in obj) {
                    if (obj.hasOwnProperty(p)) {
                        url = url.split('{' + p + '}').join(this[p]);
                    }
                }
                return url;
            };
            mdl.__toObj = function() {
                var obj = {};
                for (var p in this.__fields) {
                    if (this.__fields.hasOwnProperty(p)) {
                        obj[p] = this[p];
                    }
                }
                return obj;
            };
            mdl.mapTo = function(mapTo) {
                this.__mapTo = mapTo;
                return this;
            };
            mdl.delete = function() {
                var obj = this.__toObj(),
                    self = this,
                    url = (typeof config.urlPrefix  !== 'undefined') ? config.urlPrefix : '';
                if (this.__mapTo !== false){
                    obj = this.__mapTo(obj);
                }
                return new Promise(function(resolve, reject) {
                    // do a thing, possibly async, then…
                    engine.doDELETE({
                        'url' : url + self.__parseQuery(self.__settings.delete, obj),
                        'data' : obj
                    }, function(data){
                        resolve(data);
                    }, function(data){
                        reject(data);
                    });
                });
            };
            mdl.put = function() {
                var obj = this.__toObj(),
                    self = this,
                    url = (typeof config.urlPrefix  !== 'undefined') ? config.urlPrefix : '';
                if (this.__mapTo !== false){
                    obj = this.__mapTo(obj);
                }
                return new Promise(function(resolve, reject) {
                    // do a thing, possibly async, then…
                    engine.doPUT({
                        'url' : url + self.__parseQuery(self.__settings.put, obj),
                        'data' : obj
                    }, function(data){
                        resolve(data);
                    }, function(data){
                        reject(data);
                    });
                });
            };
            mdl.post = function() {
                var obj = this.__toObj(),
                    self = this,
                    url = (typeof config.urlPrefix  !== 'undefined') ? config.urlPrefix : '';
                if (this.__mapTo !== false){
                    obj = this.__mapTo(obj);
                }
                return new Promise(function(resolve, reject) {
                    // do a thing, possibly async, then…
                    engine.doPOST({
                        'url' : url + self.__parseQuery(self.__settings.post, obj),
                        'data' : obj
                    }, function(data){
                        resolve(data);
                    }, function(data){
                        reject(data);
                    });
                });
            };
            mdl.load = function(isInit) {
                var obj = this.__toObj(),
                    self = this,
                    url = (typeof config.urlPrefix  !== 'undefined') ? config.urlPrefix : '';
                return new Promise(function(resolve, reject) {
                    // do a thing, possibly async, then…
                    engine.doGET({
                        'url' : url + self.__parseQuery(self.__settings.get, obj),
                        'data' : obj
                    }, function(data){
                        // Do two-way databinding when load is complete.
                        for (var pr in data) {
                            for (var p in self.__fields) {
                                if (self.__fields.hasOwnProperty(p)) {
                                    if (p === pr) {
                                        self[p] = data[pr];
                                        if (typeof isInit === 'undefined') {
                                            self.__broadcast(self.__name, pr, null);
                                        }
                                    }
                                }
                            }
                        }
                        resolve(data);
                    }, function(data){
                        reject(data);
                    });
                });
            };
            mdl.removeError = function() {
                if (debugMode) {
                    console.info(labelLib + 'Remove error: ' + module + ' model: ' + name);
                }
                modules[module].models[name].__error = '';
                $('[data-ml-module="' + module+ '"]').find('[data-ml-error="' + name + '.error"]').each(function() {
                    if ($(this).is( "input" ) ||
                        $(this).is( "textarea" ) ||
                        $(this).is( "select" ) ||
                        $(this).is( "checkbox" ) ||
                        $(this).is( "radio" )) {
                        $(this).val('');
                    } else {
                        $(this).html('');
                    }
                    $(this).addHidden();
                });
            };
            mdl.addError = function(value) {
                if (debugMode) {
                    console.info(labelLib + 'Add error: ' + module + ' model: ' + name);
                }
                modules[module].models[name].__error = value;
                $('[data-ml-module="' + module+ '"]').find('[data-ml-error="' + name + '.error"]').each(function() {
                    if ($(this).is( "input" ) ||
                        $(this).is( "textarea" ) ||
                        $(this).is( "select" ) ||
                        $(this).is( "checkbox" ) ||
                        $(this).is( "radio" )) {
                        $(this).val(modules[module].models[name].__error);
                    } else {
                        $(this).html(modules[module].models[name].__error);
                    }
                    $(this).removeHidden();
                });
            };
            mdl.getError = function(value) {
                if (debugMode) {
                    console.info(labelLib + 'Get error: ' + module + ' model: ' + name + ' value: ');
                    console.info(value);
                }
                return modules[module].models[name].__error;
            };
            mdl.bind = function(param) {
                var obj = mdl.get(param);
                mdl.set(obj, param);
            };
            mdl.get = function(param, defaultValue) {
                if (debugMode) {
                    console.info(labelLib + 'Get: ' + module + ' model: ' + name + ' default value: ');
                    console.info(defaultValue);
                }
                if (typeof defaultValue === 'undefined') {
                    defaultValue = '';
                }
                if (typeof modules[module].models[name][param] !== 'undefined') {
                    return modules[module].models[name][param];
                } else {
                    console.warn(labelLib + 'Model "' + mdl.__name + '" in module "' + mdl.__module + '" does not have property "' + param + '"');
                    return defaultValue;
                }
            };
            mdl.set = function(param, value) {
                if (debugMode) {
                    console.info(labelLib + 'Set: ' + module + ' model: ' + name + ' value: ');
                    console.info(value);
                }
                if (typeof param === 'object') {
                    for (var key in param) {
                        if (param.hasOwnProperty(key)) {
                            mdl[key] = param[key];
                            searchFor(param, key, value);
                        }
                    }
                } else {
                    mdl[param] = value;
                    $('[data-ml-module="' + mdl.__module + '"').find('[data-ml-model="' + mdl.__name + '.' + param + '"]').each(function () {
                        if ($(this).is(":checkbox")) {
                            if (value === 1) {
                                $(this).prop('checked', true);
                            } else {
                                $(this).prop('checked', false);
                            }
                        }
                        if ($(this).is("input") ||
                            $(this).is("textarea") ||
                            $(this).is("select") ||
                            $(this).is(":radio")) {
                            $(this).val(value);
                        } else {
                            $(this).html(value);
                        }
                    });
                }
            };
            mdl.__on = false;
            mdl.receive = function(cb) {
                if (debugMode) {
                    console.info(labelLib + 'Set receive module: ' + module + ' model: ' + name);
                }
                mdl.__on = cb;
            };
            mdl.__broadcast = function(model, param, evt){
                if (debugMode) {
                    console.info(labelLib + 'Broadcast: ' + module + ' model: ' + name);
                }
                $('[data-ml-module="' + module+ '"]').find('[data-ml-model="' + model + '.' + param + '"]').each(function() {
                    var modelParameter = [];
                    if (param.indexOf('.') !== -1) {
                        modelParameter = param.split('.');
                    }
                    if ($(this).is( ":checkbox" )) {
                        if (modelParameter.length > 1) {
                            $(this).prop('checked', modules[module].models[model][modelParameter[0]][modelParameter[1]]);
                        } else {
                            $(this).prop('checked', modules[module].models[model][param]);
                        }
                    } else {
                        if ($(this).is("input") ||
                            $(this).is("textarea") ||
                            $(this).is("select") ||
                            $(this).is(":radio")) {
                            if (modelParameter.length > 1) {
                                modules[module].models[model][modelParameter[0]][modelParameter[1]] = $(this).val();
                            } else {
                                modules[module].models[model][param] = $(this).val();
                            }
                        } else {
                            $(this).html(modules[module].models[model][param]);
                        }
                    }
                });
                if (modules[module].models[model].__on !== false) {
                    modules[module].models[model].__on(param, evt);
                }
            };
            mdl.__initTwoWayBinding = function(){
                if (debugMode) {
                    console.info(labelLib + 'Init two-way databinding module: ' + module + ' model: ' + name);
                }
                // Attach two-way databinding
                $('[data-ml-module="' + module+ '"]').find('[data-ml-model*="' + name + '."]').each(function(){
                    if ($(this).data('ml-model').indexOf('.') !== -1) {
                        var modelParameter = $(this).data('ml-model').split('.'),
                            model = modelParameter[0];
                            modelParameter.shift();
                        var param = modelParameter[0];
                        if ($(this).is( ":checkbox" )) {
                            if (modelParameter.length > 1) {
                                if (modules[module].models[model][modelParameter[0]][modelParameter[1]] === true)
                                {
                                    $(this).prop('checked', true);
                                } else {
                                    $(this).prop('checked', false);
                                }
                            } else {
                                if (modules[module].models[model][param] === true)
                                {
                                    $(this).prop('checked', true);
                                } else {
                                    $(this).prop('checked', false);
                                }
                            }
                            $(this).on('click', function (evt) {
                                if (modelParameter.length > 1) {
                                    modules[module].models[model][modelParameter[0]][modelParameter[1]] =  $(this).prop('checked');
                                    modules[module].models[model].__broadcast(model, modelParameter.join('.'), evt);
                                } else {
                                    modules[module].models[model][param] = $(this).prop('checked');
                                    modules[module].models[model].__broadcast(model, param, evt);
                                }
                            });
                        } else {
                            if ($(this).is(":radio")) {
                                if (modelParameter.length > 1) {
                                    if (modules[module].models[model][modelParameter[0]][modelParameter[1]] === true) {
                                        $(this).prop('checked', true);
                                    } else {
                                        $(this).prop('checked', false);
                                    }
                                } else {
                                    if (modules[module].models[model][param] === true) {
                                        $(this).prop('checked', true);
                                    } else {
                                        $(this).prop('checked', false);
                                    }
                                }
                                $(this).on('click', function () {
                                    if ($(this).prop('checked')) {
                                        if (modelParameter.length > 1) {
                                            modules[module].models[model][modelParameter[0]][modelParameter[1]] = $(this).prop();
                                            modules[module].models[model].__broadcast(model, modelParameter.join('.'), evt);
                                        } else {
                                            modules[module].models[model][param] = $(this).val();
                                            modules[module].models[model].__broadcast(model, param, evt);
                                        }
                                    }
                                });
                            } else {
                                if ($(this).is("input") ||
                                    $(this).is("textarea") ||
                                    $(this).is("select")) {
                                    $(this).val(modules[module].models[model][param]);
                                    if ($(this).is("input") || $(this).is("textarea")) {
                                        $(this).on('change', function (evt) {
                                            if (modelParameter.length > 1) {
                                                modules[module].models[model][modelParameter[0]][modelParameter[1]] = $(this).val();
                                                modules[module].models[model].__broadcast(model, modelParameter.join('.'), evt);
                                            } else {
                                                modules[module].models[model][param] = $(this).val();
                                                modules[module].models[model].__broadcast(model, param, evt);
                                            }
                                        });
                                        $(this).on('keyup', function (evt) {
                                            if (modelParameter.length > 1) {
                                                modules[module].models[model][modelParameter[0]][modelParameter[1]] = $(this).val();
                                                modules[module].models[model].__broadcast(model, modelParameter.join('.'), evt);
                                            } else {
                                                modules[module].models[model][param] = $(this).val();
                                                modules[module].models[model].__broadcast(model, param, evt);
                                            }
                                        });
                                    }
                                    if ($(this).is("select")) {
                                        $(this).on('change', function (evt) {
                                            if (modelParameter.length > 1) {
                                                modules[module].models[model][modelParameter[0]][modelParameter[1]] = $(this).val();
                                                modules[module].models[model].__broadcast(model, modelParameter.join('.'), evt);
                                            } else {
                                                modules[module].models[model][param] = $(this).val();
                                                modules[module].models[model].__broadcast(model, param, evt);
                                            }
                                        });
                                    }

                                } else {
                                    if (modelParameter.length > 1) {
                                        $(this).html(modules[module].models[model][modelParameter[0]][modelParameter[1]]);
                                    } else {
                                        $(this).html(modules[module].models[model][param]);
                                    }
                                }
                            }
                        }
                    } else {
                        console.warn(labelLib + 'You must specify a model and its parameter (example "modelName.param") in the ml-model attribute. I got: ' + $(this).data('ml-model') + ' in module "' + module + '"');
                    }
                });
            };
            mdl.strip = function(obj) {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        switch (typeof obj[key]) {
                            case "object":
                                if (Array.isArray(obj[key])) {
                                    obj[key] = [];
                                } else {
                                    if (Object.prototype.toString.call(obj[key]) === '[object Date]') {
                                        obj[key] = new Date();
                                    } else {
                                        if (Object.prototype.toString.call(obj[key]) === '[object Boolean]') {
                                            obj[key] = false;
                                        } else {
                                            if (Object.prototype.toString.call(obj[key]) === '[object Number]') {
                                                obj[key] = 0;
                                            } else {
                                                if (Object.prototype.toString.call(obj[key]) === '[object String]') {
                                                    obj[key] = '';
                                                } else {
                                                    if (Object.prototype.toString.call(obj[key]) === '[object Function]') {
                                                        obj[key] = function() {};
                                                    } else {
                                                        obj[key] = {};
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case "boolean":
                                obj[key] = false;
                                break;
                            case "string":
                                obj[key] = '';
                                break;
                        }
                    }
                }
                return obj;
            };
            mdl.init = function(doNotLoadFromUrl) {
                var self = this;
                // We want to automaticly load the model at init. But also being able to disable this functionality.
                if (this.__settings !== false && typeof doNotLoadFromUrl === 'undefined'){
                    this.load(true).then(function(data){
                        self.__initTwoWayBinding();
                    }, function(data){
                        self.__initTwoWayBinding();
                    });
                } else {
                    mdl.__initTwoWayBinding();
                }
            };

            // Save model into the module.
            modules[module].models[name] = mdl;

            mdl.__initTwoWayBinding();

            if (debugMode) {
                console.info(labelLib + 'Created model: ' + name);
            }
            return this;
        },
        getModule: function(name)
        {
            if (typeof modules[name] !== 'undefined') {
                if (debugMode) {
                    console.info(labelLib + 'Get model: ' + name);
                }
                return modules[name];
            }
        },
        getModel: function(parent, name)
        {
            if (typeof modules[parent].models[name] !== 'undefined') {
                if (debugMode) {
                    console.info(labelLib + 'Get model: ' + name);
                }
                return modules[parent].models[name];
            }
        },
        getController: function(parent, name)
        {
            if (typeof modules[parent].controllers[name] !== 'undefined') {
                if (debugMode) {
                    console.info(labelLib + 'Get controller: ' + name);
                }
                return modules[parent].controllers[name];
            }
        },
        getView: function(parent, name)
        {
            if (typeof modules[parent].views[name] !== 'undefined') {
                if (debugMode) {
                    console.info(labelLib + 'Get view: ' + name);
                }
                return modules[parent].views[name];
            }
        },
        /* MOONLIGHTUI - UI components */
        tabs : function() {
            if (debugMode) {
                console.info(labelLib + 'Activate tabs');
            }
            $(this).each(function(){
                $(this).on('click', function(){
                    if (debugMode) {
                        console.info(labelLib + 'Tab click tab:' +  $(this).data('ml-tab'));
                    }
                    $(this).parent().find('.active').removeClass('active');
                    $(this).addClass('active');
                    var tab = $(this).data('ml-tab');
                    $('#' + tab).parent().find('.active').removeClass('active');
                    $('#' + tab).addClass('active');
                });
            });
        },
        tabSwitch : function() {
            if (debugMode) {
                console.info(labelLib + 'Activate tab switch');
            }
            $(this).each(function(){
                $(this).on('click', function(){
                    var collection = $(this).data('ml-tab-switch');
                    var tab = {};
                    if (debugMode) {
                        console.info(labelLib + 'Tab switch click: ' + collection);
                    }
                    if (collection.indexOf(',') !== -1) {
                        var tabs = collection.split(',');
                        for (var i = 0; i < tabs.length; i++) {
                            $('#' + tabs[i]).parent().find('.active').removeClass('active');
                            $('#' + tabs[i]).addClass('active');
                            tab = $('#' + tabs[i]).data('ml-tab');
                            $('#' + tab).parent().find('.active').removeClass('active');
                            $('#' + tab).addClass('active');
                        }
                    } else {
                        $('#' + collection).parent().find('.active').removeClass('active');
                        $('#' + collection).addClass('active');
                        tab = $('#' + collection).data('ml-tab');
                        $('#' + tab).parent().find('.active').removeClass('active');
                        $('#' + tab).addClass('active');
                    }
                });
            });
        },
        buttons : function() {
            if (debugMode) {
                console.info(labelLib + 'Activate buttons');
            }
            $(this).each(function() {
                $(this).on('mousedown', function () {
                    if (debugMode) {
                        console.info(labelLib + 'Button mousedown.');
                    }
                    $(this).addClass('down');
                });
                $(this).on('mouseup', function () {
                    if (debugMode) {
                        console.info(labelLib + 'Button mouseup:' +  $(this).data('click'));
                    }
                    $(this).removeClass('down');
                    if (typeof $(this).data('click') !== 'undefined') {
                        var click = $(this).data('click');
                        click();
                    }
                });
            });
        },
        trees: function(){
            if (debugMode) {
                console.info(labelLib + 'Init JSTrees');
            }
            $(this).each(function(){
                $(this).jstree();
                $(this).removeClass('hidden');
            });
        },
        showComponents: function() {
            if (debugMode) {
                console.info(labelLib + 'Init showComponents');
            }
            $(this).each(function(){
                $(this).on('click', function(){
                    var show = $(this).data('ml-show');
                    if (show.indexOf(',') !== -1) {
                        var elements = show.split(',');
                        for (var i = 0; i < elements.length; i++) {
                            if (debugMode) {
                                console.info(labelLib + 'Show component: ' + elements[i]);
                            }
                            $('#' + elements[i]).removeClass('hidden');
                        }
                    } else {
                        if (debugMode) {
                            console.info(labelLib + 'Show component: ' + show);
                        }
                        $('#' + show).removeClass('hidden');
                    }
                });
            });
        },
        hideComponents: function() {
            if (debugMode) {
                console.info(labelLib + 'Init hideComponents');
            }
            $(this).each(function(){
                $(this).on('click', function(){
                    var hide = $(this).data('ml-hide');
                    if (hide.indexOf(',') !== -1) {
                        var elements = hide.split(',');
                        for (var i = 0; i < elements.length; i++) {
                            if (debugMode) {
                                console.info(labelLib + 'Hide component: ' + elements[i]);
                            }
                            $('#' + elements[i]).addClass('hidden');
                        }
                    } else {
                        if (debugMode) {
                            console.info(labelLib + 'Hide component: ' + hide);
                        }
                        $('#' + hide).addClass('hidden');
                    }
                });
            });
        },
        draggableComponents: function(){
            if (debugMode) {
                console.info(labelLib + 'Init draggable components.');
            }
            $('.moonlightui-layout-left').droppable({
                accept: '.moonlightui-component',
                drop: function (event, ui) {
                    if (debugMode) {
                        console.info(labelLib + 'Drop.');
                        console.info(ui);
                    }
                    $(this).append(ui.draggable);
                }
            });
            $('.moonlightui-layout-right').droppable({
                accept: '.moonlightui-component',
                drop: function (event, ui) {
                    if (debugMode) {
                        console.info(labelLib + 'Drop.');
                        console.info(ui);
                    }
                    $(this).append(ui.draggable);
                }
            });

            /* Draggable */
            $('.moonlightui-component-draggable').draggable({revert: true, scroll: false});
        },
        tooltips: function() {
            if (debugMode) {
                console.info(labelLib + 'Init draggable tooltips.');
            }
            $('[data-ml-tooltip-active="true"]').on('mouseover', function () {
                var title = $(this).data('ml-tooltip');
                $('.moonlightui-tooltip').html(title);
                $('.moonlightui-tooltip').removeClass('hidden');
            });
            $('[data-ml-tooltip-active="true"]').on('mousemove', function (event) {
                $('.moonlightui-tooltip').css('left', event.pageX + 'px');
                $('.moonlightui-tooltip').css('top', (event.pageY + 10) + 'px');
            });
            $('[data-ml-tooltip-active="true"]').on('mouseout', function () {
                var title = $(this).data('ml-tooltip');
                $('.moonlightui-tooltip').css('left', '-1000px');
                $('.moonlightui-tooltip').css('top', '-1000px');
                $('.moonlightui-tooltip').html('');
                $('.moonlightui-tooltip').addClass('hidden');
            });
        },
        showModal: function() {
            if (debugMode) {
                console.info(labelLib + 'Show modal.');
            }
            this.css({top:'50%',left:'50%',margin:'-'+($(this).height() / 2)+'px 0 0 -'+($(this).width() / 2)+'px'});
            this.removeHidden();
        },
        hideModal: function() {
            if (debugMode) {
                console.info(labelLib + 'Hide modal.');
            }
            this.addHidden();
        },
        centerModal: function () {
            if (debugMode) {
                console.info(labelLib + 'Center modal.');
            }
            this.css({top:'50%',left:'50%',margin:'-'+($(this).height() / 2)+'px 0 0 -'+($(this).width() / 2)+'px'});
            return this;
        },
        modals: function(){
            if (debugMode) {
                console.info(labelLib + 'Init modals.');
            }
            var bottomScale = false;
            $('.moonlightui-modal').draggable({
                scroll: false,
                start: function(){
                    if ($(this).hasClass('max')) {
                        $(this).css('left', '0px');
                        $(this).css('top', '0px');
                        $(this).css('bottom', '0px');
                        $(this).css('right', '0px');
                    }
                },
                drag: function() {
                    if ($(this).hasClass('max')) {
                        $(this).css('left', '0px');
                        $(this).css('top', '0px');
                        $(this).css('bottom', '0px');
                        $(this).css('right', '0px');
                    }
                },
                stop: function(){
                    if ($(this).hasClass('max')) {
                        $(this).css('left', '0px');
                        $(this).css('top', '0px');
                        $(this).css('bottom', '0px');
                        $(this).css('right', '0px');
                    }
                }
            });
            $('.moonlightui-modal-resizable').resizable({
                stop: function(){
                    $(this).attr('data-ml-preheight', $(this).height());
                    $(this).attr('data-ml-prewidth', $(this).width());
                }
            });
            $('.moonlightui-modal .moonlightui-modal-close').on('click', function() {
                if(!$(this).hasClass('moonlightui-modal-disable')) {
                    $(this).parent().parent().addClass('hidden');
                }
            });
            $('.moonlightui-modal .moonlightui-modal-close.destroy').on('click', function() {
                if(!$(this).hasClass('moonlightui-modal-disable')) {
                    $(this).remove();
                }
            });
            $('.moonlightui-modal .moonlightui-modal-close-btn.destroy').on('click', function() {
                $(this).remove();
            });
            $('.moonlightui-modal .moonlightui-modal-ok-btn.destroy').on('click', function() {
                $(this).remove();
            });
            $('.moonlightui-modal .moonlightui-modal-min').on('click', function() {
                if(!$(this).hasClass('moonlightui-modal-disable')) {
                    if ($(this).parent().parent().hasClass('min')) {
                        $(this).parent().parent().removeClass('min');
                        if (!$(this).parent().parent().hasClass('moonlightui-modal-fixed')) {
                            $(this).parent().find('.moonlightui-modal-max').removeClass('moonlightui-modal-disable');
                        }
                        $(this).parent().parent().find('.moonlightui-modal-body').removeClass('hidden');
                        $(this).parent().parent().css('height', $(this).parent().parent().attr('data-ml-preheight') + 'px');
                    } else {
                        if (!$(this).parent().parent().hasClass('moonlightui-modal-fixed')) {
                            $(this).parent().find('.moonlightui-modal-max').addClass('moonlightui-modal-disable');
                        }
                        $(this).parent().parent().attr('data-ml-preheight', $(this).parent().parent().height());
                        $(this).parent().parent().attr('data-ml-prewidth', $(this).parent().parent().width());
                        $(this).parent().parent().find('.moonlightui-modal-body').addClass('hidden');
                        $(this).parent().parent().css('height', '22px');
                        $(this).parent().parent().addClass('min');
                    }
                }
            });
            $('.moonlightui-modal .moonlightui-modal-max').on('click', function() {
                if(!$(this).hasClass('moonlightui-modal-disable')) {
                    if ($(this).parent().parent().hasClass('max')) {
                        $(this).parent().find('.moonlightui-modal-min').removeClass('moonlightui-modal-disable');
                        $(this).parent().parent().removeClass('max');
                        $(this).parent().parent().css('height', $(this).parent().parent().attr('data-ml-preheight') + 'px');
                        $(this).parent().parent().css('width', $(this).parent().parent().attr('data-ml-prewidth') + 'px');
                        $(this).parent().parent().css('left', $(this).parent().parent().attr('data-ml-preleft') + 'px');
                        $(this).parent().parent().css('top', $(this).parent().parent().attr('data-ml-pretop') + 'px');
                        $(this).parent().parent().css('margin-left', $(this).parent().parent().attr('data-ml-premarginleft'));
                    } else {
                        $(this).parent().find('.moonlightui-modal-min').addClass('moonlightui-modal-disable');
                        $(this).parent().parent().attr('data-ml-preheight', $(this).parent().parent().height());
                        $(this).parent().parent().attr('data-ml-prewidth', $(this).parent().parent().width());
                        $(this).parent().parent().attr('data-ml-preleft', $(this).parent().parent().position().left);
                        $(this).parent().parent().attr('data-ml-pretop', $(this).parent().parent().position().top);
                        $(this).parent().parent().attr('data-ml-premarginleft', $(this).parent().parent().css('margin-left'));
                        $(this).parent().parent().css('height', $(document).height() + 'px');
                        $(this).parent().parent().css('width', $(document).width() + 'px');
                        $(this).parent().parent().css('left', '0px');
                        $(this).parent().parent().css('top', '0px');
                        $(this).parent().parent().css('margin-left', '0px');
                        $(this).parent().parent().addClass('max');
                    }
                }
            });
        },
        showHelp: function() {
            if (debugMode) {
                console.info(labelLib + 'Init show help.');
            }
            $(this).each(function() {
                var url = $(this).data('ml-help-url');
                var title = $(this).data('ml-help-title');
                if (typeof url === 'undefined') {
                    console.warn('MOONLIGHTUI - You must specify url to load the help page from.');
                }
                if (typeof title === 'undefined') {
                    console.warn('MOONLIGHTUI - You must specify title for the help dialog.');
                }
                $(this).on('click', function () {
                    var newHelp = $('<div></div>').html(
                        '<div class="moonlightui-modal-header">' +
                        '<div class="moonlightui-modal-close destroy"></div>' +
                        '<div class="moonlightui-modal-min moonlightui-modal-disable"></div>' +
                        '<div class="moonlightui-modal-max moonlightui-modal-disable"></div>' +
                        title +
                        '</div>' +
                        '<div class="moonlightui-modal-body table-add">' +
                        '<iframe src="' + url + '" target="_parent" class="moonlightui-modal-help-iframe"></iframe>' +
                        '<div class="moonlightui-modal-body-btn-bottom-fixed">' +
                        '<div id="fillableAddOk" class="moonlightui-btn moonlightui-modal-ok-btn destroy">' +
                        '<div class="moonlightui-btn-inner">ok</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>');
                    newHelp.addClass('moonlightui-modal moonlightui-modal-fixed');
                    $('body').append(newHelp);
                    newHelp.draggable({
                        scroll: false
                    });
                    newHelp.find('.moonlightui-modal-close.destroy').on('click', function() {
                        $(newHelp).remove();
                    });
                    newHelp.find('.moonlightui-modal-close-btn.destroy').on('click', function() {
                        $(newHelp).remove();
                    });
                    newHelp.find('.moonlightui-modal-ok-btn.destroy').on('click', function() {
                        $(newHelp).remove();
                    });
                    newHelp.css({
                        top: '50%',
                        left: '50%',
                        margin: '-' + ($(newHelp).height() / 2) + 'px 0 0 -' + ($(newHelp).width() / 2) + 'px'
                    });
                });
            });
        },
        /* MOONLIGHTUI - lodash */
        lodash: _,
        /* MOONLIGHTUI - External Libraries */
        async: async,
        jsPlumb: jsPlumb,
        createCookie: function(name, value, days) {
            if (debugMode) {
                console.info(labelLib + 'Create cookie name: ' + name + ' value: ' + JSON.stringify(value) + ' days: ' + days);
            }
            var dateVal, expiresVal;
            if (days) {
                dateVal = new Date();
                dateVal.setTime(dateVal.getTime() + (days * 24 * 60 * 60 * 1000));
                expiresVal = "; expires=" + dateVal.toGMTString();
            } else {
                expiresVal = "";
            }
            document.cookie = name + "=" + value + expiresVal + "; path=/";
        },
        readCookie: function(name) {
            if (debugMode) {
                console.info(labelLib + 'Read cookie name: ' + name);
            }
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            var c = 0;
            for (var i = 0; i < ca.length; i++) {
                c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        return c.substring(nameEQ.length, c.length);
                    }
                }
            }
            return null;
        },
        eraseCookie: function(name) {
            if (debugMode) {
                console.info(labelLib + 'Erase cookie name: ' + name);
            }
            this.createCookie(name, "", -1);
        },
        /* MOONLIGHTUI - Lets GO */
        deenergize: function(element) {
            if (debugMode) {
                console.info(labelLib + 'DE-ENERGIZE');
            }

            /* MOONLIGHT UI - Tab's */
            $(element + ' .moonlightui-tab').off();

            /* MOONLIGHT UI - Main tabs */
            $(element + ' .moonlightui-main-tab').off();

            // Attach tab switches again
            $(element + ' .moonlightui-tab-switch').off();

            // Attach show components
            $(element + ' .moonlightui-show').off();

            // Attach show components
            $(element + ' .moonlightui-hide').off();

            // Attach actions and clicks again.
            $(element).find('[data-ml-action]').off();

            // Attach buttons
            $(element + ' .moonlightui-btn-inner').off();

            /* MOONLIGHT UI - Show help */
            $(element + ' .moonlightui-show-help').off();

            // Attach tooltips
            $(element).find('[data-ml-tooltip-active="true"]').off();

            // Attach modals
            $(element + ' .moonlightui-modal .moonlightui-modal-close').off();
            $(element + ' .moonlightui-modal .moonlightui-modal-min').off();
            $(element + ' .moonlightui-modal .moonlightui-modal-max').off();

            /* Detach all events */
            $(element).off();

            /* Detach two-way databinding */
            $(element).find('[data-ml-model]').off();

            /* Detach all # */
            $("a[href^=\\#\\!]").off();
        },
        reenergize: function(element) {
            if (debugMode) {
                console.info(labelLib + 'RE-ENERGIZE');
            }
            this.deenergize(element);

            /* Attach model two way databinding */
            for (var module in modules) {
                for (var model in modules[module].models) {
                    modules[module].models[model].__initTwoWayBinding();
                }
            }

            $(element).energize(element);
        },
        energize: function(element) {
            if (debugMode) {
                console.info(labelLib + 'ENERGIZE');
            }

            /* MOONLIGHT UI - Tree's */
            $(element + ' .moonlightui-tree').trees();

            /* MOONLIGHT UI - Tab's */
            $(element + ' .moonlightui-component-title-main-options').sortable();
            $(element + ' .moonlightui-tab').tabs();

            /* MOONLIGHT UI - Main tabs */
            $(element + ' .moonlightui-main-tab').tabs();

            /* MOONLIGHT UI - Tab switches */
            $(element + ' .moonlightui-tab-switch').tabSwitch();

            /* MOONLIGHT UI - Show items */
            $(element + ' .moonlightui-show').showComponents();

            /* MOONLIGHT UI - Hide items */
            $(element + ' .moonlightui-hide').hideComponents();

            /* MOONLIGHT UI - Draggable components */
            $(element + ' moonlightui').draggableComponents();

            /* MOONLIGHT UI - Will activate all custom click */
            $(element).find('[data-ml-action]').actions();

            /* MOONLIGHT UI - Show help */
            $(element + ' .moonlightui-show-help').showHelp();

            /* MOONLIGHT UI - Buttons */
            $(element + ' .moonlightui-btn-inner').buttons();

            /* Init all scrollbars */
            $(element + ' .moonlightui-scrollbar-inner').scrollbar();

            /* MOONLIGHT UI - Activate all tooltips */
            $(element + ' .moonlightui').tooltips();

            /* MOONLIGHT UI - Enable all modal dialogs */
            $(element + ' .moonlightui').modals();

            /* MOONLIGHT UI - Check */
            $("a[href^=\\#\\!]").on('click', this.checkRoute);

        },
        doGET: function(options, done, error){
            var engine = this;
            if (debugMode) {
                console.info(labelLib + 'doGET ' + JSON.stringify(options));
            }
            if (typeof config.jwt_token !== 'undefined') {
                $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                    jqXHR.setRequestHeader('X-CSRF-Token', config.jwt_token);
                    jqXHR.setRequestHeader('X-XSRF-TOKEN', config.jwt_token);
                    jqXHR.setRequestHeader('Authorization', 'Bearer ' + config.jwt_bearer);
                    options.async = true;
                });
            }
            $.ajax(options).done(function(data) {
                done(data);
            }).fail(function(data) {
                engine.__activateErrorHandlers(data);
                error(data);
            });
        },
        doPUT: function(options, done, error){
            if (debugMode) {
                console.info(labelLib + 'doPUT ' + JSON.stringify(options));
            }
            this.doPOSTPUTDELETE('PUT', options, done, error);
        },
        doPOST: function(options, done, error){
            if (debugMode) {
                console.info(labelLib + 'doPOST ' + JSON.stringify(options));
            }
            this.doPOSTPUTDELETE('POST', options, done, error);
        },
        doDELETE: function(options, done, error){
            if (debugMode) {
                console.info(labelLib + 'doDELETE ' + JSON.stringify(options));
            }
            this.doPOSTPUTDELETE('DELETE', options, done, error);
        },
        doPOSTPUTDELETE: function(type, options, done, error) {
            var engine = this;
            if (typeof options.data === 'undefined') {
                options.data = {};
            }
            if (typeof config.jwt_token !== 'undefined') {
                $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
                    jqXHR.setRequestHeader('X-CSRF-Token', config.jwt_token);
                    jqXHR.setRequestHeader('X-XSRF-TOKEN', config.jwt_token);
                    jqXHR.setRequestHeader('Authorization', 'Bearer ' + config.jwt_bearer);
                    options.async = true;
                });
            } else {
                if (typeof config.csrf_token !== 'undefined') {
                    options.data._token = config.csrf_token;
                }
            }
            options.method = type;
            options.data = JSON.stringify(options.data);
            options.contentType = 'application/json; charset=utf-8';
            options.dataType = 'json';
            options.async = false;
            $.ajax(options).done(function(data) {
                done(data);
            }).fail(function(data) {
                engine.__activateErrorHandlers(data);
                error(data);
            });
        }
    });
    window.$ml = window.moonlightui = $.noConflict();
}));