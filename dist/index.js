'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs-extra');
var path = require('path');
var _ = require('lodash');
var LiveServer = require('live-server');
var Handlebars = require('handlebars');
var ts = require('typescript');

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var gutil = require('gulp-util');
var c = gutil.colors;
var pkg$1 = require('../package.json');
var LEVEL;
(function (LEVEL) {
    LEVEL[LEVEL["INFO"] = 0] = "INFO";
    LEVEL[LEVEL["DEBUG"] = 1] = "DEBUG";
    LEVEL[LEVEL["ERROR"] = 2] = "ERROR";
    LEVEL[LEVEL["WARN"] = 3] = "WARN";
})(LEVEL || (LEVEL = {}));
var Logger = (function () {
    function Logger() {
        this.name = pkg$1.name;
        this.version = pkg$1.version;
        this.logger = gutil.log;
        this.silent = true;
    }
    Logger.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.silent)
            return;
        this.logger(this.format.apply(this, [LEVEL.INFO].concat(args)));
    };
    Logger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.silent)
            return;
        this.logger(this.format.apply(this, [LEVEL.ERROR].concat(args)));
    };
    Logger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.silent)
            return;
        this.logger(this.format.apply(this, [LEVEL.WARN].concat(args)));
    };
    Logger.prototype.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.silent)
            return;
        this.logger(this.format.apply(this, [LEVEL.DEBUG].concat(args)));
    };
    Logger.prototype.format = function (level) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var pad = function (s, l, c) {
            if (c === void 0) { c = ''; }
            return s + Array(Math.max(0, l - s.length + 1)).join(c);
        };
        var msg = args.join(' ');
        if (args.length > 1) {
            msg = pad(args.shift(), 15, ' ') + ": " + args.join(' ');
        }
        switch (level) {
            case LEVEL.INFO:
                msg = c.green(msg);
                break;
            case LEVEL.DEBUG:
                msg = c.cyan(msg);
                break;
            case LEVEL.WARN:
                msg = c.yellow(msg);
                break;
            case LEVEL.ERROR:
                msg = c.red(msg);
                break;
        }
        return [
            msg
        ].join('');
    };
    return Logger;
}());
var logger = new Logger();

var AngularAPIs = require('../src/data/api-list.json');
function finderInAngularAPIs(type) {
    var _result = {
        source: 'external',
        data: null
    };
    _.forEach(AngularAPIs, function (angularModuleAPIs, angularModule) {
        var i = 0, len = angularModuleAPIs.length;
        for (i; i < len; i++) {
            if (angularModuleAPIs[i].title === type) {
                _result.data = angularModuleAPIs[i];
            }
        }
    });
    return _result;
}

var DependenciesEngine = (function () {
    function DependenciesEngine() {
        if (DependenciesEngine._instance) {
            throw new Error('Error: Instantiation failed: Use DependenciesEngine.getInstance() instead of new.');
        }
        DependenciesEngine._instance = this;
    }
    DependenciesEngine.getInstance = function () {
        return DependenciesEngine._instance;
    };
    DependenciesEngine.prototype.cleanModules = function (modules) {
        var _m = modules, i = 0, len = modules.length;
        for (i; i < len; i++) {
            var j = 0, leng = _m[i].declarations.length;
            for (j; j < leng; j++) {
                var k = 0, lengt = void 0;
                if (_m[i].declarations[j].jsdoctags) {
                    lengt = _m[i].declarations[j].jsdoctags.length;
                    for (k; k < lengt; k++) {
                        delete _m[i].declarations[j].jsdoctags[k].parent;
                    }
                }
            }
        }
        return _m;
    };
    DependenciesEngine.prototype.init = function (data) {
        this.rawData = data;
        this.modules = _.sortBy(this.rawData.modules, ['name']);
        this.rawModulesForOverview = _.sortBy(_.cloneDeep(this.cleanModules(data.modules)), ['name']);
        this.rawModules = _.sortBy(_.cloneDeep(this.cleanModules(data.modules)), ['name']);
        this.components = _.sortBy(this.rawData.components, ['name']);
        this.directives = _.sortBy(this.rawData.directives, ['name']);
        this.injectables = _.sortBy(this.rawData.injectables, ['name']);
        this.interfaces = _.sortBy(this.rawData.interfaces, ['name']);
        this.pipes = _.sortBy(this.rawData.pipes, ['name']);
        this.classes = _.sortBy(this.rawData.classes, ['name']);
        this.miscellaneous = this.rawData.miscellaneous;
        this.prepareMiscellaneous();
        this.routes = this.rawData.routesTree;
        this.cleanRawModulesForOverview();
    };
    DependenciesEngine.prototype.find = function (type) {
        var finderInCompodocDependencies = function (data) {
            var _result = {
                source: 'internal',
                data: null
            }, i = 0, len = data.length;
            for (i; i < len; i++) {
                if (typeof type !== 'undefined') {
                    if (type.indexOf(data[i].name) !== -1) {
                        _result.data = data[i];
                    }
                }
            }
            return _result;
        }, resultInCompodocInjectables = finderInCompodocDependencies(this.injectables), resultInCompodocInterfaces = finderInCompodocDependencies(this.interfaces), resultInCompodocClasses = finderInCompodocDependencies(this.classes), resultInCompodocComponents = finderInCompodocDependencies(this.components), resultInAngularAPIs = finderInAngularAPIs(type);
        if (resultInCompodocInjectables.data !== null) {
            return resultInCompodocInjectables;
        }
        else if (resultInCompodocInterfaces.data !== null) {
            return resultInCompodocInterfaces;
        }
        else if (resultInCompodocClasses.data !== null) {
            return resultInCompodocClasses;
        }
        else if (resultInCompodocComponents.data !== null) {
            return resultInCompodocComponents;
        }
        else if (resultInAngularAPIs.data !== null) {
            return resultInAngularAPIs;
        }
    };
    DependenciesEngine.prototype.update = function (updatedData) {
        var _this = this;
        if (updatedData.modules.length > 0) {
            _.forEach(updatedData.modules, function (module) {
                var _index = _.findIndex(_this.modules, { 'name': module.name });
                _this.modules[_index] = module;
            });
        }
        if (updatedData.components.length > 0) {
            _.forEach(updatedData.components, function (component) {
                var _index = _.findIndex(_this.components, { 'name': component.name });
                _this.components[_index] = component;
            });
        }
        if (updatedData.directives.length > 0) {
            _.forEach(updatedData.directives, function (directive) {
                var _index = _.findIndex(_this.directives, { 'name': directive.name });
                _this.directives[_index] = directive;
            });
        }
        if (updatedData.injectables.length > 0) {
            _.forEach(updatedData.injectables, function (injectable) {
                var _index = _.findIndex(_this.injectables, { 'name': injectable.name });
                _this.injectables[_index] = injectable;
            });
        }
        if (updatedData.interfaces.length > 0) {
            _.forEach(updatedData.interfaces, function (int) {
                var _index = _.findIndex(_this.interfaces, { 'name': int.name });
                _this.interfaces[_index] = int;
            });
        }
        if (updatedData.pipes.length > 0) {
            _.forEach(updatedData.pipes, function (pipe) {
                var _index = _.findIndex(_this.pipes, { 'name': pipe.name });
                _this.pipes[_index] = pipe;
            });
        }
        if (updatedData.classes.length > 0) {
            _.forEach(updatedData.classes, function (classe) {
                var _index = _.findIndex(_this.classes, { 'name': classe.name });
                _this.classes[_index] = classe;
            });
        }
    };
    DependenciesEngine.prototype.findInCompodoc = function (name) {
        var mergedData = _.concat([], this.modules, this.components, this.directives, this.injectables, this.interfaces, this.pipes, this.classes), result = _.find(mergedData, { 'name': name });
        return result || false;
    };
    DependenciesEngine.prototype.cleanRawModulesForOverview = function () {
        _.forEach(this.rawModulesForOverview, function (module) {
            module.declarations = [];
            module.providers = [];
        });
    };
    DependenciesEngine.prototype.prepareMiscellaneous = function () {
        //group each subgoup by file
        this.miscellaneous.groupedVariables = _.groupBy(this.miscellaneous.variables, 'file');
        this.miscellaneous.groupedFunctions = _.groupBy(this.miscellaneous.functions, 'file');
        this.miscellaneous.groupedEnumerations = _.groupBy(this.miscellaneous.enumerations, 'file');
    };
    DependenciesEngine.prototype.getModule = function (name) {
        return _.find(this.modules, ['name', name]);
    };
    DependenciesEngine.prototype.getRawModule = function (name) {
        return _.find(this.rawModules, ['name', name]);
    };
    DependenciesEngine.prototype.getModules = function () {
        return this.modules;
    };
    DependenciesEngine.prototype.getComponents = function () {
        return this.components;
    };
    DependenciesEngine.prototype.getDirectives = function () {
        return this.directives;
    };
    DependenciesEngine.prototype.getInjectables = function () {
        return this.injectables;
    };
    DependenciesEngine.prototype.getInterfaces = function () {
        return this.interfaces;
    };
    DependenciesEngine.prototype.getRoutes = function () {
        return this.routes;
    };
    DependenciesEngine.prototype.getPipes = function () {
        return this.pipes;
    };
    DependenciesEngine.prototype.getClasses = function () {
        return this.classes;
    };
    DependenciesEngine.prototype.getMiscellaneous = function () {
        return this.miscellaneous;
    };
    return DependenciesEngine;
}());
DependenciesEngine._instance = new DependenciesEngine();

var $dependenciesEngine = DependenciesEngine.getInstance();

function extractLeadingText(string, completeTag) {
    var tagIndex = string.indexOf(completeTag);
    var leadingText = null;
    var leadingTextRegExp = /\[(.+?)\]/g;
    var leadingTextInfo = leadingTextRegExp.exec(string);
    // did we find leading text, and if so, does it immediately precede the tag?
    while (leadingTextInfo && leadingTextInfo.length) {
        if (leadingTextInfo.index + leadingTextInfo[0].length === tagIndex) {
            string = string.replace(leadingTextInfo[0], '');
            leadingText = leadingTextInfo[1];
            break;
        }
        leadingTextInfo = leadingTextRegExp.exec(string);
    }
    return {
        leadingText: leadingText,
        string: string
    };
}
function splitLinkText(text) {
    var linkText;
    var target;
    var splitIndex;
    // if a pipe is not present, we split on the first space
    splitIndex = text.indexOf('|');
    if (splitIndex === -1) {
        splitIndex = text.search(/\s/);
    }
    if (splitIndex !== -1) {
        linkText = text.substr(splitIndex + 1);
        // Normalize subsequent newlines to a single space.
        linkText = linkText.replace(/\n+/, ' ');
        target = text.substr(0, splitIndex);
    }
    return {
        linkText: linkText,
        target: target || text
    };
}
var LinkParser = (function () {
    var processTheLink = function (string, tagInfo) {
        var leading = extractLeadingText(string, tagInfo.completeTag), linkText = leading.leadingText || '', split, target, stringtoReplace;
        split = splitLinkText(tagInfo.text);
        target = split.target;
        if (leading.leadingText !== null) {
            stringtoReplace = '[' + leading.leadingText + ']' + tagInfo.completeTag;
        }
        else if (typeof split.linkText !== 'undefined') {
            stringtoReplace = tagInfo.completeTag;
            linkText = split.linkText;
        }
        return string.replace(stringtoReplace, '[' + linkText + '](' + target + ')');
    };
    /**
     * Convert
     * {@link http://www.google.com|Google} or {@link https://github.com GitHub} to [Github](https://github.com)
     */
    var replaceLinkTag = function (str) {
        var tagRegExp = new RegExp('\\{@link\\s+((?:.|\n)+?)\\}', 'i'), matches, previousString, tagInfo = [];
        function replaceMatch(replacer, tag, match, text) {
            var matchedTag = {
                completeTag: match,
                tag: tag,
                text: text
            };
            tagInfo.push(matchedTag);
            return replacer(str, matchedTag);
        }
        do {
            matches = tagRegExp.exec(str);
            if (matches) {
                previousString = str;
                str = replaceMatch(processTheLink, 'link', matches[0], matches[1]);
            }
        } while (matches && previousString !== str);
        return {
            newString: str
        };
    };
    var _resolveLinks = function (str) {
        return replaceLinkTag(str).newString;
    };
    return {
        resolveLinks: _resolveLinks
    };
})();

var COMPODOC_DEFAULTS = {
    title: 'Application documentation',
    additionalEntryName: 'Additional documentation',
    additionalEntryPath: 'additional-documentation',
    folder: './documentation/',
    port: 8080,
    theme: 'gitbook',
    base: '/',
    defaultCoverageThreshold: 70,
    disableSourceCode: false,
    disableGraph: false,
    disableCoverage: false,
    disablePrivateOrInternalSupport: false,
    PAGE_TYPES: {
        ROOT: 'root',
        INTERNAL: 'internal'
    }
};

var Configuration = (function () {
    function Configuration() {
        this._pages = [];
        this._mainData = {
            output: COMPODOC_DEFAULTS.folder,
            theme: COMPODOC_DEFAULTS.theme,
            extTheme: '',
            serve: false,
            port: COMPODOC_DEFAULTS.port,
            open: false,
            assetsFolder: '',
            documentationMainName: COMPODOC_DEFAULTS.title,
            documentationMainDescription: '',
            base: COMPODOC_DEFAULTS.base,
            hideGenerator: false,
            modules: [],
            readme: '',
            additionalPages: [],
            pipes: [],
            classes: [],
            interfaces: [],
            components: [],
            directives: [],
            injectables: [],
            miscellaneous: [],
            routes: [],
            tsconfig: '',
            toggleMenuItems: [],
            includes: '',
            includesName: COMPODOC_DEFAULTS.additionalEntryName,
            includesFolder: COMPODOC_DEFAULTS.additionalEntryPath,
            disableSourceCode: COMPODOC_DEFAULTS.disableSourceCode,
            disableGraph: COMPODOC_DEFAULTS.disableGraph,
            disableCoverage: COMPODOC_DEFAULTS.disableCoverage,
            disablePrivateOrInternalSupport: COMPODOC_DEFAULTS.disablePrivateOrInternalSupport,
            watch: false,
            mainGraph: '',
            coverageTest: false,
            coverageTestThreshold: COMPODOC_DEFAULTS.defaultCoverageThreshold,
            routesLength: 0
        };
        if (Configuration._instance) {
            throw new Error('Error: Instantiation failed: Use Configuration.getInstance() instead of new.');
        }
        Configuration._instance = this;
    }
    Configuration.getInstance = function () {
        return Configuration._instance;
    };
    Configuration.prototype.addPage = function (page) {
        this._pages.push(page);
    };
    Configuration.prototype.addAdditionalPage = function (page) {
        this._mainData.additionalPages.push(page);
    };
    Configuration.prototype.resetPages = function () {
        this._pages = [];
    };
    Configuration.prototype.resetAdditionalPages = function () {
        this._mainData.additionalPages = [];
    };
    Object.defineProperty(Configuration.prototype, "pages", {
        get: function () {
            return this._pages;
        },
        set: function (pages) {
            this._pages = [];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "mainData", {
        get: function () {
            return this._mainData;
        },
        set: function (data) {
            Object.assign(this._mainData, data);
        },
        enumerable: true,
        configurable: true
    });
    return Configuration;
}());
Configuration._instance = new Configuration();

var HtmlEngineHelpers = (function () {
    var init = function () {
        //TODO use this instead : https://github.com/assemble/handlebars-helpers
        Handlebars.registerHelper("compare", function (a, operator, b, options) {
            if (arguments.length < 4) {
                throw new Error('handlebars Helper {{compare}} expects 4 arguments');
            }
            var result;
            switch (operator) {
                case 'indexof':
                    result = (b.indexOf(a) !== -1);
                    break;
                case '===':
                    result = a === b;
                    break;
                case '!==':
                    result = a !== b;
                    break;
                case '>':
                    result = a > b;
                    break;
                default: {
                    throw new Error('helper {{compare}}: invalid operator: `' + operator + '`');
                }
            }
            if (result === false) {
                return options.inverse(this);
            }
            return options.fn(this);
        });
        Handlebars.registerHelper("or", function () {
            var len = arguments.length - 1;
            var options = arguments[len];
            for (var i = 0; i < len; i++) {
                if (arguments[i]) {
                    return options.fn(this);
                }
            }
            return options.inverse(this);
        });
        Handlebars.registerHelper("filterAngular2Modules", function (text, options) {
            var NG2_MODULES = [
                'BrowserModule',
                'FormsModule',
                'HttpModule',
                'RouterModule'
            ], len = NG2_MODULES.length;
            var i = 0, result = false;
            for (i; i < len; i++) {
                if (text.indexOf(NG2_MODULES[i]) > -1) {
                    result = true;
                }
            }
            if (result) {
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        });
        Handlebars.registerHelper("debug", function (optionalValue) {
            console.log("Current Context");
            console.log("====================");
            console.log(this);
            if (optionalValue) {
                console.log("OptionalValue");
                console.log("====================");
                console.log(optionalValue);
            }
        });
        Handlebars.registerHelper('breaklines', function (text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
            text = text.replace(/ /gm, '&nbsp;');
            text = text.replace(/	/gm, '&nbsp;&nbsp;&nbsp;&nbsp;');
            return new Handlebars.SafeString(text);
        });
        Handlebars.registerHelper('escapeSimpleQuote', function (text) {
            if (!text)
                return;
            var _text = text.replace(/'/g, "\\'");
            _text = _text.replace(/(\r\n|\n|\r)/gm, '');
            return _text;
        });
        Handlebars.registerHelper('breakComma', function (text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/,/g, ',<br>');
            return new Handlebars.SafeString(text);
        });
        Handlebars.registerHelper('modifKind', function (kind) {
            // https://github.com/Microsoft/TypeScript/blob/73ee2feb51c9b7e24a29eb4cee19d7c14b933065/lib/typescript.d.ts#L64
            var _kindText = '';
            switch (kind) {
                case 112:
                    _kindText = 'Private';
                    break;
                case 113:
                    _kindText = 'Protected';
                    break;
                case 114:
                    _kindText = 'Public';
                    break;
                case 115:
                    _kindText = 'Static';
                    break;
            }
            return new Handlebars.SafeString(_kindText);
        });
        Handlebars.registerHelper('modifIcon', function (kind) {
            // https://github.com/Microsoft/TypeScript/blob/73ee2feb51c9b7e24a29eb4cee19d7c14b933065/lib/typescript.d.ts#L64
            var _kindText = '';
            switch (kind) {
                case 112:
                    _kindText = 'lock';
                    break;
                case 113:
                    _kindText = 'circle';
                    break;
                case 115:
                    _kindText = 'square';
                case 83:
                    _kindText = 'export';
                    break;
            }
            return _kindText;
        });
        /**
         * Convert {@link MyClass} to [MyClass](http://localhost:8080/classes/MyClass.html)
         */
        Handlebars.registerHelper('parseDescription', function (description, depth) {
            var tagRegExp = new RegExp('\\{@link\\s+((?:.|\n)+?)\\}', 'i'), matches, previousString, tagInfo = [];
            var processTheLink = function (string, tagInfo) {
                var leading = extractLeadingText(string, tagInfo.completeTag), split, result, newLink, rootPath, stringtoReplace;
                split = splitLinkText(tagInfo.text);
                if (typeof split.linkText !== 'undefined') {
                    result = $dependenciesEngine.findInCompodoc(split.target);
                }
                else {
                    result = $dependenciesEngine.findInCompodoc(tagInfo.text);
                }
                if (result) {
                    if (leading.leadingText !== null) {
                        stringtoReplace = '[' + leading.leadingText + ']' + tagInfo.completeTag;
                    }
                    else if (typeof split.linkText !== 'undefined') {
                        stringtoReplace = tagInfo.completeTag;
                    }
                    else {
                        stringtoReplace = tagInfo.completeTag;
                    }
                    if (result.type === 'class')
                        result.type = 'classe';
                    rootPath = '';
                    switch (depth) {
                        case 0:
                            rootPath = './';
                            break;
                        case 1:
                            rootPath = '../';
                            break;
                        case 2:
                            rootPath = '../../';
                            break;
                    }
                    var label = result.name;
                    if (leading.leadingText !== null) {
                        label = leading.leadingText;
                    }
                    if (typeof split.linkText !== 'undefined') {
                        label = split.linkText;
                    }
                    newLink = "<a href=\"" + rootPath + result.type + "s/" + result.name + ".html\">" + label + "</a>";
                    return string.replace(stringtoReplace, newLink);
                }
                else {
                    return string;
                }
            };
            function replaceMatch(replacer, tag, match, text) {
                var matchedTag = {
                    completeTag: match,
                    tag: tag,
                    text: text
                };
                tagInfo.push(matchedTag);
                return replacer(description, matchedTag);
            }
            description = description.replace(/\n/g, '<br/>');
            do {
                matches = tagRegExp.exec(description);
                if (matches) {
                    previousString = description;
                    description = replaceMatch(processTheLink, 'link', matches[0], matches[1]);
                }
            } while (matches && previousString !== description);
            return description;
        });
        Handlebars.registerHelper('relativeURL', function (currentDepth, context) {
            var result = '';
            switch (currentDepth) {
                case 0:
                    result = './';
                    break;
                case 1:
                    result = '../';
                    break;
                case 2:
                    result = '../../';
                    break;
            }
            /*
            if (typeof context === 'string' && context == 'additional-page') {
                console.log('relativeURL: ', currentDepth, result);
            }
            */
            return result;
        });
        Handlebars.registerHelper('functionSignature', function (method) {
            var args = [];
            if (method.args) {
                args = method.args.map(function (arg) {
                    var _result = $dependenciesEngine.find(arg.type);
                    if (_result) {
                        if (_result.source === 'internal') {
                            var path$$1 = _result.data.type;
                            if (_result.data.type === 'class')
                                path$$1 = 'classe';
                            return arg.name + ": <a href=\"../" + path$$1 + "s/" + _result.data.name + ".html\">" + arg.type + "</a>";
                        }
                        else {
                            var path$$1 = 'https://angular.io/docs/ts/latest/api/' + _result.data.path;
                            return arg.name + ": <a href=\"" + path$$1 + "\" target=\"_blank\">" + arg.type + "</a>";
                        }
                    }
                    else {
                        return arg.name + ": " + arg.type;
                    }
                }).join(', ');
            }
            if (method.name) {
                return method.name + "(" + args + ")";
            }
            else {
                return "(" + args + ")";
            }
        });
        Handlebars.registerHelper('jsdoc-returns-comment', function (jsdocTags, options) {
            var i = 0, len = jsdocTags.length, result;
            for (i; i < len; i++) {
                if (jsdocTags[i].tagName) {
                    if (jsdocTags[i].tagName.text === 'returns') {
                        result = jsdocTags[i].comment;
                        break;
                    }
                }
            }
            return result;
        });
        Handlebars.registerHelper('jsdoc-component-example', function (jsdocTags, options) {
            var i = 0, len = jsdocTags.length, tags = [];
            var cleanTag = function (comment) {
                if (comment.charAt(0) === '*') {
                    comment = comment.substring(1, comment.length);
                }
                if (comment.charAt(0) === ' ') {
                    comment = comment.substring(1, comment.length);
                }
                return comment;
            };
            var type = 'html';
            if (options.hash.type) {
                type = options.hash.type;
            }
            function htmlEntities(str) {
                return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            }
            for (i; i < len; i++) {
                if (jsdocTags[i].tagName) {
                    if (jsdocTags[i].tagName.text === 'example') {
                        var tag = {};
                        if (jsdocTags[i].comment) {
                            tag.comment = "<pre class=\"line-numbers\"><code class=\"language-" + type + "\">" + htmlEntities(cleanTag(jsdocTags[i].comment)) + "</code></pre>";
                        }
                        tags.push(tag);
                    }
                }
            }
            if (tags.length > 0) {
                this.tags = tags;
                return options.fn(this);
            }
        });
        Handlebars.registerHelper('jsdoc-example', function (jsdocTags, options) {
            var i = 0, len = jsdocTags.length, tags = [];
            for (i; i < len; i++) {
                if (jsdocTags[i].tagName) {
                    if (jsdocTags[i].tagName.text === 'example') {
                        var tag = {};
                        if (jsdocTags[i].comment) {
                            tag.comment = jsdocTags[i].comment.replace(/<caption>/g, '<b><i>').replace(/\/caption>/g, '/b></i>');
                        }
                        tags.push(tag);
                    }
                }
            }
            if (tags.length > 0) {
                this.tags = tags;
                return options.fn(this);
            }
        });
        Handlebars.registerHelper('jsdoc-params', function (jsdocTags, options) {
            var i = 0, len = jsdocTags.length, tags = [];
            for (i; i < len; i++) {
                if (jsdocTags[i].tagName) {
                    if (jsdocTags[i].tagName.text === 'param') {
                        var tag = {};
                        if (jsdocTags[i].typeExpression && jsdocTags[i].typeExpression.type.name) {
                            tag.type = jsdocTags[i].typeExpression.type.name.text;
                        }
                        if (jsdocTags[i].comment) {
                            tag.comment = jsdocTags[i].comment;
                        }
                        if (jsdocTags[i].parameterName) {
                            tag.name = jsdocTags[i].parameterName.text;
                        }
                        tags.push(tag);
                    }
                }
            }
            if (tags.length >= 1) {
                this.tags = tags;
                return options.fn(this);
            }
        });
        Handlebars.registerHelper('linkType', function (name, options) {
            var _result = $dependenciesEngine.find(name);
            if (_result) {
                this.type = {
                    raw: name
                };
                if (_result.source === 'internal') {
                    if (_result.data.type === 'class')
                        _result.data.type = 'classe';
                    this.type.href = '../' + _result.data.type + 's/' + _result.data.name + '.html';
                    this.type.target = '_self';
                }
                else {
                    this.type.href = 'https://angular.io/docs/ts/latest/api/' + _result.data.path;
                    this.type.target = '_blank';
                }
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        });
        Handlebars.registerHelper('indexableSignature', function (method) {
            var args = method.args.map(function (arg) { return arg.name + ": " + arg.type; }).join(', ');
            if (method.name) {
                return method.name + "[" + args + "]";
            }
            else {
                return "[" + args + "]";
            }
        });
        Handlebars.registerHelper('object', function (text) {
            text = JSON.stringify(text);
            text = text.replace(/{"/, '{<br>&nbsp;&nbsp;&nbsp;&nbsp;"');
            text = text.replace(/,"/, ',<br>&nbsp;&nbsp;&nbsp;&nbsp;"');
            text = text.replace(/}$/, '<br>}');
            return new Handlebars.SafeString(text);
        });
        Handlebars.registerHelper('isNotToggle', function (type, options) {
            var configuration = Configuration.getInstance(), result = configuration.mainData.toggleMenuItems.indexOf(type);
            if (configuration.mainData.toggleMenuItems.indexOf('all') !== -1) {
                return options.inverse(this);
            }
            else if (result === -1) {
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        });
    };
    return {
        init: init
    };
})();

//import * as helpers from 'handlebars-helpers';
var HtmlEngine = (function () {
    function HtmlEngine() {
        this.cache = {};
        HtmlEngineHelpers.init();
    }
    HtmlEngine.prototype.init = function () {
        var partials = [
            'menu',
            'overview',
            'readme',
            'modules',
            'module',
            'components',
            'component',
            'component-detail',
            'directives',
            'directive',
            'injectables',
            'injectable',
            'pipes',
            'pipe',
            'classes',
            'class',
            'interface',
            'routes',
            'search-results',
            'search-input',
            'link-type',
            'block-method',
            'block-enum',
            'block-property',
            'block-index',
            'block-constructor',
            'coverage-report',
            'miscellaneous',
            'additional-page'
        ], i = 0, len = partials.length, loop = function (resolve$$1, reject) {
            if (i <= len - 1) {
                fs.readFile(path.resolve(__dirname + '/../src/templates/partials/' + partials[i] + '.hbs'), 'utf8', function (err, data) {
                    if (err) {
                        reject();
                    }
                    Handlebars.registerPartial(partials[i], data);
                    i++;
                    loop(resolve$$1, reject);
                });
            }
            else {
                resolve$$1();
            }
        };
        return new Promise(function (resolve$$1, reject) {
            loop(resolve$$1, reject);
        });
    };
    HtmlEngine.prototype.render = function (mainData, page) {
        var o = mainData, that = this;
        Object.assign(o, page);
        return new Promise(function (resolve$$1, reject) {
            if (that.cache['page']) {
                var template = Handlebars.compile(that.cache['page']), result = template({
                    data: o
                });
                resolve$$1(result);
            }
            else {
                fs.readFile(path.resolve(__dirname + '/../src/templates/page.hbs'), 'utf8', function (err, data) {
                    if (err) {
                        reject('Error during index ' + page.name + ' generation');
                    }
                    else {
                        that.cache['page'] = data;
                        var template = Handlebars.compile(data), result = template({
                            data: o
                        });
                        resolve$$1(result);
                    }
                });
            }
        });
    };
    HtmlEngine.prototype.generateCoverageBadge = function (outputFolder, coverageData) {
        return new Promise(function (resolve$$1, reject) {
            fs.readFile(path.resolve(__dirname + '/../src/templates/partials/coverage-badge.hbs'), 'utf8', function (err, data) {
                if (err) {
                    reject('Error during coverage badge generation');
                }
                else {
                    var template = Handlebars.compile(data), result = template({
                        data: coverageData
                    });
                    outputFolder = outputFolder.replace(process.cwd(), '');
                    fs.outputFile(path.resolve(process.cwd() + path.sep + outputFolder + path.sep + '/images/coverage-badge.svg'), result, function (err) {
                        if (err) {
                            logger.error('Error during coverage badge file generation ', err);
                            reject(err);
                        }
                        else {
                            resolve$$1();
                        }
                    });
                }
            });
        });
    };
    return HtmlEngine;
}());

var marked$1 = require('marked');
var MarkdownEngine = (function () {
    function MarkdownEngine() {
        var _this = this;
        var renderer = new marked$1.Renderer();
        renderer.code = function (code, language) {
            var highlighted = code;
            if (!language) {
                language = 'none';
            }
            highlighted = _this.escape(code);
            return "<pre class=\"line-numbers\"><code class=\"language-" + language + "\">" + highlighted + "</code></pre>";
        };
        renderer.table = function (header, body) {
            return '<table class="table table-bordered compodoc-table">\n'
                + '<thead>\n'
                + header
                + '</thead>\n'
                + '<tbody>\n'
                + body
                + '</tbody>\n'
                + '</table>\n';
        };
        renderer.image = function (href, title, text) {
            var out = '<img src="' + href + '" alt="' + text + '" class="img-responsive"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += this.options.xhtml ? '/>' : '>';
            return out;
        };
        marked$1.setOptions({
            renderer: renderer,
            breaks: false
        });
    }
    MarkdownEngine.prototype.get = function (filepath) {
        return new Promise(function (resolve$$1, reject) {
            fs.readFile(path.resolve(process.cwd() + path.sep + filepath), 'utf8', function (err, data) {
                if (err) {
                    reject('Error during ' + filepath + ' read');
                }
                else {
                    resolve$$1(marked$1(data));
                }
            });
        });
    };
    MarkdownEngine.prototype.getReadmeFile = function () {
        return new Promise(function (resolve$$1, reject) {
            fs.readFile(path.resolve(process.cwd() + '/README.md'), 'utf8', function (err, data) {
                if (err) {
                    reject('Error during README.md file reading');
                }
                else {
                    resolve$$1(marked$1(data));
                }
            });
        });
    };
    MarkdownEngine.prototype.componentHasReadmeFile = function (file) {
        var dirname$$1 = path.dirname(file), readmeFile = dirname$$1 + path.sep + 'README.md', readmeAlternativeFile = dirname$$1 + path.sep + path.basename(file, '.ts') + '.md';
        return fs.existsSync(readmeFile) || fs.existsSync(readmeAlternativeFile);
    };
    MarkdownEngine.prototype.componentReadmeFile = function (file) {
        var dirname$$1 = path.dirname(file), readmeFile = dirname$$1 + path.sep + 'README.md', readmeAlternativeFile = dirname$$1 + path.sep + path.basename(file, '.ts') + '.md', finalPath = '';
        if (fs.existsSync(readmeFile)) {
            finalPath = readmeFile;
        }
        else {
            finalPath = readmeAlternativeFile;
        }
        return finalPath;
    };
    MarkdownEngine.prototype.escape = function (html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/@/g, '&#64;');
    };
    return MarkdownEngine;
}());

var FileEngine = (function () {
    function FileEngine() {
    }
    FileEngine.prototype.get = function (filepath) {
        return new Promise(function (resolve$$1, reject) {
            fs.readFile(path.resolve(process.cwd() + path.sep + filepath), 'utf8', function (err, data) {
                if (err) {
                    reject('Error during ' + filepath + ' read');
                }
                else {
                    resolve$$1(data);
                }
            });
        });
    };
    return FileEngine;
}());

var ngdCr = require('@compodoc/ngd-core');
var ngdT = require('@compodoc/ngd-transformer');
var NgdEngine = (function () {
    function NgdEngine() {
    }
    NgdEngine.prototype.renderGraph = function (filepath, outputpath, type, name) {
        return new Promise(function (resolve$$1, reject) {
            ngdCr.logger.silent = false;
            var engine = new ngdT.DotEngine({
                output: outputpath,
                displayLegend: true,
                outputFormats: 'svg'
            });
            if (type === 'f') {
                engine
                    .generateGraph([$dependenciesEngine.getRawModule(name)])
                    .then(function (file) {
                    resolve$$1();
                }, function (error) {
                    reject(error);
                });
            }
            else {
                engine
                    .generateGraph($dependenciesEngine.rawModulesForOverview)
                    .then(function (file) {
                    resolve$$1();
                }, function (error) {
                    reject(error);
                });
            }
        });
    };
    NgdEngine.prototype.readGraph = function (filepath, name) {
        return new Promise(function (resolve$$1, reject) {
            fs.readFile(path.resolve(filepath), 'utf8', function (err, data) {
                if (err) {
                    reject('Error during graph read ' + name);
                }
                else {
                    resolve$$1(data);
                }
            });
        });
    };
    return NgdEngine;
}());

var lunr = require('lunr');
var cheerio = require('cheerio');
var Entities = require('html-entities').AllHtmlEntities;
var $configuration = Configuration.getInstance();
var Html = new Entities();
var SearchEngine = (function () {
    function SearchEngine() {
        this.documentsStore = {};
    }
    SearchEngine.prototype.getSearchIndex = function () {
        if (!this.searchIndex) {
            this.searchIndex = lunr(function () {
                this.ref('url');
                this.field('title', { boost: 10 });
                this.field('body');
            });
        }
        return this.searchIndex;
    };
    SearchEngine.prototype.indexPage = function (page) {
        var text, $ = cheerio.load(page.rawData);
        text = $('.content').html();
        text = Html.decode(text);
        text = text.replace(/(<([^>]+)>)/ig, '');
        page.url = page.url.replace($configuration.mainData.output, '');
        var doc = {
            url: page.url,
            title: page.infos.context + ' - ' + page.infos.name,
            body: text
        };
        this.documentsStore[doc.url] = doc;
        this.getSearchIndex().add(doc);
    };
    SearchEngine.prototype.generateSearchIndexJson = function (outputFolder) {
        var _this = this;
        return new Promise(function (resolve$$1, reject) {
            fs.readFile(path.resolve(__dirname + '/../src/templates/partials/search-index.hbs'), 'utf8', function (err, data) {
                if (err) {
                    reject('Error during search index generation');
                }
                else {
                    var template = Handlebars.compile(data), result = template({
                        index: JSON.stringify(_this.getSearchIndex()),
                        store: JSON.stringify(_this.documentsStore)
                    });
                    outputFolder = outputFolder.replace(process.cwd(), '');
                    fs.outputFile(path.resolve(process.cwd() + path.sep + outputFolder + path.sep + '/js/search/search_index.js'), result, function (err) {
                        if (err) {
                            logger.error('Error during search index file generation ', err);
                            reject(err);
                        }
                        else {
                            resolve$$1();
                        }
                    });
                }
            });
        });
    };
    return SearchEngine;
}());

function cleanNameWithoutSpaceAndToLowerCase(name) {
    return name.toLowerCase().replace(/ /g, '-');
}
function detectIndent(str, count, indent) {
    var stripIndent = function (str) {
        var match = str.match(/^[ \t]*(?=\S)/gm);
        if (!match) {
            return str;
        }
        // TODO: use spread operator when targeting Node.js 6
        var indent = Math.min.apply(Math, match.map(function (x) { return x.length; })); // eslint-disable-line
        var re = new RegExp("^[ \\t]{" + indent + "}", 'gm');
        return indent > 0 ? str.replace(re, '') : str;
    }, repeating = function (n, str) {
        str = str === undefined ? ' ' : str;
        if (typeof str !== 'string') {
            throw new TypeError("Expected `input` to be a `string`, got `" + typeof str + "`");
        }
        if (n < 0) {
            throw new TypeError("Expected `count` to be a positive finite number, got `" + n + "`");
        }
        var ret = '';
        do {
            if (n & 1) {
                ret += str;
            }
            str += str;
        } while ((n >>= 1));
        return ret;
    }, indentString = function (str, count, indent) {
        indent = indent === undefined ? ' ' : indent;
        count = count === undefined ? 1 : count;
        if (typeof str !== 'string') {
            throw new TypeError("Expected `input` to be a `string`, got `" + typeof str + "`");
        }
        if (typeof count !== 'number') {
            throw new TypeError("Expected `count` to be a `number`, got `" + typeof count + "`");
        }
        if (typeof indent !== 'string') {
            throw new TypeError("Expected `indent` to be a `string`, got `" + typeof indent + "`");
        }
        if (count === 0) {
            return str;
        }
        indent = count > 1 ? repeating(count, indent) : indent;
        return str.replace(/^(?!\s*$)/mg, indent);
    };
    return indentString(stripIndent(str), count || 0, indent);
}
// Create a compilerHost object to allow the compiler to read and write files
function compilerHost(transpileOptions) {
    var inputFileName = transpileOptions.fileName || (transpileOptions.jsx ? 'module.tsx' : 'module.ts');
    var compilerHost = {
        getSourceFile: function (fileName) {
            if (fileName.lastIndexOf('.ts') !== -1) {
                if (fileName === 'lib.d.ts') {
                    return undefined;
                }
                if (fileName.substr(-5) === '.d.ts') {
                    return undefined;
                }
                if (path.isAbsolute(fileName) === false) {
                    fileName = path.join(transpileOptions.tsconfigDirectory, fileName);
                }
                if (!fs.existsSync(fileName)) {
                    return undefined;
                }
                var libSource = '';
                try {
                    libSource = fs.readFileSync(fileName).toString();
                }
                catch (e) {
                    logger.debug(e, fileName);
                }
                return ts.createSourceFile(fileName, libSource, transpileOptions.target, false);
            }
            return undefined;
        },
        writeFile: function (name, text) { },
        getDefaultLibFileName: function () { return 'lib.d.ts'; },
        useCaseSensitiveFileNames: function () { return false; },
        getCanonicalFileName: function (fileName) { return fileName; },
        getCurrentDirectory: function () { return ''; },
        getNewLine: function () { return '\n'; },
        fileExists: function (fileName) { return fileName === inputFileName; },
        readFile: function () { return ''; },
        directoryExists: function () { return true; },
        getDirectories: function () { return []; }
    };
    return compilerHost;
}
function findMainSourceFolder(files) {
    var mainFolder = '', mainFolderCount = 0, rawFolders = files.map(function (filepath) {
        var shortPath = filepath.replace(process.cwd() + path.sep, '');
        return path.dirname(shortPath);
    }), folders = {}, i = 0;
    rawFolders = _.uniq(rawFolders);
    var len = rawFolders.length;
    for (i; i < len; i++) {
        var sep$$1 = rawFolders[i].split(path.sep);
        sep$$1.map(function (folder) {
            if (folders[folder]) {
                folders[folder] += 1;
            }
            else {
                folders[folder] = 1;
            }
        });
    }
    for (var f in folders) {
        if (folders[f] > mainFolderCount) {
            mainFolderCount = folders[f];
            mainFolder = f;
        }
    }
    return mainFolder;
}

var RouterParser = (function () {
    var routes = [], incompleteRoutes = [], modules = [], modulesTree, rootModule, cleanModulesTree, modulesWithRoutes = [], _addRoute = function (route) {
        routes.push(route);
        routes = _.sortBy(_.uniqWith(routes, _.isEqual), ['name']);
    }, _addIncompleteRoute = function (route) {
        incompleteRoutes.push(route);
        incompleteRoutes = _.sortBy(_.uniqWith(incompleteRoutes, _.isEqual), ['name']);
    }, _addModuleWithRoutes = function (moduleName, moduleImports) {
        modulesWithRoutes.push({
            name: moduleName,
            importsNode: moduleImports
        });
        modulesWithRoutes = _.sortBy(_.uniqWith(modulesWithRoutes, _.isEqual), ['name']);
    }, _addModule = function (moduleName, moduleImports) {
        modules.push({
            name: moduleName,
            importsNode: moduleImports
        });
        modules = _.sortBy(_.uniqWith(modules, _.isEqual), ['name']);
    }, _cleanRawRouteParsed = function (route) {
        var routesWithoutSpaces = route.replace(/ /gm, ''), testTrailingComma = routesWithoutSpaces.indexOf('},]');
        if (testTrailingComma != -1) {
            routesWithoutSpaces = routesWithoutSpaces.replace('},]', '}]');
        }
        return JSON.parse(routesWithoutSpaces);
    }, _cleanRawRoute = function (route) {
        var routesWithoutSpaces = route.replace(/ /gm, ''), testTrailingComma = routesWithoutSpaces.indexOf('},]');
        if (testTrailingComma != -1) {
            routesWithoutSpaces = routesWithoutSpaces.replace('},]', '}]');
        }
        return routesWithoutSpaces;
    }, _setRootModule = function (module) {
        rootModule = module;
    }, _hasRouterModuleInImports = function (imports) {
        var result = false, i = 0, len = imports.length;
        for (i; i < len; i++) {
            if (imports[i].name.indexOf('RouterModule.forChild') !== -1 ||
                imports[i].name.indexOf('RouterModule.forRoot') !== -1) {
                result = true;
            }
        }
        return result;
    }, _fixIncompleteRoutes = function (miscellaneousVariables) {
        /*console.log('fixIncompleteRoutes');
        console.log('');
        console.log(routes);
        console.log('');*/
        //console.log(miscellaneousVariables);
        //console.log('');
        var i = 0, len = incompleteRoutes.length, matchingVariables = [];
        // For each incompleteRoute, scan if one misc variable is in code
        // if ok, try recreating complete route
        for (i; i < len; i++) {
            var j = 0, leng = miscellaneousVariables.length;
            for (j; j < leng; j++) {
                if (incompleteRoutes[i].data.indexOf(miscellaneousVariables[j].name) !== -1) {
                    console.log('found one misc var inside incompleteRoute');
                    console.log(miscellaneousVariables[j].name);
                    matchingVariables.push(miscellaneousVariables[j]);
                }
            }
            //Clean incompleteRoute
            incompleteRoutes[i].data = incompleteRoutes[i].data.replace('[', '');
            incompleteRoutes[i].data = incompleteRoutes[i].data.replace(']', '');
        }
        /*console.log(incompleteRoutes);
        console.log('');
        console.log(matchingVariables);
        console.log('');*/
    }, _linkModulesAndRoutes = function () {
        /*console.log('');
        console.log('linkModulesAndRoutes: ');
        //scan each module imports AST for each routes, and link routes with module
        console.log('linkModulesAndRoutes routes: ', routes);
        console.log('');*/
        var i = 0, len = modulesWithRoutes.length;
        for (i; i < len; i++) {
            _.forEach(modulesWithRoutes[i].importsNode, function (node) {
                if (node.initializer) {
                    if (node.initializer.elements) {
                        _.forEach(node.initializer.elements, function (element) {
                            //find element with arguments
                            if (element.arguments) {
                                _.forEach(element.arguments, function (argument) {
                                    _.forEach(routes, function (route) {
                                        if (argument.text && route.name === argument.text) {
                                            route.module = modulesWithRoutes[i].name;
                                        }
                                    });
                                });
                            }
                        });
                    }
                }
            });
        }
        /*console.log('');
        console.log('end linkModulesAndRoutes: ');
        console.log(util.inspect(routes, { depth: 10 }));
        console.log('');*/
    }, foundRouteWithModuleName = function (moduleName) {
        return _.find(routes, { 'module': moduleName });
    }, foundLazyModuleWithPath = function (path$$1) {
        //path is like app/customers/customers.module#CustomersModule
        var split = path$$1.split('#'), lazyModulePath = split[0], lazyModuleName = split[1];
        return lazyModuleName;
    }, _constructRoutesTree = function () {
        //console.log('');
        /*console.log('constructRoutesTree modules: ', modules);
        console.log('');
        console.log('constructRoutesTree modulesWithRoutes: ', modulesWithRoutes);
        console.log('');
        console.log('constructRoutesTree modulesTree: ', util.inspect(modulesTree, { depth: 10 }));
        console.log('');*/
        // routes[] contains routes with module link
        // modulesTree contains modules tree
        // make a final routes tree with that
        cleanModulesTree = _.cloneDeep(modulesTree);
        var modulesCleaner = function (arr) {
            for (var i in arr) {
                if (arr[i].importsNode) {
                    delete arr[i].importsNode;
                }
                if (arr[i].parent) {
                    delete arr[i].parent;
                }
                if (arr[i].children) {
                    modulesCleaner(arr[i].children);
                }
            }
        };
        modulesCleaner(cleanModulesTree);
        //console.log('');
        //console.log('  cleanModulesTree light: ', util.inspect(cleanModulesTree, { depth: 10 }));
        //console.log('');
        //console.log(routes);
        //console.log('');
        var routesTree = {
            name: '<root>',
            kind: 'module',
            className: rootModule,
            children: []
        };
        var loopModulesParser = function (node) {
            if (node.children && node.children.length > 0) {
                //If module has child modules
                //console.log('   If module has child modules');
                for (var i in node.children) {
                    var route = foundRouteWithModuleName(node.children[i].name);
                    if (route && route.data) {
                        route.children = JSON.parse(route.data);
                        delete route.data;
                        route.kind = 'module';
                        routesTree.children.push(route);
                    }
                    if (node.children[i].children) {
                        loopModulesParser(node.children[i]);
                    }
                }
            }
            else {
                //else routes are directly inside the module
                //console.log('   else routes are directly inside the root module');
                var rawRoutes = foundRouteWithModuleName(node.name);
                if (rawRoutes) {
                    var routes_1 = JSON.parse(rawRoutes.data);
                    if (routes_1) {
                        var i_1 = 0, len = routes_1.length;
                        for (i_1; i_1 < len; i_1++) {
                            var route = routes_1[i_1];
                            if (routes_1[i_1].component) {
                                routesTree.children.push({
                                    kind: 'component',
                                    component: routes_1[i_1].component,
                                    path: routes_1[i_1].path
                                });
                            }
                        }
                    }
                }
            }
        };
        //console.log('');
        //console.log('  rootModule: ', rootModule);
        //console.log('');
        var startModule = _.find(cleanModulesTree, { 'name': rootModule });
        if (startModule) {
            loopModulesParser(startModule);
            //Loop twice for routes with lazy loading
            //loopModulesParser(routesTree);
        }
        /*console.log('');
        console.log('  routesTree: ', routesTree);
        console.log('');*/
        var cleanedRoutesTree = null;
        var cleanRoutesTree = function (route) {
            for (var i in route.children) {
                var routes = route.children[i].routes;
            }
            return route;
        };
        cleanedRoutesTree = cleanRoutesTree(routesTree);
        //Try updating routes with lazy loading
        //console.log('');
        //console.log('Try updating routes with lazy loading');
        var loopRoutesParser = function (route) {
            if (route.children) {
                var _loop_1 = function () {
                    if (route.children[i].loadChildren) {
                        var child = foundLazyModuleWithPath(route.children[i].loadChildren), module = _.find(cleanModulesTree, { 'name': child });
                        if (module) {
                            var _rawModule_1 = {};
                            _rawModule_1.kind = 'module';
                            _rawModule_1.children = [];
                            _rawModule_1.module = module.name;
                            var loopInside = function (mod) {
                                if (mod.children) {
                                    for (var i in mod.children) {
                                        var route_1 = foundRouteWithModuleName(mod.children[i].name);
                                        if (typeof route_1 !== 'undefined') {
                                            if (route_1.data) {
                                                route_1.children = JSON.parse(route_1.data);
                                                delete route_1.data;
                                                route_1.kind = 'module';
                                                _rawModule_1.children[i] = route_1;
                                            }
                                        }
                                    }
                                }
                            };
                            loopInside(module);
                            route.children[i].children = [];
                            route.children[i].children.push(_rawModule_1);
                        }
                    }
                    loopRoutesParser(route.children[i]);
                };
                for (var i in route.children) {
                    _loop_1();
                }
            }
        };
        loopRoutesParser(cleanedRoutesTree);
        //console.log('');
        //console.log('  cleanedRoutesTree: ', util.inspect(cleanedRoutesTree, { depth: 10 }));
        return cleanedRoutesTree;
    }, _constructModulesTree = function () {
        //console.log('');
        //console.log('constructModulesTree');
        var getNestedChildren = function (arr, parent) {
            var out = [];
            for (var i in arr) {
                if (arr[i].parent === parent) {
                    var children = getNestedChildren(arr, arr[i].name);
                    if (children.length) {
                        arr[i].children = children;
                    }
                    out.push(arr[i]);
                }
            }
            return out;
        };
        //Scan each module and add parent property
        _.forEach(modules, function (firstLoopModule) {
            _.forEach(firstLoopModule.importsNode, function (importNode) {
                _.forEach(modules, function (module) {
                    if (module.name === importNode.name) {
                        module.parent = firstLoopModule.name;
                    }
                });
            });
        });
        modulesTree = getNestedChildren(modules);
        /*console.log('');
        console.log('end constructModulesTree');
        console.log(modulesTree);*/
    }, _generateRoutesIndex = function (outputFolder, routes) {
        return new Promise(function (resolve$$1, reject) {
            fs.readFile(path.resolve(__dirname + '/../src/templates/partials/routes-index.hbs'), 'utf8', function (err, data) {
                if (err) {
                    reject('Error during routes index generation');
                }
                else {
                    var template = Handlebars.compile(data), result = template({
                        routes: JSON.stringify(routes)
                    });
                    outputFolder = outputFolder.replace(process.cwd(), '');
                    fs.outputFile(path.resolve(process.cwd() + path.sep + outputFolder + path.sep + '/js/routes/routes_index.js'), result, function (err) {
                        if (err) {
                            logger.error('Error during routes index file generation ', err);
                            reject(err);
                        }
                        else {
                            resolve$$1();
                        }
                    });
                }
            });
        });
    }, _routesLength = function () {
        var _n = 0;
        var routesParser = function (route) {
            if (typeof route.path !== 'undefined') {
                _n += 1;
            }
            if (route.children) {
                for (var j in route.children) {
                    routesParser(route.children[j]);
                }
            }
        };
        for (var i in routes) {
            routesParser(routes[i]);
        }
        return _n;
    };
    return {
        incompleteRoutes: incompleteRoutes,
        addRoute: _addRoute,
        addIncompleteRoute: _addIncompleteRoute,
        addModuleWithRoutes: _addModuleWithRoutes,
        addModule: _addModule,
        cleanRawRouteParsed: _cleanRawRouteParsed,
        cleanRawRoute: _cleanRawRoute,
        setRootModule: _setRootModule,
        printRoutes: function () {
            console.log('');
            console.log('printRoutes: ');
            console.log(routes);
        },
        printModulesRoutes: function () {
            console.log('');
            console.log('printModulesRoutes: ');
            console.log(modulesWithRoutes);
        },
        routesLength: _routesLength,
        hasRouterModuleInImports: _hasRouterModuleInImports,
        fixIncompleteRoutes: _fixIncompleteRoutes,
        linkModulesAndRoutes: _linkModulesAndRoutes,
        constructRoutesTree: _constructRoutesTree,
        constructModulesTree: _constructModulesTree,
        generateRoutesIndex: _generateRoutesIndex
    };
})();

function isVariableLike(node) {
    if (node) {
        switch (node.kind) {
            case ts.SyntaxKind.BindingElement:
            case ts.SyntaxKind.EnumMember:
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.PropertyAssignment:
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.ShorthandPropertyAssignment:
            case ts.SyntaxKind.VariableDeclaration:
                return true;
        }
    }
    return false;
}
function some(array, predicate) {
    if (array) {
        if (predicate) {
            for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
                var v = array_1[_i];
                if (predicate(v)) {
                    return true;
                }
            }
        }
        else {
            return array.length > 0;
        }
    }
    return false;
}
function concatenate(array1, array2) {
    if (!some(array2))
        return array1;
    if (!some(array1))
        return array2;
    return array1.concat(array2);
}
function isParameter(node) {
    return node.kind === ts.SyntaxKind.Parameter;
}
function getJSDocParameterTags(param) {
    if (!isParameter(param)) {
        return undefined;
    }
    var func = param.parent;
    var tags = getJSDocTags(func, ts.SyntaxKind.JSDocParameterTag);
    if (!param.name) {
        // this is an anonymous jsdoc param from a `function(type1, type2): type3` specification
        var i = func.parameters.indexOf(param);
        var paramTags = filter(tags, function (tag) { return tag.kind === ts.SyntaxKind.JSDocParameterTag; });
        if (paramTags && 0 <= i && i < paramTags.length) {
            return [paramTags[i]];
        }
    }
    else if (param.name.kind === ts.SyntaxKind.Identifier) {
        var name_1 = param.name.text;
        return filter(tags, function (tag) { return tag.kind === ts.SyntaxKind.JSDocParameterTag && tag.parameterName.text === name_1; });
    }
    else {
        // TODO: it's a destructured parameter, so it should look up an "object type" series of multiple lines
        // But multi-line object types aren't supported yet either
        return undefined;
    }
}
var JSDocTagsParser = (function () {
    var _getJSDocs = function (node) {
        //console.log('getJSDocs: ', node);
        var cache = node.jsDocCache;
        if (!cache) {
            getJSDocsWorker(node);
            node.jsDocCache = cache;
        }
        return cache;
        function getJSDocsWorker(node) {
            var parent = node.parent;
            // Try to recognize this pattern when node is initializer of variable declaration and JSDoc comments are on containing variable statement.
            // /**
            //   * @param {number} name
            //   * @returns {number}
            //   */
            // var x = function(name) { return name.length; }
            var isInitializerOfVariableDeclarationInStatement = isVariableLike(parent) &&
                parent.initializer === node &&
                parent.parent.parent.kind === ts.SyntaxKind.VariableStatement;
            var isVariableOfVariableDeclarationStatement = isVariableLike(node) &&
                parent.parent.kind === ts.SyntaxKind.VariableStatement;
            var variableStatementNode = isInitializerOfVariableDeclarationInStatement ? parent.parent.parent :
                isVariableOfVariableDeclarationStatement ? parent.parent :
                    undefined;
            if (variableStatementNode) {
                getJSDocsWorker(variableStatementNode);
            }
            // Also recognize when the node is the RHS of an assignment expression
            var isSourceOfAssignmentExpressionStatement = parent && parent.parent &&
                parent.kind === ts.SyntaxKind.BinaryExpression &&
                parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
                parent.parent.kind === ts.SyntaxKind.ExpressionStatement;
            if (isSourceOfAssignmentExpressionStatement) {
                getJSDocsWorker(parent.parent);
            }
            var isModuleDeclaration = node.kind === ts.SyntaxKind.ModuleDeclaration &&
                parent && parent.kind === ts.SyntaxKind.ModuleDeclaration;
            var isPropertyAssignmentExpression = parent && parent.kind === ts.SyntaxKind.PropertyAssignment;
            if (isModuleDeclaration || isPropertyAssignmentExpression) {
                getJSDocsWorker(parent);
            }
            // Pull parameter comments from declaring function as well
            if (node.kind === ts.SyntaxKind.Parameter) {
                cache = concatenate(cache, getJSDocParameterTags(node));
            }
            if (isVariableLike(node) && node.initializer) {
                cache = concatenate(cache, node.initializer.jsDoc);
            }
            cache = concatenate(cache, node.jsDoc);
        }
    };
    return {
        getJSDocs: _getJSDocs
    };
})();

var code = [];
var gen = (function () {
    var tmp = [];
    return function (token) {
        if (token === void 0) { token = null; }
        if (!token) {
            //console.log(' ! token');
            return code;
        }
        else if (token === '\n') {
            //console.log(' \n');
            code.push(tmp.join(''));
            tmp = [];
        }
        else {
            code.push(token);
        }
        return code;
    };
}());
function generate(node) {
    code = [];
    visitAndRecognize(node);
    return code.join('');
}
function visitAndRecognize(node, depth) {
    if (depth === void 0) { depth = 0; }
    recognize(node);
    depth++;
    node.getChildren().forEach(function (c) { return visitAndRecognize(c, depth); });
}
function recognize(node) {
    //console.log('recognizing...', ts.SyntaxKind[node.kind+'']);
    switch (node.kind) {
        case ts.SyntaxKind.FirstLiteralToken:
        case ts.SyntaxKind.Identifier:
            gen('\"');
            gen(node.text);
            gen('\"');
            break;
        case ts.SyntaxKind.StringLiteral:
            gen('\"');
            gen(node.text);
            gen('\"');
            break;
        case ts.SyntaxKind.ArrayLiteralExpression:
            break;
        case ts.SyntaxKind.ImportKeyword:
            gen('import');
            gen(' ');
            break;
        case ts.SyntaxKind.FromKeyword:
            gen('from');
            gen(' ');
            break;
        case ts.SyntaxKind.ExportKeyword:
            gen('\n');
            gen('export');
            gen(' ');
            break;
        case ts.SyntaxKind.ClassKeyword:
            gen('class');
            gen(' ');
            break;
        case ts.SyntaxKind.ThisKeyword:
            gen('this');
            break;
        case ts.SyntaxKind.ConstructorKeyword:
            gen('constructor');
            break;
        case ts.SyntaxKind.FalseKeyword:
            gen('false');
            break;
        case ts.SyntaxKind.TrueKeyword:
            gen('true');
            break;
        case ts.SyntaxKind.NullKeyword:
            gen('null');
            break;
        case ts.SyntaxKind.AtToken:
            break;
        case ts.SyntaxKind.PlusToken:
            gen('+');
            break;
        case ts.SyntaxKind.EqualsGreaterThanToken:
            gen(' => ');
            break;
        case ts.SyntaxKind.OpenParenToken:
            gen('(');
            break;
        case ts.SyntaxKind.ImportClause:
        case ts.SyntaxKind.ObjectLiteralExpression:
            gen('{');
            gen(' ');
            break;
        case ts.SyntaxKind.Block:
            gen('{');
            gen('\n');
            break;
        case ts.SyntaxKind.CloseBraceToken:
            gen('}');
            break;
        case ts.SyntaxKind.CloseParenToken:
            gen(')');
            break;
        case ts.SyntaxKind.OpenBracketToken:
            gen('[');
            break;
        case ts.SyntaxKind.CloseBracketToken:
            gen(']');
            break;
        case ts.SyntaxKind.SemicolonToken:
            gen(';');
            gen('\n');
            break;
        case ts.SyntaxKind.CommaToken:
            gen(',');
            gen(' ');
            break;
        case ts.SyntaxKind.ColonToken:
            gen(' ');
            gen(':');
            gen(' ');
            break;
        case ts.SyntaxKind.DotToken:
            gen('.');
            break;
        case ts.SyntaxKind.DoStatement:
            break;
        case ts.SyntaxKind.Decorator:
            break;
        case ts.SyntaxKind.FirstAssignment:
            gen(' = ');
            break;
        case ts.SyntaxKind.FirstPunctuation:
            gen(' ');
            break;
        case ts.SyntaxKind.PrivateKeyword:
            gen('private');
            gen(' ');
            break;
        case ts.SyntaxKind.PublicKeyword:
            gen('public');
            gen(' ');
            break;
        default:
            break;
    }
}

var getCurrentDirectory = ts.sys.getCurrentDirectory;
var useCaseSensitiveFileNames = ts.sys.useCaseSensitiveFileNames;
var newLine = ts.sys.newLine;
function getNewLine() {
    return newLine;
}
function getCanonicalFileName(fileName) {
    return useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
}
var formatDiagnosticsHost = {
    getCurrentDirectory: getCurrentDirectory,
    getCanonicalFileName: getCanonicalFileName,
    getNewLine: getNewLine
};
function readConfig(configFile) {
    var result = ts.readConfigFile(configFile, ts.sys.readFile);
    if (result.error) {
        var message = ts.formatDiagnostics([result.error], formatDiagnosticsHost);
        throw new Error(message);
    }
    return result.config;
}

function stripBom(source) {
    if (source.charCodeAt(0) === 0xFEFF) {
        return source.slice(1);
    }
    return source;
}
function handlePath(files, cwd) {
    var _files = files, i = 0, len = files.length;
    for (i; i < len; i++) {
        if (files[i].indexOf(cwd) === -1) {
            files[i] = path.resolve(cwd + path.sep + files[i]);
        }
    }
    return _files;
}

var $ = require('cheerio');
var ComponentsTreeEngine = (function () {
    function ComponentsTreeEngine() {
        this.components = [];
        this.componentsForTree = [];
        if (ComponentsTreeEngine._instance) {
            throw new Error('Error: Instantiation failed: Use ComponentsTreeEngine.getInstance() instead of new.');
        }
        ComponentsTreeEngine._instance = this;
    }
    ComponentsTreeEngine.getInstance = function () {
        return ComponentsTreeEngine._instance;
    };
    ComponentsTreeEngine.prototype.addComponent = function (component) {
        this.components.push(component);
    };
    ComponentsTreeEngine.prototype.readTemplates = function () {
        var _this = this;
        return new Promise(function (resolve$$1, reject) {
            var i = 0, len = _this.componentsForTree.length, $fileengine = new FileEngine(), loop = function () {
                if (i <= len - 1) {
                    if (_this.componentsForTree[i].templateUrl) {
                        $fileengine.get(path.dirname(_this.componentsForTree[i].file) + path.sep + _this.componentsForTree[i].templateUrl).then(function (templateData) {
                            _this.componentsForTree[i].templateData = templateData;
                            i++;
                            loop();
                        }, function (e) {
                            logger.error(e);
                            reject();
                        });
                    }
                    else {
                        _this.componentsForTree[i].templateData = _this.componentsForTree[i].template;
                        i++;
                        loop();
                    }
                }
                else {
                    resolve$$1();
                }
            };
            loop();
        });
    };
    ComponentsTreeEngine.prototype.findChildrenAndParents = function () {
        var _this = this;
        return new Promise(function (resolve$$1, reject) {
            _.forEach(_this.componentsForTree, function (component) {
                var $component = $(component.templateData);
                _.forEach(_this.componentsForTree, function (componentToFind) {
                    if ($component.find(componentToFind.selector).length > 0) {
                        console.log(componentToFind.name + ' found in ' + component.name);
                        component.children.push(componentToFind.name);
                    }
                });
            });
            resolve$$1();
        });
    };
    ComponentsTreeEngine.prototype.createTreesForComponents = function () {
        var _this = this;
        return new Promise(function (resolve$$1, reject) {
            _.forEach(_this.components, function (component) {
                var _component = {
                    name: component.name,
                    file: component.file,
                    selector: component.selector,
                    children: [],
                    template: '',
                    templateUrl: ''
                };
                if (typeof component.template !== 'undefined') {
                    _component.template = component.template;
                }
                if (component.templateUrl.length > 0) {
                    _component.templateUrl = component.templateUrl[0];
                }
                _this.componentsForTree.push(_component);
            });
            _this.readTemplates().then(function () {
                _this.findChildrenAndParents().then(function () {
                    console.log('this.componentsForTree: ', _this.componentsForTree);
                    resolve$$1();
                }, function (e) {
                    logger.error(e);
                    reject();
                });
            }, function (e) {
                logger.error(e);
            });
        });
    };
    return ComponentsTreeEngine;
}());
ComponentsTreeEngine._instance = new ComponentsTreeEngine();

var $componentsTreeEngine = ComponentsTreeEngine.getInstance();

var marked$2 = require('marked');
var Dependencies = (function () {
    function Dependencies(files, options) {
        this.__cache = {};
        this.__nsModule = {};
        this.unknown = '???';
        this.configuration = Configuration.getInstance();
        this.files = files;
        var transpileOptions = {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.CommonJS,
            tsconfigDirectory: options.tsconfigDirectory
        };
        this.program = ts.createProgram(this.files, transpileOptions, compilerHost(transpileOptions));
    }
    Dependencies.prototype.getDependencies = function () {
        var _this = this;
        var deps = {
            'modules': [],
            'components': [],
            'injectables': [],
            'pipes': [],
            'directives': [],
            'routes': [],
            'classes': [],
            'interfaces': [],
            'miscellaneous': {
                variables: [],
                functions: [],
                typealiases: [],
                enumerations: [],
                types: []
            }
        };
        var sourceFiles = this.parseFiles(this.files) || [];
        sourceFiles.map(function (file) {
            var filePath = file.fileName;
            if (path.extname(filePath) === '.ts') {
                if (filePath.lastIndexOf('.d.ts') === -1 && filePath.lastIndexOf('spec.ts') === -1) {
                    logger.info('parsing', filePath);
                    try {
                        _this.getSourceFileDecorators(file, deps);
                    }
                    catch (e) {
                        logger.error(e, file.fileName);
                    }
                }
            }
            return deps;
        });
        //RouterParser.printModulesRoutes();
        //RouterParser.printRoutes();
        /*if (RouterParser.incompleteRoutes.length > 0) {
            if (deps['miscellaneous']['variables'].length > 0) {
                RouterParser.fixIncompleteRoutes(deps['miscellaneous']['variables']);
            }
        }*/
        //$componentsTreeEngine.createTreesForComponents();
        RouterParser.linkModulesAndRoutes();
        RouterParser.constructModulesTree();
        deps.routesTree = RouterParser.constructRoutesTree();
        return deps;
    };
    Dependencies.prototype.parseFiles = function (fileNames) {
        var _parsedFiles = [];
        fileNames.forEach(function (fileName) {
            var sourceCode = stripBom(fs.readFileSync(fileName).toString()), sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.ES5, true);
            _parsedFiles.push(sourceFile);
        });
        return _parsedFiles;
    };
    Dependencies.prototype.getSourceFileDecorators = function (srcFile, outputSymbols) {
        var _this = this;
        var cleaner = (process.cwd() + path.sep).replace(/\\/g, '/');
        var file = srcFile.fileName.replace(cleaner, '');
        this.programComponent = ts.createProgram([file], {});
        var sourceFile = this.programComponent.getSourceFile(file);
        this.typeCheckerComponent = this.programComponent.getTypeChecker(true);
        ts.forEachChild(srcFile, function (node) {
            var deps = {};
            if (node.decorators) {
                var visitNode = function (visitedNode, index) {
                    var metadata = node.decorators;
                    var name = _this.getSymboleName(node);
                    var props = _this.findProps(visitedNode);
                    var IO = _this.getComponentIO(file, sourceFile, node);
                    if (_this.isModule(metadata)) {
                        deps = {
                            name: name,
                            file: file,
                            providers: _this.getModuleProviders(props),
                            declarations: _this.getModuleDeclations(props),
                            imports: _this.getModuleImports(props),
                            exports: _this.getModuleExports(props),
                            bootstrap: _this.getModuleBootstrap(props),
                            type: 'module',
                            description: IO.description,
                            sourceCode: sourceFile.getText()
                        };
                        if (RouterParser.hasRouterModuleInImports(deps.imports)) {
                            RouterParser.addModuleWithRoutes(name, _this.getModuleImportsRaw(props));
                        }
                        RouterParser.addModule(name, deps.imports);
                        outputSymbols['modules'].push(deps);
                    }
                    else if (_this.isComponent(metadata)) {
                        if (props.length === 0)
                            return;
                        //console.log(util.inspect(props, { showHidden: true, depth: 10 }));
                        deps = {
                            name: name,
                            file: file,
                            //animations?: string[]; // TODO
                            changeDetection: _this.getComponentChangeDetection(props),
                            encapsulation: _this.getComponentEncapsulation(props),
                            //entryComponents?: string; // TODO waiting doc infos
                            exportAs: _this.getComponentExportAs(props),
                            host: _this.getComponentHost(props),
                            inputs: _this.getComponentInputsMetadata(props),
                            //interpolation?: string; // TODO waiting doc infos
                            moduleId: _this.getComponentModuleId(props),
                            outputs: _this.getComponentOutputs(props),
                            providers: _this.getComponentProviders(props),
                            //queries?: Deps[]; // TODO
                            selector: _this.getComponentSelector(props),
                            styleUrls: _this.getComponentStyleUrls(props),
                            styles: _this.getComponentStyles(props),
                            template: _this.getComponentTemplate(props),
                            templateUrl: _this.getComponentTemplateUrl(props),
                            viewProviders: _this.getComponentViewProviders(props),
                            inputsClass: IO.inputs,
                            outputsClass: IO.outputs,
                            propertiesClass: IO.properties,
                            methodsClass: IO.methods,
                            description: IO.description,
                            type: 'component',
                            sourceCode: sourceFile.getText()
                        };
                        if (IO.jsdoctags && IO.jsdoctags.length > 0) {
                            deps.jsdoctags = IO.jsdoctags[0].tags;
                        }
                        if (IO.constructor) {
                            deps.constructorObj = IO.constructor;
                        }
                        if (IO.extends) {
                            deps.extends = IO.extends;
                        }
                        if (IO.implements && IO.implements.length > 0) {
                            deps.implements = IO.implements;
                        }
                        $componentsTreeEngine.addComponent(deps);
                        outputSymbols['components'].push(deps);
                    }
                    else if (_this.isInjectable(metadata)) {
                        deps = {
                            name: name,
                            file: file,
                            type: 'injectable',
                            properties: IO.properties,
                            methods: IO.methods,
                            description: IO.description,
                            sourceCode: sourceFile.getText()
                        };
                        if (IO.constructor) {
                            deps.constructorObj = IO.constructor;
                        }
                        outputSymbols['injectables'].push(deps);
                    }
                    else if (_this.isPipe(metadata)) {
                        deps = {
                            name: name,
                            file: file,
                            type: 'pipe',
                            description: IO.description,
                            sourceCode: sourceFile.getText()
                        };
                        if (IO.jsdoctags && IO.jsdoctags.length > 0) {
                            deps.jsdoctags = IO.jsdoctags[0].tags;
                        }
                        outputSymbols['pipes'].push(deps);
                    }
                    else if (_this.isDirective(metadata)) {
                        if (props.length === 0)
                            return;
                        deps = {
                            name: name,
                            file: file,
                            type: 'directive',
                            description: IO.description,
                            sourceCode: sourceFile.getText(),
                            selector: _this.getComponentSelector(props),
                            providers: _this.getComponentProviders(props),
                            inputsClass: IO.inputs,
                            outputsClass: IO.outputs,
                            propertiesClass: IO.properties,
                            methodsClass: IO.methods
                        };
                        if (IO.jsdoctags && IO.jsdoctags.length > 0) {
                            deps.jsdoctags = IO.jsdoctags[0].tags;
                        }
                        if (IO.implements && IO.implements.length > 0) {
                            deps.implements = IO.implements;
                        }
                        if (IO.constructor) {
                            deps.constructorObj = IO.constructor;
                        }
                        outputSymbols['directives'].push(deps);
                    }
                    _this.debug(deps);
                    _this.__cache[name] = deps;
                };
                var filterByDecorators = function (node) {
                    if (node.expression && node.expression.expression) {
                        return /(NgModule|Component|Injectable|Pipe|Directive)/.test(node.expression.expression.text);
                    }
                    return false;
                };
                node.decorators
                    .filter(filterByDecorators)
                    .forEach(visitNode);
            }
            else if (node.symbol) {
                if (node.symbol.flags === ts.SymbolFlags.Class) {
                    var name = _this.getSymboleName(node);
                    var IO = _this.getClassIO(file, sourceFile, node);
                    deps = {
                        name: name,
                        file: file,
                        type: 'class',
                        sourceCode: sourceFile.getText()
                    };
                    if (IO.constructor) {
                        deps.constructorObj = IO.constructor;
                    }
                    if (IO.properties) {
                        deps.properties = IO.properties;
                    }
                    if (IO.description) {
                        deps.description = IO.description;
                    }
                    if (IO.methods) {
                        deps.methods = IO.methods;
                    }
                    if (IO.extends) {
                        deps.extends = IO.extends;
                    }
                    if (IO.implements && IO.implements.length > 0) {
                        deps.implements = IO.implements;
                    }
                    _this.debug(deps);
                    outputSymbols['classes'].push(deps);
                }
                else if (node.symbol.flags === ts.SymbolFlags.Interface) {
                    var name = _this.getSymboleName(node);
                    var IO = _this.getInterfaceIO(file, sourceFile, node);
                    deps = {
                        name: name,
                        file: file,
                        type: 'interface',
                        sourceCode: sourceFile.getText()
                    };
                    if (IO.properties) {
                        deps.properties = IO.properties;
                    }
                    if (IO.indexSignatures) {
                        deps.indexSignatures = IO.indexSignatures;
                    }
                    if (IO.kind) {
                        deps.kind = IO.kind;
                    }
                    if (IO.description) {
                        deps.description = IO.description;
                    }
                    if (IO.methods) {
                        deps.methods = IO.methods;
                    }
                    _this.debug(deps);
                    outputSymbols['interfaces'].push(deps);
                }
                else if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
                    var infos = _this.visitFunctionDeclaration(node), name = infos.name;
                    deps = {
                        name: name,
                        file: file
                    };
                    if (infos.args) {
                        deps.args = infos.args;
                    }
                    outputSymbols['miscellaneous'].functions.push(deps);
                }
                else if (node.kind === ts.SyntaxKind.EnumDeclaration) {
                    var infos = _this.visitEnumDeclaration(node), name = node.name.text;
                    deps = {
                        name: name,
                        childs: infos,
                        file: file
                    };
                    outputSymbols['miscellaneous'].enumerations.push(deps);
                }
            }
            else {
                var IO = _this.getRouteIO(file, sourceFile);
                if (IO.routes) {
                    var newRoutes = void 0;
                    try {
                        newRoutes = RouterParser.cleanRawRouteParsed(IO.routes);
                    }
                    catch (e) {
                        logger.error('Routes parsing error, maybe a trailing comma or an external variable, trying to fix that later after sources scanning.');
                        newRoutes = IO.routes.replace(/ /gm, '');
                        RouterParser.addIncompleteRoute({
                            data: newRoutes,
                            file: file
                        });
                        return true;
                    }
                    outputSymbols['routes'] = outputSymbols['routes'].concat(newRoutes);
                }
                if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                    var name = _this.getSymboleName(node);
                    var IO_1 = _this.getClassIO(file, sourceFile, node);
                    deps = {
                        name: name,
                        file: file,
                        type: 'class',
                        sourceCode: sourceFile.getText()
                    };
                    if (IO_1.constructor) {
                        deps.constructorObj = IO_1.constructor;
                    }
                    if (IO_1.properties) {
                        deps.properties = IO_1.properties;
                    }
                    if (IO_1.indexSignatures) {
                        deps.indexSignatures = IO_1.indexSignatures;
                    }
                    if (IO_1.description) {
                        deps.description = IO_1.description;
                    }
                    if (IO_1.methods) {
                        deps.methods = IO_1.methods;
                    }
                    if (IO_1.extends) {
                        deps.extends = IO_1.extends;
                    }
                    if (IO_1.implements && IO_1.implements.length > 0) {
                        deps.implements = IO_1.implements;
                    }
                    _this.debug(deps);
                    outputSymbols['classes'].push(deps);
                }
                if (node.kind === ts.SyntaxKind.ExpressionStatement) {
                    var bootstrapModuleReference = 'bootstrapModule';
                    //Find the root module with bootstrapModule call
                    //1. find a simple call : platformBrowserDynamic().bootstrapModule(AppModule);
                    //2. or inside a call :
                    // () => {
                    //     platformBrowserDynamic().bootstrapModule(AppModule);
                    // });
                    //3. with a catch : platformBrowserDynamic().bootstrapModule(AppModule).catch(error => console.error(error));
                    //4. with parameters : platformBrowserDynamic().bootstrapModule(AppModule, {}).catch(error => console.error(error));
                    //Find recusively in expression nodes one with name 'bootstrapModule'
                    var rootModule_1, resultNode = void 0;
                    if (sourceFile.text.indexOf(bootstrapModuleReference) !== -1) {
                        if (node.expression) {
                            resultNode = _this.findExpressionByNameInExpressions(node.expression, 'bootstrapModule');
                        }
                        if (!resultNode) {
                            if (node.expression && node.expression.arguments && node.expression.arguments.length > 0) {
                                resultNode = _this.findExpressionByNameInExpressionArguments(node.expression.arguments, 'bootstrapModule');
                            }
                        }
                        if (resultNode) {
                            if (resultNode.arguments.length > 0) {
                                _.forEach(resultNode.arguments, function (argument) {
                                    if (argument.text) {
                                        rootModule_1 = argument.text;
                                    }
                                });
                            }
                            if (rootModule_1) {
                                RouterParser.setRootModule(rootModule_1);
                            }
                        }
                    }
                }
                if (node.kind === ts.SyntaxKind.VariableStatement && !_this.isVariableRoutes(node)) {
                    var infos = _this.visitVariableDeclaration(node), name = infos.name;
                    deps = {
                        name: name,
                        file: file
                    };
                    deps.type = (infos.type) ? infos.type : '';
                    if (infos.defaultValue) {
                        deps.defaultValue = infos.defaultValue;
                    }
                    if (node.jsDoc && node.jsDoc.length > 0 && node.jsDoc[0].comment) {
                        deps.description = marked$2(node.jsDoc[0].comment);
                    }
                    outputSymbols['miscellaneous'].variables.push(deps);
                }
                if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
                    var infos = _this.visitTypeDeclaration(node), name = infos.name;
                    deps = {
                        name: name,
                        file: file
                    };
                    outputSymbols['miscellaneous'].types.push(deps);
                }
                if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
                    var infos = _this.visitFunctionDeclaration(node), name = infos.name;
                    deps = {
                        name: name,
                        file: file
                    };
                    if (infos.args) {
                        deps.args = infos.args;
                    }
                    outputSymbols['miscellaneous'].functions.push(deps);
                }
                if (node.kind === ts.SyntaxKind.EnumDeclaration) {
                    var infos = _this.visitEnumDeclaration(node), name = node.name.text;
                    deps = {
                        name: name,
                        childs: infos,
                        file: file
                    };
                    outputSymbols['miscellaneous'].enumerations.push(deps);
                }
            }
        });
    };
    Dependencies.prototype.debug = function (deps) {
        logger.debug('found', "" + deps.name);
        [
            'imports', 'exports', 'declarations', 'providers', 'bootstrap'
        ].forEach(function (symbols) {
            if (deps[symbols] && deps[symbols].length > 0) {
                logger.debug('', "- " + symbols + ":");
                deps[symbols].map(function (i) { return i.name; }).forEach(function (d) {
                    logger.debug('', "\t- " + d);
                });
            }
        });
    };
    Dependencies.prototype.isVariableRoutes = function (node) {
        var result = false;
        if (node.declarationList.declarations) {
            var i = 0, len = node.declarationList.declarations.length;
            for (i; i < len; i++) {
                if (node.declarationList.declarations[i].type) {
                    if (node.declarationList.declarations[i].type.typeName && node.declarationList.declarations[i].type.typeName.text === 'Routes') {
                        result = true;
                    }
                }
            }
        }
        return result;
    };
    Dependencies.prototype.findExpressionByNameInExpressions = function (entryNode, name) {
        var result, loop = function (node, name) {
            if (node.expression && !node.expression.name) {
                loop(node.expression, name);
            }
            if (node.expression && node.expression.name) {
                if (node.expression.name.text === name) {
                    result = node;
                }
                else {
                    loop(node.expression, name);
                }
            }
        };
        loop(entryNode, name);
        return result;
    };
    Dependencies.prototype.findExpressionByNameInExpressionArguments = function (arg, name) {
        var result, that = this, i = 0, len = arg.length, loop = function (node, name) {
            if (node.body) {
                if (node.body.statements && node.body.statements.length > 0) {
                    var j = 0, leng = node.body.statements.length;
                    for (j; j < leng; j++) {
                        result = that.findExpressionByNameInExpressions(node.body.statements[j], name);
                    }
                }
            }
        };
        for (i; i < len; i++) {
            loop(arg[i], name);
        }
        return result;
    };
    Dependencies.prototype.parseDecorators = function (decorators, type) {
        var result = false;
        if (decorators.length > 1) {
            _.forEach(decorators, function (decorator) {
                if (decorator.expression.expression) {
                    if (decorator.expression.expression.text === type) {
                        result = true;
                    }
                }
            });
        }
        else {
            if (decorators[0].expression.expression) {
                if (decorators[0].expression.expression.text === type) {
                    result = true;
                }
            }
        }
        return result;
    };
    Dependencies.prototype.isComponent = function (metadatas) {
        return this.parseDecorators(metadatas, 'Component');
    };
    Dependencies.prototype.isPipe = function (metadatas) {
        return this.parseDecorators(metadatas, 'Pipe');
    };
    Dependencies.prototype.isDirective = function (metadatas) {
        return this.parseDecorators(metadatas, 'Directive');
    };
    Dependencies.prototype.isInjectable = function (metadatas) {
        return this.parseDecorators(metadatas, 'Injectable');
    };
    Dependencies.prototype.isModule = function (metadatas) {
        return this.parseDecorators(metadatas, 'NgModule');
    };
    Dependencies.prototype.getType = function (name) {
        var type;
        if (name.toLowerCase().indexOf('component') !== -1) {
            type = 'component';
        }
        else if (name.toLowerCase().indexOf('pipe') !== -1) {
            type = 'pipe';
        }
        else if (name.toLowerCase().indexOf('module') !== -1) {
            type = 'module';
        }
        else if (name.toLowerCase().indexOf('directive') !== -1) {
            type = 'directive';
        }
        return type;
    };
    Dependencies.prototype.getSymboleName = function (node) {
        return node.name.text;
    };
    Dependencies.prototype.getComponentSelector = function (props) {
        return this.getSymbolDeps(props, 'selector').pop();
    };
    Dependencies.prototype.getComponentExportAs = function (props) {
        return this.getSymbolDeps(props, 'exportAs').pop();
    };
    Dependencies.prototype.getModuleProviders = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'providers').map(function (providerName) {
            return _this.parseDeepIndentifier(providerName);
        });
    };
    Dependencies.prototype.findProps = function (visitedNode) {
        if (visitedNode.expression.arguments.length > 0) {
            return visitedNode.expression.arguments.pop().properties;
        }
        else {
            return '';
        }
    };
    Dependencies.prototype.getModuleDeclations = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'declarations').map(function (name) {
            var component = _this.findComponentSelectorByName(name);
            if (component) {
                return component;
            }
            return _this.parseDeepIndentifier(name);
        });
    };
    Dependencies.prototype.getModuleImportsRaw = function (props) {
        return this.getSymbolDepsRaw(props, 'imports');
    };
    Dependencies.prototype.getModuleImports = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'imports').map(function (name) {
            return _this.parseDeepIndentifier(name);
        });
    };
    Dependencies.prototype.getModuleExports = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'exports').map(function (name) {
            return _this.parseDeepIndentifier(name);
        });
    };
    Dependencies.prototype.getComponentHost = function (props) {
        return this.getSymbolDepsObject(props, 'host');
    };
    Dependencies.prototype.getModuleBootstrap = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'bootstrap').map(function (name) {
            return _this.parseDeepIndentifier(name);
        });
    };
    Dependencies.prototype.getComponentInputsMetadata = function (props) {
        return this.getSymbolDeps(props, 'inputs');
    };
    Dependencies.prototype.getDecoratorOfType = function (node, decoratorType) {
        var decorators = node.decorators || [];
        for (var i = 0; i < decorators.length; i++) {
            if (decorators[i].expression.expression) {
                if (decorators[i].expression.expression.text === decoratorType) {
                    return decorators[i];
                }
            }
        }
        return null;
    };
    Dependencies.prototype.visitInput = function (property, inDecorator, sourceFile) {
        var inArgs = inDecorator.expression.arguments, _return = {
            name: inArgs.length ? inArgs[0].text : property.name.text,
            defaultValue: property.initializer ? this.stringifyDefaultValue(property.initializer) : undefined,
            description: marked$2(LinkParser.resolveLinks(ts.displayPartsToString(property.symbol.getDocumentationComment()))),
            line: this.getPosition(property, sourceFile).line + 1
        };
        if (property.type) {
            _return.type = this.visitType(property);
        }
        else {
            // handle NewExpression
            if (property.initializer) {
                if (property.initializer.kind === ts.SyntaxKind.NewExpression) {
                    if (property.initializer.expression) {
                        _return.type = property.initializer.expression.text;
                    }
                }
            }
        }
        return _return;
    };
    Dependencies.prototype.visitType = function (node) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var _return = 'void';
        if (node) {
            try {
                _return = this.typeCheckerComponent.typeToString(this.typeCheckerComponent.getTypeAtLocation(node));
            }
            catch (e) {
                _return = '';
            }
        }
        return _return;
    };
    Dependencies.prototype.visitOutput = function (property, outDecorator, sourceFile) {
        var outArgs = outDecorator.expression.arguments, _return = {
            name: outArgs.length ? outArgs[0].text : property.name.text,
            description: marked$2(LinkParser.resolveLinks(ts.displayPartsToString(property.symbol.getDocumentationComment()))),
            line: this.getPosition(property, sourceFile).line + 1
        };
        if (property.type) {
            _return.type = this.visitType(property);
        }
        else {
            // handle NewExpression
            if (property.initializer) {
                if (property.initializer.kind === ts.SyntaxKind.NewExpression) {
                    if (property.initializer.expression) {
                        _return.type = property.initializer.expression.text;
                    }
                }
            }
        }
        return _return;
    };
    Dependencies.prototype.isPublic = function (member) {
        if (member.modifiers) {
            var isPublic = member.modifiers.some(function (modifier) {
                return modifier.kind === ts.SyntaxKind.PublicKeyword;
            });
            if (isPublic) {
                return true;
            }
        }
        return this.isHiddenMember(member);
    };
    Dependencies.prototype.isPrivate = function (member) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        if (member.modifiers) {
            var isPrivate = member.modifiers.some(function (modifier) { return modifier.kind === ts.SyntaxKind.PrivateKeyword; });
            if (isPrivate) {
                return true;
            }
        }
        return this.isHiddenMember(member);
    };
    Dependencies.prototype.isInternal = function (member) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var internalTags = ['internal'];
        if (member.jsDoc) {
            for (var _i = 0, _a = member.jsDoc; _i < _a.length; _i++) {
                var doc = _a[_i];
                if (doc.tags) {
                    for (var _b = 0, _c = doc.tags; _b < _c.length; _b++) {
                        var tag = _c[_b];
                        if (internalTags.indexOf(tag.tagName.text) > -1) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };
    Dependencies.prototype.isHiddenMember = function (member) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var internalTags = ['hidden'];
        if (member.jsDoc) {
            for (var _i = 0, _a = member.jsDoc; _i < _a.length; _i++) {
                var doc = _a[_i];
                if (doc.tags) {
                    for (var _b = 0, _c = doc.tags; _b < _c.length; _b++) {
                        var tag = _c[_b];
                        if (internalTags.indexOf(tag.tagName.text) > -1) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };
    Dependencies.prototype.isAngularLifecycleHook = function (methodName) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var ANGULAR_LIFECYCLE_METHODS = [
            'ngOnInit', 'ngOnChanges', 'ngDoCheck', 'ngOnDestroy', 'ngAfterContentInit', 'ngAfterContentChecked',
            'ngAfterViewInit', 'ngAfterViewChecked', 'writeValue', 'registerOnChange', 'registerOnTouched', 'setDisabledState'
        ];
        return ANGULAR_LIFECYCLE_METHODS.indexOf(methodName) >= 0;
    };
    Dependencies.prototype.visitConstructorDeclaration = function (method, sourceFile) {
        var _this = this;
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var result = {
            name: 'constructor',
            description: marked$2(LinkParser.resolveLinks(ts.displayPartsToString(method.symbol.getDocumentationComment()))),
            args: method.parameters ? method.parameters.map(function (prop) { return _this.visitArgument(prop); }) : [],
            line: this.getPosition(method, sourceFile).line + 1
        }, jsdoctags = JSDocTagsParser.getJSDocs(method), markedtags = function (tags) {
            var mtags = tags;
            _.forEach(mtags, function (tag) {
                tag.comment = marked$2(LinkParser.resolveLinks(tag.comment));
            });
            return mtags;
        };
        if (method.modifiers) {
            if (method.modifiers.length > 0) {
                result.modifierKind = method.modifiers[0].kind;
            }
        }
        if (jsdoctags && jsdoctags.length >= 1) {
            if (jsdoctags[0].tags) {
                result.jsdoctags = markedtags(jsdoctags[0].tags);
            }
        }
        return result;
    };
    Dependencies.prototype.visitConstructorProperties = function (method) {
        var that = this;
        if (method.parameters) {
            var _parameters = [], i = 0, len = method.parameters.length;
            for (i; i < len; i++) {
                if (that.isPublic(method.parameters[i])) {
                    _parameters.push(that.visitArgument(method.parameters[i]));
                }
            }
            return _parameters;
        }
        else {
            return [];
        }
    };
    Dependencies.prototype.visitCallDeclaration = function (method, sourceFile) {
        var _this = this;
        return {
            description: marked$2(LinkParser.resolveLinks(ts.displayPartsToString(method.symbol.getDocumentationComment()))),
            args: method.parameters ? method.parameters.map(function (prop) { return _this.visitArgument(prop); }) : [],
            returnType: this.visitType(method.type),
            line: this.getPosition(method, sourceFile).line + 1
        };
    };
    Dependencies.prototype.visitIndexDeclaration = function (method, sourceFile) {
        var _this = this;
        return {
            description: marked$2(LinkParser.resolveLinks(ts.displayPartsToString(method.symbol.getDocumentationComment()))),
            args: method.parameters ? method.parameters.map(function (prop) { return _this.visitArgument(prop); }) : [],
            returnType: this.visitType(method.type),
            line: this.getPosition(method, sourceFile).line + 1
        };
    };
    Dependencies.prototype.getPosition = function (node, sourceFile) {
        var position;
        if (node['name'] && node['name'].end) {
            position = ts.getLineAndCharacterOfPosition(sourceFile, node['name'].end);
        }
        else {
            position = ts.getLineAndCharacterOfPosition(sourceFile, node.pos);
        }
        return position;
    };
    Dependencies.prototype.visitMethodDeclaration = function (method, sourceFile) {
        var _this = this;
        var result = {
            name: method.name.text,
            args: method.parameters ? method.parameters.map(function (prop) { return _this.visitArgument(prop); }) : [],
            returnType: this.visitType(method.type),
            line: this.getPosition(method, sourceFile).line + 1
        }, jsdoctags = JSDocTagsParser.getJSDocs(method), markedtags = function (tags) {
            var mtags = tags;
            _.forEach(mtags, function (tag) {
                tag.comment = marked$2(LinkParser.resolveLinks(tag.comment));
            });
            return mtags;
        };
        if (method.symbol) {
            result.description = marked$2(LinkParser.resolveLinks(ts.displayPartsToString(method.symbol.getDocumentationComment())));
        }
        if (method.decorators) {
            result.decorators = this.formatDecorators(method.decorators);
        }
        if (method.modifiers) {
            if (method.modifiers.length > 0) {
                result.modifierKind = method.modifiers[0].kind;
            }
        }
        if (jsdoctags && jsdoctags.length >= 1) {
            if (jsdoctags[0].tags) {
                result.jsdoctags = markedtags(jsdoctags[0].tags);
            }
        }
        return result;
    };
    Dependencies.prototype.visitArgument = function (arg) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        return {
            name: arg.name.text,
            type: this.visitType(arg)
        };
    };
    Dependencies.prototype.getNamesCompareFn = function (name) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        name = name || 'name';
        var t = function (a, b) {
            if (a[name]) {
                return a[name].localeCompare(b[name]);
            }
            else {
                return 0;
            }
        };
        return t;
    };
    Dependencies.prototype.stringifyDefaultValue = function (node) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        if (node.text) {
            return node.text;
        }
        else if (node.kind === ts.SyntaxKind.FalseKeyword) {
            return 'false';
        }
        else if (node.kind === ts.SyntaxKind.TrueKeyword) {
            return 'true';
        }
    };
    Dependencies.prototype.formatDecorators = function (decorators) {
        var _decorators = [];
        _.forEach(decorators, function (decorator) {
            if (decorator.expression) {
                if (decorator.expression.text) {
                    _decorators.push({
                        name: decorator.expression.text
                    });
                }
                if (decorator.expression.expression) {
                    var info = {
                        name: decorator.expression.expression.text
                    };
                    if (decorator.expression.expression.arguments) {
                        if (decorator.expression.expression.arguments.length > 0) {
                            info.args = decorator.expression.expression.arguments;
                        }
                    }
                    _decorators.push(info);
                }
            }
        });
        return _decorators;
    };
    Dependencies.prototype.visitProperty = function (property, sourceFile) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var result = {
            name: property.name.text,
            defaultValue: property.initializer ? this.stringifyDefaultValue(property.initializer) : undefined,
            type: this.visitType(property),
            description: marked$2(LinkParser.resolveLinks(ts.displayPartsToString(property.symbol.getDocumentationComment()))),
            line: this.getPosition(property, sourceFile).line + 1
        };
        if (property.decorators) {
            result.decorators = this.formatDecorators(property.decorators);
        }
        if (property.modifiers) {
            if (property.modifiers.length > 0) {
                result.modifierKind = property.modifiers[0].kind;
            }
        }
        return result;
    };
    Dependencies.prototype.visitMembers = function (members, sourceFile) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var inputs = [], outputs = [], methods = [], properties = [], indexSignatures = [], kind, inputDecorator, constructor, outDecorator;
        for (var i = 0; i < members.length; i++) {
            inputDecorator = this.getDecoratorOfType(members[i], 'Input');
            outDecorator = this.getDecoratorOfType(members[i], 'Output');
            kind = members[i].kind;
            if (inputDecorator) {
                inputs.push(this.visitInput(members[i], inputDecorator, sourceFile));
            }
            else if (outDecorator) {
                outputs.push(this.visitOutput(members[i], outDecorator, sourceFile));
            }
            else if (!this.isHiddenMember(members[i])) {
                if ((this.isPrivate(members[i]) || this.isInternal(members[i])) && this.configuration.mainData.disablePrivateOrInternalSupport) { }
                else {
                    if ((members[i].kind === ts.SyntaxKind.MethodDeclaration ||
                        members[i].kind === ts.SyntaxKind.MethodSignature)) {
                        methods.push(this.visitMethodDeclaration(members[i], sourceFile));
                    }
                    else if (members[i].kind === ts.SyntaxKind.PropertyDeclaration ||
                        members[i].kind === ts.SyntaxKind.PropertySignature || members[i].kind === ts.SyntaxKind.GetAccessor) {
                        properties.push(this.visitProperty(members[i], sourceFile));
                    }
                    else if (members[i].kind === ts.SyntaxKind.CallSignature) {
                        properties.push(this.visitCallDeclaration(members[i], sourceFile));
                    }
                    else if (members[i].kind === ts.SyntaxKind.IndexSignature) {
                        indexSignatures.push(this.visitIndexDeclaration(members[i], sourceFile));
                    }
                    else if (members[i].kind === ts.SyntaxKind.Constructor) {
                        var _constructorProperties = this.visitConstructorProperties(members[i]), j = 0, len = _constructorProperties.length;
                        for (j; j < len; j++) {
                            properties.push(_constructorProperties[j]);
                        }
                        constructor = this.visitConstructorDeclaration(members[i], sourceFile);
                    }
                }
            }
        }
        inputs.sort(this.getNamesCompareFn());
        outputs.sort(this.getNamesCompareFn());
        properties.sort(this.getNamesCompareFn());
        indexSignatures.sort(this.getNamesCompareFn());
        return {
            inputs: inputs,
            outputs: outputs,
            methods: methods,
            properties: properties,
            indexSignatures: indexSignatures,
            kind: kind,
            constructor: constructor
        };
    };
    Dependencies.prototype.visitDirectiveDecorator = function (decorator) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var selector;
        var exportAs;
        var properties = decorator.expression.arguments[0].properties;
        for (var i = 0; i < properties.length; i++) {
            if (properties[i].name.text === 'selector') {
                // TODO: this will only work if selector is initialized as a string literal
                selector = properties[i].initializer.text;
            }
            if (properties[i].name.text === 'exportAs') {
                // TODO: this will only work if selector is initialized as a string literal
                exportAs = properties[i].initializer.text;
            }
        }
        return {
            selector: selector,
            exportAs: exportAs
        };
    };
    Dependencies.prototype.isPipeDecorator = function (decorator) {
        return (decorator.expression.expression) ? decorator.expression.expression.text === 'Pipe' : false;
    };
    Dependencies.prototype.isModuleDecorator = function (decorator) {
        return (decorator.expression.expression) ? decorator.expression.expression.text === 'NgModule' : false;
    };
    Dependencies.prototype.isDirectiveDecorator = function (decorator) {
        if (decorator.expression.expression) {
            var decoratorIdentifierText = decorator.expression.expression.text;
            return decoratorIdentifierText === 'Directive' || decoratorIdentifierText === 'Component';
        }
        else {
            return false;
        }
    };
    Dependencies.prototype.isServiceDecorator = function (decorator) {
        return (decorator.expression.expression) ? decorator.expression.expression.text === 'Injectable' : false;
    };
    Dependencies.prototype.visitClassDeclaration = function (fileName, classDeclaration, sourceFile) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var symbol = this.program.getTypeChecker().getSymbolAtLocation(classDeclaration.name);
        var description = marked$2(LinkParser.resolveLinks(ts.displayPartsToString(symbol.getDocumentationComment())));
        var className = classDeclaration.name.text;
        var directiveInfo;
        var members;
        var implementsElements = [];
        var extendsElement;
        var jsdoctags = [];
        if (typeof ts.getClassImplementsHeritageClauseElements !== 'undefined') {
            var implementedTypes = ts.getClassImplementsHeritageClauseElements(classDeclaration);
            if (implementedTypes) {
                var i_1 = 0, len = implementedTypes.length;
                for (i_1; i_1 < len; i_1++) {
                    if (implementedTypes[i_1].expression) {
                        implementsElements.push(implementedTypes[i_1].expression.text);
                    }
                }
            }
        }
        if (typeof ts.getClassExtendsHeritageClauseElement !== 'undefined') {
            var extendsTypes = ts.getClassExtendsHeritageClauseElement(classDeclaration);
            if (extendsTypes) {
                if (extendsTypes.expression) {
                    extendsElement = extendsTypes.expression.text;
                }
            }
        }
        if (symbol.valueDeclaration) {
            jsdoctags = JSDocTagsParser.getJSDocs(symbol.valueDeclaration);
        }
        if (classDeclaration.decorators) {
            for (var i = 0; i < classDeclaration.decorators.length; i++) {
                if (this.isDirectiveDecorator(classDeclaration.decorators[i])) {
                    directiveInfo = this.visitDirectiveDecorator(classDeclaration.decorators[i]);
                    members = this.visitMembers(classDeclaration.members, sourceFile);
                    return {
                        description: description,
                        inputs: members.inputs,
                        outputs: members.outputs,
                        properties: members.properties,
                        methods: members.methods,
                        indexSignatures: members.indexSignatures,
                        kind: members.kind,
                        constructor: members.constructor,
                        jsdoctags: jsdoctags,
                        extends: extendsElement,
                        implements: implementsElements
                    };
                }
                else if (this.isServiceDecorator(classDeclaration.decorators[i])) {
                    members = this.visitMembers(classDeclaration.members, sourceFile);
                    return [{
                            fileName: fileName,
                            className: className,
                            description: description,
                            methods: members.methods,
                            indexSignatures: members.indexSignatures,
                            properties: members.properties,
                            kind: members.kind,
                            constructor: members.constructor,
                            extends: extendsElement,
                            implements: implementsElements
                        }];
                }
                else if (this.isPipeDecorator(classDeclaration.decorators[i]) || this.isModuleDecorator(classDeclaration.decorators[i])) {
                    return [{
                            fileName: fileName,
                            className: className,
                            description: description,
                            jsdoctags: jsdoctags
                        }];
                }
                else {
                    //console.log('custom decorator');
                }
            }
        }
        else if (description) {
            members = this.visitMembers(classDeclaration.members, sourceFile);
            return [{
                    description: description,
                    methods: members.methods,
                    indexSignatures: members.indexSignatures,
                    properties: members.properties,
                    kind: members.kind,
                    constructor: members.constructor,
                    extends: extendsElement,
                    implements: implementsElements
                }];
        }
        else {
            members = this.visitMembers(classDeclaration.members, sourceFile);
            return [{
                    methods: members.methods,
                    indexSignatures: members.indexSignatures,
                    properties: members.properties,
                    kind: members.kind,
                    constructor: members.constructor,
                    extends: extendsElement,
                    implements: implementsElements
                }];
        }
        return [];
    };
    Dependencies.prototype.visitTypeDeclaration = function (type) {
        var result = {
            name: type.name.text
        }, jsdoctags = JSDocTagsParser.getJSDocs(type);
        var markedtags = function (tags) {
            var mtags = tags;
            _.forEach(mtags, function (tag) {
                tag.comment = marked$2(LinkParser.resolveLinks(tag.comment));
            });
            return mtags;
        };
        if (jsdoctags && jsdoctags.length >= 1) {
            if (jsdoctags[0].tags) {
                result.jsdoctags = markedtags(jsdoctags[0].tags);
            }
        }
        return result;
    };
    Dependencies.prototype.visitFunctionDeclaration = function (method) {
        var mapTypes = function (type) {
            switch (type) {
                case 94:
                    return 'Null';
                case 118:
                    return 'Any';
                case 121:
                    return 'Boolean';
                case 129:
                    return 'Never';
                case 132:
                    return 'Number';
                case 134:
                    return 'String';
                case 137:
                    return 'Undefined';
                case 157:
                    return 'TypeReference';
            }
        };
        var visitArgument = function (arg) {
            var result = {
                name: arg.name.text
            };
            if (arg.type) {
                result.type = mapTypes(arg.type.kind);
                if (arg.type.kind === 157) {
                    //try replace TypeReference with typeName
                    if (arg.type.typeName) {
                        result.type = arg.type.typeName.text;
                    }
                }
            }
            return result;
        };
        var result = {
            name: method.name.text,
            args: method.parameters ? method.parameters.map(function (prop) { return visitArgument(prop); }) : []
        }, jsdoctags = JSDocTagsParser.getJSDocs(method);
        var markedtags = function (tags) {
            var mtags = tags;
            _.forEach(mtags, function (tag) {
                tag.comment = marked$2(LinkParser.resolveLinks(tag.comment));
            });
            return mtags;
        };
        if (typeof method.type !== 'undefined') {
            result.returnType = this.visitType(method.type);
        }
        if (method.modifiers) {
            if (method.modifiers.length > 0) {
                result.modifierKind = method.modifiers[0].kind;
            }
        }
        if (jsdoctags && jsdoctags.length >= 1) {
            if (jsdoctags[0].tags) {
                result.jsdoctags = markedtags(jsdoctags[0].tags);
            }
        }
        return result;
    };
    Dependencies.prototype.visitVariableDeclaration = function (node) {
        if (node.declarationList.declarations) {
            var i = 0, len = node.declarationList.declarations.length;
            for (i; i < len; i++) {
                var result = {
                    name: node.declarationList.declarations[i].name.text,
                    defaultValue: node.declarationList.declarations[i].initializer ? this.stringifyDefaultValue(node.declarationList.declarations[i].initializer) : undefined
                };
                if (node.declarationList.declarations[i].type) {
                    result.type = this.visitType(node.declarationList.declarations[i].type);
                }
                return result;
            }
        }
    };
    Dependencies.prototype.visitEnumDeclaration = function (node) {
        var result = [];
        if (node.members) {
            var i = 0, len = node.members.length;
            for (i; i < len; i++) {
                var member = {
                    name: node.members[i].name.text
                };
                if (node.members[i].initializer) {
                    member.value = node.members[i].initializer.text;
                }
                result.push(member);
            }
        }
        return result;
    };
    Dependencies.prototype.visitEnumDeclarationForRoutes = function (fileName, node) {
        if (node.declarationList.declarations) {
            var i = 0, len = node.declarationList.declarations.length;
            for (i; i < len; i++) {
                if (node.declarationList.declarations[i].type) {
                    if (node.declarationList.declarations[i].type.typeName && node.declarationList.declarations[i].type.typeName.text === 'Routes') {
                        var data = generate(node.declarationList.declarations[i].initializer);
                        RouterParser.addRoute({
                            name: node.declarationList.declarations[i].name.text,
                            data: RouterParser.cleanRawRoute(data),
                            file: fileName
                        });
                        return [{
                                routes: data
                            }];
                    }
                }
            }
        }
        return [];
    };
    Dependencies.prototype.getRouteIO = function (filename, sourceFile) {
        var _this = this;
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var res = sourceFile.statements.reduce(function (directive, statement) {
            if (statement.kind === ts.SyntaxKind.VariableStatement) {
                return directive.concat(_this.visitEnumDeclarationForRoutes(filename, statement));
            }
            return directive;
        }, []);
        return res[0] || {};
    };
    Dependencies.prototype.getComponentIO = function (filename, sourceFile, node) {
        var _this = this;
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var res = sourceFile.statements.reduce(function (directive, statement) {
            if (statement.kind === ts.SyntaxKind.ClassDeclaration) {
                if (statement.pos === node.pos && statement.end === node.end) {
                    return directive.concat(_this.visitClassDeclaration(filename, statement, sourceFile));
                }
            }
            return directive;
        }, []);
        return res[0] || {};
    };
    Dependencies.prototype.getClassIO = function (filename, sourceFile, node) {
        var _this = this;
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var res = sourceFile.statements.reduce(function (directive, statement) {
            if (statement.kind === ts.SyntaxKind.ClassDeclaration) {
                if (statement.pos === node.pos && statement.end === node.end) {
                    return directive.concat(_this.visitClassDeclaration(filename, statement, sourceFile));
                }
            }
            return directive;
        }, []);
        return res[0] || {};
    };
    Dependencies.prototype.getInterfaceIO = function (filename, sourceFile, node) {
        var _this = this;
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        var res = sourceFile.statements.reduce(function (directive, statement) {
            if (statement.kind === ts.SyntaxKind.InterfaceDeclaration) {
                if (statement.pos === node.pos && statement.end === node.end) {
                    return directive.concat(_this.visitClassDeclaration(filename, statement, sourceFile));
                }
            }
            return directive;
        }, []);
        return res[0] || {};
    };
    Dependencies.prototype.getComponentOutputs = function (props) {
        return this.getSymbolDeps(props, 'outputs');
    };
    Dependencies.prototype.getComponentProviders = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'providers').map(function (name) {
            return _this.parseDeepIndentifier(name);
        });
    };
    Dependencies.prototype.getComponentViewProviders = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'viewProviders').map(function (name) {
            return _this.parseDeepIndentifier(name);
        });
    };
    Dependencies.prototype.getComponentDirectives = function (props) {
        var _this = this;
        return this.getSymbolDeps(props, 'directives').map(function (name) {
            var identifier = _this.parseDeepIndentifier(name);
            identifier.selector = _this.findComponentSelectorByName(name);
            identifier.label = '';
            return identifier;
        });
    };
    Dependencies.prototype.parseDeepIndentifier = function (name) {
        var nsModule = name.split('.'), type = this.getType(name);
        if (nsModule.length > 1) {
            // cache deps with the same namespace (i.e Shared.*)
            if (this.__nsModule[nsModule[0]]) {
                this.__nsModule[nsModule[0]].push(name);
            }
            else {
                this.__nsModule[nsModule[0]] = [name];
            }
            return {
                ns: nsModule[0],
                name: name,
                type: type
            };
        }
        return {
            name: name,
            type: type
        };
    };
    Dependencies.prototype.getComponentTemplateUrl = function (props) {
        return this.getSymbolDeps(props, 'templateUrl');
    };
    Dependencies.prototype.getComponentTemplate = function (props) {
        var t = this.getSymbolDeps(props, 'template', true).pop();
        if (t) {
            t = detectIndent(t, 0);
            t = t.replace(/\n/, '');
            t = t.replace(/ +$/gm, '');
        }
        return t;
    };
    Dependencies.prototype.getComponentStyleUrls = function (props) {
        return this.sanitizeUrls(this.getSymbolDeps(props, 'styleUrls'));
    };
    Dependencies.prototype.getComponentStyles = function (props) {
        return this.getSymbolDeps(props, 'styles');
    };
    Dependencies.prototype.getComponentModuleId = function (props) {
        return this.getSymbolDeps(props, 'moduleId').pop();
    };
    Dependencies.prototype.getComponentChangeDetection = function (props) {
        return this.getSymbolDeps(props, 'changeDetection').pop();
    };
    Dependencies.prototype.getComponentEncapsulation = function (props) {
        return this.getSymbolDeps(props, 'encapsulation');
    };
    Dependencies.prototype.sanitizeUrls = function (urls) {
        return urls.map(function (url) { return url.replace('./', ''); });
    };
    Dependencies.prototype.getSymbolDepsObject = function (props, type, multiLine) {
        var deps = props.filter(function (node) {
            return node.name.text === type;
        });
        var parseProperties = function (node) {
            var obj = {};
            (node.initializer.properties || []).forEach(function (prop) {
                obj[prop.name.text] = prop.initializer.text;
            });
            return obj;
        };
        return deps.map(parseProperties).pop();
    };
    Dependencies.prototype.getSymbolDepsRaw = function (props, type, multiLine) {
        var deps = props.filter(function (node) {
            return node.name.text === type;
        });
        return deps || [];
    };
    Dependencies.prototype.getSymbolDeps = function (props, type, multiLine) {
        var _this = this;
        var deps = props.filter(function (node) {
            return node.name.text === type;
        });
        var parseSymbolText = function (text) {
            return [
                text
            ];
        };
        var buildIdentifierName = function (node, name) {
            if (name === void 0) { name = ''; }
            if (node.expression) {
                name = name ? "." + name : name;
                var nodeName = _this.unknown;
                if (node.name) {
                    nodeName = node.name.text;
                }
                else if (node.text) {
                    nodeName = node.text;
                }
                else if (node.expression) {
                    if (node.expression.text) {
                        nodeName = node.expression.text;
                    }
                    else if (node.expression.elements) {
                        if (node.expression.kind === ts.SyntaxKind.ArrayLiteralExpression) {
                            nodeName = node.expression.elements.map(function (el) { return el.text; }).join(', ');
                            nodeName = "[" + nodeName + "]";
                        }
                    }
                }
                if (node.kind === ts.SyntaxKind.SpreadElement) {
                    return "..." + nodeName;
                }
                return "" + buildIdentifierName(node.expression, nodeName) + name;
            }
            return node.text + "." + name;
        };
        var parseProviderConfiguration = function (o) {
            // parse expressions such as:
            // { provide: APP_BASE_HREF, useValue: '/' },
            // or
            // { provide: 'Date', useFactory: (d1, d2) => new Date(), deps: ['d1', 'd2'] }
            var _genProviderName = [];
            var _providerProps = [];
            (o.properties || []).forEach(function (prop) {
                var identifier = prop.initializer.text;
                if (prop.initializer.kind === ts.SyntaxKind.StringLiteral) {
                    identifier = "'" + identifier + "'";
                }
                // lambda function (i.e useFactory)
                if (prop.initializer.body) {
                    var params = (prop.initializer.parameters || []).map(function (params) { return params.name.text; });
                    identifier = "(" + params.join(', ') + ") => {}";
                }
                else if (prop.initializer.elements) {
                    var elements = (prop.initializer.elements || []).map(function (n) {
                        if (n.kind === ts.SyntaxKind.StringLiteral) {
                            return "'" + n.text + "'";
                        }
                        return n.text;
                    });
                    identifier = "[" + elements.join(', ') + "]";
                }
                _providerProps.push([
                    // i.e provide
                    prop.name.text,
                    // i.e OpaqueToken or 'StringToken'
                    identifier
                ].join(': '));
            });
            return "{ " + _providerProps.join(', ') + " }";
        };
        var parseSymbolElements = function (o) {
            // parse expressions such as: AngularFireModule.initializeApp(firebaseConfig)
            if (o.arguments) {
                var className = buildIdentifierName(o.expression);
                // function arguments could be really complexe. There are so
                // many use cases that we can't handle. Just print "args" to indicate
                // that we have arguments.
                var functionArgs = o.arguments.length > 0 ? 'args' : '';
                var text = className + "(" + functionArgs + ")";
                return text;
            }
            else if (o.expression) {
                var identifier = buildIdentifierName(o);
                return identifier;
            }
            return o.text ? o.text : parseProviderConfiguration(o);
        };
        var parseSymbols = function (node) {
            var text = node.initializer.text;
            if (text) {
                return parseSymbolText(text);
            }
            else if (node.initializer.expression) {
                var identifier = parseSymbolElements(node.initializer);
                return [
                    identifier
                ];
            }
            else if (node.initializer.elements) {
                return node.initializer.elements.map(parseSymbolElements);
            }
        };
        return deps.map(parseSymbols).pop() || [];
    };
    Dependencies.prototype.findComponentSelectorByName = function (name) {
        return this.__cache[name];
    };
    return Dependencies;
}());

function promiseSequential(promises) {
    if (!Array.isArray(promises)) {
        throw new Error('First argument need to be an array of Promises');
    }
    return new Promise(function (resolve$$1, reject) {
        var count = 0;
        var results = [];
        var iterateeFunc = function (previousPromise, currentPromise) {
            return previousPromise
                .then(function (result) {
                if (count++ !== 0)
                    results = results.concat(result);
                return currentPromise(result, results, count);
            })
                .catch(function (err) {
                return reject(err);
            });
        };
        promises = promises.concat(function () { return Promise.resolve(); });
        promises
            .reduce(iterateeFunc, Promise.resolve(false))
            .then(function (res) {
            resolve$$1(results);
        });
    });
}

var glob = require('glob');
var marked = require('marked');
var chokidar = require('chokidar');
var pkg = require('../package.json');
var cwd = process.cwd();
var $htmlengine = new HtmlEngine();
var $fileengine = new FileEngine();
var $markdownengine = new MarkdownEngine();
var $ngdengine = new NgdEngine();
var $searchEngine = new SearchEngine();
var startTime = new Date();
var Application = (function () {
    /**
     * Create a new compodoc application instance.
     *
     * @param options An object containing the options that should be used.
     */
    function Application(options) {
        var _this = this;
        /**
         * Boolean for watching status
         * @type {boolean}
         */
        this.isWatching = false;
        this.preparePipes = function (somePipes) {
            logger.info('');
            logger.info('Prepare pipes');
            _this.configuration.mainData.pipes = (somePipes) ? somePipes : $dependenciesEngine.getPipes();
            return new Promise(function (resolve$$1, reject) {
                var i = 0, len = _this.configuration.mainData.pipes.length;
                for (i; i < len; i++) {
                    _this.configuration.addPage({
                        path: 'pipes',
                        name: _this.configuration.mainData.pipes[i].name,
                        context: 'pipe',
                        pipe: _this.configuration.mainData.pipes[i],
                        depth: 1,
                        pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                    });
                }
                resolve$$1();
            });
        };
        this.prepareClasses = function (someClasses) {
            logger.info('');
            logger.info('Prepare classes');
            _this.configuration.mainData.classes = (someClasses) ? someClasses : $dependenciesEngine.getClasses();
            return new Promise(function (resolve$$1, reject) {
                var i = 0, len = _this.configuration.mainData.classes.length;
                for (i; i < len; i++) {
                    _this.configuration.addPage({
                        path: 'classes',
                        name: _this.configuration.mainData.classes[i].name,
                        context: 'class',
                        class: _this.configuration.mainData.classes[i],
                        depth: 1,
                        pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                    });
                }
                resolve$$1();
            });
        };
        this.prepareDirectives = function (someDirectives) {
            logger.info('');
            logger.info('Prepare directives');
            _this.configuration.mainData.directives = (someDirectives) ? someDirectives : $dependenciesEngine.getDirectives();
            return new Promise(function (resolve$$1, reject) {
                var i = 0, len = _this.configuration.mainData.directives.length;
                for (i; i < len; i++) {
                    _this.configuration.addPage({
                        path: 'directives',
                        name: _this.configuration.mainData.directives[i].name,
                        context: 'directive',
                        directive: _this.configuration.mainData.directives[i],
                        depth: 1,
                        pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                    });
                }
                resolve$$1();
            });
        };
        this.configuration = Configuration.getInstance();
        for (var option in options) {
            if (typeof this.configuration.mainData[option] !== 'undefined') {
                this.configuration.mainData[option] = options[option];
            }
        }
    }
    /**
     * Start compodoc process
     */
    Application.prototype.generate = function () {
        var _this = this;
        $htmlengine.init().then(function () {
            _this.processPackageJson();
        });
    };
    /**
     * Start compodoc documentation coverage
     */
    Application.prototype.testCoverage = function () {
        this.getDependenciesData();
    };
    /**
     * Store files for initial processing
     * @param  {Array<string>} files Files found during source folder and tsconfig scan
     */
    Application.prototype.setFiles = function (files) {
        this.files = files;
    };
    /**
     * Store files for watch processing
     * @param  {Array<string>} files Files found during source folder and tsconfig scan
     */
    Application.prototype.setUpdatedFiles = function (files) {
        this.updatedFiles = files;
    };
    /**
     * Return a boolean indicating presence of one TypeScript file in updatedFiles list
     * @return {boolean} Result of scan
     */
    Application.prototype.hasWatchedFilesTSFiles = function () {
        var result = false;
        _.forEach(this.updatedFiles, function (file) {
            if (path.extname(file) === '.ts') {
                result = true;
            }
        });
        return false;
    };
    /**
     * Clear files for watch processing
     */
    Application.prototype.clearUpdatedFiles = function () {
        this.updatedFiles = [];
    };
    Application.prototype.processPackageJson = function () {
        var _this = this;
        logger.info('');
        logger.info('Searching package.json file');
        $fileengine.get('package.json').then(function (packageData) {
            var parsedData = JSON.parse(packageData);
            if (typeof parsedData.name !== 'undefined' && _this.configuration.mainData.documentationMainName === COMPODOC_DEFAULTS.title) {
                _this.configuration.mainData.documentationMainName = parsedData.name + ' documentation';
            }
            if (typeof parsedData.description !== 'undefined') {
                _this.configuration.mainData.documentationMainDescription = parsedData.description;
            }
            logger.info('package.json file found');
            _this.processMarkdown();
        }, function (errorMessage) {
            logger.error(errorMessage);
            logger.error('Continuing without package.json file');
            _this.processMarkdown();
        });
    };
    Application.prototype.processMarkdown = function () {
        var _this = this;
        logger.info('');
        logger.info('Searching README.md file');
        $markdownengine.getReadmeFile().then(function (readmeData) {
            _this.configuration.addPage({
                name: 'index',
                context: 'readme',
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
            _this.configuration.addPage({
                name: 'overview',
                context: 'overview',
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
            _this.configuration.mainData.readme = readmeData;
            logger.info('README.md file found');
            _this.getDependenciesData();
        }, function (errorMessage) {
            logger.error(errorMessage);
            logger.error('Continuing without README.md file');
            _this.configuration.addPage({
                name: 'index',
                context: 'overview'
            });
            _this.getDependenciesData();
        });
    };
    /**
     * Get dependency data for small group of updated files during watch process
     */
    Application.prototype.getMicroDependenciesData = function () {
        logger.info('');
        logger.info('Get diff dependencies data');
        var crawler = new Dependencies(this.updatedFiles, {
            tsconfigDirectory: path.dirname(this.configuration.mainData.tsconfig)
        });
        var dependenciesData = crawler.getDependencies();
        $dependenciesEngine.update(dependenciesData);
        this.prepareJustAFewThings(dependenciesData);
    };
    /**
     * Rebuild external documentation during watch process
     */
    Application.prototype.rebuildExternalDocumentation = function () {
        var _this = this;
        logger.info('');
        logger.info('Rebuild external documentation');
        var actions = [];
        this.configuration.resetAdditionalPages();
        if (this.configuration.mainData.includes !== '') {
            actions.push(function () { return _this.prepareExternalIncludes(); });
        }
        promiseSequential(actions)
            .then(function (res) {
            _this.processPages();
            _this.clearUpdatedFiles();
        })
            .catch(function (errorMessage) {
            logger.error(errorMessage);
        });
    };
    Application.prototype.getDependenciesData = function () {
        logger.info('');
        logger.info('Get dependencies data');
        var crawler = new Dependencies(this.files, {
            tsconfigDirectory: path.dirname(this.configuration.mainData.tsconfig)
        });
        var dependenciesData = crawler.getDependencies();
        $dependenciesEngine.init(dependenciesData);
        this.configuration.mainData.routesLength = RouterParser.routesLength();
        this.prepareEverything();
    };
    Application.prototype.prepareJustAFewThings = function (diffCrawledData) {
        var _this = this;
        var actions = [];
        this.configuration.resetPages();
        actions.push(function () { return _this.prepareRoutes(); });
        if (diffCrawledData.modules.length > 0) {
            actions.push(function () { return _this.prepareModules(diffCrawledData.modules); });
        }
        if (diffCrawledData.components.length > 0) {
            actions.push(function () { return _this.prepareComponents(diffCrawledData.components); });
        }
        if (diffCrawledData.directives.length > 0) {
            actions.push(function () { return _this.prepareDirectives(diffCrawledData.directives); });
        }
        if (diffCrawledData.injectables.length > 0) {
            actions.push(function () { return _this.prepareInjectables(diffCrawledData.injectables); });
        }
        if (diffCrawledData.pipes.length > 0) {
            actions.push(function () { return _this.preparePipes(diffCrawledData.pipes); });
        }
        if (diffCrawledData.classes.length > 0) {
            actions.push(function () { return _this.prepareClasses(diffCrawledData.classes); });
        }
        if (diffCrawledData.interfaces.length > 0) {
            actions.push(function () { return _this.prepareInterfaces(diffCrawledData.interfaces); });
        }
        if (diffCrawledData.miscellaneous.variables.length > 0 ||
            diffCrawledData.miscellaneous.functions.length > 0 ||
            diffCrawledData.miscellaneous.typealiases.length > 0 ||
            diffCrawledData.miscellaneous.enumerations.length > 0 ||
            diffCrawledData.miscellaneous.types.length > 0) {
            actions.push(function () { return _this.prepareMiscellaneous(diffCrawledData.miscellaneous); });
        }
        if (!this.configuration.mainData.disableCoverage) {
            actions.push(function () { return _this.prepareCoverage(); });
        }
        promiseSequential(actions)
            .then(function (res) {
            _this.processGraphs();
            _this.clearUpdatedFiles();
        })
            .catch(function (errorMessage) {
            logger.error(errorMessage);
        });
    };
    Application.prototype.prepareEverything = function () {
        var _this = this;
        var actions = [];
        actions.push(function () { return _this.prepareModules(); });
        actions.push(function () { return _this.prepareComponents(); });
        if ($dependenciesEngine.directives.length > 0) {
            actions.push(function () { return _this.prepareDirectives(); });
        }
        if ($dependenciesEngine.injectables.length > 0) {
            actions.push(function () { return _this.prepareInjectables(); });
        }
        if ($dependenciesEngine.routes && $dependenciesEngine.routes.children.length > 0) {
            actions.push(function () { return _this.prepareRoutes(); });
        }
        if ($dependenciesEngine.pipes.length > 0) {
            actions.push(function () { return _this.preparePipes(); });
        }
        if ($dependenciesEngine.classes.length > 0) {
            actions.push(function () { return _this.prepareClasses(); });
        }
        if ($dependenciesEngine.interfaces.length > 0) {
            actions.push(function () { return _this.prepareInterfaces(); });
        }
        if ($dependenciesEngine.miscellaneous.variables.length > 0 ||
            $dependenciesEngine.miscellaneous.functions.length > 0 ||
            $dependenciesEngine.miscellaneous.typealiases.length > 0 ||
            $dependenciesEngine.miscellaneous.enumerations.length > 0 ||
            $dependenciesEngine.miscellaneous.types.length > 0) {
            actions.push(function () { return _this.prepareMiscellaneous(); });
        }
        if (!this.configuration.mainData.disableCoverage) {
            actions.push(function () { return _this.prepareCoverage(); });
        }
        if (this.configuration.mainData.includes !== '') {
            actions.push(function () { return _this.prepareExternalIncludes(); });
        }
        promiseSequential(actions)
            .then(function (res) {
            _this.processGraphs();
        })
            .catch(function (errorMessage) {
            logger.error(errorMessage);
        });
    };
    Application.prototype.prepareExternalIncludes = function () {
        var _this = this;
        logger.info('');
        logger.info('Adding external markdown files');
        //Scan include folder for files detailed in summary.json
        //For each file, add to this.configuration.mainData.additionalPages
        //Each file will be converted to html page, inside COMPODOC_DEFAULTS.additionalEntryPath
        return new Promise(function (resolve$$1, reject) {
            $fileengine.get(_this.configuration.mainData.includes + path.sep + 'summary.json').then(function (summaryData) {
                logger.info('Additional documentation: summary.json file found');
                var parsedSummaryData = JSON.parse(summaryData), i = 0, len = parsedSummaryData.length, loop = function () {
                    if (i <= len - 1) {
                        $markdownengine.get(_this.configuration.mainData.includes + path.sep + parsedSummaryData[i].file).then(function (markedData) {
                            _this.configuration.addAdditionalPage({
                                name: parsedSummaryData[i].title,
                                filename: cleanNameWithoutSpaceAndToLowerCase(parsedSummaryData[i].title),
                                context: 'additional-page',
                                path: _this.configuration.mainData.includesFolder,
                                additionalPage: markedData,
                                depth: 1,
                                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                            });
                            if (parsedSummaryData[i].children && parsedSummaryData[i].children.length > 0) {
                                var j_1 = 0, leng_1 = parsedSummaryData[i].children.length, loopChild_1 = function () {
                                    if (j_1 <= leng_1 - 1) {
                                        $markdownengine.get(_this.configuration.mainData.includes + path.sep + parsedSummaryData[i].children[j_1].file).then(function (markedData) {
                                            _this.configuration.addAdditionalPage({
                                                name: parsedSummaryData[i].children[j_1].title,
                                                filename: cleanNameWithoutSpaceAndToLowerCase(parsedSummaryData[i].children[j_1].title),
                                                context: 'additional-page',
                                                path: _this.configuration.mainData.includesFolder + '/' + cleanNameWithoutSpaceAndToLowerCase(parsedSummaryData[i].title),
                                                additionalPage: markedData,
                                                depth: 2,
                                                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                                            });
                                            j_1++;
                                            loopChild_1();
                                        }, function (e) {
                                            logger.error(e);
                                        });
                                    }
                                    else {
                                        i++;
                                        loop();
                                    }
                                };
                                loopChild_1();
                            }
                            else {
                                i++;
                                loop();
                            }
                        }, function (e) {
                            logger.error(e);
                        });
                    }
                    else {
                        resolve$$1();
                    }
                };
                loop();
            }, function (errorMessage) {
                logger.error(errorMessage);
                reject('Error during Additional documentation generation');
            });
        });
    };
    Application.prototype.prepareModules = function (someModules) {
        var _this = this;
        logger.info('');
        logger.info('Prepare modules');
        var i = 0, _modules = (someModules) ? someModules : $dependenciesEngine.getModules();
        return new Promise(function (resolve$$1, reject) {
            _this.configuration.mainData.modules = _modules.map(function (ngModule) {
                ['declarations', 'bootstrap', 'imports', 'exports'].forEach(function (metadataType) {
                    ngModule[metadataType] = ngModule[metadataType].filter(function (metaDataItem) {
                        switch (metaDataItem.type) {
                            case 'directive':
                                return $dependenciesEngine.getDirectives().some(function (directive) { return directive.name === metaDataItem.name; });
                            case 'component':
                                return $dependenciesEngine.getComponents().some(function (component) { return component.name === metaDataItem.name; });
                            case 'module':
                                return $dependenciesEngine.getModules().some(function (module) { return module.name === metaDataItem.name; });
                            case 'pipe':
                                return $dependenciesEngine.getPipes().some(function (pipe) { return pipe.name === metaDataItem.name; });
                            default:
                                return true;
                        }
                    });
                });
                ngModule.providers = ngModule.providers.filter(function (provider) {
                    return $dependenciesEngine.getInjectables().some(function (injectable) { return injectable.name === provider.name; });
                });
                return ngModule;
            });
            _this.configuration.addPage({
                name: 'modules',
                context: 'modules',
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
            var len = _this.configuration.mainData.modules.length;
            for (i; i < len; i++) {
                _this.configuration.addPage({
                    path: 'modules',
                    name: _this.configuration.mainData.modules[i].name,
                    context: 'module',
                    module: _this.configuration.mainData.modules[i],
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            resolve$$1();
        });
    };
    Application.prototype.prepareInterfaces = function (someInterfaces) {
        var _this = this;
        logger.info('');
        logger.info('Prepare interfaces');
        this.configuration.mainData.interfaces = (someInterfaces) ? someInterfaces : $dependenciesEngine.getInterfaces();
        return new Promise(function (resolve$$1, reject) {
            var i = 0, len = _this.configuration.mainData.interfaces.length;
            for (i; i < len; i++) {
                _this.configuration.addPage({
                    path: 'interfaces',
                    name: _this.configuration.mainData.interfaces[i].name,
                    context: 'interface',
                    interface: _this.configuration.mainData.interfaces[i],
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            resolve$$1();
        });
    };
    Application.prototype.prepareMiscellaneous = function (someMisc) {
        var _this = this;
        logger.info('');
        logger.info('Prepare miscellaneous');
        this.configuration.mainData.miscellaneous = (someMisc) ? someMisc : $dependenciesEngine.getMiscellaneous();
        return new Promise(function (resolve$$1, reject) {
            _this.configuration.addPage({
                name: 'miscellaneous',
                context: 'miscellaneous',
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
            resolve$$1();
        });
    };
    Application.prototype.prepareComponents = function (someComponents) {
        var _this = this;
        logger.info('');
        logger.info('Prepare components');
        this.configuration.mainData.components = (someComponents) ? someComponents : $dependenciesEngine.getComponents();
        return new Promise(function (mainResolve, reject) {
            var i = 0, len = _this.configuration.mainData.components.length, loop = function () {
                if (i <= len - 1) {
                    var dirname_1 = path.dirname(_this.configuration.mainData.components[i].file), handleTemplateurl_1 = function () {
                        return new Promise(function (resolve$$1, reject) {
                            var templatePath = path.resolve(dirname_1 + path.sep + _this.configuration.mainData.components[i].templateUrl);
                            if (fs.existsSync(templatePath)) {
                                fs.readFile(templatePath, 'utf8', function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                        reject();
                                    }
                                    else {
                                        _this.configuration.mainData.components[i].templateData = data;
                                        resolve$$1();
                                    }
                                });
                            }
                            else {
                                logger.error("Cannot read template for " + _this.configuration.mainData.components[i].name);
                            }
                        });
                    };
                    if ($markdownengine.componentHasReadmeFile(_this.configuration.mainData.components[i].file)) {
                        logger.info(_this.configuration.mainData.components[i].name + " has a README file, include it");
                        var readmeFile = $markdownengine.componentReadmeFile(_this.configuration.mainData.components[i].file);
                        fs.readFile(readmeFile, 'utf8', function (err, data) {
                            if (err)
                                throw err;
                            _this.configuration.mainData.components[i].readme = marked(data);
                            _this.configuration.addPage({
                                path: 'components',
                                name: _this.configuration.mainData.components[i].name,
                                context: 'component',
                                component: _this.configuration.mainData.components[i],
                                depth: 1,
                                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                            });
                            if (_this.configuration.mainData.components[i].templateUrl.length > 0) {
                                logger.info(_this.configuration.mainData.components[i].name + " has a templateUrl, include it");
                                handleTemplateurl_1().then(function () {
                                    i++;
                                    loop();
                                }, function (e) {
                                    logger.error(e);
                                });
                            }
                            else {
                                i++;
                                loop();
                            }
                        });
                    }
                    else {
                        _this.configuration.addPage({
                            path: 'components',
                            name: _this.configuration.mainData.components[i].name,
                            context: 'component',
                            component: _this.configuration.mainData.components[i],
                            depth: 1,
                            pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                        });
                        if (_this.configuration.mainData.components[i].templateUrl.length > 0) {
                            logger.info(_this.configuration.mainData.components[i].name + " has a templateUrl, include it");
                            handleTemplateurl_1().then(function () {
                                i++;
                                loop();
                            }, function (e) {
                                logger.error(e);
                            });
                        }
                        else {
                            i++;
                            loop();
                        }
                    }
                }
                else {
                    mainResolve();
                }
            };
            loop();
        });
    };
    Application.prototype.prepareInjectables = function (someInjectables) {
        var _this = this;
        logger.info('');
        logger.info('Prepare injectables');
        this.configuration.mainData.injectables = (someInjectables) ? someInjectables : $dependenciesEngine.getInjectables();
        return new Promise(function (resolve$$1, reject) {
            var i = 0, len = _this.configuration.mainData.injectables.length;
            for (i; i < len; i++) {
                _this.configuration.addPage({
                    path: 'injectables',
                    name: _this.configuration.mainData.injectables[i].name,
                    context: 'injectable',
                    injectable: _this.configuration.mainData.injectables[i],
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            resolve$$1();
        });
    };
    Application.prototype.prepareRoutes = function () {
        var _this = this;
        logger.info('');
        logger.info('Process routes');
        this.configuration.mainData.routes = $dependenciesEngine.getRoutes();
        return new Promise(function (resolve$$1, reject) {
            _this.configuration.addPage({
                name: 'routes',
                context: 'routes',
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
            RouterParser.generateRoutesIndex(_this.configuration.mainData.output, _this.configuration.mainData.routes).then(function () {
                logger.info('Routes index generated');
                resolve$$1();
            }, function (e) {
                logger.error(e);
                reject();
            });
        });
    };
    Application.prototype.prepareCoverage = function () {
        var _this = this;
        logger.info('');
        logger.info('Process documentation coverage report');
        return new Promise(function (resolve$$1, reject) {
            /*
             * loop with components, classes, injectables, interfaces, pipes
             */
            var files = [], totalProjectStatementDocumented = 0, getStatus = function (percent) {
                var status;
                if (percent <= 25) {
                    status = 'low';
                }
                else if (percent > 25 && percent <= 50) {
                    status = 'medium';
                }
                else if (percent > 50 && percent <= 75) {
                    status = 'good';
                }
                else {
                    status = 'good';
                }
                return status;
            };
            _.forEach(_this.configuration.mainData.components, function (component) {
                if (!component.propertiesClass ||
                    !component.methodsClass ||
                    !component.inputsClass ||
                    !component.outputsClass) {
                    return;
                }
                var cl = {
                    filePath: component.file,
                    type: component.type,
                    linktype: component.type,
                    name: component.name
                }, totalStatementDocumented = 0, totalStatements = component.propertiesClass.length + component.methodsClass.length + component.inputsClass.length + component.outputsClass.length + 1; // +1 for component decorator comment
                if (component.constructorObj) {
                    totalStatements += 1;
                    if (component.constructorObj.description !== '') {
                        totalStatementDocumented += 1;
                    }
                }
                if (component.description !== '') {
                    totalStatementDocumented += 1;
                }
                _.forEach(component.propertiesClass, function (property) {
                    if (property.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (property.description !== '' && property.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                _.forEach(component.methodsClass, function (method) {
                    if (method.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (method.description !== '' && method.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                _.forEach(component.inputsClass, function (input) {
                    if (input.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (input.description !== '' && input.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                _.forEach(component.outputsClass, function (output) {
                    if (output.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (output.description !== '' && output.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                cl.coveragePercent = Math.floor((totalStatementDocumented / totalStatements) * 100);
                if (totalStatements === 0) {
                    cl.coveragePercent = 0;
                }
                cl.coverageCount = totalStatementDocumented + '/' + totalStatements;
                cl.status = getStatus(cl.coveragePercent);
                totalProjectStatementDocumented += cl.coveragePercent;
                files.push(cl);
            });
            _.forEach(_this.configuration.mainData.classes, function (classe) {
                if (!classe.properties ||
                    !classe.methods) {
                    return;
                }
                var cl = {
                    filePath: classe.file,
                    type: 'class',
                    linktype: 'classe',
                    name: classe.name
                }, totalStatementDocumented = 0, totalStatements = classe.properties.length + classe.methods.length + 1; // +1 for class itself
                if (classe.constructorObj) {
                    totalStatements += 1;
                    if (classe.constructorObj.description !== '') {
                        totalStatementDocumented += 1;
                    }
                }
                if (classe.description !== '') {
                    totalStatementDocumented += 1;
                }
                _.forEach(classe.properties, function (property) {
                    if (property.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (property.description !== '' && property.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                _.forEach(classe.methods, function (method) {
                    if (method.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (method.description !== '' && method.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                cl.coveragePercent = Math.floor((totalStatementDocumented / totalStatements) * 100);
                if (totalStatements === 0) {
                    cl.coveragePercent = 0;
                }
                cl.coverageCount = totalStatementDocumented + '/' + totalStatements;
                cl.status = getStatus(cl.coveragePercent);
                totalProjectStatementDocumented += cl.coveragePercent;
                files.push(cl);
            });
            _.forEach(_this.configuration.mainData.injectables, function (injectable) {
                if (!injectable.properties ||
                    !injectable.methods) {
                    return;
                }
                var cl = {
                    filePath: injectable.file,
                    type: injectable.type,
                    linktype: injectable.type,
                    name: injectable.name
                }, totalStatementDocumented = 0, totalStatements = injectable.properties.length + injectable.methods.length + 1; // +1 for injectable itself
                if (injectable.constructorObj) {
                    totalStatements += 1;
                    if (injectable.constructorObj.description !== '') {
                        totalStatementDocumented += 1;
                    }
                }
                if (injectable.description !== '') {
                    totalStatementDocumented += 1;
                }
                _.forEach(injectable.properties, function (property) {
                    if (property.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (property.description !== '' && property.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                _.forEach(injectable.methods, function (method) {
                    if (method.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (method.description !== '' && method.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                cl.coveragePercent = Math.floor((totalStatementDocumented / totalStatements) * 100);
                if (totalStatements === 0) {
                    cl.coveragePercent = 0;
                }
                cl.coverageCount = totalStatementDocumented + '/' + totalStatements;
                cl.status = getStatus(cl.coveragePercent);
                totalProjectStatementDocumented += cl.coveragePercent;
                files.push(cl);
            });
            _.forEach(_this.configuration.mainData.interfaces, function (inter) {
                if (!inter.properties ||
                    !inter.methods) {
                    return;
                }
                var cl = {
                    filePath: inter.file,
                    type: inter.type,
                    linktype: inter.type,
                    name: inter.name
                }, totalStatementDocumented = 0, totalStatements = inter.properties.length + inter.methods.length + 1; // +1 for interface itself
                if (inter.constructorObj) {
                    totalStatements += 1;
                    if (inter.constructorObj.description !== '') {
                        totalStatementDocumented += 1;
                    }
                }
                if (inter.description !== '') {
                    totalStatementDocumented += 1;
                }
                _.forEach(inter.properties, function (property) {
                    if (property.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (property.description !== '' && property.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                _.forEach(inter.methods, function (method) {
                    if (method.modifierKind === 111) {
                        totalStatements -= 1;
                    }
                    if (method.description !== '' && method.modifierKind !== 111) {
                        totalStatementDocumented += 1;
                    }
                });
                cl.coveragePercent = Math.floor((totalStatementDocumented / totalStatements) * 100);
                if (totalStatements === 0) {
                    cl.coveragePercent = 0;
                }
                cl.coverageCount = totalStatementDocumented + '/' + totalStatements;
                cl.status = getStatus(cl.coveragePercent);
                totalProjectStatementDocumented += cl.coveragePercent;
                files.push(cl);
            });
            _.forEach(_this.configuration.mainData.pipes, function (pipe) {
                var cl = {
                    filePath: pipe.file,
                    type: pipe.type,
                    linktype: pipe.type,
                    name: pipe.name
                }, totalStatementDocumented = 0, totalStatements = 1;
                if (pipe.description !== '') {
                    totalStatementDocumented += 1;
                }
                cl.coveragePercent = Math.floor((totalStatementDocumented / totalStatements) * 100);
                cl.coverageCount = totalStatementDocumented + '/' + totalStatements;
                cl.status = getStatus(cl.coveragePercent);
                totalProjectStatementDocumented += cl.coveragePercent;
                files.push(cl);
            });
            files = _.sortBy(files, ['filePath']);
            var coverageData = {
                count: (files.length > 0) ? Math.floor(totalProjectStatementDocumented / files.length) : 0,
                status: ''
            };
            coverageData.status = getStatus(coverageData.count);
            _this.configuration.addPage({
                name: 'coverage',
                context: 'coverage',
                files: files,
                data: coverageData,
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
            $htmlengine.generateCoverageBadge(_this.configuration.mainData.output, coverageData);
            if (_this.configuration.mainData.coverageTest) {
                if (coverageData.count >= _this.configuration.mainData.coverageTestThreshold) {
                    logger.info('Documentation coverage is over threshold');
                    process.exit(0);
                }
                else {
                    logger.error('Documentation coverage is not over threshold');
                    process.exit(1);
                }
            }
            else {
                resolve$$1();
            }
        });
    };
    Application.prototype.processPages = function () {
        var _this = this;
        logger.info('');
        logger.info('Process pages');
        var pages = this.configuration.pages, i = 0, len = pages.length, loop = function () {
            if (i <= len - 1) {
                logger.info('Process page', pages[i].name);
                $htmlengine.render(_this.configuration.mainData, pages[i]).then(function (htmlData) {
                    var finalPath = _this.configuration.mainData.output;
                    if (_this.configuration.mainData.output.lastIndexOf('/') === -1) {
                        finalPath += '/';
                    }
                    if (pages[i].path) {
                        finalPath += pages[i].path + '/';
                    }
                    finalPath += pages[i].name + '.html';
                    $searchEngine.indexPage({
                        infos: pages[i],
                        rawData: htmlData,
                        url: finalPath
                    });
                    fs.outputFile(path.resolve(finalPath), htmlData, function (err) {
                        if (err) {
                            logger.error('Error during ' + pages[i].name + ' page generation');
                        }
                        else {
                            i++;
                            loop();
                        }
                    });
                }, function (errorMessage) {
                    logger.error(errorMessage);
                });
            }
            else {
                $searchEngine.generateSearchIndexJson(_this.configuration.mainData.output).then(function () {
                    if (_this.configuration.mainData.additionalPages.length > 0) {
                        _this.processAdditionalPages();
                    }
                    else {
                        if (_this.configuration.mainData.assetsFolder !== '') {
                            _this.processAssetsFolder();
                        }
                        _this.processResources();
                    }
                }, function (e) {
                    logger.error(e);
                });
            }
        };
        loop();
    };
    Application.prototype.processAdditionalPages = function () {
        var _this = this;
        logger.info('');
        logger.info('Process additional pages');
        var pages = this.configuration.mainData.additionalPages, i = 0, len = pages.length, loop = function () {
            if (i <= len - 1) {
                logger.info('Process page', pages[i].name);
                $htmlengine.render(_this.configuration.mainData, pages[i]).then(function (htmlData) {
                    var finalPath = _this.configuration.mainData.output;
                    if (_this.configuration.mainData.output.lastIndexOf('/') === -1) {
                        finalPath += '/';
                    }
                    if (pages[i].path) {
                        finalPath += pages[i].path + '/';
                    }
                    finalPath += pages[i].filename + '.html';
                    $searchEngine.indexPage({
                        infos: pages[i],
                        rawData: htmlData,
                        url: finalPath
                    });
                    fs.outputFile(path.resolve(finalPath), htmlData, function (err) {
                        if (err) {
                            logger.error('Error during ' + pages[i].name + ' page generation');
                        }
                        else {
                            i++;
                            loop();
                        }
                    });
                }, function (errorMessage) {
                    logger.error(errorMessage);
                });
            }
            else {
                $searchEngine.generateSearchIndexJson(_this.configuration.mainData.output).then(function () {
                    if (_this.configuration.mainData.assetsFolder !== '') {
                        _this.processAssetsFolder();
                    }
                    _this.processResources();
                }, function (e) {
                    logger.error(e);
                });
            }
        };
        loop();
    };
    Application.prototype.processAssetsFolder = function () {
        logger.info('');
        logger.info('Copy assets folder');
        if (!fs.existsSync(this.configuration.mainData.assetsFolder)) {
            logger.error("Provided assets folder " + this.configuration.mainData.assetsFolder + " did not exist");
        }
        else {
            fs.copy(path.resolve(this.configuration.mainData.assetsFolder), path.resolve(process.cwd() + path.sep + this.configuration.mainData.output + path.sep + this.configuration.mainData.assetsFolder), function (err) {
                if (err) {
                    logger.error('Error during resources copy ', err);
                }
            });
        }
    };
    Application.prototype.processResources = function () {
        var _this = this;
        logger.info('');
        logger.info('Copy main resources');
        var onComplete = function () {
            var finalTime = (new Date() - startTime) / 1000;
            logger.info('');
            logger.info('Documentation generated in ' + _this.configuration.mainData.output + ' in ' + finalTime + ' seconds using ' + _this.configuration.mainData.theme + ' theme');
            if (_this.configuration.mainData.serve) {
                logger.info("Serving documentation from " + _this.configuration.mainData.output + " at http://127.0.0.1:" + _this.configuration.mainData.port);
                _this.runWebServer(_this.configuration.mainData.output);
            }
        };
        var finalOutput = this.configuration.mainData.output.replace(process.cwd(), '');
        fs.copy(path.resolve(__dirname + '/../src/resources/'), path.resolve(process.cwd() + path.sep + finalOutput), function (err) {
            if (err) {
                logger.error('Error during resources copy ', err);
            }
            else {
                if (_this.configuration.mainData.extTheme) {
                    fs.copy(path.resolve(process.cwd() + path.sep + _this.configuration.mainData.extTheme), path.resolve(process.cwd() + path.sep + finalOutput + '/styles/'), function (err) {
                        if (err) {
                            logger.error('Error during external styling theme copy ', err);
                        }
                        else {
                            logger.info('External styling theme copy succeeded');
                            onComplete();
                        }
                    });
                }
                else {
                    onComplete();
                }
            }
        });
    };
    Application.prototype.processGraphs = function () {
        var _this = this;
        if (this.configuration.mainData.disableGraph) {
            logger.info('');
            logger.info('Graph generation disabled');
            this.processPages();
        }
        else {
            logger.info('');
            logger.info('Process main graph');
            logger.info('');
            var modules_1 = this.configuration.mainData.modules, i_1 = 0, len_1 = modules_1.length, loop_1 = function () {
                if (i_1 <= len_1 - 1) {
                    logger.info('Process module graph', modules_1[i_1].name);
                    var finalPath_1 = _this.configuration.mainData.output;
                    if (_this.configuration.mainData.output.lastIndexOf('/') === -1) {
                        finalPath_1 += '/';
                    }
                    finalPath_1 += 'modules/' + modules_1[i_1].name;
                    $ngdengine.renderGraph(modules_1[i_1].file, finalPath_1, 'f', modules_1[i_1].name).then(function () {
                        $ngdengine.readGraph(path.resolve(finalPath_1 + path.sep + 'dependencies.svg'), modules_1[i_1].name).then(function (data) {
                            modules_1[i_1].graph = data;
                            i_1++;
                            loop_1();
                        }, function (err) {
                            logger.error('Error during graph read: ', err);
                        });
                    }, function (errorMessage) {
                        logger.error(errorMessage);
                    });
                }
                else {
                    _this.processPages();
                }
            };
            var finalMainGraphPath_1 = this.configuration.mainData.output;
            if (finalMainGraphPath_1.lastIndexOf('/') === -1) {
                finalMainGraphPath_1 += '/';
            }
            finalMainGraphPath_1 += 'graph';
            $ngdengine.renderGraph(this.configuration.mainData.tsconfig, path.resolve(finalMainGraphPath_1), 'p').then(function () {
                $ngdengine.readGraph(path.resolve(finalMainGraphPath_1 + path.sep + 'dependencies.svg'), 'Main graph').then(function (data) {
                    _this.configuration.mainData.mainGraph = data;
                    loop_1();
                }, function (err) {
                    logger.error('Error during graph read: ', err);
                });
            }, function (err) {
                logger.error('Error during graph generation: ', err);
            });
        }
    };
    Application.prototype.runWebServer = function (folder) {
        if (!this.isWatching) {
            LiveServer.start({
                root: folder,
                open: this.configuration.mainData.open,
                quiet: true,
                logLevel: 0,
                wait: 1000,
                port: this.configuration.mainData.port
            });
        }
        if (this.configuration.mainData.watch && !this.isWatching) {
            this.runWatch();
        }
        else if (this.configuration.mainData.watch && this.isWatching) {
            var srcFolder = findMainSourceFolder(this.files);
            logger.info('');
            logger.info("Already watching sources in " + srcFolder + " folder");
        }
    };
    Application.prototype.runWatch = function () {
        var _this = this;
        var srcFolder = findMainSourceFolder(this.files), watchChangedFiles = [];
        this.isWatching = true;
        logger.info('');
        logger.info("Watching sources in " + srcFolder + " folder");
        var watcher = chokidar.watch(srcFolder, {
            awaitWriteFinish: true,
            ignored: /(spec|\.d)\.ts/
        }), timerAddAndRemoveRef, timerChangeRef, waiterAddAndRemove = function () {
            clearTimeout(timerAddAndRemoveRef);
            timerAddAndRemoveRef = setTimeout(runnerAddAndRemove, 1000);
        }, runnerAddAndRemove = function () {
            _this.generate();
        }, waiterChange = function () {
            clearTimeout(timerChangeRef);
            timerChangeRef = setTimeout(runnerChange, 1000);
        }, runnerChange = function () {
            _this.setUpdatedFiles(watchChangedFiles);
            if (_this.hasWatchedFilesTSFiles()) {
                _this.getMicroDependenciesData();
            }
            else {
                _this.rebuildExternalDocumentation();
            }
        };
        if (this.configuration.mainData.includes !== '') {
            watcher.add(this.configuration.mainData.includes);
        }
        watcher
            .on('ready', function () {
            watcher
                .on('add', function (file) {
                logger.debug("File " + file + " has been added");
                // Test extension, if ts
                // rescan everything
                if (path.extname(file) === '.ts') {
                    waiterAddAndRemove();
                }
            })
                .on('change', function (file) {
                logger.debug("File " + file + " has been changed");
                // Test extension, if ts
                // rescan only file
                if (path.extname(file) === '.ts') {
                    watchChangedFiles.push(path.join(process.cwd() + path.sep + file));
                    waiterChange();
                }
                if (path.extname(file) === '.md' || path.extname(file) === '.json') {
                    watchChangedFiles.push(path.join(process.cwd() + path.sep + file));
                    waiterChange();
                }
            })
                .on('unlink', function (file) {
                logger.debug("File " + file + " has been removed");
                // Test extension, if ts
                // rescan everything
                if (path.extname(file) === '.ts') {
                    waiterAddAndRemove();
                }
            });
        });
    };
    Object.defineProperty(Application.prototype, "application", {
        /**
         * Return the application / root component instance.
         */
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Application.prototype, "isCLI", {
        get: function () {
            return false;
        },
        enumerable: true,
        configurable: true
    });
    return Application;
}());

var pkg$2 = require('../package.json');
var program = require('commander');
var glob$1 = require('glob');
var os = require('os');
var osName = require('os-name');
var files = [];
var cwd$1 = process.cwd();
process.setMaxListeners(0);
var CliApplication = (function (_super) {
    __extends(CliApplication, _super);
    function CliApplication() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Run compodoc from the command line.
     */
    CliApplication.prototype.generate = function () {
        function list(val) {
            return val.split(',');
        }
        program
            .version(pkg$2.version)
            .usage('<src> [options]')
            .option('-p, --tsconfig [config]', 'A tsconfig.json file')
            .option('-d, --output [folder]', 'Where to store the generated documentation (default: ./documentation)', COMPODOC_DEFAULTS.folder)
            .option('-y, --extTheme [file]', 'External styling theme file')
            .option('-n, --name [name]', 'Title documentation', COMPODOC_DEFAULTS.title)
            .option('-a, --assetsFolder [folder]', 'External assets folder to copy in generated documentation folder')
            .option('-o, --open', 'Open the generated documentation', false)
            .option('-t, --silent', 'In silent mode, log messages aren\'t logged in the console', false)
            .option('-s, --serve', 'Serve generated documentation (default http://localhost:8080/)', false)
            .option('-r, --port [port]', 'Change default serving port', COMPODOC_DEFAULTS.port)
            .option('-w, --watch', 'Watch source files after serve and force documentation rebuild', false)
            .option('--theme [theme]', 'Choose one of available themes, default is \'gitbook\' (laravel, original, postmark, readthedocs, stripe, vagrant)')
            .option('--hideGenerator', 'Do not print the Compodoc link at the bottom of the page', false)
            .option('--toggleMenuItems <items>', 'Close by default items in the menu example: \'all\' or \'modules\',\'components\',\'directives\',\'classes\',\'injectables\',\'interfaces\',\'pipes\',\'additionalPages\'', list)
            .option('--includes [path]', 'Path of external markdown files to include')
            .option('--includesName [name]', 'Name of item menu of externals markdown files (default "Additional documentation")', COMPODOC_DEFAULTS.additionalEntryName)
            .option('--coverageTest [threshold]', 'Test command of documentation coverage with a threshold (default 70)')
            .option('--disableSourceCode', 'Do not add source code tab', false)
            .option('--disableGraph', 'Do not add the dependency graph', false)
            .option('--disableCoverage', 'Do not add the documentation coverage report', false)
            .option('--disablePrivateOrInternalSupport', 'Do not show private or @internal in generated documentation', false)
            .parse(process.argv);
        var outputHelp = function () {
            program.outputHelp();
            process.exit(1);
        };
        if (program.output) {
            this.configuration.mainData.output = program.output;
        }
        if (program.extTheme) {
            this.configuration.mainData.extTheme = program.extTheme;
        }
        if (program.theme) {
            this.configuration.mainData.theme = program.theme;
        }
        if (program.name) {
            this.configuration.mainData.documentationMainName = program.name;
        }
        if (program.assetsFolder) {
            this.configuration.mainData.assetsFolder = program.assetsFolder;
        }
        if (program.open) {
            this.configuration.mainData.open = program.open;
        }
        if (program.toggleMenuItems) {
            this.configuration.mainData.toggleMenuItems = program.toggleMenuItems;
        }
        if (program.includes) {
            this.configuration.mainData.includes = program.includes;
        }
        if (program.includesName) {
            this.configuration.mainData.includesName = program.includesName;
        }
        if (program.silent) {
            logger.silent = false;
        }
        if (program.serve) {
            this.configuration.mainData.serve = program.serve;
        }
        if (program.port) {
            this.configuration.mainData.port = program.port;
        }
        if (program.watch) {
            this.configuration.mainData.watch = program.watch;
        }
        if (program.hideGenerator) {
            this.configuration.mainData.hideGenerator = program.hideGenerator;
        }
        if (program.includes) {
            this.configuration.mainData.includes = program.includes;
        }
        if (program.includesName) {
            this.configuration.mainData.includesName = program.includesName;
        }
        if (program.coverageTest) {
            this.configuration.mainData.coverageTest = true;
            this.configuration.mainData.coverageTestThreshold = (typeof program.coverageTest === 'string') ? parseInt(program.coverageTest) : COMPODOC_DEFAULTS.defaultCoverageThreshold;
        }
        if (program.disableSourceCode) {
            this.configuration.mainData.disableSourceCode = program.disableSourceCode;
        }
        if (program.disableGraph) {
            this.configuration.mainData.disableGraph = program.disableGraph;
        }
        if (program.disableCoverage) {
            this.configuration.mainData.disableCoverage = program.disableCoverage;
        }
        if (program.disablePrivateOrInternalSupport) {
            this.configuration.mainData.disablePrivateOrInternalSupport = program.disablePrivateOrInternalSupport;
        }
        if (!this.isWatching) {
            console.log(fs.readFileSync(path.join(__dirname, '../src/resources/images/banner')).toString());
            console.log(pkg$2.version);
            console.log('');
            console.log("Node.js version : " + process.version);
            console.log('');
            console.log("Operating system : " + osName(os.platform(), os.release()));
            console.log('');
        }
        if (program.serve && !program.tsconfig && program.output) {
            // if -s & -d, serve it
            if (!fs.existsSync(program.output)) {
                logger.error(program.output + " folder doesn't exist");
                process.exit(1);
            }
            else {
                logger.info("Serving documentation from " + program.output + " at http://127.0.0.1:" + program.port);
                _super.prototype.runWebServer.call(this, program.output);
            }
        }
        else if (program.serve && !program.tsconfig && !program.output) {
            // if only -s find ./documentation, if ok serve, else error provide -d
            if (!fs.existsSync(program.output)) {
                logger.error('Provide output generated folder with -d flag');
                process.exit(1);
            }
            else {
                logger.info("Serving documentation from " + program.output + " at http://127.0.0.1:" + program.port);
                _super.prototype.runWebServer.call(this, program.output);
            }
        }
        else {
            if (program.hideGenerator) {
                this.configuration.mainData.hideGenerator = true;
            }
            var defaultWalkFOlder = cwd$1 || '.', walk_1 = function (dir, exclude) {
                var results = [];
                var list = fs.readdirSync(dir);
                list.forEach(function (file) {
                    var excludeTest = _.find(exclude, function (o) {
                        var globFiles = glob$1.sync(o, {
                            cwd: cwd$1
                        });
                        if (globFiles.length > 0) {
                            var fileNameForGlobSearch_1 = path.join(dir, file).replace(cwd$1 + path.sep, ''), resultGlobSearch = globFiles.findIndex(function (element) {
                                return element === fileNameForGlobSearch_1;
                            }), test = resultGlobSearch !== -1;
                            if (test) {
                                logger.warn('Excluding', path.join(dir, file));
                            }
                            return test;
                        }
                        else {
                            var test = path.basename(o) === file;
                            if (test) {
                                logger.warn('Excluding', path.join(dir, file));
                            }
                            return test;
                        }
                    });
                    if (typeof excludeTest === 'undefined' && dir.indexOf('node_modules') < 0) {
                        file = path.join(dir, file);
                        var stat = fs.statSync(file);
                        if (stat && stat.isDirectory()) {
                            results = results.concat(walk_1(file, exclude));
                        }
                        else if (/(spec|\.d)\.ts/.test(file)) {
                            logger.warn('Ignoring', file);
                        }
                        else if (path.extname(file) === '.ts') {
                            logger.debug('Including', file);
                            results.push(file);
                        }
                    }
                });
                return results;
            };
            if (program.tsconfig && program.args.length === 0) {
                this.configuration.mainData.tsconfig = program.tsconfig;
                if (!fs.existsSync(program.tsconfig)) {
                    logger.error("\"" + program.tsconfig + "\" file was not found in the current directory");
                    process.exit(1);
                }
                else {
                    var _file = path.join(path.join(process.cwd(), path.dirname(this.configuration.mainData.tsconfig)), path.basename(this.configuration.mainData.tsconfig));
                    // use the current directory of tsconfig.json as a working directory
                    cwd$1 = _file.split(path.sep).slice(0, -1).join(path.sep);
                    logger.info('Using tsconfig', _file);
                    var tsConfigFile = readConfig(_file);
                    files = tsConfigFile.files;
                    if (files) {
                        files = handlePath(files, cwd$1);
                    }
                    if (!files) {
                        var exclude = tsConfigFile.exclude || [];
                        files = walk_1(cwd$1 || '.', exclude);
                    }
                    _super.prototype.setFiles.call(this, files);
                    _super.prototype.generate.call(this);
                }
            }
            else if (program.tsconfig && program.args.length > 0 && program.coverageTest) {
                logger.info('Run documentation coverage test');
                this.configuration.mainData.tsconfig = program.tsconfig;
                if (!fs.existsSync(program.tsconfig)) {
                    logger.error("\"" + program.tsconfig + "\" file was not found in the current directory");
                    process.exit(1);
                }
                else {
                    var _file = path.join(path.join(process.cwd(), path.dirname(this.configuration.mainData.tsconfig)), path.basename(this.configuration.mainData.tsconfig));
                    // use the current directory of tsconfig.json as a working directory
                    cwd$1 = _file.split(path.sep).slice(0, -1).join(path.sep);
                    logger.info('Using tsconfig', _file);
                    var tsConfigFile = readConfig(_file);
                    files = tsConfigFile.files;
                    if (files) {
                        files = handlePath(files, cwd$1);
                    }
                    if (!files) {
                        var exclude = tsConfigFile.exclude || [];
                        files = walk_1(cwd$1 || '.', exclude);
                    }
                    _super.prototype.setFiles.call(this, files);
                    _super.prototype.testCoverage.call(this);
                }
            }
            else if (program.tsconfig && program.args.length > 0) {
                this.configuration.mainData.tsconfig = program.tsconfig;
                var sourceFolder = program.args[0];
                if (!fs.existsSync(sourceFolder)) {
                    logger.error("Provided source folder " + sourceFolder + " was not found in the current directory");
                    process.exit(1);
                }
                else {
                    logger.info('Using provided source folder');
                    files = walk_1(path.resolve(sourceFolder), []);
                    _super.prototype.setFiles.call(this, files);
                    _super.prototype.generate.call(this);
                }
            }
            else {
                logger.error('tsconfig.json file was not found, please use -p flag');
                outputHelp();
            }
        }
    };
    return CliApplication;
}(Application));

exports.Application = Application;
exports.CliApplication = CliApplication;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9sb2dnZXIudHMiLCIuLi9zcmMvdXRpbHMvYW5ndWxhci1hcGkudHMiLCIuLi9zcmMvYXBwL2VuZ2luZXMvZGVwZW5kZW5jaWVzLmVuZ2luZS50cyIsIi4uL3NyYy91dGlscy9saW5rLXBhcnNlci50cyIsIi4uL3NyYy91dGlscy9kZWZhdWx0cy50cyIsIi4uL3NyYy9hcHAvY29uZmlndXJhdGlvbi50cyIsIi4uL3NyYy9hcHAvZW5naW5lcy9odG1sLmVuZ2luZS5oZWxwZXJzLnRzIiwiLi4vc3JjL2FwcC9lbmdpbmVzL2h0bWwuZW5naW5lLnRzIiwiLi4vc3JjL2FwcC9lbmdpbmVzL21hcmtkb3duLmVuZ2luZS50cyIsIi4uL3NyYy9hcHAvZW5naW5lcy9maWxlLmVuZ2luZS50cyIsIi4uL3NyYy9hcHAvZW5naW5lcy9uZ2QuZW5naW5lLnRzIiwiLi4vc3JjL2FwcC9lbmdpbmVzL3NlYXJjaC5lbmdpbmUudHMiLCIuLi9zcmMvdXRpbGl0aWVzLnRzIiwiLi4vc3JjL3V0aWxzL3JvdXRlci5wYXJzZXIudHMiLCIuLi9zcmMvdXRpbHMvanNkb2MucGFyc2VyLnRzIiwiLi4vc3JjL2FwcC9jb21waWxlci9jb2RlZ2VuLnRzIiwiLi4vc3JjL3V0aWxzL3V0aWxzLnRzIiwiLi4vc3JjL2FwcC9lbmdpbmVzL2NvbXBvbmVudHMtdHJlZS5lbmdpbmUudHMiLCIuLi9zcmMvYXBwL2NvbXBpbGVyL2RlcGVuZGVuY2llcy50cyIsIi4uL3NyYy91dGlscy9wcm9taXNlLXNlcXVlbnRpYWwudHMiLCIuLi9zcmMvYXBwL2FwcGxpY2F0aW9uLnRzIiwiLi4vc3JjL2luZGV4LWNsaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgZ3V0aWwgPSByZXF1aXJlKCdndWxwLXV0aWwnKVxubGV0IGMgPSBndXRpbC5jb2xvcnM7XG5sZXQgcGtnID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyk7XG5cbmVudW0gTEVWRUwge1xuXHRJTkZPLFxuXHRERUJVRyxcbiAgICBFUlJPUixcbiAgICBXQVJOXG59XG5cbmNsYXNzIExvZ2dlciB7XG5cblx0bmFtZTtcblx0bG9nZ2VyO1xuXHR2ZXJzaW9uO1xuXHRzaWxlbnQ7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5uYW1lID0gcGtnLm5hbWU7XG5cdFx0dGhpcy52ZXJzaW9uID0gcGtnLnZlcnNpb247XG5cdFx0dGhpcy5sb2dnZXIgPSBndXRpbC5sb2c7XG5cdFx0dGhpcy5zaWxlbnQgPSB0cnVlO1xuXHR9XG5cblx0aW5mbyguLi5hcmdzKSB7XG5cdFx0aWYoIXRoaXMuc2lsZW50KSByZXR1cm47XG5cdFx0dGhpcy5sb2dnZXIoXG5cdFx0XHR0aGlzLmZvcm1hdChMRVZFTC5JTkZPLCAuLi5hcmdzKVxuXHRcdCk7XG5cdH1cblxuXHRlcnJvciguLi5hcmdzKSB7XG5cdFx0aWYoIXRoaXMuc2lsZW50KSByZXR1cm47XG5cdFx0dGhpcy5sb2dnZXIoXG5cdFx0XHR0aGlzLmZvcm1hdChMRVZFTC5FUlJPUiwgLi4uYXJncylcblx0XHQpO1xuXHR9XG5cbiAgICB3YXJuKC4uLmFyZ3MpIHtcblx0XHRpZighdGhpcy5zaWxlbnQpIHJldHVybjtcblx0XHR0aGlzLmxvZ2dlcihcblx0XHRcdHRoaXMuZm9ybWF0KExFVkVMLldBUk4sIC4uLmFyZ3MpXG5cdFx0KTtcblx0fVxuXG5cdGRlYnVnKC4uLmFyZ3MpIHtcblx0XHRpZighdGhpcy5zaWxlbnQpIHJldHVybjtcblx0XHR0aGlzLmxvZ2dlcihcblx0XHRcdHRoaXMuZm9ybWF0KExFVkVMLkRFQlVHLCAuLi5hcmdzKVxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIGZvcm1hdChsZXZlbCwgLi4uYXJncykge1xuXG5cdFx0bGV0IHBhZCA9IChzLCBsLCBjPScnKSA9PiB7XG5cdFx0XHRyZXR1cm4gcyArIEFycmF5KCBNYXRoLm1heCgwLCBsIC0gcy5sZW5ndGggKyAxKSkuam9pbiggYyApXG5cdFx0fTtcblxuXHRcdGxldCBtc2cgPSBhcmdzLmpvaW4oJyAnKTtcblx0XHRpZihhcmdzLmxlbmd0aCA+IDEpIHtcblx0XHRcdG1zZyA9IGAkeyBwYWQoYXJncy5zaGlmdCgpLCAxNSwgJyAnKSB9OiAkeyBhcmdzLmpvaW4oJyAnKSB9YDtcblx0XHR9XG5cblxuXHRcdHN3aXRjaChsZXZlbCkge1xuXHRcdFx0Y2FzZSBMRVZFTC5JTkZPOlxuXHRcdFx0XHRtc2cgPSBjLmdyZWVuKG1zZyk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIExFVkVMLkRFQlVHOlxuXHRcdFx0XHRtc2cgPSBjLmN5YW4obXNnKTtcblx0XHRcdFx0YnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgTEVWRUwuV0FSTjpcblx0XHRcdFx0bXNnID0gYy55ZWxsb3cobXNnKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgTEVWRUwuRVJST1I6XG5cdFx0XHRcdG1zZyA9IGMucmVkKG1zZyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXG5cdFx0XHRtc2dcblx0XHRdLmpvaW4oJycpO1xuXHR9XG59XG5cbmV4cG9ydCBsZXQgbG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuIiwiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuXG5sZXQgQW5ndWxhckFQSXMgPSByZXF1aXJlKCcuLi9zcmMvZGF0YS9hcGktbGlzdC5qc29uJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kZXJJbkFuZ3VsYXJBUElzKHR5cGU6IHN0cmluZykge1xuICAgIGxldCBfcmVzdWx0ID0ge1xuICAgICAgICBzb3VyY2U6ICdleHRlcm5hbCcsXG4gICAgICAgIGRhdGE6IG51bGxcbiAgICB9O1xuXG4gICAgXy5mb3JFYWNoKEFuZ3VsYXJBUElzLCBmdW5jdGlvbihhbmd1bGFyTW9kdWxlQVBJcywgYW5ndWxhck1vZHVsZSkge1xuICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICBsZW4gPSBhbmd1bGFyTW9kdWxlQVBJcy5sZW5ndGg7XG4gICAgICAgIGZvciAoaTsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKGFuZ3VsYXJNb2R1bGVBUElzW2ldLnRpdGxlID09PSB0eXBlKSB7XG4gICAgICAgICAgICAgICAgX3Jlc3VsdC5kYXRhID0gYW5ndWxhck1vZHVsZUFQSXNbaV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIF9yZXN1bHQ7XG59XG4iLCJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7IGZpbmRlckluQW5ndWxhckFQSXMgfSBmcm9tICcuLi8uLi91dGlscy9hbmd1bGFyLWFwaSc7XG5cbmltcG9ydCB7IFBhcnNlZERhdGEgfSBmcm9tICcuLi9pbnRlcmZhY2VzL3BhcnNlZC1kYXRhLmludGVyZmFjZSc7XG5pbXBvcnQgeyBNaXNjZWxsYW5lb3VzRGF0YSB9IGZyb20gJy4uL2ludGVyZmFjZXMvbWlzY2VsbGFuZW91cy1kYXRhLmludGVyZmFjZSc7XG5cbmNsYXNzIERlcGVuZGVuY2llc0VuZ2luZSB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgX2luc3RhbmNlOkRlcGVuZGVuY2llc0VuZ2luZSA9IG5ldyBEZXBlbmRlbmNpZXNFbmdpbmUoKTtcblxuICAgIHJhd0RhdGE6IFBhcnNlZERhdGE7XG4gICAgbW9kdWxlczogT2JqZWN0W107XG4gICAgcmF3TW9kdWxlczogT2JqZWN0W107XG4gICAgcmF3TW9kdWxlc0Zvck92ZXJ2aWV3OiBPYmplY3RbXTtcbiAgICBjb21wb25lbnRzOiBPYmplY3RbXTtcbiAgICBkaXJlY3RpdmVzOiBPYmplY3RbXTtcbiAgICBpbmplY3RhYmxlczogT2JqZWN0W107XG4gICAgaW50ZXJmYWNlczogT2JqZWN0W107XG4gICAgcm91dGVzOiBPYmplY3RbXTtcbiAgICBwaXBlczogT2JqZWN0W107XG4gICAgY2xhc3NlczogT2JqZWN0W107XG4gICAgbWlzY2VsbGFuZW91czogTWlzY2VsbGFuZW91c0RhdGE7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgaWYoRGVwZW5kZW5jaWVzRW5naW5lLl9pbnN0YW5jZSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yOiBJbnN0YW50aWF0aW9uIGZhaWxlZDogVXNlIERlcGVuZGVuY2llc0VuZ2luZS5nZXRJbnN0YW5jZSgpIGluc3RlYWQgb2YgbmV3LicpO1xuICAgICAgICB9XG4gICAgICAgIERlcGVuZGVuY2llc0VuZ2luZS5faW5zdGFuY2UgPSB0aGlzO1xuICAgIH1cbiAgICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKCk6RGVwZW5kZW5jaWVzRW5naW5lXG4gICAge1xuICAgICAgICByZXR1cm4gRGVwZW5kZW5jaWVzRW5naW5lLl9pbnN0YW5jZTtcbiAgICB9XG4gICAgY2xlYW5Nb2R1bGVzKG1vZHVsZXMpIHtcbiAgICAgICAgbGV0IF9tID0gbW9kdWxlcyxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgbGVuID0gbW9kdWxlcy5sZW5ndGg7XG4gICAgICAgIGZvcihpOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgaiA9IDAsXG4gICAgICAgICAgICAgICAgbGVuZyA9IF9tW2ldLmRlY2xhcmF0aW9ucy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IoajsgajxsZW5nOyBqKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgayA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0O1xuICAgICAgICAgICAgICAgIGlmIChfbVtpXS5kZWNsYXJhdGlvbnNbal0uanNkb2N0YWdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlbmd0ID0gX21baV0uZGVjbGFyYXRpb25zW2pdLmpzZG9jdGFncy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGZvcihrOyBrPGxlbmd0OyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBfbVtpXS5kZWNsYXJhdGlvbnNbal0uanNkb2N0YWdzW2tdLnBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX207XG4gICAgfVxuICAgIGluaXQoZGF0YTogUGFyc2VkRGF0YSkge1xuICAgICAgICB0aGlzLnJhd0RhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLm1vZHVsZXMgPSBfLnNvcnRCeSh0aGlzLnJhd0RhdGEubW9kdWxlcywgWyduYW1lJ10pO1xuICAgICAgICB0aGlzLnJhd01vZHVsZXNGb3JPdmVydmlldyA9IF8uc29ydEJ5KF8uY2xvbmVEZWVwKHRoaXMuY2xlYW5Nb2R1bGVzKGRhdGEubW9kdWxlcykpLCBbJ25hbWUnXSk7XG4gICAgICAgIHRoaXMucmF3TW9kdWxlcyA9IF8uc29ydEJ5KF8uY2xvbmVEZWVwKHRoaXMuY2xlYW5Nb2R1bGVzKGRhdGEubW9kdWxlcykpLCBbJ25hbWUnXSk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IF8uc29ydEJ5KHRoaXMucmF3RGF0YS5jb21wb25lbnRzLCBbJ25hbWUnXSk7XG4gICAgICAgIHRoaXMuZGlyZWN0aXZlcyA9IF8uc29ydEJ5KHRoaXMucmF3RGF0YS5kaXJlY3RpdmVzLCBbJ25hbWUnXSk7XG4gICAgICAgIHRoaXMuaW5qZWN0YWJsZXMgPSBfLnNvcnRCeSh0aGlzLnJhd0RhdGEuaW5qZWN0YWJsZXMsIFsnbmFtZSddKTtcbiAgICAgICAgdGhpcy5pbnRlcmZhY2VzID0gXy5zb3J0QnkodGhpcy5yYXdEYXRhLmludGVyZmFjZXMsIFsnbmFtZSddKTtcbiAgICAgICAgdGhpcy5waXBlcyA9IF8uc29ydEJ5KHRoaXMucmF3RGF0YS5waXBlcywgWyduYW1lJ10pO1xuICAgICAgICB0aGlzLmNsYXNzZXMgPSBfLnNvcnRCeSh0aGlzLnJhd0RhdGEuY2xhc3NlcywgWyduYW1lJ10pO1xuICAgICAgICB0aGlzLm1pc2NlbGxhbmVvdXMgPSB0aGlzLnJhd0RhdGEubWlzY2VsbGFuZW91cztcbiAgICAgICAgdGhpcy5wcmVwYXJlTWlzY2VsbGFuZW91cygpO1xuICAgICAgICB0aGlzLnJvdXRlcyA9IHRoaXMucmF3RGF0YS5yb3V0ZXNUcmVlO1xuICAgICAgICB0aGlzLmNsZWFuUmF3TW9kdWxlc0Zvck92ZXJ2aWV3KCk7XG4gICAgfVxuICAgIGZpbmQodHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGxldCBmaW5kZXJJbkNvbXBvZG9jRGVwZW5kZW5jaWVzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgbGV0IF9yZXN1bHQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ2ludGVybmFsJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogbnVsbFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlLmluZGV4T2YoZGF0YVtpXS5uYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9yZXN1bHQuZGF0YSA9IGRhdGFbaV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfcmVzdWx0O1xuICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdWx0SW5Db21wb2RvY0luamVjdGFibGVzID0gZmluZGVySW5Db21wb2RvY0RlcGVuZGVuY2llcyh0aGlzLmluamVjdGFibGVzKSxcbiAgICAgICAgICAgIHJlc3VsdEluQ29tcG9kb2NJbnRlcmZhY2VzID0gZmluZGVySW5Db21wb2RvY0RlcGVuZGVuY2llcyh0aGlzLmludGVyZmFjZXMpLFxuICAgICAgICAgICAgcmVzdWx0SW5Db21wb2RvY0NsYXNzZXMgPSBmaW5kZXJJbkNvbXBvZG9jRGVwZW5kZW5jaWVzKHRoaXMuY2xhc3NlcyksXG4gICAgICAgICAgICByZXN1bHRJbkNvbXBvZG9jQ29tcG9uZW50cyA9IGZpbmRlckluQ29tcG9kb2NEZXBlbmRlbmNpZXModGhpcy5jb21wb25lbnRzKSxcbiAgICAgICAgICAgIHJlc3VsdEluQW5ndWxhckFQSXMgPSBmaW5kZXJJbkFuZ3VsYXJBUElzKHR5cGUpXG5cbiAgICAgICAgaWYgKHJlc3VsdEluQ29tcG9kb2NJbmplY3RhYmxlcy5kYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0SW5Db21wb2RvY0luamVjdGFibGVzO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdEluQ29tcG9kb2NJbnRlcmZhY2VzLmRhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRJbkNvbXBvZG9jSW50ZXJmYWNlcztcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHRJbkNvbXBvZG9jQ2xhc3Nlcy5kYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0SW5Db21wb2RvY0NsYXNzZXM7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0SW5Db21wb2RvY0NvbXBvbmVudHMuZGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdEluQ29tcG9kb2NDb21wb25lbnRzO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdEluQW5ndWxhckFQSXMuZGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdEluQW5ndWxhckFQSXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlKHVwZGF0ZWREYXRhKSB7XG4gICAgICAgIGlmICh1cGRhdGVkRGF0YS5tb2R1bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIF8uZm9yRWFjaCh1cGRhdGVkRGF0YS5tb2R1bGVzLCAobW9kdWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IF9pbmRleCA9IF8uZmluZEluZGV4KHRoaXMubW9kdWxlcywgeyduYW1lJzogbW9kdWxlLm5hbWV9KTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vZHVsZXNbX2luZGV4XSA9IG1vZHVsZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGVkRGF0YS5jb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIF8uZm9yRWFjaCh1cGRhdGVkRGF0YS5jb21wb25lbnRzLCAoY29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IF9pbmRleCA9IF8uZmluZEluZGV4KHRoaXMuY29tcG9uZW50cywgeyduYW1lJzogY29tcG9uZW50Lm5hbWV9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudHNbX2luZGV4XSA9IGNvbXBvbmVudDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGVkRGF0YS5kaXJlY3RpdmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIF8uZm9yRWFjaCh1cGRhdGVkRGF0YS5kaXJlY3RpdmVzLCAoZGlyZWN0aXZlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IF9pbmRleCA9IF8uZmluZEluZGV4KHRoaXMuZGlyZWN0aXZlcywgeyduYW1lJzogZGlyZWN0aXZlLm5hbWV9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpcmVjdGl2ZXNbX2luZGV4XSA9IGRpcmVjdGl2ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGVkRGF0YS5pbmplY3RhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBfLmZvckVhY2godXBkYXRlZERhdGEuaW5qZWN0YWJsZXMsIChpbmplY3RhYmxlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IF9pbmRleCA9IF8uZmluZEluZGV4KHRoaXMuaW5qZWN0YWJsZXMsIHsnbmFtZSc6IGluamVjdGFibGUubmFtZX0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5qZWN0YWJsZXNbX2luZGV4XSA9IGluamVjdGFibGU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXBkYXRlZERhdGEuaW50ZXJmYWNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBfLmZvckVhY2godXBkYXRlZERhdGEuaW50ZXJmYWNlcywgKGludCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBfaW5kZXggPSBfLmZpbmRJbmRleCh0aGlzLmludGVyZmFjZXMsIHsnbmFtZSc6IGludC5uYW1lfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcmZhY2VzW19pbmRleF0gPSBpbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXBkYXRlZERhdGEucGlwZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgXy5mb3JFYWNoKHVwZGF0ZWREYXRhLnBpcGVzLCAocGlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBfaW5kZXggPSBfLmZpbmRJbmRleCh0aGlzLnBpcGVzLCB7J25hbWUnOiBwaXBlLm5hbWV9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnBpcGVzW19pbmRleF0gPSBwaXBlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVwZGF0ZWREYXRhLmNsYXNzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgXy5mb3JFYWNoKHVwZGF0ZWREYXRhLmNsYXNzZXMsIChjbGFzc2UpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgX2luZGV4ID0gXy5maW5kSW5kZXgodGhpcy5jbGFzc2VzLCB7J25hbWUnOiBjbGFzc2UubmFtZX0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlc1tfaW5kZXhdID0gY2xhc3NlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmluZEluQ29tcG9kb2MobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGxldCBtZXJnZWREYXRhID0gXy5jb25jYXQoW10sIHRoaXMubW9kdWxlcywgdGhpcy5jb21wb25lbnRzLCB0aGlzLmRpcmVjdGl2ZXMsIHRoaXMuaW5qZWN0YWJsZXMsIHRoaXMuaW50ZXJmYWNlcywgdGhpcy5waXBlcywgdGhpcy5jbGFzc2VzKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IF8uZmluZChtZXJnZWREYXRhLCB7J25hbWUnOiBuYW1lfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQgfHwgZmFsc2U7XG4gICAgfVxuICAgIGNsZWFuUmF3TW9kdWxlc0Zvck92ZXJ2aWV3KCkge1xuICAgICAgICBfLmZvckVhY2godGhpcy5yYXdNb2R1bGVzRm9yT3ZlcnZpZXcsIChtb2R1bGUpID0+IHtcbiAgICAgICAgICAgIG1vZHVsZS5kZWNsYXJhdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIG1vZHVsZS5wcm92aWRlcnMgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHByZXBhcmVNaXNjZWxsYW5lb3VzKCkge1xuICAgICAgICAvL2dyb3VwIGVhY2ggc3ViZ291cCBieSBmaWxlXG4gICAgICAgIHRoaXMubWlzY2VsbGFuZW91cy5ncm91cGVkVmFyaWFibGVzID0gXy5ncm91cEJ5KHRoaXMubWlzY2VsbGFuZW91cy52YXJpYWJsZXMsICdmaWxlJyk7XG4gICAgICAgIHRoaXMubWlzY2VsbGFuZW91cy5ncm91cGVkRnVuY3Rpb25zID0gXy5ncm91cEJ5KHRoaXMubWlzY2VsbGFuZW91cy5mdW5jdGlvbnMsICdmaWxlJyk7XG4gICAgICAgIHRoaXMubWlzY2VsbGFuZW91cy5ncm91cGVkRW51bWVyYXRpb25zID0gXy5ncm91cEJ5KHRoaXMubWlzY2VsbGFuZW91cy5lbnVtZXJhdGlvbnMsICdmaWxlJyk7XG4gICAgfVxuICAgIGdldE1vZHVsZShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIF8uZmluZCh0aGlzLm1vZHVsZXMsIFsnbmFtZScsIG5hbWVdKTtcbiAgICB9XG4gICAgZ2V0UmF3TW9kdWxlKG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gXy5maW5kKHRoaXMucmF3TW9kdWxlcywgWyduYW1lJywgbmFtZV0pO1xuICAgIH1cbiAgICBnZXRNb2R1bGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVzO1xuICAgIH1cbiAgICBnZXRDb21wb25lbnRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRzO1xuICAgIH1cbiAgICBnZXREaXJlY3RpdmVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXJlY3RpdmVzO1xuICAgIH1cbiAgICBnZXRJbmplY3RhYmxlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0YWJsZXM7XG4gICAgfVxuICAgIGdldEludGVyZmFjZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyZmFjZXM7XG4gICAgfVxuICAgIGdldFJvdXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm91dGVzO1xuICAgIH1cbiAgICBnZXRQaXBlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGlwZXM7XG4gICAgfVxuICAgIGdldENsYXNzZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsYXNzZXM7XG4gICAgfVxuICAgIGdldE1pc2NlbGxhbmVvdXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pc2NlbGxhbmVvdXM7XG4gICAgfVxufTtcblxuZXhwb3J0IGNvbnN0ICRkZXBlbmRlbmNpZXNFbmdpbmUgPSBEZXBlbmRlbmNpZXNFbmdpbmUuZ2V0SW5zdGFuY2UoKTtcbiIsImltcG9ydCB7ICRkZXBlbmRlbmNpZXNFbmdpbmUgfSBmcm9tICcuLi9hcHAvZW5naW5lcy9kZXBlbmRlbmNpZXMuZW5naW5lJztcblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMZWFkaW5nVGV4dChzdHJpbmcsIGNvbXBsZXRlVGFnKSB7XG4gICAgdmFyIHRhZ0luZGV4ID0gc3RyaW5nLmluZGV4T2YoY29tcGxldGVUYWcpO1xuICAgIHZhciBsZWFkaW5nVGV4dCA9IG51bGw7XG4gICAgdmFyIGxlYWRpbmdUZXh0UmVnRXhwID0gL1xcWyguKz8pXFxdL2c7XG4gICAgdmFyIGxlYWRpbmdUZXh0SW5mbyA9IGxlYWRpbmdUZXh0UmVnRXhwLmV4ZWMoc3RyaW5nKTtcblxuICAgIC8vIGRpZCB3ZSBmaW5kIGxlYWRpbmcgdGV4dCwgYW5kIGlmIHNvLCBkb2VzIGl0IGltbWVkaWF0ZWx5IHByZWNlZGUgdGhlIHRhZz9cbiAgICB3aGlsZSAobGVhZGluZ1RleHRJbmZvICYmIGxlYWRpbmdUZXh0SW5mby5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGxlYWRpbmdUZXh0SW5mby5pbmRleCArIGxlYWRpbmdUZXh0SW5mb1swXS5sZW5ndGggPT09IHRhZ0luZGV4KSB7XG4gICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZShsZWFkaW5nVGV4dEluZm9bMF0sICcnKTtcbiAgICAgICAgICAgIGxlYWRpbmdUZXh0ID0gbGVhZGluZ1RleHRJbmZvWzFdO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBsZWFkaW5nVGV4dEluZm8gPSBsZWFkaW5nVGV4dFJlZ0V4cC5leGVjKHN0cmluZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGVhZGluZ1RleHQ6IGxlYWRpbmdUZXh0LFxuICAgICAgICBzdHJpbmc6IHN0cmluZ1xuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdExpbmtUZXh0KHRleHQpIHtcbiAgICB2YXIgbGlua1RleHQ7XG4gICAgdmFyIHRhcmdldDtcbiAgICB2YXIgc3BsaXRJbmRleDtcblxuICAgIC8vIGlmIGEgcGlwZSBpcyBub3QgcHJlc2VudCwgd2Ugc3BsaXQgb24gdGhlIGZpcnN0IHNwYWNlXG4gICAgc3BsaXRJbmRleCA9IHRleHQuaW5kZXhPZignfCcpO1xuICAgIGlmIChzcGxpdEluZGV4ID09PSAtMSkge1xuICAgICAgICBzcGxpdEluZGV4ID0gdGV4dC5zZWFyY2goL1xccy8pO1xuICAgIH1cblxuICAgIGlmIChzcGxpdEluZGV4ICE9PSAtMSkge1xuICAgICAgICBsaW5rVGV4dCA9IHRleHQuc3Vic3RyKHNwbGl0SW5kZXggKyAxKTtcbiAgICAgICAgLy8gTm9ybWFsaXplIHN1YnNlcXVlbnQgbmV3bGluZXMgdG8gYSBzaW5nbGUgc3BhY2UuXG4gICAgICAgIGxpbmtUZXh0ID0gbGlua1RleHQucmVwbGFjZSgvXFxuKy8sICcgJyk7XG4gICAgICAgIHRhcmdldCA9IHRleHQuc3Vic3RyKDAsIHNwbGl0SW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxpbmtUZXh0OiBsaW5rVGV4dCxcbiAgICAgICAgdGFyZ2V0OiB0YXJnZXQgfHwgdGV4dFxuICAgIH07XG59XG5cbmV4cG9ydCBsZXQgTGlua1BhcnNlciA9IChmdW5jdGlvbigpIHtcblxuICAgIHZhciBwcm9jZXNzVGhlTGluayA9IGZ1bmN0aW9uKHN0cmluZywgdGFnSW5mbykge1xuICAgICAgICB2YXIgbGVhZGluZyA9IGV4dHJhY3RMZWFkaW5nVGV4dChzdHJpbmcsIHRhZ0luZm8uY29tcGxldGVUYWcpLFxuICAgICAgICAgICAgbGlua1RleHQgPSBsZWFkaW5nLmxlYWRpbmdUZXh0IHx8ICcnLFxuICAgICAgICAgICAgc3BsaXQsXG4gICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICBzdHJpbmd0b1JlcGxhY2U7XG5cbiAgICAgICAgc3BsaXQgPSBzcGxpdExpbmtUZXh0KHRhZ0luZm8udGV4dCk7XG4gICAgICAgIHRhcmdldCA9IHNwbGl0LnRhcmdldDtcblxuICAgICAgICBpZiAobGVhZGluZy5sZWFkaW5nVGV4dCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyaW5ndG9SZXBsYWNlID0gJ1snICsgbGVhZGluZy5sZWFkaW5nVGV4dCArICddJyArIHRhZ0luZm8uY29tcGxldGVUYWc7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNwbGl0LmxpbmtUZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgc3RyaW5ndG9SZXBsYWNlID0gdGFnSW5mby5jb21wbGV0ZVRhZztcbiAgICAgICAgICAgIGxpbmtUZXh0ID0gc3BsaXQubGlua1RleHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2Uoc3RyaW5ndG9SZXBsYWNlLCAnWycgKyBsaW5rVGV4dCArICddKCcgKyB0YXJnZXQgKyAnKScpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRcbiAgICAgKiB7QGxpbmsgaHR0cDovL3d3dy5nb29nbGUuY29tfEdvb2dsZX0gb3Ige0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbSBHaXRIdWJ9IHRvIFtHaXRodWJdKGh0dHBzOi8vZ2l0aHViLmNvbSlcbiAgICAgKi9cblxuICAgIHZhciByZXBsYWNlTGlua1RhZyA9IGZ1bmN0aW9uKHN0cjogc3RyaW5nKSB7XG5cbiAgICAgICAgdmFyIHRhZ1JlZ0V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7QGxpbmtcXFxccysoKD86LnxcXG4pKz8pXFxcXH0nLCAnaScpLFxuICAgICAgICAgICAgbWF0Y2hlcyxcbiAgICAgICAgICAgIHByZXZpb3VzU3RyaW5nLFxuICAgICAgICAgICAgdGFnSW5mbyA9IFtdO1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VNYXRjaChyZXBsYWNlciwgdGFnLCBtYXRjaCwgdGV4dCkge1xuICAgICAgICAgICAgdmFyIG1hdGNoZWRUYWcgPSB7XG4gICAgICAgICAgICAgICAgY29tcGxldGVUYWc6IG1hdGNoLFxuICAgICAgICAgICAgICAgIHRhZzogdGFnLFxuICAgICAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0YWdJbmZvLnB1c2gobWF0Y2hlZFRhZyk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihzdHIsIG1hdGNoZWRUYWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgbWF0Y2hlcyA9IHRhZ1JlZ0V4cC5leGVjKHN0cik7XG4gICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgIHByZXZpb3VzU3RyaW5nID0gc3RyO1xuICAgICAgICAgICAgICAgIHN0ciA9IHJlcGxhY2VNYXRjaChwcm9jZXNzVGhlTGluaywgJ2xpbmsnLCBtYXRjaGVzWzBdLCBtYXRjaGVzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSB3aGlsZSAobWF0Y2hlcyAmJiBwcmV2aW91c1N0cmluZyAhPT0gc3RyKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmV3U3RyaW5nOiBzdHJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgX3Jlc29sdmVMaW5rcyA9IGZ1bmN0aW9uKHN0cjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiByZXBsYWNlTGlua1RhZyhzdHIpLm5ld1N0cmluZztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXNvbHZlTGlua3M6IF9yZXNvbHZlTGlua3NcbiAgICB9XG59KSgpO1xuIiwiZXhwb3J0IGNvbnN0IENPTVBPRE9DX0RFRkFVTFRTID0ge1xuICAgIHRpdGxlOiAnQXBwbGljYXRpb24gZG9jdW1lbnRhdGlvbicsXG4gICAgYWRkaXRpb25hbEVudHJ5TmFtZTogJ0FkZGl0aW9uYWwgZG9jdW1lbnRhdGlvbicsXG4gICAgYWRkaXRpb25hbEVudHJ5UGF0aDogJ2FkZGl0aW9uYWwtZG9jdW1lbnRhdGlvbicsXG4gICAgZm9sZGVyOiAnLi9kb2N1bWVudGF0aW9uLycsXG4gICAgcG9ydDogODA4MCxcbiAgICB0aGVtZTogJ2dpdGJvb2snLFxuICAgIGJhc2U6ICcvJyxcbiAgICBkZWZhdWx0Q292ZXJhZ2VUaHJlc2hvbGQ6IDcwLFxuICAgIGRpc2FibGVTb3VyY2VDb2RlOiBmYWxzZSxcbiAgICBkaXNhYmxlR3JhcGg6IGZhbHNlLFxuICAgIGRpc2FibGVDb3ZlcmFnZTogZmFsc2UsXG4gICAgZGlzYWJsZVByaXZhdGVPckludGVybmFsU3VwcG9ydDogZmFsc2UsXG4gICAgUEFHRV9UWVBFUzoge1xuICAgICAgICBST09UOiAncm9vdCcsXG4gICAgICAgIElOVEVSTkFMOiAnaW50ZXJuYWwnXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ09NUE9ET0NfREVGQVVMVFMgfSBmcm9tICcuLi91dGlscy9kZWZhdWx0cyc7XG5cbmltcG9ydCB7IFBhZ2VJbnRlcmZhY2UgfSBmcm9tICcuL2ludGVyZmFjZXMvcGFnZS5pbnRlcmZhY2UnO1xuXG5pbXBvcnQgeyBNYWluRGF0YUludGVyZmFjZSB9IGZyb20gJy4vaW50ZXJmYWNlcy9tYWluLWRhdGEuaW50ZXJmYWNlJztcblxuaW1wb3J0IHsgQ29uZmlndXJhdGlvbkludGVyZmFjZSB9IGZyb20gJy4vaW50ZXJmYWNlcy9jb25maWd1cmF0aW9uLmludGVyZmFjZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25maWd1cmF0aW9uIGltcGxlbWVudHMgQ29uZmlndXJhdGlvbkludGVyZmFjZSB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgX2luc3RhbmNlOkNvbmZpZ3VyYXRpb24gPSBuZXcgQ29uZmlndXJhdGlvbigpO1xuXG4gICAgcHJpdmF0ZSBfcGFnZXM6UGFnZUludGVyZmFjZVtdID0gW107XG4gICAgcHJpdmF0ZSBfbWFpbkRhdGE6IE1haW5EYXRhSW50ZXJmYWNlID0ge1xuICAgICAgICBvdXRwdXQ6IENPTVBPRE9DX0RFRkFVTFRTLmZvbGRlcixcbiAgICAgICAgdGhlbWU6IENPTVBPRE9DX0RFRkFVTFRTLnRoZW1lLFxuICAgICAgICBleHRUaGVtZTogJycsXG4gICAgICAgIHNlcnZlOiBmYWxzZSxcbiAgICAgICAgcG9ydDogQ09NUE9ET0NfREVGQVVMVFMucG9ydCxcbiAgICAgICAgb3BlbjogZmFsc2UsXG4gICAgICAgIGFzc2V0c0ZvbGRlcjogJycsXG4gICAgICAgIGRvY3VtZW50YXRpb25NYWluTmFtZTogQ09NUE9ET0NfREVGQVVMVFMudGl0bGUsXG4gICAgICAgIGRvY3VtZW50YXRpb25NYWluRGVzY3JpcHRpb246ICcnLFxuICAgICAgICBiYXNlOiBDT01QT0RPQ19ERUZBVUxUUy5iYXNlLFxuICAgICAgICBoaWRlR2VuZXJhdG9yOiBmYWxzZSxcbiAgICAgICAgbW9kdWxlczogW10sXG4gICAgICAgIHJlYWRtZTogJycsXG4gICAgICAgIGFkZGl0aW9uYWxQYWdlczogW10sXG4gICAgICAgIHBpcGVzOiBbXSxcbiAgICAgICAgY2xhc3NlczogW10sXG4gICAgICAgIGludGVyZmFjZXM6IFtdLFxuICAgICAgICBjb21wb25lbnRzOiBbXSxcbiAgICAgICAgZGlyZWN0aXZlczogW10sXG4gICAgICAgIGluamVjdGFibGVzOiBbXSxcbiAgICAgICAgbWlzY2VsbGFuZW91czogW10sXG4gICAgICAgIHJvdXRlczogW10sXG4gICAgICAgIHRzY29uZmlnOiAnJyxcbiAgICAgICAgdG9nZ2xlTWVudUl0ZW1zOiBbXSxcbiAgICAgICAgaW5jbHVkZXM6ICcnLFxuICAgICAgICBpbmNsdWRlc05hbWU6IENPTVBPRE9DX0RFRkFVTFRTLmFkZGl0aW9uYWxFbnRyeU5hbWUsXG4gICAgICAgIGluY2x1ZGVzRm9sZGVyOiBDT01QT0RPQ19ERUZBVUxUUy5hZGRpdGlvbmFsRW50cnlQYXRoLFxuICAgICAgICBkaXNhYmxlU291cmNlQ29kZTogQ09NUE9ET0NfREVGQVVMVFMuZGlzYWJsZVNvdXJjZUNvZGUsXG4gICAgICAgIGRpc2FibGVHcmFwaDogQ09NUE9ET0NfREVGQVVMVFMuZGlzYWJsZUdyYXBoLFxuICAgICAgICBkaXNhYmxlQ292ZXJhZ2U6IENPTVBPRE9DX0RFRkFVTFRTLmRpc2FibGVDb3ZlcmFnZSxcbiAgICAgICAgZGlzYWJsZVByaXZhdGVPckludGVybmFsU3VwcG9ydDogQ09NUE9ET0NfREVGQVVMVFMuZGlzYWJsZVByaXZhdGVPckludGVybmFsU3VwcG9ydCxcbiAgICAgICAgd2F0Y2g6IGZhbHNlLFxuICAgICAgICBtYWluR3JhcGg6ICcnLFxuICAgICAgICBjb3ZlcmFnZVRlc3Q6IGZhbHNlLFxuICAgICAgICBjb3ZlcmFnZVRlc3RUaHJlc2hvbGQ6IENPTVBPRE9DX0RFRkFVTFRTLmRlZmF1bHRDb3ZlcmFnZVRocmVzaG9sZCxcbiAgICAgICAgcm91dGVzTGVuZ3RoOiAwXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBpZihDb25maWd1cmF0aW9uLl9pbnN0YW5jZSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yOiBJbnN0YW50aWF0aW9uIGZhaWxlZDogVXNlIENvbmZpZ3VyYXRpb24uZ2V0SW5zdGFuY2UoKSBpbnN0ZWFkIG9mIG5ldy4nKTtcbiAgICAgICAgfVxuICAgICAgICBDb25maWd1cmF0aW9uLl9pbnN0YW5jZSA9IHRoaXM7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOkNvbmZpZ3VyYXRpb25cbiAgICB7XG4gICAgICAgIHJldHVybiBDb25maWd1cmF0aW9uLl9pbnN0YW5jZTtcbiAgICB9XG5cbiAgICBhZGRQYWdlKHBhZ2U6IFBhZ2VJbnRlcmZhY2UpIHtcbiAgICAgICAgdGhpcy5fcGFnZXMucHVzaChwYWdlKTtcbiAgICB9XG5cbiAgICBhZGRBZGRpdGlvbmFsUGFnZShwYWdlOiBQYWdlSW50ZXJmYWNlKSB7XG4gICAgICAgIHRoaXMuX21haW5EYXRhLmFkZGl0aW9uYWxQYWdlcy5wdXNoKHBhZ2UpO1xuICAgIH1cblxuICAgIHJlc2V0UGFnZXMoKSB7XG4gICAgICAgIHRoaXMuX3BhZ2VzID0gW107XG4gICAgfVxuXG4gICAgcmVzZXRBZGRpdGlvbmFsUGFnZXMoKSB7XG4gICAgICAgIHRoaXMuX21haW5EYXRhLmFkZGl0aW9uYWxQYWdlcyA9IFtdO1xuICAgIH1cblxuICAgIGdldCBwYWdlcygpOlBhZ2VJbnRlcmZhY2VbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYWdlcztcbiAgICB9XG4gICAgc2V0IHBhZ2VzKHBhZ2VzOlBhZ2VJbnRlcmZhY2VbXSkge1xuICAgICAgICB0aGlzLl9wYWdlcyA9IFtdO1xuICAgIH1cblxuICAgIGdldCBtYWluRGF0YSgpOk1haW5EYXRhSW50ZXJmYWNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21haW5EYXRhO1xuICAgIH1cbiAgICBzZXQgbWFpbkRhdGEoZGF0YTpNYWluRGF0YUludGVyZmFjZSkge1xuICAgICAgICAoPGFueT5PYmplY3QpLmFzc2lnbih0aGlzLl9tYWluRGF0YSwgZGF0YSk7XG4gICAgfVxufTtcbiIsImltcG9ydCAqIGFzIEhhbmRsZWJhcnMgZnJvbSAnaGFuZGxlYmFycyc7XG5pbXBvcnQgeyBDT01QT0RPQ19ERUZBVUxUUyB9IGZyb20gJy4uLy4uL3V0aWxzL2RlZmF1bHRzJztcbmltcG9ydCB7ICRkZXBlbmRlbmNpZXNFbmdpbmUgfSBmcm9tICcuL2RlcGVuZGVuY2llcy5lbmdpbmUnO1xuaW1wb3J0IHsgZXh0cmFjdExlYWRpbmdUZXh0LCBzcGxpdExpbmtUZXh0IH0gZnJvbSAnLi4vLi4vdXRpbHMvbGluay1wYXJzZXInO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4uL2NvbmZpZ3VyYXRpb24nO1xuXG5pbXBvcnQgeyBqc2RvY1RhZ0ludGVyZmFjZSB9IGZyb20gJy4uL2ludGVyZmFjZXMvanNkb2MtdGFnLmludGVyZmFjZSc7XG5cbmV4cG9ydCBsZXQgSHRtbEVuZ2luZUhlbHBlcnMgPSAoZnVuY3Rpb24oKSB7XG4gICAgbGV0IGluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9UT0RPIHVzZSB0aGlzIGluc3RlYWQgOiBodHRwczovL2dpdGh1Yi5jb20vYXNzZW1ibGUvaGFuZGxlYmFycy1oZWxwZXJzXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoIFwiY29tcGFyZVwiLCBmdW5jdGlvbihhLCBvcGVyYXRvciwgYiwgb3B0aW9ucykge1xuICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgNCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdoYW5kbGViYXJzIEhlbHBlciB7e2NvbXBhcmV9fSBleHBlY3RzIDQgYXJndW1lbnRzJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgICAgICBjYXNlICdpbmRleG9mJzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoYi5pbmRleE9mKGEpICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICc9PT0nOlxuICAgICAgICAgICAgICByZXN1bHQgPSBhID09PSBiO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJyE9PSc6XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGEgIT09IGI7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnPic6XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGEgPiBiO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdoZWxwZXIge3tjb21wYXJlfX06IGludmFsaWQgb3BlcmF0b3I6IGAnICsgb3BlcmF0b3IgKyAnYCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoXCJvclwiLCBmdW5jdGlvbigvKiBhbnksIGFueSwgLi4uLCBvcHRpb25zICovKSB7XG4gICAgICAgICAgICB2YXIgbGVuID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbbGVuXTtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoXCJmaWx0ZXJBbmd1bGFyMk1vZHVsZXNcIiwgZnVuY3Rpb24odGV4dCwgb3B0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgTkcyX01PRFVMRVM6c3RyaW5nW10gPSBbXG4gICAgICAgICAgICAgICAgJ0Jyb3dzZXJNb2R1bGUnLFxuICAgICAgICAgICAgICAgICdGb3Jtc01vZHVsZScsXG4gICAgICAgICAgICAgICAgJ0h0dHBNb2R1bGUnLFxuICAgICAgICAgICAgICAgICdSb3V0ZXJNb2R1bGUnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIGxlbiA9IE5HMl9NT0RVTEVTLmxlbmd0aDtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAoaTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRleHQuaW5kZXhPZihORzJfTU9EVUxFU1tpXSkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoXCJkZWJ1Z1wiLCBmdW5jdGlvbihvcHRpb25hbFZhbHVlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDdXJyZW50IENvbnRleHRcIik7XG4gICAgICAgICAgY29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcblxuICAgICAgICAgIGlmIChvcHRpb25hbFZhbHVlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk9wdGlvbmFsVmFsdWVcIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PT09PT09XCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2cob3B0aW9uYWxWYWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignYnJlYWtsaW5lcycsIGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgICAgIHRleHQgPSBIYW5kbGViYXJzLlV0aWxzLmVzY2FwZUV4cHJlc3Npb24odGV4dCk7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxyXFxufFxcbnxcXHIpL2dtLCAnPGJyPicpO1xuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvIC9nbSwgJyZuYnNwOycpO1xuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXHQvZ20sICcmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsnKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSGFuZGxlYmFycy5TYWZlU3RyaW5nKHRleHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignZXNjYXBlU2ltcGxlUXVvdGUnLCBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgICAgICBpZighdGV4dCkgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIF90ZXh0ID0gdGV4dC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIik7XG4gICAgICAgICAgICBfdGV4dCA9IF90ZXh0LnJlcGxhY2UoLyhcXHJcXG58XFxufFxccikvZ20sICcnKTtcbiAgICAgICAgICAgIHJldHVybiBfdGV4dDtcbiAgICAgICAgfSk7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2JyZWFrQ29tbWEnLCBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgICAgICB0ZXh0ID0gSGFuZGxlYmFycy5VdGlscy5lc2NhcGVFeHByZXNzaW9uKHRleHQpO1xuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvLC9nLCAnLDxicj4nKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSGFuZGxlYmFycy5TYWZlU3RyaW5nKHRleHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignbW9kaWZLaW5kJywgZnVuY3Rpb24oa2luZCkge1xuICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2Jsb2IvNzNlZTJmZWI1MWM5YjdlMjRhMjllYjRjZWUxOWQ3YzE0YjkzMzA2NS9saWIvdHlwZXNjcmlwdC5kLnRzI0w2NFxuICAgICAgICAgICAgbGV0IF9raW5kVGV4dCA9ICcnO1xuICAgICAgICAgICAgc3dpdGNoKGtpbmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDExMjpcbiAgICAgICAgICAgICAgICAgICAgX2tpbmRUZXh0ID0gJ1ByaXZhdGUnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDExMzpcbiAgICAgICAgICAgICAgICAgICAgX2tpbmRUZXh0ID0gJ1Byb3RlY3RlZCc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTE0OlxuICAgICAgICAgICAgICAgICAgICBfa2luZFRleHQgPSAnUHVibGljJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAxMTU6XG4gICAgICAgICAgICAgICAgICAgIF9raW5kVGV4dCA9ICdTdGF0aWMnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgSGFuZGxlYmFycy5TYWZlU3RyaW5nKF9raW5kVGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdtb2RpZkljb24nLCBmdW5jdGlvbihraW5kKSB7XG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvYmxvYi83M2VlMmZlYjUxYzliN2UyNGEyOWViNGNlZTE5ZDdjMTRiOTMzMDY1L2xpYi90eXBlc2NyaXB0LmQudHMjTDY0XG4gICAgICAgICAgICBsZXQgX2tpbmRUZXh0ID0gJyc7XG4gICAgICAgICAgICBzd2l0Y2goa2luZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMTEyOlxuICAgICAgICAgICAgICAgICAgICBfa2luZFRleHQgPSAnbG9jayc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTEzOlxuICAgICAgICAgICAgICAgICAgICBfa2luZFRleHQgPSAnY2lyY2xlJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAxMTU6XG4gICAgICAgICAgICAgICAgICAgIF9raW5kVGV4dCA9ICdzcXVhcmUnO1xuICAgICAgICAgICAgICAgIGNhc2UgODM6XG4gICAgICAgICAgICAgICAgICAgIF9raW5kVGV4dCA9ICdleHBvcnQnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfa2luZFRleHQ7XG4gICAgICAgIH0pO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydCB7QGxpbmsgTXlDbGFzc30gdG8gW015Q2xhc3NdKGh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9jbGFzc2VzL015Q2xhc3MuaHRtbClcbiAgICAgICAgICovXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3BhcnNlRGVzY3JpcHRpb24nLCBmdW5jdGlvbihkZXNjcmlwdGlvbiwgZGVwdGgpIHtcbiAgICAgICAgICAgIGxldCB0YWdSZWdFeHAgPSBuZXcgUmVnRXhwKCdcXFxce0BsaW5rXFxcXHMrKCg/Oi58XFxuKSs/KVxcXFx9JywgJ2knKSxcbiAgICAgICAgICAgICAgICBtYXRjaGVzLFxuICAgICAgICAgICAgICAgIHByZXZpb3VzU3RyaW5nLFxuICAgICAgICAgICAgICAgIHRhZ0luZm8gPSBbXVxuXG4gICAgICAgICAgICB2YXIgcHJvY2Vzc1RoZUxpbmsgPSBmdW5jdGlvbihzdHJpbmcsIHRhZ0luZm8pIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVhZGluZyA9IGV4dHJhY3RMZWFkaW5nVGV4dChzdHJpbmcsIHRhZ0luZm8uY29tcGxldGVUYWcpLFxuICAgICAgICAgICAgICAgICAgICBzcGxpdCxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICBuZXdMaW5rLFxuICAgICAgICAgICAgICAgICAgICByb290UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5ndG9SZXBsYWNlO1xuXG4gICAgICAgICAgICAgICAgc3BsaXQgPSBzcGxpdExpbmtUZXh0KHRhZ0luZm8udGV4dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNwbGl0LmxpbmtUZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAkZGVwZW5kZW5jaWVzRW5naW5lLmZpbmRJbkNvbXBvZG9jKHNwbGl0LnRhcmdldCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gJGRlcGVuZGVuY2llc0VuZ2luZS5maW5kSW5Db21wb2RvYyh0YWdJbmZvLnRleHQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlYWRpbmcubGVhZGluZ1RleHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZ3RvUmVwbGFjZSA9ICdbJyArIGxlYWRpbmcubGVhZGluZ1RleHQgKyAnXScgKyB0YWdJbmZvLmNvbXBsZXRlVGFnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzcGxpdC5saW5rVGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZ3RvUmVwbGFjZSA9IHRhZ0luZm8uY29tcGxldGVUYWc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmd0b1JlcGxhY2UgPSB0YWdJbmZvLmNvbXBsZXRlVGFnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50eXBlID09PSAnY2xhc3MnKSByZXN1bHQudHlwZSA9ICdjbGFzc2UnO1xuXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQYXRoID0gJyc7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChkZXB0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQYXRoID0gJy4vJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UGF0aCA9ICcuLi8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQYXRoID0gJy4uLy4uLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSByZXN1bHQubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlYWRpbmcubGVhZGluZ1RleHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID0gbGVhZGluZy5sZWFkaW5nVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNwbGl0LmxpbmtUZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPSBzcGxpdC5saW5rVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG5ld0xpbmsgPSBgPGEgaHJlZj1cIiR7cm9vdFBhdGh9JHtyZXN1bHQudHlwZX1zLyR7cmVzdWx0Lm5hbWV9Lmh0bWxcIj4ke2xhYmVsfTwvYT5gO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2Uoc3RyaW5ndG9SZXBsYWNlLCBuZXdMaW5rKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVwbGFjZU1hdGNoKHJlcGxhY2VyLCB0YWcsIG1hdGNoLCB0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoZWRUYWcgPSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlVGFnOiBtYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRhZ0luZm8ucHVzaChtYXRjaGVkVGFnKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihkZXNjcmlwdGlvbiwgbWF0Y2hlZFRhZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb24ucmVwbGFjZSgvXFxuL2csICc8YnIvPicpO1xuXG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IHRhZ1JlZ0V4cC5leGVjKGRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c1N0cmluZyA9IGRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9IHJlcGxhY2VNYXRjaChwcm9jZXNzVGhlTGluaywgJ2xpbmsnLCBtYXRjaGVzWzBdLCBtYXRjaGVzWzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlIChtYXRjaGVzICYmIHByZXZpb3VzU3RyaW5nICE9PSBkZXNjcmlwdGlvbik7XG5cbiAgICAgICAgICAgIHJldHVybiBkZXNjcmlwdGlvbjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcigncmVsYXRpdmVVUkwnLCBmdW5jdGlvbihjdXJyZW50RGVwdGgsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSAnJztcblxuICAgICAgICAgICAgc3dpdGNoIChjdXJyZW50RGVwdGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICcuLyc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gJy4uLyc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gJy4uLy4uLyc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ID09PSAnc3RyaW5nJyAmJiBjb250ZXh0ID09ICdhZGRpdGlvbmFsLXBhZ2UnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbGF0aXZlVVJMOiAnLCBjdXJyZW50RGVwdGgsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcblxuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdmdW5jdGlvblNpZ25hdHVyZScsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICAgICAgbGV0IGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGlmIChtZXRob2QuYXJncykge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXRob2QuYXJncy5tYXAoZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfcmVzdWx0ID0gJGRlcGVuZGVuY2llc0VuZ2luZS5maW5kKGFyZy50eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9yZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfcmVzdWx0LnNvdXJjZSA9PT0gJ2ludGVybmFsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXRoID0gX3Jlc3VsdC5kYXRhLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9yZXN1bHQuZGF0YS50eXBlID09PSAnY2xhc3MnKSBwYXRoID0gJ2NsYXNzZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2FyZy5uYW1lfTogPGEgaHJlZj1cIi4uLyR7cGF0aH1zLyR7X3Jlc3VsdC5kYXRhLm5hbWV9Lmh0bWxcIj4ke2FyZy50eXBlfTwvYT5gO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGF0aCA9ICdodHRwczovL2FuZ3VsYXIuaW8vZG9jcy90cy9sYXRlc3QvYXBpLycgKyBfcmVzdWx0LmRhdGEucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7YXJnLm5hbWV9OiA8YSBocmVmPVwiJHtwYXRofVwiIHRhcmdldD1cIl9ibGFua1wiPiR7YXJnLnR5cGV9PC9hPmA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7YXJnLm5hbWV9OiAke2FyZy50eXBlfWA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KS5qb2luKCcsICcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1ldGhvZC5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke21ldGhvZC5uYW1lfSgke2FyZ3N9KWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBgKCR7YXJnc30pYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2pzZG9jLXJldHVybnMtY29tbWVudCcsIGZ1bmN0aW9uKGpzZG9jVGFncywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgIGxlbiA9IGpzZG9jVGFncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcmVzdWx0O1xuICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLnRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGpzZG9jVGFnc1tpXS50YWdOYW1lLnRleHQgPT09ICdyZXR1cm5zJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0ganNkb2NUYWdzW2ldLmNvbW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pO1xuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdqc2RvYy1jb21wb25lbnQtZXhhbXBsZScsIGZ1bmN0aW9uKGpzZG9jVGFnczpqc2RvY1RhZ0ludGVyZmFjZVtdLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0ganNkb2NUYWdzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB0YWdzID0gW107XG5cbiAgICAgICAgICAgIGxldCBjbGVhblRhZyA9IGZ1bmN0aW9uKGNvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tbWVudC5jaGFyQXQoMCkgPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gY29tbWVudC5zdWJzdHJpbmcoMSwgY29tbWVudC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY29tbWVudC5jaGFyQXQoMCkgPT09ICcgJykge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gY29tbWVudC5zdWJzdHJpbmcoMSwgY29tbWVudC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29tbWVudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHR5cGUgPSAnaHRtbCc7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc2gudHlwZSkge1xuICAgICAgICAgICAgICAgIHR5cGUgPSBvcHRpb25zLmhhc2gudHlwZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaHRtbEVudGl0aWVzKHN0cikge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoc3RyKS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IoaTsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChqc2RvY1RhZ3NbaV0udGFnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLnRhZ05hbWUudGV4dCA9PT0gJ2V4YW1wbGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFnID0ge30gYXMganNkb2NUYWdJbnRlcmZhY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLmNvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuY29tbWVudCA9IGA8cHJlIGNsYXNzPVwibGluZS1udW1iZXJzXCI+PGNvZGUgY2xhc3M9XCJsYW5ndWFnZS0ke3R5cGV9XCI+YCArIGh0bWxFbnRpdGllcyhjbGVhblRhZyhqc2RvY1RhZ3NbaV0uY29tbWVudCkpICsgYDwvY29kZT48L3ByZT5gO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFncy5wdXNoKHRhZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YWdzID0gdGFncztcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2pzZG9jLWV4YW1wbGUnLCBmdW5jdGlvbihqc2RvY1RhZ3M6anNkb2NUYWdJbnRlcmZhY2VbXSwgb3B0aW9ucykge1xuICAgICAgICAgICAgbGV0IGkgPSAwLFxuICAgICAgICAgICAgICAgIGxlbiA9IGpzZG9jVGFncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgdGFncyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IoaTsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChqc2RvY1RhZ3NbaV0udGFnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLnRhZ05hbWUudGV4dCA9PT0gJ2V4YW1wbGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFnID0ge30gYXMganNkb2NUYWdJbnRlcmZhY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLmNvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuY29tbWVudCA9IGpzZG9jVGFnc1tpXS5jb21tZW50LnJlcGxhY2UoLzxjYXB0aW9uPi9nLCAnPGI+PGk+JykucmVwbGFjZSgvXFwvY2FwdGlvbj4vZywgJy9iPjwvaT4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3MucHVzaCh0YWcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFncyA9IHRhZ3M7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdqc2RvYy1wYXJhbXMnLCBmdW5jdGlvbihqc2RvY1RhZ3M6anNkb2NUYWdJbnRlcmZhY2VbXSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgIGxlbiA9IGpzZG9jVGFncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgdGFncyA9IFtdO1xuICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLnRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGpzZG9jVGFnc1tpXS50YWdOYW1lLnRleHQgPT09ICdwYXJhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWcgPSB7fSBhcyBqc2RvY1RhZ0ludGVyZmFjZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqc2RvY1RhZ3NbaV0udHlwZUV4cHJlc3Npb24gJiYganNkb2NUYWdzW2ldLnR5cGVFeHByZXNzaW9uLnR5cGUubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy50eXBlID0ganNkb2NUYWdzW2ldLnR5cGVFeHByZXNzaW9uLnR5cGUubmFtZS50ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLmNvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuY29tbWVudCA9IGpzZG9jVGFnc1tpXS5jb21tZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanNkb2NUYWdzW2ldLnBhcmFtZXRlck5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcubmFtZSA9IGpzZG9jVGFnc1tpXS5wYXJhbWV0ZXJOYW1lLnRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3MucHVzaCh0YWcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRhZ3MubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ3MgPSB0YWdzO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignbGlua1R5cGUnLCBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgX3Jlc3VsdCA9ICRkZXBlbmRlbmNpZXNFbmdpbmUuZmluZChuYW1lKTtcbiAgICAgICAgICAgIGlmIChfcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0ge1xuICAgICAgICAgICAgICAgICAgICByYXc6IG5hbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9yZXN1bHQuc291cmNlID09PSAnaW50ZXJuYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfcmVzdWx0LmRhdGEudHlwZSA9PT0gJ2NsYXNzJykgX3Jlc3VsdC5kYXRhLnR5cGUgPSAnY2xhc3NlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlLmhyZWYgPSAnLi4vJyArIF9yZXN1bHQuZGF0YS50eXBlICsgJ3MvJyArIF9yZXN1bHQuZGF0YS5uYW1lICsgJy5odG1sJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlLnRhcmdldCA9ICdfc2VsZic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlLmhyZWYgPSAnaHR0cHM6Ly9hbmd1bGFyLmlvL2RvY3MvdHMvbGF0ZXN0L2FwaS8nICsgX3Jlc3VsdC5kYXRhLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHlwZS50YXJnZXQgPSAnX2JsYW5rJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2luZGV4YWJsZVNpZ25hdHVyZScsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICAgICAgY29uc3QgYXJncyA9IG1ldGhvZC5hcmdzLm1hcChhcmcgPT4gYCR7YXJnLm5hbWV9OiAke2FyZy50eXBlfWApLmpvaW4oJywgJyk7XG4gICAgICAgICAgICBpZiAobWV0aG9kLm5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7bWV0aG9kLm5hbWV9WyR7YXJnc31dYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBbJHthcmdzfV1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignb2JqZWN0JywgZnVuY3Rpb24odGV4dCkge1xuICAgICAgICAgICAgdGV4dCA9IEpTT04uc3RyaW5naWZ5KHRleHQpO1xuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgve1wiLywgJ3s8YnI+Jm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XCInKTtcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyxcIi8sICcsPGJyPiZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1wiJyk7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC99JC8sICc8YnI+fScpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBIYW5kbGViYXJzLlNhZmVTdHJpbmcodGV4dCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2lzTm90VG9nZ2xlJywgZnVuY3Rpb24odHlwZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSBDb25maWd1cmF0aW9uLmdldEluc3RhbmNlKCksXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gY29uZmlndXJhdGlvbi5tYWluRGF0YS50b2dnbGVNZW51SXRlbXMuaW5kZXhPZih0eXBlKTtcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uLm1haW5EYXRhLnRvZ2dsZU1lbnVJdGVtcy5pbmRleE9mKCdhbGwnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBpbml0XG4gICAgfVxufSkoKVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIEhhbmRsZWJhcnMgZnJvbSAnaGFuZGxlYmFycyc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9sb2dnZXInO1xuLy9pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJ2hhbmRsZWJhcnMtaGVscGVycyc7XG5pbXBvcnQgeyBIdG1sRW5naW5lSGVscGVycyB9IGZyb20gJy4vaHRtbC5lbmdpbmUuaGVscGVycyc7XG5cbmV4cG9ydCBjbGFzcyBIdG1sRW5naW5lIHtcbiAgICBjYWNoZTogT2JqZWN0ID0ge307XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIEh0bWxFbmdpbmVIZWxwZXJzLmluaXQoKTtcbiAgICB9XG4gICAgaW5pdCgpIHtcbiAgICAgICAgbGV0IHBhcnRpYWxzID0gW1xuICAgICAgICAgICAgJ21lbnUnLFxuICAgICAgICAgICAgJ292ZXJ2aWV3JyxcbiAgICAgICAgICAgICdyZWFkbWUnLFxuICAgICAgICAgICAgJ21vZHVsZXMnLFxuICAgICAgICAgICAgJ21vZHVsZScsXG4gICAgICAgICAgICAnY29tcG9uZW50cycsXG4gICAgICAgICAgICAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICdjb21wb25lbnQtZGV0YWlsJyxcbiAgICAgICAgICAgICdkaXJlY3RpdmVzJyxcbiAgICAgICAgICAgICdkaXJlY3RpdmUnLFxuICAgICAgICAgICAgJ2luamVjdGFibGVzJyxcbiAgICAgICAgICAgICdpbmplY3RhYmxlJyxcbiAgICAgICAgICAgICdwaXBlcycsXG4gICAgICAgICAgICAncGlwZScsXG4gICAgICAgICAgICAnY2xhc3NlcycsXG4gICAgICAgICAgICAnY2xhc3MnLFxuXHQgICAgICAgICdpbnRlcmZhY2UnLFxuICAgICAgICAgICAgJ3JvdXRlcycsXG4gICAgICAgICAgICAnc2VhcmNoLXJlc3VsdHMnLFxuICAgICAgICAgICAgJ3NlYXJjaC1pbnB1dCcsXG4gICAgICAgICAgICAnbGluay10eXBlJyxcbiAgICAgICAgICAgICdibG9jay1tZXRob2QnLFxuICAgICAgICAgICAgJ2Jsb2NrLWVudW0nLFxuICAgICAgICAgICAgJ2Jsb2NrLXByb3BlcnR5JyxcbiAgICAgICAgICAgICdibG9jay1pbmRleCcsXG4gICAgICAgICAgICAnYmxvY2stY29uc3RydWN0b3InLFxuICAgICAgICAgICAgJ2NvdmVyYWdlLXJlcG9ydCcsXG4gICAgICAgICAgICAnbWlzY2VsbGFuZW91cycsXG4gICAgICAgICAgICAnYWRkaXRpb25hbC1wYWdlJ1xuICAgICAgICBdLFxuICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICBsZW4gPSBwYXJ0aWFscy5sZW5ndGgsXG4gICAgICAgICAgICBsb29wID0gKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCBpIDw9IGxlbi0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUgKyAnLy4uL3NyYy90ZW1wbGF0ZXMvcGFydGlhbHMvJyArIHBhcnRpYWxzW2ldICsgJy5oYnMnKSwgJ3V0ZjgnLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7IHJlamVjdCgpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbChwYXJ0aWFsc1tpXSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb29wKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBsb29wKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXIobWFpbkRhdGE6YW55LCBwYWdlOmFueSkge1xuICAgICAgICB2YXIgbyA9IG1haW5EYXRhLFxuICAgICAgICAgICAgdGhhdCA9IHRoaXM7XG4gICAgICAgICg8YW55Pk9iamVjdCkuYXNzaWduKG8sIHBhZ2UpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBpZih0aGF0LmNhY2hlWydwYWdlJ10pIHtcbiAgICAgICAgICAgICAgICBsZXQgdGVtcGxhdGU6YW55ID0gSGFuZGxlYmFycy5jb21waWxlKHRoYXQuY2FjaGVbJ3BhZ2UnXSksXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IG9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShwYXRoLnJlc29sdmUoX19kaXJuYW1lICsgJy8uLi9zcmMvdGVtcGxhdGVzL3BhZ2UuaGJzJyksICd1dGY4JywgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdFcnJvciBkdXJpbmcgaW5kZXggJyArIHBhZ2UubmFtZSArICcgZ2VuZXJhdGlvbicpO1xuICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY2FjaGVbJ3BhZ2UnXSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTphbnkgPSBIYW5kbGViYXJzLmNvbXBpbGUoZGF0YSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0ZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2VuZXJhdGVDb3ZlcmFnZUJhZGdlKG91dHB1dEZvbGRlciwgY292ZXJhZ2VEYXRhKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBmcy5yZWFkRmlsZShwYXRoLnJlc29sdmUoX19kaXJuYW1lICsgJy8uLi9zcmMvdGVtcGxhdGVzL3BhcnRpYWxzL2NvdmVyYWdlLWJhZGdlLmhicycpLCAndXRmOCcsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICByZWplY3QoJ0Vycm9yIGR1cmluZyBjb3ZlcmFnZSBiYWRnZSBnZW5lcmF0aW9uJyk7XG4gICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTphbnkgPSBIYW5kbGViYXJzLmNvbXBpbGUoZGF0YSksXG4gICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGNvdmVyYWdlRGF0YVxuICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICBvdXRwdXRGb2xkZXIgPSBvdXRwdXRGb2xkZXIucmVwbGFjZShwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgZnMub3V0cHV0RmlsZShwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSArIHBhdGguc2VwICsgb3V0cHV0Rm9sZGVyICsgcGF0aC5zZXAgKyAnL2ltYWdlcy9jb3ZlcmFnZS1iYWRnZS5zdmcnKSwgcmVzdWx0LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkdXJpbmcgY292ZXJhZ2UgYmFkZ2UgZmlsZSBnZW5lcmF0aW9uICcsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICB9KTtcbiAgICAgICB9KTtcbiAgICB9XG59O1xuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc3QgbWFya2VkID0gcmVxdWlyZSgnbWFya2VkJyk7XG5cbmV4cG9ydCBjbGFzcyBNYXJrZG93bkVuZ2luZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGNvbnN0IHJlbmRlcmVyID0gbmV3IG1hcmtlZC5SZW5kZXJlcigpO1xuICAgICAgICByZW5kZXJlci5jb2RlID0gKGNvZGUsIGxhbmd1YWdlKSA9PiB7XG4gICAgICAgICAgICBsZXQgaGlnaGxpZ2h0ZWQgPSBjb2RlO1xuICAgICAgICAgICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICAgICAgICAgIGxhbmd1YWdlID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoaWdobGlnaHRlZCA9IHRoaXMuZXNjYXBlKGNvZGUpO1xuICAgICAgICAgICAgcmV0dXJuIGA8cHJlIGNsYXNzPVwibGluZS1udW1iZXJzXCI+PGNvZGUgY2xhc3M9XCJsYW5ndWFnZS0ke2xhbmd1YWdlfVwiPiR7aGlnaGxpZ2h0ZWR9PC9jb2RlPjwvcHJlPmA7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVuZGVyZXIudGFibGUgPSAoaGVhZGVyLCBib2R5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJzx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIGNvbXBvZG9jLXRhYmxlXCI+XFxuJ1xuICAgICAgICAgICAgICAgICsgJzx0aGVhZD5cXG4nXG4gICAgICAgICAgICAgICAgKyBoZWFkZXJcbiAgICAgICAgICAgICAgICArICc8L3RoZWFkPlxcbidcbiAgICAgICAgICAgICAgICArICc8dGJvZHk+XFxuJ1xuICAgICAgICAgICAgICAgICsgYm9keVxuICAgICAgICAgICAgICAgICsgJzwvdGJvZHk+XFxuJ1xuICAgICAgICAgICAgICAgICsgJzwvdGFibGU+XFxuJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlbmRlcmVyLmltYWdlID0gZnVuY3Rpb24gKGhyZWYsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICAgICAgICB2YXIgb3V0ID0gJzxpbWcgc3JjPVwiJyArIGhyZWYgKyAnXCIgYWx0PVwiJyArIHRleHQgKyAnXCIgY2xhc3M9XCJpbWctcmVzcG9uc2l2ZVwiJztcbiAgICAgICAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICAgICAgICAgIG91dCArPSAnIHRpdGxlPVwiJyArIHRpdGxlICsgJ1wiJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dCArPSB0aGlzLm9wdGlvbnMueGh0bWwgPyAnLz4nIDogJz4nO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfTtcblxuICAgICAgICBtYXJrZWQuc2V0T3B0aW9ucyh7XG4gICAgICAgICAgICByZW5kZXJlcjogcmVuZGVyZXIsXG4gICAgICAgICAgICBicmVha3M6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXQoZmlsZXBhdGg6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgZnMucmVhZEZpbGUocGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCkgKyBwYXRoLnNlcCArIGZpbGVwYXRoKSwgJ3V0ZjgnLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ0Vycm9yIGR1cmluZyAnICsgZmlsZXBhdGggKyAnIHJlYWQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG1hcmtlZChkYXRhKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRSZWFkbWVGaWxlKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgZnMucmVhZEZpbGUocGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCkgKyAnL1JFQURNRS5tZCcpLCAndXRmOCcsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnRXJyb3IgZHVyaW5nIFJFQURNRS5tZCBmaWxlIHJlYWRpbmcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG1hcmtlZChkYXRhKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb21wb25lbnRIYXNSZWFkbWVGaWxlKGZpbGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlKSxcbiAgICAgICAgICAgIHJlYWRtZUZpbGUgPSBkaXJuYW1lICsgcGF0aC5zZXAgKyAnUkVBRE1FLm1kJyxcbiAgICAgICAgICAgIHJlYWRtZUFsdGVybmF0aXZlRmlsZSA9IGRpcm5hbWUgKyBwYXRoLnNlcCArIHBhdGguYmFzZW5hbWUoZmlsZSwgJy50cycpICsgJy5tZCc7XG4gICAgICAgIHJldHVybiBmcy5leGlzdHNTeW5jKHJlYWRtZUZpbGUpIHx8IGZzLmV4aXN0c1N5bmMocmVhZG1lQWx0ZXJuYXRpdmVGaWxlKTtcbiAgICB9XG4gICAgY29tcG9uZW50UmVhZG1lRmlsZShmaWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlKSxcbiAgICAgICAgICAgIHJlYWRtZUZpbGUgPSBkaXJuYW1lICsgcGF0aC5zZXAgKyAnUkVBRE1FLm1kJyxcbiAgICAgICAgICAgIHJlYWRtZUFsdGVybmF0aXZlRmlsZSA9IGRpcm5hbWUgKyBwYXRoLnNlcCArIHBhdGguYmFzZW5hbWUoZmlsZSwgJy50cycpICsgJy5tZCcsXG4gICAgICAgICAgICBmaW5hbFBhdGggPSAnJztcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocmVhZG1lRmlsZSkpIHtcbiAgICAgICAgICAgIGZpbmFsUGF0aCA9IHJlYWRtZUZpbGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaW5hbFBhdGggPSByZWFkbWVBbHRlcm5hdGl2ZUZpbGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbmFsUGF0aDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGVzY2FwZShodG1sKSB7XG4gICAgICAgIHJldHVybiBodG1sXG4gICAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgJyYjMzk7JylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9AL2csICcmIzY0OycpO1xuICAgIH1cbn07XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgSGFuZGxlYmFycyBmcm9tICdoYW5kbGViYXJzJztcblxuZXhwb3J0IGNsYXNzIEZpbGVFbmdpbmUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgfVxuICAgIGdldChmaWxlcGF0aDpzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICBmcy5yZWFkRmlsZShwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSArIHBhdGguc2VwICsgZmlsZXBhdGgpLCAndXRmOCcsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICByZWplY3QoJ0Vycm9yIGR1cmluZyAnICsgZmlsZXBhdGggKyAnIHJlYWQnKTtcbiAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgU2hlbGxqcyBmcm9tICdzaGVsbGpzJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5cbmltcG9ydCB7ICRkZXBlbmRlbmNpZXNFbmdpbmUgfSBmcm9tICcuL2RlcGVuZGVuY2llcy5lbmdpbmUnO1xuXG5pbXBvcnQgaXNHbG9iYWwgZnJvbSAnLi4vLi4vdXRpbHMvZ2xvYmFsLnBhdGgnO1xuXG5sZXQgbmdkQ3IgPSByZXF1aXJlKCdAY29tcG9kb2MvbmdkLWNvcmUnKTtcbmxldCBuZ2RUID0gcmVxdWlyZSgnQGNvbXBvZG9jL25nZC10cmFuc2Zvcm1lcicpO1xuXG5leHBvcnQgY2xhc3MgTmdkRW5naW5lIHtcbiAgICBjb25zdHJ1Y3RvcigpIHt9XG4gICAgcmVuZGVyR3JhcGgoZmlsZXBhdGg6IHN0cmluZywgb3V0cHV0cGF0aDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgbmdkQ3IubG9nZ2VyLnNpbGVudCA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IGVuZ2luZSA9IG5ldyBuZ2RULkRvdEVuZ2luZSh7XG4gICAgICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRwYXRoLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlMZWdlbmQ6IHRydWUsXG4gICAgICAgICAgICAgICAgb3V0cHV0Rm9ybWF0czogJ3N2ZydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdmJykge1xuICAgICAgICAgICAgICAgIGVuZ2luZVxuICAgICAgICAgICAgICAgICAgICAuZ2VuZXJhdGVHcmFwaChbJGRlcGVuZGVuY2llc0VuZ2luZS5nZXRSYXdNb2R1bGUobmFtZSldKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmaWxlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVuZ2luZVxuICAgICAgICAgICAgICAgICAgICAuZ2VuZXJhdGVHcmFwaCgkZGVwZW5kZW5jaWVzRW5naW5lLnJhd01vZHVsZXNGb3JPdmVydmlldylcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZmlsZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVhZEdyYXBoKGZpbGVwYXRoOiBzdHJpbmcsIG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBmcy5yZWFkRmlsZShwYXRoLnJlc29sdmUoZmlsZXBhdGgpLCAndXRmOCcsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICByZWplY3QoJ0Vycm9yIGR1cmluZyBncmFwaCByZWFkICcgKyBuYW1lKTtcbiAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgSGFuZGxlYmFycyBmcm9tICdoYW5kbGViYXJzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2xvZ2dlcic7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vY29uZmlndXJhdGlvbic7XG5cbmNvbnN0IGx1bnI6IGFueSA9IHJlcXVpcmUoJ2x1bnInKSxcbiAgICAgIGNoZWVyaW86IGFueSA9IHJlcXVpcmUoJ2NoZWVyaW8nKSxcbiAgICAgIEVudGl0aWVzOmFueSA9IHJlcXVpcmUoJ2h0bWwtZW50aXRpZXMnKS5BbGxIdG1sRW50aXRpZXMsXG4gICAgICAkY29uZmlndXJhdGlvbiA9IENvbmZpZ3VyYXRpb24uZ2V0SW5zdGFuY2UoKSxcbiAgICAgIEh0bWwgPSBuZXcgRW50aXRpZXMoKTtcblxuZXhwb3J0IGNsYXNzIFNlYXJjaEVuZ2luZSB7XG4gICAgc2VhcmNoSW5kZXg6IGFueTtcbiAgICBkb2N1bWVudHNTdG9yZTogT2JqZWN0ID0ge307XG4gICAgaW5kZXhTaXplOiBudW1iZXI7XG4gICAgY29uc3RydWN0b3IoKSB7fVxuICAgIHByaXZhdGUgZ2V0U2VhcmNoSW5kZXgoKSB7XG4gICAgICAgIGlmICghdGhpcy5zZWFyY2hJbmRleCkge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hJbmRleCA9IGx1bnIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVmKCd1cmwnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkKCd0aXRsZScsIHsgYm9vc3Q6IDEwIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQoJ2JvZHknKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnNlYXJjaEluZGV4O1xuICAgIH1cbiAgICBpbmRleFBhZ2UocGFnZSkge1xuICAgICAgICB2YXIgdGV4dCxcbiAgICAgICAgICAgICQgPSBjaGVlcmlvLmxvYWQocGFnZS5yYXdEYXRhKTtcblxuICAgICAgICB0ZXh0ID0gJCgnLmNvbnRlbnQnKS5odG1sKCk7XG4gICAgICAgIHRleHQgPSBIdG1sLmRlY29kZSh0ZXh0KTtcbiAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcblxuICAgICAgICBwYWdlLnVybCA9IHBhZ2UudXJsLnJlcGxhY2UoJGNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3V0cHV0LCAnJyk7XG5cbiAgICAgICAgdmFyIGRvYyA9IHtcbiAgICAgICAgICAgIHVybDogcGFnZS51cmwsXG4gICAgICAgICAgICB0aXRsZTogcGFnZS5pbmZvcy5jb250ZXh0ICsgJyAtICcgKyBwYWdlLmluZm9zLm5hbWUsXG4gICAgICAgICAgICBib2R5OiB0ZXh0XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kb2N1bWVudHNTdG9yZVtkb2MudXJsXSA9IGRvYztcblxuICAgICAgICB0aGlzLmdldFNlYXJjaEluZGV4KCkuYWRkKGRvYyk7XG4gICAgfVxuICAgIGdlbmVyYXRlU2VhcmNoSW5kZXhKc29uKG91dHB1dEZvbGRlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZnMucmVhZEZpbGUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSArICcvLi4vc3JjL3RlbXBsYXRlcy9wYXJ0aWFscy9zZWFyY2gtaW5kZXguaGJzJyksICd1dGY4JywgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgIHJlamVjdCgnRXJyb3IgZHVyaW5nIHNlYXJjaCBpbmRleCBnZW5lcmF0aW9uJyk7XG4gICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZTphbnkgPSBIYW5kbGViYXJzLmNvbXBpbGUoZGF0YSksXG4gICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBKU09OLnN0cmluZ2lmeSh0aGlzLmdldFNlYXJjaEluZGV4KCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmU6IEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnRzU3RvcmUpXG4gICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgIG91dHB1dEZvbGRlciA9IG91dHB1dEZvbGRlci5yZXBsYWNlKHByb2Nlc3MuY3dkKCksICcnKTtcbiAgICAgICAgICAgICAgICAgICBmcy5vdXRwdXRGaWxlKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpICsgcGF0aC5zZXAgKyBvdXRwdXRGb2xkZXIgKyBwYXRoLnNlcCArICcvanMvc2VhcmNoL3NlYXJjaF9pbmRleC5qcycpLCByZXN1bHQsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGR1cmluZyBzZWFyY2ggaW5kZXggZmlsZSBnZW5lcmF0aW9uICcsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICB9KTtcbiAgICAgICB9KTtcbiAgICB9XG59O1xuIiwiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuXG5jb25zdCBjYXJyaWFnZVJldHVybkxpbmVGZWVkID0gJ1xcclxcbic7XG5jb25zdCBsaW5lRmVlZCA9ICdcXG4nO1xuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5OYW1lV2l0aG91dFNwYWNlQW5kVG9Mb3dlckNhc2UobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyAvZywgJy0nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdEluZGVudChzdHIsIGNvdW50LCBpbmRlbnQ/KTogc3RyaW5nIHtcbiAgICBsZXQgc3RyaXBJbmRlbnQgPSBmdW5jdGlvbihzdHI6IHN0cmluZykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IHN0ci5tYXRjaCgvXlsgXFx0XSooPz1cXFMpL2dtKTtcblxuICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogdXNlIHNwcmVhZCBvcGVyYXRvciB3aGVuIHRhcmdldGluZyBOb2RlLmpzIDZcbiAgICAgICAgY29uc3QgaW5kZW50ID0gTWF0aC5taW4uYXBwbHkoTWF0aCwgbWF0Y2gubWFwKHggPT4geC5sZW5ndGgpKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYF5bIFxcXFx0XXske2luZGVudH19YCwgJ2dtJyk7XG5cbiAgICAgICAgcmV0dXJuIGluZGVudCA+IDAgPyBzdHIucmVwbGFjZShyZSwgJycpIDogc3RyO1xuICAgIH0sXG4gICAgICAgIHJlcGVhdGluZyA9IGZ1bmN0aW9uKG4sIHN0cikge1xuICAgICAgICBzdHIgPSBzdHIgPT09IHVuZGVmaW5lZCA/ICcgJyA6IHN0cjtcblxuICAgICAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEV4cGVjdGVkIFxcYGlucHV0XFxgIHRvIGJlIGEgXFxgc3RyaW5nXFxgLCBnb3QgXFxgJHt0eXBlb2Ygc3RyfVxcYGApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG4gPCAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCBcXGBjb3VudFxcYCB0byBiZSBhIHBvc2l0aXZlIGZpbml0ZSBudW1iZXIsIGdvdCBcXGAke259XFxgYCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmV0ID0gJyc7XG5cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWYgKG4gJiAxKSB7XG4gICAgICAgICAgICAgICAgcmV0ICs9IHN0cjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RyICs9IHN0cjtcbiAgICAgICAgfSB3aGlsZSAoKG4gPj49IDEpKTtcblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG4gICAgaW5kZW50U3RyaW5nID0gZnVuY3Rpb24oc3RyLCBjb3VudCwgaW5kZW50KSB7XG4gICAgICAgIGluZGVudCA9IGluZGVudCA9PT0gdW5kZWZpbmVkID8gJyAnIDogaW5kZW50O1xuICAgICAgICBjb3VudCA9IGNvdW50ID09PSB1bmRlZmluZWQgPyAxIDogY291bnQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCBcXGBpbnB1dFxcYCB0byBiZSBhIFxcYHN0cmluZ1xcYCwgZ290IFxcYCR7dHlwZW9mIHN0cn1cXGBgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY291bnQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCBcXGBjb3VudFxcYCB0byBiZSBhIFxcYG51bWJlclxcYCwgZ290IFxcYCR7dHlwZW9mIGNvdW50fVxcYGApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBpbmRlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCBcXGBpbmRlbnRcXGAgdG8gYmUgYSBcXGBzdHJpbmdcXGAsIGdvdCBcXGAke3R5cGVvZiBpbmRlbnR9XFxgYCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cblxuICAgICAgICBpbmRlbnQgPSBjb3VudCA+IDEgPyByZXBlYXRpbmcoY291bnQsIGluZGVudCkgOiBpbmRlbnQ7XG5cbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eKD8hXFxzKiQpL21nLCBpbmRlbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRlbnRTdHJpbmcoc3RyaXBJbmRlbnQoc3RyKSwgY291bnQgfHwgMCwgaW5kZW50KTtcbn1cblxuLy8gQ3JlYXRlIGEgY29tcGlsZXJIb3N0IG9iamVjdCB0byBhbGxvdyB0aGUgY29tcGlsZXIgdG8gcmVhZCBhbmQgd3JpdGUgZmlsZXNcbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlckhvc3QodHJhbnNwaWxlT3B0aW9uczogYW55KTogdHMuQ29tcGlsZXJIb3N0IHtcblxuICAgIGNvbnN0IGlucHV0RmlsZU5hbWUgPSB0cmFuc3BpbGVPcHRpb25zLmZpbGVOYW1lIHx8ICh0cmFuc3BpbGVPcHRpb25zLmpzeCA/ICdtb2R1bGUudHN4JyA6ICdtb2R1bGUudHMnKTtcblxuICAgIGNvbnN0IGNvbXBpbGVySG9zdDogdHMuQ29tcGlsZXJIb3N0ID0ge1xuICAgICAgICBnZXRTb3VyY2VGaWxlOiAoZmlsZU5hbWUpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWxlTmFtZS5sYXN0SW5kZXhPZignLnRzJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGVOYW1lID09PSAnbGliLmQudHMnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaWxlTmFtZS5zdWJzdHIoLTUpID09PSAnLmQudHMnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShmaWxlTmFtZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lID0gcGF0aC5qb2luKHRyYW5zcGlsZU9wdGlvbnMudHNjb25maWdEaXJlY3RvcnksIGZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGZpbGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBsaWJTb3VyY2UgPSAnJztcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGxpYlNvdXJjZSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlTmFtZSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZGVidWcoZSwgZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVTb3VyY2VGaWxlKGZpbGVOYW1lLCBsaWJTb3VyY2UsIHRyYW5zcGlsZU9wdGlvbnMudGFyZ2V0LCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9LFxuICAgICAgICB3cml0ZUZpbGU6IChuYW1lLCB0ZXh0KSA9PiB7fSxcbiAgICAgICAgZ2V0RGVmYXVsdExpYkZpbGVOYW1lOiAoKSA9PiAnbGliLmQudHMnLFxuICAgICAgICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzOiAoKSA9PiBmYWxzZSxcbiAgICAgICAgZ2V0Q2Fub25pY2FsRmlsZU5hbWU6IGZpbGVOYW1lID0+IGZpbGVOYW1lLFxuICAgICAgICBnZXRDdXJyZW50RGlyZWN0b3J5OiAoKSA9PiAnJyxcbiAgICAgICAgZ2V0TmV3TGluZTogKCkgPT4gJ1xcbicsXG4gICAgICAgIGZpbGVFeGlzdHM6IChmaWxlTmFtZSk6IGJvb2xlYW4gPT4gZmlsZU5hbWUgPT09IGlucHV0RmlsZU5hbWUsXG4gICAgICAgIHJlYWRGaWxlOiAoKSA9PiAnJyxcbiAgICAgICAgZGlyZWN0b3J5RXhpc3RzOiAoKSA9PiB0cnVlLFxuICAgICAgICBnZXREaXJlY3RvcmllczogKCkgPT4gW11cbiAgICB9O1xuICAgIHJldHVybiBjb21waWxlckhvc3Q7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTWFpblNvdXJjZUZvbGRlcihmaWxlczogc3RyaW5nW10pIHtcbiAgICBsZXQgbWFpbkZvbGRlciA9ICcnLFxuICAgICAgICBtYWluRm9sZGVyQ291bnQgPSAwLFxuICAgICAgICByYXdGb2xkZXJzID0gZmlsZXMubWFwKChmaWxlcGF0aCkgPT4ge1xuICAgICAgICAgICAgdmFyIHNob3J0UGF0aCA9IGZpbGVwYXRoLnJlcGxhY2UocHJvY2Vzcy5jd2QoKSArIHBhdGguc2VwLCAnJyk7XG4gICAgICAgICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKHNob3J0UGF0aCk7XG4gICAgICAgIH0pLFxuICAgICAgICBmb2xkZXJzID0ge30sXG4gICAgICAgIGkgPSAwO1xuICAgIHJhd0ZvbGRlcnMgPSBfLnVuaXEocmF3Rm9sZGVycyk7XG4gICAgbGV0IGxlbiA9IHJhd0ZvbGRlcnMubGVuZ3RoO1xuICAgIGZvcihpOyBpPGxlbjsgaSsrKXtcbiAgICAgICAgbGV0IHNlcCA9IHJhd0ZvbGRlcnNbaV0uc3BsaXQocGF0aC5zZXApO1xuICAgICAgICBzZXAubWFwKChmb2xkZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChmb2xkZXJzW2ZvbGRlcl0pIHtcbiAgICAgICAgICAgICAgICBmb2xkZXJzW2ZvbGRlcl0gKz0gMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9sZGVyc1tmb2xkZXJdID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG4gICAgZm9yIChsZXQgZiBpbiBmb2xkZXJzKSB7XG4gICAgICAgIGlmKGZvbGRlcnNbZl0gPiBtYWluRm9sZGVyQ291bnQpIHtcbiAgICAgICAgICAgIG1haW5Gb2xkZXJDb3VudCA9IGZvbGRlcnNbZl07XG4gICAgICAgICAgICBtYWluRm9sZGVyID0gZjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFpbkZvbGRlcjtcbn1cbiIsImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgSGFuZGxlYmFycyBmcm9tICdoYW5kbGViYXJzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL2xvZ2dlcic7XG5cbmV4cG9ydCBsZXQgUm91dGVyUGFyc2VyID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHJvdXRlczogYW55W10gPSBbXSxcbiAgICAgICAgaW5jb21wbGV0ZVJvdXRlcyA9IFtdLFxuICAgICAgICBtb2R1bGVzID0gW10sXG4gICAgICAgIG1vZHVsZXNUcmVlLFxuICAgICAgICByb290TW9kdWxlLFxuICAgICAgICBjbGVhbk1vZHVsZXNUcmVlLFxuICAgICAgICBtb2R1bGVzV2l0aFJvdXRlcyA9IFtdLFxuXG4gICAgICAgIF9hZGRSb3V0ZSA9IGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICAgICAgICByb3V0ZXMucHVzaChyb3V0ZSk7XG4gICAgICAgICAgICByb3V0ZXMgPSBfLnNvcnRCeShfLnVuaXFXaXRoKHJvdXRlcywgXy5pc0VxdWFsKSwgWyduYW1lJ10pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9hZGRJbmNvbXBsZXRlUm91dGUgPSBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgICAgICAgaW5jb21wbGV0ZVJvdXRlcy5wdXNoKHJvdXRlKTtcbiAgICAgICAgICAgIGluY29tcGxldGVSb3V0ZXMgPSBfLnNvcnRCeShfLnVuaXFXaXRoKGluY29tcGxldGVSb3V0ZXMsIF8uaXNFcXVhbCksIFsnbmFtZSddKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfYWRkTW9kdWxlV2l0aFJvdXRlcyA9IGZ1bmN0aW9uKG1vZHVsZU5hbWUsIG1vZHVsZUltcG9ydHMpIHtcbiAgICAgICAgICAgIG1vZHVsZXNXaXRoUm91dGVzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IG1vZHVsZU5hbWUsXG4gICAgICAgICAgICAgICAgaW1wb3J0c05vZGU6IG1vZHVsZUltcG9ydHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbW9kdWxlc1dpdGhSb3V0ZXMgPSBfLnNvcnRCeShfLnVuaXFXaXRoKG1vZHVsZXNXaXRoUm91dGVzLCBfLmlzRXF1YWwpLCBbJ25hbWUnXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FkZE1vZHVsZSA9IGZ1bmN0aW9uKG1vZHVsZU5hbWU6IHN0cmluZywgbW9kdWxlSW1wb3J0cykge1xuICAgICAgICAgICAgbW9kdWxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBtb2R1bGVOYW1lLFxuICAgICAgICAgICAgICAgIGltcG9ydHNOb2RlOiBtb2R1bGVJbXBvcnRzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG1vZHVsZXMgPSBfLnNvcnRCeShfLnVuaXFXaXRoKG1vZHVsZXMsIF8uaXNFcXVhbCksIFsnbmFtZSddKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY2xlYW5SYXdSb3V0ZVBhcnNlZCA9IGZ1bmN0aW9uKHJvdXRlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGxldCByb3V0ZXNXaXRob3V0U3BhY2VzID0gcm91dGUucmVwbGFjZSgvIC9nbSwgJycpLFxuICAgICAgICAgICAgICAgIHRlc3RUcmFpbGluZ0NvbW1hID0gcm91dGVzV2l0aG91dFNwYWNlcy5pbmRleE9mKCd9LF0nKTtcbiAgICAgICAgICAgIGlmICh0ZXN0VHJhaWxpbmdDb21tYSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHJvdXRlc1dpdGhvdXRTcGFjZXMgPSByb3V0ZXNXaXRob3V0U3BhY2VzLnJlcGxhY2UoJ30sXScsICd9XScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uocm91dGVzV2l0aG91dFNwYWNlcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NsZWFuUmF3Um91dGUgPSBmdW5jdGlvbihyb3V0ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICBsZXQgcm91dGVzV2l0aG91dFNwYWNlcyA9IHJvdXRlLnJlcGxhY2UoLyAvZ20sICcnKSxcbiAgICAgICAgICAgICAgICB0ZXN0VHJhaWxpbmdDb21tYSA9IHJvdXRlc1dpdGhvdXRTcGFjZXMuaW5kZXhPZignfSxdJyk7XG4gICAgICAgICAgICBpZiAodGVzdFRyYWlsaW5nQ29tbWEgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICByb3V0ZXNXaXRob3V0U3BhY2VzID0gcm91dGVzV2l0aG91dFNwYWNlcy5yZXBsYWNlKCd9LF0nLCAnfV0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByb3V0ZXNXaXRob3V0U3BhY2VzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRSb290TW9kdWxlID0gZnVuY3Rpb24obW9kdWxlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHJvb3RNb2R1bGUgPSBtb2R1bGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2hhc1JvdXRlck1vZHVsZUluSW1wb3J0cyA9IGZ1bmN0aW9uKGltcG9ydHMpIHtcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSBpbXBvcnRzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihpOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGltcG9ydHNbaV0ubmFtZS5pbmRleE9mKCdSb3V0ZXJNb2R1bGUuZm9yQ2hpbGQnKSAhPT0gLTEgfHxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0c1tpXS5uYW1lLmluZGV4T2YoJ1JvdXRlck1vZHVsZS5mb3JSb290JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBfZml4SW5jb21wbGV0ZVJvdXRlcyA9IGZ1bmN0aW9uKG1pc2NlbGxhbmVvdXNWYXJpYWJsZXMpIHtcbiAgICAgICAgICAgIC8qY29uc29sZS5sb2coJ2ZpeEluY29tcGxldGVSb3V0ZXMnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJvdXRlcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7Ki9cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2cobWlzY2VsbGFuZW91c1ZhcmlhYmxlcyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSBpbmNvbXBsZXRlUm91dGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBtYXRjaGluZ1ZhcmlhYmxlcyA9IFtdO1xuICAgICAgICAgICAgLy8gRm9yIGVhY2ggaW5jb21wbGV0ZVJvdXRlLCBzY2FuIGlmIG9uZSBtaXNjIHZhcmlhYmxlIGlzIGluIGNvZGVcbiAgICAgICAgICAgIC8vIGlmIG9rLCB0cnkgcmVjcmVhdGluZyBjb21wbGV0ZSByb3V0ZVxuICAgICAgICAgICAgZm9yIChpOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGogPSAwLFxuICAgICAgICAgICAgICAgICAgICBsZW5nID0gbWlzY2VsbGFuZW91c1ZhcmlhYmxlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChqOyBqPGxlbmc7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5jb21wbGV0ZVJvdXRlc1tpXS5kYXRhLmluZGV4T2YobWlzY2VsbGFuZW91c1ZhcmlhYmxlc1tqXS5uYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmb3VuZCBvbmUgbWlzYyB2YXIgaW5zaWRlIGluY29tcGxldGVSb3V0ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobWlzY2VsbGFuZW91c1ZhcmlhYmxlc1tqXS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nVmFyaWFibGVzLnB1c2gobWlzY2VsbGFuZW91c1ZhcmlhYmxlc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9DbGVhbiBpbmNvbXBsZXRlUm91dGVcbiAgICAgICAgICAgICAgICBpbmNvbXBsZXRlUm91dGVzW2ldLmRhdGEgPSBpbmNvbXBsZXRlUm91dGVzW2ldLmRhdGEucmVwbGFjZSgnWycsICcnKTtcbiAgICAgICAgICAgICAgICBpbmNvbXBsZXRlUm91dGVzW2ldLmRhdGEgPSBpbmNvbXBsZXRlUm91dGVzW2ldLmRhdGEucmVwbGFjZSgnXScsICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qY29uc29sZS5sb2coaW5jb21wbGV0ZVJvdXRlcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtYXRjaGluZ1ZhcmlhYmxlcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7Ki9cblxuICAgICAgICB9LFxuXG4gICAgICAgIF9saW5rTW9kdWxlc0FuZFJvdXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLypjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbGlua01vZHVsZXNBbmRSb3V0ZXM6ICcpO1xuICAgICAgICAgICAgLy9zY2FuIGVhY2ggbW9kdWxlIGltcG9ydHMgQVNUIGZvciBlYWNoIHJvdXRlcywgYW5kIGxpbmsgcm91dGVzIHdpdGggbW9kdWxlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbGlua01vZHVsZXNBbmRSb3V0ZXMgcm91dGVzOiAnLCByb3V0ZXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJycpOyovXG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0gbW9kdWxlc1dpdGhSb3V0ZXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfLmZvckVhY2gobW9kdWxlc1dpdGhSb3V0ZXNbaV0uaW1wb3J0c05vZGUsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmluaXRpYWxpemVyLmVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5mb3JFYWNoKG5vZGUuaW5pdGlhbGl6ZXIuZWxlbWVudHMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9maW5kIGVsZW1lbnQgd2l0aCBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuYXJndW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmZvckVhY2goZWxlbWVudC5hcmd1bWVudHMsIGZ1bmN0aW9uKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5mb3JFYWNoKHJvdXRlcywgZnVuY3Rpb24ocm91dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoYXJndW1lbnQudGV4dCAmJiByb3V0ZS5uYW1lID09PSBhcmd1bWVudC50ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3V0ZS5tb2R1bGUgPSBtb2R1bGVzV2l0aFJvdXRlc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qY29uc29sZS5sb2coJycpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2VuZCBsaW5rTW9kdWxlc0FuZFJvdXRlczogJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qocm91dGVzLCB7IGRlcHRoOiAxMCB9KSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7Ki9cbiAgICAgICAgfSxcblxuICAgICAgICBmb3VuZFJvdXRlV2l0aE1vZHVsZU5hbWUgPSBmdW5jdGlvbihtb2R1bGVOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5maW5kKHJvdXRlcywgeydtb2R1bGUnOiBtb2R1bGVOYW1lfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm91bmRMYXp5TW9kdWxlV2l0aFBhdGggPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgICAgICAvL3BhdGggaXMgbGlrZSBhcHAvY3VzdG9tZXJzL2N1c3RvbWVycy5tb2R1bGUjQ3VzdG9tZXJzTW9kdWxlXG4gICAgICAgICAgICBsZXQgc3BsaXQgPSBwYXRoLnNwbGl0KCcjJyksXG4gICAgICAgICAgICAgICAgbGF6eU1vZHVsZVBhdGggPSBzcGxpdFswXSxcbiAgICAgICAgICAgICAgICBsYXp5TW9kdWxlTmFtZSA9IHNwbGl0WzFdO1xuICAgICAgICAgICAgcmV0dXJuIGxhenlNb2R1bGVOYW1lO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jb25zdHJ1Y3RSb3V0ZXNUcmVlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICAgIC8qY29uc29sZS5sb2coJ2NvbnN0cnVjdFJvdXRlc1RyZWUgbW9kdWxlczogJywgbW9kdWxlcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29uc3RydWN0Um91dGVzVHJlZSBtb2R1bGVzV2l0aFJvdXRlczogJywgbW9kdWxlc1dpdGhSb3V0ZXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvbnN0cnVjdFJvdXRlc1RyZWUgbW9kdWxlc1RyZWU6ICcsIHV0aWwuaW5zcGVjdChtb2R1bGVzVHJlZSwgeyBkZXB0aDogMTAgfSkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJycpOyovXG5cbiAgICAgICAgICAgIC8vIHJvdXRlc1tdIGNvbnRhaW5zIHJvdXRlcyB3aXRoIG1vZHVsZSBsaW5rXG4gICAgICAgICAgICAvLyBtb2R1bGVzVHJlZSBjb250YWlucyBtb2R1bGVzIHRyZWVcbiAgICAgICAgICAgIC8vIG1ha2UgYSBmaW5hbCByb3V0ZXMgdHJlZSB3aXRoIHRoYXRcbiAgICAgICAgICAgIGNsZWFuTW9kdWxlc1RyZWUgPSBfLmNsb25lRGVlcChtb2R1bGVzVHJlZSk7XG5cbiAgICAgICAgICAgIGxldCBtb2R1bGVzQ2xlYW5lciA9IGZ1bmN0aW9uKGFycikge1xuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgaW4gYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyW2ldLmltcG9ydHNOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGFycltpXS5pbXBvcnRzTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcnJbaV0ucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGFycltpXS5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihhcnJbaV0uY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVzQ2xlYW5lcihhcnJbaV0uY2hpbGRyZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBtb2R1bGVzQ2xlYW5lcihjbGVhbk1vZHVsZXNUcmVlKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJycpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnICBjbGVhbk1vZHVsZXNUcmVlIGxpZ2h0OiAnLCB1dGlsLmluc3BlY3QoY2xlYW5Nb2R1bGVzVHJlZSwgeyBkZXB0aDogMTAgfSkpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnJyk7XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2cocm91dGVzKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJycpO1xuXG4gICAgICAgICAgICB2YXIgcm91dGVzVHJlZSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnPHJvb3Q+JyxcbiAgICAgICAgICAgICAgICBraW5kOiAnbW9kdWxlJyxcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6IHJvb3RNb2R1bGUsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsZXQgbG9vcE1vZHVsZXNQYXJzZXIgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vSWYgbW9kdWxlIGhhcyBjaGlsZCBtb2R1bGVzXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJyAgIElmIG1vZHVsZSBoYXMgY2hpbGQgbW9kdWxlcycpO1xuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgaW4gbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJvdXRlID0gZm91bmRSb3V0ZVdpdGhNb2R1bGVOYW1lKG5vZGUuY2hpbGRyZW5baV0ubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocm91dGUgJiYgcm91dGUuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlLmNoaWxkcmVuID0gSlNPTi5wYXJzZShyb3V0ZS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcm91dGUuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3V0ZS5raW5kID0gJ21vZHVsZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm91dGVzVHJlZS5jaGlsZHJlbi5wdXNoKHJvdXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuW2ldLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcE1vZHVsZXNQYXJzZXIobm9kZS5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL2Vsc2Ugcm91dGVzIGFyZSBkaXJlY3RseSBpbnNpZGUgdGhlIG1vZHVsZVxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcgICBlbHNlIHJvdXRlcyBhcmUgZGlyZWN0bHkgaW5zaWRlIHRoZSByb290IG1vZHVsZScpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmF3Um91dGVzID0gZm91bmRSb3V0ZVdpdGhNb2R1bGVOYW1lKG5vZGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyYXdSb3V0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByb3V0ZXMgPSBKU09OLnBhcnNlKHJhd1JvdXRlcy5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb3V0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbiA9IHJvdXRlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJvdXRlID0gcm91dGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm91dGVzW2ldLmNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm91dGVzVHJlZS5jaGlsZHJlbi5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kOiAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHJvdXRlc1tpXS5jb21wb25lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcm91dGVzW2ldLnBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcgIHJvb3RNb2R1bGU6ICcsIHJvb3RNb2R1bGUpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnJyk7XG5cbiAgICAgICAgICAgIGxldCBzdGFydE1vZHVsZSA9IF8uZmluZChjbGVhbk1vZHVsZXNUcmVlLCB7J25hbWUnOiByb290TW9kdWxlfSk7XG5cbiAgICAgICAgICAgIGlmIChzdGFydE1vZHVsZSkge1xuICAgICAgICAgICAgICAgIGxvb3BNb2R1bGVzUGFyc2VyKHN0YXJ0TW9kdWxlKTtcbiAgICAgICAgICAgICAgICAvL0xvb3AgdHdpY2UgZm9yIHJvdXRlcyB3aXRoIGxhenkgbG9hZGluZ1xuICAgICAgICAgICAgICAgIC8vbG9vcE1vZHVsZXNQYXJzZXIocm91dGVzVHJlZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qY29uc29sZS5sb2coJycpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJyAgcm91dGVzVHJlZTogJywgcm91dGVzVHJlZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7Ki9cblxuICAgICAgICAgICAgdmFyIGNsZWFuZWRSb3V0ZXNUcmVlID0gbnVsbDtcblxuICAgICAgICAgICAgdmFyIGNsZWFuUm91dGVzVHJlZSA9IGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBpIGluIHJvdXRlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByb3V0ZXMgPSByb3V0ZS5jaGlsZHJlbltpXS5yb3V0ZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByb3V0ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2xlYW5lZFJvdXRlc1RyZWUgPSBjbGVhblJvdXRlc1RyZWUocm91dGVzVHJlZSk7XG5cbiAgICAgICAgICAgIC8vVHJ5IHVwZGF0aW5nIHJvdXRlcyB3aXRoIGxhenkgbG9hZGluZ1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdUcnkgdXBkYXRpbmcgcm91dGVzIHdpdGggbGF6eSBsb2FkaW5nJyk7XG5cbiAgICAgICAgICAgIGxldCBsb29wUm91dGVzUGFyc2VyID0gZnVuY3Rpb24ocm91dGUpIHtcbiAgICAgICAgICAgICAgICBpZihyb3V0ZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgaW4gcm91dGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb3V0ZS5jaGlsZHJlbltpXS5sb2FkQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBmb3VuZExhenlNb2R1bGVXaXRoUGF0aChyb3V0ZS5jaGlsZHJlbltpXS5sb2FkQ2hpbGRyZW4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUgPSBfLmZpbmQoY2xlYW5Nb2R1bGVzVHJlZSwgeyduYW1lJzogY2hpbGR9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBfcmF3TW9kdWxlOmFueSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmF3TW9kdWxlLmtpbmQgPSAnbW9kdWxlJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3Jhd01vZHVsZS5jaGlsZHJlbiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmF3TW9kdWxlLm1vZHVsZSA9IG1vZHVsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbG9vcEluc2lkZSA9IGZ1bmN0aW9uKG1vZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYobW9kLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpIGluIG1vZC5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcm91dGUgPSBmb3VuZFJvdXRlV2l0aE1vZHVsZU5hbWUobW9kLmNoaWxkcmVuW2ldLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJvdXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdXRlLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3V0ZS5jaGlsZHJlbiA9IEpTT04ucGFyc2Uocm91dGUuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJvdXRlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm91dGUua2luZCA9ICdtb2R1bGUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9yYXdNb2R1bGUuY2hpbGRyZW5baV0gPSByb3V0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb29wSW5zaWRlKG1vZHVsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm91dGUuY2hpbGRyZW5baV0uY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm91dGUuY2hpbGRyZW5baV0uY2hpbGRyZW4ucHVzaChfcmF3TW9kdWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsb29wUm91dGVzUGFyc2VyKHJvdXRlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvb3BSb3V0ZXNQYXJzZXIoY2xlYW5lZFJvdXRlc1RyZWUpO1xuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJyAgY2xlYW5lZFJvdXRlc1RyZWU6ICcsIHV0aWwuaW5zcGVjdChjbGVhbmVkUm91dGVzVHJlZSwgeyBkZXB0aDogMTAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gY2xlYW5lZFJvdXRlc1RyZWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NvbnN0cnVjdE1vZHVsZXNUcmVlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2NvbnN0cnVjdE1vZHVsZXNUcmVlJyk7XG4gICAgICAgICAgICBsZXQgZ2V0TmVzdGVkQ2hpbGRyZW4gPSBmdW5jdGlvbihhcnIsIHBhcmVudD8pIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0ID0gW11cbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgaW4gYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGFycltpXS5wYXJlbnQgPT09IHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gZ2V0TmVzdGVkQ2hpbGRyZW4oYXJyLCBhcnJbaV0ubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycltpXS5jaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChhcnJbaV0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vU2NhbiBlYWNoIG1vZHVsZSBhbmQgYWRkIHBhcmVudCBwcm9wZXJ0eVxuICAgICAgICAgICAgXy5mb3JFYWNoKG1vZHVsZXMsIGZ1bmN0aW9uKGZpcnN0TG9vcE1vZHVsZSkge1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChmaXJzdExvb3BNb2R1bGUuaW1wb3J0c05vZGUsIGZ1bmN0aW9uKGltcG9ydE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5mb3JFYWNoKG1vZHVsZXMsIGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIG1vZHVsZS5uYW1lID09PSBpbXBvcnROb2RlLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUucGFyZW50ID0gZmlyc3RMb29wTW9kdWxlLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG1vZHVsZXNUcmVlID0gZ2V0TmVzdGVkQ2hpbGRyZW4obW9kdWxlcyk7XG4gICAgICAgICAgICAvKmNvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlbmQgY29uc3RydWN0TW9kdWxlc1RyZWUnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1vZHVsZXNUcmVlKTsqL1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZW5lcmF0ZVJvdXRlc0luZGV4ID0gZnVuY3Rpb24ob3V0cHV0Rm9sZGVyLCByb3V0ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgZnMucmVhZEZpbGUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSArICcvLi4vc3JjL3RlbXBsYXRlcy9wYXJ0aWFscy9yb3V0ZXMtaW5kZXguaGJzJyksICd1dGY4JywgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdFcnJvciBkdXJpbmcgcm91dGVzIGluZGV4IGdlbmVyYXRpb24nKTtcbiAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcGxhdGU6YW55ID0gSGFuZGxlYmFycy5jb21waWxlKGRhdGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlczogSlNPTi5zdHJpbmdpZnkocm91dGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEZvbGRlciA9IG91dHB1dEZvbGRlci5yZXBsYWNlKHByb2Nlc3MuY3dkKCksICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgZnMub3V0cHV0RmlsZShwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSArIHBhdGguc2VwICsgb3V0cHV0Rm9sZGVyICsgcGF0aC5zZXAgKyAnL2pzL3JvdXRlcy9yb3V0ZXNfaW5kZXguanMnKSwgcmVzdWx0LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGR1cmluZyByb3V0ZXMgaW5kZXggZmlsZSBnZW5lcmF0aW9uICcsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIH0pO1xuICAgICAgIH0sXG5cbiAgICAgICBfcm91dGVzTGVuZ3RoID0gZnVuY3Rpb24oKTogbnVtYmVyIHtcbiAgICAgICAgICAgdmFyIF9uID0gMDtcblxuICAgICAgICAgICBsZXQgcm91dGVzUGFyc2VyID0gZnVuY3Rpb24ocm91dGUpIHtcbiAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygcm91dGUucGF0aCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICBfbiArPSAxO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgaWYgKHJvdXRlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgZm9yKHZhciBqIGluIHJvdXRlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJvdXRlc1BhcnNlcihyb3V0ZS5jaGlsZHJlbltqXSk7XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIGZvcih2YXIgaSBpbiByb3V0ZXMpIHtcbiAgICAgICAgICAgICAgIHJvdXRlc1BhcnNlcihyb3V0ZXNbaV0pO1xuICAgICAgICAgICB9XG5cbiAgICAgICAgICAgcmV0dXJuIF9uO1xuICAgICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGluY29tcGxldGVSb3V0ZXM6IGluY29tcGxldGVSb3V0ZXMsXG4gICAgICAgIGFkZFJvdXRlOiBfYWRkUm91dGUsXG4gICAgICAgIGFkZEluY29tcGxldGVSb3V0ZTogX2FkZEluY29tcGxldGVSb3V0ZSxcbiAgICAgICAgYWRkTW9kdWxlV2l0aFJvdXRlczogX2FkZE1vZHVsZVdpdGhSb3V0ZXMsXG4gICAgICAgIGFkZE1vZHVsZTogX2FkZE1vZHVsZSxcbiAgICAgICAgY2xlYW5SYXdSb3V0ZVBhcnNlZDogX2NsZWFuUmF3Um91dGVQYXJzZWQsXG4gICAgICAgIGNsZWFuUmF3Um91dGU6IF9jbGVhblJhd1JvdXRlLFxuICAgICAgICBzZXRSb290TW9kdWxlOiBfc2V0Um9vdE1vZHVsZSxcbiAgICAgICAgcHJpbnRSb3V0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3ByaW50Um91dGVzOiAnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJvdXRlcyk7XG4gICAgICAgIH0sXG4gICAgICAgIHByaW50TW9kdWxlc1JvdXRlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHJpbnRNb2R1bGVzUm91dGVzOiAnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1vZHVsZXNXaXRoUm91dGVzKTtcbiAgICAgICAgfSxcbiAgICAgICAgcm91dGVzTGVuZ3RoOiBfcm91dGVzTGVuZ3RoLFxuICAgICAgICBoYXNSb3V0ZXJNb2R1bGVJbkltcG9ydHM6IF9oYXNSb3V0ZXJNb2R1bGVJbkltcG9ydHMsXG4gICAgICAgIGZpeEluY29tcGxldGVSb3V0ZXM6IF9maXhJbmNvbXBsZXRlUm91dGVzLFxuICAgICAgICBsaW5rTW9kdWxlc0FuZFJvdXRlczogX2xpbmtNb2R1bGVzQW5kUm91dGVzLFxuICAgICAgICBjb25zdHJ1Y3RSb3V0ZXNUcmVlOiBfY29uc3RydWN0Um91dGVzVHJlZSxcbiAgICAgICAgY29uc3RydWN0TW9kdWxlc1RyZWU6IF9jb25zdHJ1Y3RNb2R1bGVzVHJlZSxcbiAgICAgICAgZ2VuZXJhdGVSb3V0ZXNJbmRleDogX2dlbmVyYXRlUm91dGVzSW5kZXhcbiAgICB9XG59KSgpO1xuIiwiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhcmlhYmxlTGlrZShub2RlOiBOb2RlKTogbm9kZSBpcyBWYXJpYWJsZUxpa2VEZWNsYXJhdGlvbiB7XG4gICBpZiAobm9kZSkge1xuICAgICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5CaW5kaW5nRWxlbWVudDpcbiAgICAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkVudW1NZW1iZXI6XG4gICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5QYXJhbWV0ZXI6XG4gICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFzc2lnbm1lbnQ6XG4gICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eURlY2xhcmF0aW9uOlxuICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUHJvcGVydHlTaWduYXR1cmU6XG4gICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TaG9ydGhhbmRQcm9wZXJ0eUFzc2lnbm1lbnQ6XG4gICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5WYXJpYWJsZURlY2xhcmF0aW9uOlxuICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgfVxuICAgfVxuICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc29tZTxUPihhcnJheTogVFtdLCBwcmVkaWNhdGU/OiAodmFsdWU6IFQpID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCB2IG9mIGFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZSh2KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXkubGVuZ3RoID4gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25jYXRlbmF0ZTxUPihhcnJheTE6IFRbXSwgYXJyYXkyOiBUW10pOiBUW10ge1xuICAgIGlmICghc29tZShhcnJheTIpKSByZXR1cm4gYXJyYXkxO1xuICAgIGlmICghc29tZShhcnJheTEpKSByZXR1cm4gYXJyYXkyO1xuICAgIHJldHVybiBbLi4uYXJyYXkxLCAuLi5hcnJheTJdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQYXJhbWV0ZXIobm9kZTogTm9kZSk6IG5vZGUgaXMgUGFyYW1ldGVyRGVjbGFyYXRpb24ge1xuICAgIHJldHVybiBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuUGFyYW1ldGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SlNEb2NQYXJhbWV0ZXJUYWdzKHBhcmFtOiBOb2RlKTogSlNEb2NQYXJhbWV0ZXJUYWdbXSB7XG4gICAgaWYgKCFpc1BhcmFtZXRlcihwYXJhbSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgZnVuYyA9IHBhcmFtLnBhcmVudCBhcyBGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbjtcbiAgICBjb25zdCB0YWdzID0gZ2V0SlNEb2NUYWdzKGZ1bmMsIHRzLlN5bnRheEtpbmQuSlNEb2NQYXJhbWV0ZXJUYWcpIGFzIEpTRG9jUGFyYW1ldGVyVGFnW107XG4gICAgaWYgKCFwYXJhbS5uYW1lKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgYW4gYW5vbnltb3VzIGpzZG9jIHBhcmFtIGZyb20gYSBgZnVuY3Rpb24odHlwZTEsIHR5cGUyKTogdHlwZTNgIHNwZWNpZmljYXRpb25cbiAgICAgICAgY29uc3QgaSA9IGZ1bmMucGFyYW1ldGVycy5pbmRleE9mKHBhcmFtKTtcbiAgICAgICAgY29uc3QgcGFyYW1UYWdzID0gZmlsdGVyKHRhZ3MsIHRhZyA9PiB0YWcua2luZCA9PT0gdHMuU3ludGF4S2luZC5KU0RvY1BhcmFtZXRlclRhZyk7XG4gICAgICAgIGlmIChwYXJhbVRhZ3MgJiYgMCA8PSBpICYmIGkgPCBwYXJhbVRhZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3BhcmFtVGFnc1tpXV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAocGFyYW0ubmFtZS5raW5kID09PSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IChwYXJhbS5uYW1lIGFzIElkZW50aWZpZXIpLnRleHQ7XG4gICAgICAgIHJldHVybiBmaWx0ZXIodGFncywgdGFnID0+IHRhZy5raW5kID09PSB0cy5TeW50YXhLaW5kLkpTRG9jUGFyYW1ldGVyVGFnICYmIHRhZy5wYXJhbWV0ZXJOYW1lLnRleHQgPT09IG5hbWUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gVE9ETzogaXQncyBhIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXIsIHNvIGl0IHNob3VsZCBsb29rIHVwIGFuIFwib2JqZWN0IHR5cGVcIiBzZXJpZXMgb2YgbXVsdGlwbGUgbGluZXNcbiAgICAgICAgLy8gQnV0IG11bHRpLWxpbmUgb2JqZWN0IHR5cGVzIGFyZW4ndCBzdXBwb3J0ZWQgeWV0IGVpdGhlclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuZXhwb3J0IGxldCBKU0RvY1RhZ3NQYXJzZXIgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBsZXQgX2dldEpTRG9jcyA9IChub2RlOiBOb2RlKTooSlNEb2MgfCBKU0RvY1RhZylbXSA9PiB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2dldEpTRG9jczogJywgbm9kZSk7XG4gICAgICAgIGxldCBjYWNoZTogKEpTRG9jIHwgSlNEb2NUYWcpW10gPSBub2RlLmpzRG9jQ2FjaGU7XG4gICAgICAgIGlmICghY2FjaGUpIHtcbiAgICAgICAgICAgIGdldEpTRG9jc1dvcmtlcihub2RlKTtcbiAgICAgICAgICAgIG5vZGUuanNEb2NDYWNoZSA9IGNhY2hlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWNoZTtcblxuICAgICAgICBmdW5jdGlvbiBnZXRKU0RvY3NXb3JrZXIobm9kZTogTm9kZSkge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgICAgICAvLyBUcnkgdG8gcmVjb2duaXplIHRoaXMgcGF0dGVybiB3aGVuIG5vZGUgaXMgaW5pdGlhbGl6ZXIgb2YgdmFyaWFibGUgZGVjbGFyYXRpb24gYW5kIEpTRG9jIGNvbW1lbnRzIGFyZSBvbiBjb250YWluaW5nIHZhcmlhYmxlIHN0YXRlbWVudC5cbiAgICAgICAgICAgIC8vIC8qKlxuICAgICAgICAgICAgLy8gICAqIEBwYXJhbSB7bnVtYmVyfSBuYW1lXG4gICAgICAgICAgICAvLyAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgICAgICAgIC8vICAgKi9cbiAgICAgICAgICAgIC8vIHZhciB4ID0gZnVuY3Rpb24obmFtZSkgeyByZXR1cm4gbmFtZS5sZW5ndGg7IH1cbiAgICAgICAgICAgIGNvbnN0IGlzSW5pdGlhbGl6ZXJPZlZhcmlhYmxlRGVjbGFyYXRpb25JblN0YXRlbWVudCA9XG4gICAgICAgICAgICAgICAgaXNWYXJpYWJsZUxpa2UocGFyZW50KSAmJlxuICAgICAgICAgICAgICAgIHBhcmVudC5pbml0aWFsaXplciA9PT0gbm9kZSAmJlxuICAgICAgICAgICAgICAgIHBhcmVudC5wYXJlbnQucGFyZW50LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVmFyaWFibGVTdGF0ZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBpc1ZhcmlhYmxlT2ZWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50ID0gaXNWYXJpYWJsZUxpa2Uobm9kZSkgJiZcbiAgICAgICAgICAgICAgICBwYXJlbnQucGFyZW50LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVmFyaWFibGVTdGF0ZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCB2YXJpYWJsZVN0YXRlbWVudE5vZGUgPVxuICAgICAgICAgICAgICAgIGlzSW5pdGlhbGl6ZXJPZlZhcmlhYmxlRGVjbGFyYXRpb25JblN0YXRlbWVudCA/IHBhcmVudC5wYXJlbnQucGFyZW50IDpcbiAgICAgICAgICAgICAgICBpc1ZhcmlhYmxlT2ZWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50ID8gcGFyZW50LnBhcmVudCA6XG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKHZhcmlhYmxlU3RhdGVtZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIGdldEpTRG9jc1dvcmtlcih2YXJpYWJsZVN0YXRlbWVudE5vZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBbHNvIHJlY29nbml6ZSB3aGVuIHRoZSBub2RlIGlzIHRoZSBSSFMgb2YgYW4gYXNzaWdubWVudCBleHByZXNzaW9uXG4gICAgICAgICAgICBjb25zdCBpc1NvdXJjZU9mQXNzaWdubWVudEV4cHJlc3Npb25TdGF0ZW1lbnQgPVxuICAgICAgICAgICAgICAgIHBhcmVudCAmJiBwYXJlbnQucGFyZW50ICYmXG4gICAgICAgICAgICAgICAgcGFyZW50LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQmluYXJ5RXhwcmVzc2lvbiAmJlxuICAgICAgICAgICAgICAgIChwYXJlbnQgYXMgQmluYXJ5RXhwcmVzc2lvbikub3BlcmF0b3JUb2tlbi5raW5kID09PSB0cy5TeW50YXhLaW5kLkVxdWFsc1Rva2VuICYmXG4gICAgICAgICAgICAgICAgcGFyZW50LnBhcmVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLkV4cHJlc3Npb25TdGF0ZW1lbnQ7XG4gICAgICAgICAgICBpZiAoaXNTb3VyY2VPZkFzc2lnbm1lbnRFeHByZXNzaW9uU3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgZ2V0SlNEb2NzV29ya2VyKHBhcmVudC5wYXJlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpc01vZHVsZURlY2xhcmF0aW9uID0gbm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLk1vZHVsZURlY2xhcmF0aW9uICYmXG4gICAgICAgICAgICAgICAgcGFyZW50ICYmIHBhcmVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLk1vZHVsZURlY2xhcmF0aW9uO1xuICAgICAgICAgICAgY29uc3QgaXNQcm9wZXJ0eUFzc2lnbm1lbnRFeHByZXNzaW9uID0gcGFyZW50ICYmIHBhcmVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QXNzaWdubWVudDtcbiAgICAgICAgICAgIGlmIChpc01vZHVsZURlY2xhcmF0aW9uIHx8IGlzUHJvcGVydHlBc3NpZ25tZW50RXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgIGdldEpTRG9jc1dvcmtlcihwYXJlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQdWxsIHBhcmFtZXRlciBjb21tZW50cyBmcm9tIGRlY2xhcmluZyBmdW5jdGlvbiBhcyB3ZWxsXG4gICAgICAgICAgICBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLlBhcmFtZXRlcikge1xuICAgICAgICAgICAgICAgIGNhY2hlID0gY29uY2F0ZW5hdGUoY2FjaGUsIGdldEpTRG9jUGFyYW1ldGVyVGFncyhub2RlKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpc1ZhcmlhYmxlTGlrZShub2RlKSAmJiBub2RlLmluaXRpYWxpemVyKSB7XG4gICAgICAgICAgICAgICAgY2FjaGUgPSBjb25jYXRlbmF0ZShjYWNoZSwgbm9kZS5pbml0aWFsaXplci5qc0RvYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlID0gY29uY2F0ZW5hdGUoY2FjaGUsIG5vZGUuanNEb2MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0SlNEb2NzOiBfZ2V0SlNEb2NzXG4gICAgfVxufSkoKTtcbiIsImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5sZXQgY29kZTogc3RyaW5nW10gPSBbXTtcblxuZXhwb3J0IGxldCBnZW4gPSAoZnVuY3Rpb24gKCkge1xuICAgIGxldCB0bXA6IHR5cGVvZiBjb2RlID0gW107XG5cbiAgICByZXR1cm4gKHRva2VuID0gbnVsbCkgPT4ge1xuICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcgISB0b2tlbicpO1xuICAgICAgICAgICAgcmV0dXJuIGNvZGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodG9rZW4gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcgXFxuJyk7XG4gICAgICAgICAgICBjb2RlLnB1c2godG1wLmpvaW4oJycpKTtcbiAgICAgICAgICAgIHRtcCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29kZS5wdXNoKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29kZTtcbiAgICB9XG59ICgpKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlKG5vZGU6IGFueSkge1xuICAgIGNvZGUgPSBbXTtcbiAgICB2aXNpdEFuZFJlY29nbml6ZShub2RlKTtcbiAgICByZXR1cm4gY29kZS5qb2luKCcnKTtcbn1cblxuZnVuY3Rpb24gdmlzaXRBbmRSZWNvZ25pemUobm9kZTogYW55LCBkZXB0aCA9IDApIHtcbiAgICByZWNvZ25pemUobm9kZSk7XG4gICAgZGVwdGgrKztcbiAgICBub2RlLmdldENoaWxkcmVuKCkuZm9yRWFjaChjID0+IHZpc2l0QW5kUmVjb2duaXplKGMsIGRlcHRoKSk7XG59XG5cbmZ1bmN0aW9uIHJlY29nbml6ZShub2RlOiBhbnkpIHtcblxuICAgIC8vY29uc29sZS5sb2coJ3JlY29nbml6aW5nLi4uJywgdHMuU3ludGF4S2luZFtub2RlLmtpbmQrJyddKTtcblxuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5GaXJzdExpdGVyYWxUb2tlbjpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXI6XG4gICAgICAgICAgICBnZW4oJ1xcXCInKTtcbiAgICAgICAgICAgIGdlbihub2RlLnRleHQpO1xuICAgICAgICAgICAgZ2VuKCdcXFwiJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgICAgICBnZW4oJ1xcXCInKTtcbiAgICAgICAgICAgIGdlbihub2RlLnRleHQpO1xuICAgICAgICAgICAgZ2VuKCdcXFwiJyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbjpcbiAgICAgICAgICAgIGJyZWFrO1xuXG5cbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkltcG9ydEtleXdvcmQ6XG4gICAgICAgICAgICBnZW4oJ2ltcG9ydCcpO1xuICAgICAgICAgICAgZ2VuKCcgJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZyb21LZXl3b3JkOlxuICAgICAgICAgICAgZ2VuKCdmcm9tJyk7XG4gICAgICAgICAgICBnZW4oJyAnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuRXhwb3J0S2V5d29yZDpcbiAgICAgICAgICAgIGdlbignXFxuJyk7XG4gICAgICAgICAgICBnZW4oJ2V4cG9ydCcpO1xuICAgICAgICAgICAgZ2VuKCcgJyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQ2xhc3NLZXl3b3JkOlxuICAgICAgICAgICAgZ2VuKCdjbGFzcycpO1xuICAgICAgICAgICAgZ2VuKCcgJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlRoaXNLZXl3b3JkOlxuICAgICAgICAgICAgZ2VuKCd0aGlzJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNvbnN0cnVjdG9yS2V5d29yZDpcbiAgICAgICAgICAgIGdlbignY29uc3RydWN0b3InKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5GYWxzZUtleXdvcmQ6XG4gICAgICAgICAgICBnZW4oJ2ZhbHNlJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlRydWVLZXl3b3JkOlxuICAgICAgICAgICAgZ2VuKCd0cnVlJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk51bGxLZXl3b3JkOlxuICAgICAgICAgICAgZ2VuKCdudWxsJyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQXRUb2tlbjpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUGx1c1Rva2VuOlxuICAgICAgICAgICAgZ2VuKCcrJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkVxdWFsc0dyZWF0ZXJUaGFuVG9rZW46XG4gICAgICAgICAgICBnZW4oJyA9PiAnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5PcGVuUGFyZW5Ub2tlbjpcbiAgICAgICAgICAgIGdlbignKCcpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkltcG9ydENsYXVzZTpcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk9iamVjdExpdGVyYWxFeHByZXNzaW9uOlxuICAgICAgICAgICAgZ2VuKCd7Jyk7XG4gICAgICAgICAgICBnZW4oJyAnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQmxvY2s6XG4gICAgICAgICAgICBnZW4oJ3snKTtcbiAgICAgICAgICAgIGdlbignXFxuJyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuOlxuICAgICAgICAgICAgZ2VuKCd9Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNsb3NlUGFyZW5Ub2tlbjpcbiAgICAgICAgICAgIGdlbignKScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5PcGVuQnJhY2tldFRva2VuOlxuICAgICAgICAgICAgZ2VuKCdbJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNsb3NlQnJhY2tldFRva2VuOlxuICAgICAgICAgICAgZ2VuKCddJyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU2VtaWNvbG9uVG9rZW46XG4gICAgICAgICAgICBnZW4oJzsnKTtcbiAgICAgICAgICAgIGdlbignXFxuJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNvbW1hVG9rZW46XG4gICAgICAgICAgICBnZW4oJywnKTtcbiAgICAgICAgICAgIGdlbignICcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Db2xvblRva2VuOlxuICAgICAgICAgICAgZ2VuKCcgJyk7XG4gICAgICAgICAgICBnZW4oJzonKTtcbiAgICAgICAgICAgIGdlbignICcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Eb3RUb2tlbjpcbiAgICAgICAgICAgIGdlbignLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Eb1N0YXRlbWVudDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuRGVjb3JhdG9yOlxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZpcnN0QXNzaWdubWVudDpcbiAgICAgICAgICAgIGdlbignID0gJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZpcnN0UHVuY3R1YXRpb246XG4gICAgICAgICAgICBnZW4oJyAnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Qcml2YXRlS2V5d29yZDpcbiAgICAgICAgICAgIGdlbigncHJpdmF0ZScpO1xuICAgICAgICAgICAgZ2VuKCcgJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlB1YmxpY0tleXdvcmQ6XG4gICAgICAgICAgICBnZW4oJ3B1YmxpYycpO1xuICAgICAgICAgICAgZ2VuKCcgJyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IHJlYWRDb25maWdGaWxlLCBmb3JtYXREaWFnbm9zdGljcywgRm9ybWF0RGlhZ25vc3RpY3NIb3N0LCBzeXMgfSBmcm9tICd0eXBlc2NyaXB0JztcblxuY29uc3QgZ2V0Q3VycmVudERpcmVjdG9yeSA9IHN5cy5nZXRDdXJyZW50RGlyZWN0b3J5O1xuY29uc3QgdXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcyA9IHN5cy51c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzO1xuY29uc3QgbmV3TGluZSA9IHN5cy5uZXdMaW5lO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV3TGluZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXdMaW5lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2Fub25pY2FsRmlsZU5hbWUoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXMgPyBmaWxlTmFtZSA6IGZpbGVOYW1lLnRvTG93ZXJDYXNlKCk7XG59XG5cbmV4cG9ydCBjb25zdCBmb3JtYXREaWFnbm9zdGljc0hvc3Q6IEZvcm1hdERpYWdub3N0aWNzSG9zdCA9IHtcbiAgICBnZXRDdXJyZW50RGlyZWN0b3J5LFxuICAgIGdldENhbm9uaWNhbEZpbGVOYW1lLFxuICAgIGdldE5ld0xpbmVcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkQ29uZmlnKGNvbmZpZ0ZpbGU6IHN0cmluZyk6IGFueSB7XG4gICAgbGV0IHJlc3VsdCA9IHJlYWRDb25maWdGaWxlKGNvbmZpZ0ZpbGUsIHN5cy5yZWFkRmlsZSk7XG4gICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgICBsZXQgbWVzc2FnZSA9IGZvcm1hdERpYWdub3N0aWNzKFtyZXN1bHQuZXJyb3JdLCBmb3JtYXREaWFnbm9zdGljc0hvc3QpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuY29uZmlnO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwQm9tKHNvdXJjZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoMCkgPT09IDB4RkVGRikge1xuXHRcdHJldHVybiBzb3VyY2Uuc2xpY2UoMSk7XG5cdH1cblx0cmV0dXJuIHNvdXJjZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVBhdGgoZmlsZXM6IHN0cmluZ1tdLCBjd2Q6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBsZXQgX2ZpbGVzID0gZmlsZXMsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBsZW4gPSBmaWxlcy5sZW5ndGg7XG5cbiAgICBmb3IoaTsgaTxsZW47IGkrKykge1xuICAgICAgICBpZiAoZmlsZXNbaV0uaW5kZXhPZihjd2QpID09PSAtMSkge1xuICAgICAgICAgICAgZmlsZXNbaV0gPSBwYXRoLnJlc29sdmUoY3dkICsgcGF0aC5zZXAgKyBmaWxlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2ZpbGVzO1xufVxuIiwiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEZpbGVFbmdpbmUgfSBmcm9tICcuL2ZpbGUuZW5naW5lJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2xvZ2dlcic7XG5cbmNvbnN0ICQ6IGFueSA9IHJlcXVpcmUoJ2NoZWVyaW8nKTtcblxuY2xhc3MgQ29tcG9uZW50c1RyZWVFbmdpbmUge1xuICAgIHByaXZhdGUgc3RhdGljIF9pbnN0YW5jZTogQ29tcG9uZW50c1RyZWVFbmdpbmUgPSBuZXcgQ29tcG9uZW50c1RyZWVFbmdpbmUoKTtcbiAgICBjb21wb25lbnRzOiBhbnlbXSA9IFtdO1xuICAgIGNvbXBvbmVudHNGb3JUcmVlOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBpZiAoQ29tcG9uZW50c1RyZWVFbmdpbmUuX2luc3RhbmNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yOiBJbnN0YW50aWF0aW9uIGZhaWxlZDogVXNlIENvbXBvbmVudHNUcmVlRW5naW5lLmdldEluc3RhbmNlKCkgaW5zdGVhZCBvZiBuZXcuJyk7XG4gICAgICAgIH1cbiAgICAgICAgQ29tcG9uZW50c1RyZWVFbmdpbmUuX2luc3RhbmNlID0gdGhpcztcbiAgICB9XG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBDb21wb25lbnRzVHJlZUVuZ2luZSB7XG4gICAgICAgIHJldHVybiBDb21wb25lbnRzVHJlZUVuZ2luZS5faW5zdGFuY2U7XG4gICAgfVxuICAgIGFkZENvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICB9XG4gICAgcmVhZFRlbXBsYXRlcygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLmNvbXBvbmVudHNGb3JUcmVlLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAkZmlsZWVuZ2luZSA9IG5ldyBGaWxlRW5naW5lKCksXG4gICAgICAgICAgICAgICAgbG9vcCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPD0gbGVuIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50c0ZvclRyZWVbaV0udGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZmlsZWVuZ2luZS5nZXQocGF0aC5kaXJuYW1lKHRoaXMuY29tcG9uZW50c0ZvclRyZWVbaV0uZmlsZSkgKyBwYXRoLnNlcCArIHRoaXMuY29tcG9uZW50c0ZvclRyZWVbaV0udGVtcGxhdGVVcmwpLnRoZW4oKHRlbXBsYXRlRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudHNGb3JUcmVlW2ldLnRlbXBsYXRlRGF0YSA9IHRlbXBsYXRlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudHNGb3JUcmVlW2ldLnRlbXBsYXRlRGF0YSA9IHRoaXMuY29tcG9uZW50c0ZvclRyZWVbaV0udGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9vcCgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZmluZENoaWxkcmVuQW5kUGFyZW50cygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIF8uZm9yRWFjaCh0aGlzLmNvbXBvbmVudHNGb3JUcmVlLCAoY29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0ICRjb21wb25lbnQgPSAkKGNvbXBvbmVudC50ZW1wbGF0ZURhdGEpO1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaCh0aGlzLmNvbXBvbmVudHNGb3JUcmVlLCAoY29tcG9uZW50VG9GaW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkY29tcG9uZW50LmZpbmQoY29tcG9uZW50VG9GaW5kLnNlbGVjdG9yKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjb21wb25lbnRUb0ZpbmQubmFtZSArICcgZm91bmQgaW4gJyArIGNvbXBvbmVudC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jaGlsZHJlbi5wdXNoKGNvbXBvbmVudFRvRmluZC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGVUcmVlc0ZvckNvbXBvbmVudHMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBfLmZvckVhY2godGhpcy5jb21wb25lbnRzLCAoY29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IF9jb21wb25lbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGNvbXBvbmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBmaWxlOiBjb21wb25lbnQuZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3I6IGNvbXBvbmVudC5zZWxlY3RvcixcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJycsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudC50ZW1wbGF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NvbXBvbmVudC50ZW1wbGF0ZSA9IGNvbXBvbmVudC50ZW1wbGF0ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LnRlbXBsYXRlVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgX2NvbXBvbmVudC50ZW1wbGF0ZVVybCA9IGNvbXBvbmVudC50ZW1wbGF0ZVVybFswXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudHNGb3JUcmVlLnB1c2goX2NvbXBvbmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucmVhZFRlbXBsYXRlcygpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZmluZENoaWxkcmVuQW5kUGFyZW50cygpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGhpcy5jb21wb25lbnRzRm9yVHJlZTogJywgdGhpcy5jb21wb25lbnRzRm9yVHJlZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9LCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZXhwb3J0IGNvbnN0ICRjb21wb25lbnRzVHJlZUVuZ2luZSA9IENvbXBvbmVudHNUcmVlRW5naW5lLmdldEluc3RhbmNlKCk7XG4iLCJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuXG5pbXBvcnQgeyBjb21waWxlckhvc3QsIGRldGVjdEluZGVudCB9IGZyb20gJy4uLy4uL3V0aWxpdGllcyc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9sb2dnZXInO1xuaW1wb3J0IHsgUm91dGVyUGFyc2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMvcm91dGVyLnBhcnNlcic7XG5pbXBvcnQgeyBMaW5rUGFyc2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMvbGluay1wYXJzZXInO1xuaW1wb3J0IHsgSlNEb2NUYWdzUGFyc2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMvanNkb2MucGFyc2VyJztcbmltcG9ydCB7IGdlbmVyYXRlIH0gZnJvbSAnLi9jb2RlZ2VuJztcbmltcG9ydCB7IHN0cmlwQm9tIH0gZnJvbSAnLi4vLi4vdXRpbHMvdXRpbHMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgSUNvbmZpZ3VyYXRpb24gfSBmcm9tICcuLi9jb25maWd1cmF0aW9uJztcbmltcG9ydCB7ICRjb21wb25lbnRzVHJlZUVuZ2luZSB9IGZyb20gJy4uL2VuZ2luZXMvY29tcG9uZW50cy10cmVlLmVuZ2luZSc7XG5cbmNvbnN0IG1hcmtlZCA9IHJlcXVpcmUoJ21hcmtlZCcpO1xuXG5pbnRlcmZhY2UgTm9kZU9iamVjdCB7XG4gICAga2luZDogTnVtYmVyO1xuICAgIHBvczogTnVtYmVyO1xuICAgIGVuZDogTnVtYmVyO1xuICAgIHRleHQ6IHN0cmluZztcbiAgICBpbml0aWFsaXplcjogTm9kZU9iamVjdCxcbiAgICBuYW1lPzogeyB0ZXh0OiBzdHJpbmcgfTtcbiAgICBleHByZXNzaW9uPzogTm9kZU9iamVjdDtcbiAgICBlbGVtZW50cz86IE5vZGVPYmplY3RbXTtcbiAgICBhcmd1bWVudHM/OiBOb2RlT2JqZWN0W107XG4gICAgcHJvcGVydGllcz86IGFueVtdO1xuICAgIHBhcnNlckNvbnRleHRGbGFncz86IE51bWJlcjtcbiAgICBlcXVhbHNHcmVhdGVyVGhhblRva2VuPzogTm9kZU9iamVjdFtdO1xuICAgIHBhcmFtZXRlcnM/OiBOb2RlT2JqZWN0W107XG4gICAgQ29tcG9uZW50Pzogc3RyaW5nO1xuICAgIGJvZHk/OiB7XG4gICAgICAgIHBvczogTnVtYmVyO1xuICAgICAgICBlbmQ6IE51bWJlcjtcbiAgICAgICAgc3RhdGVtZW50czogTm9kZU9iamVjdFtdO1xuICAgIH1cbn1cblxuaW50ZXJmYWNlIERlcHMge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB0eXBlOiBzdHJpbmc7XG4gICAgbGFiZWw/OiBzdHJpbmc7XG4gICAgZmlsZT86IHN0cmluZztcbiAgICBzb3VyY2VDb2RlPzogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuXG4gICAgLy9Db21wb25lbnRcblxuICAgIGFuaW1hdGlvbnM/OiBzdHJpbmdbXTsgLy8gVE9ET1xuICAgIGNoYW5nZURldGVjdGlvbj86IHN0cmluZztcbiAgICBlbmNhcHN1bGF0aW9uPzogc3RyaW5nO1xuICAgIGVudHJ5Q29tcG9uZW50cz86IHN0cmluZzsgLy8gVE9ET1xuICAgIGV4cG9ydEFzPzogc3RyaW5nO1xuICAgIGhvc3Q/OiBzdHJpbmc7XG4gICAgaW5wdXRzPzogc3RyaW5nW107XG4gICAgaW50ZXJwb2xhdGlvbj86IHN0cmluZzsgLy8gVE9ET1xuICAgIG1vZHVsZUlkPzogc3RyaW5nO1xuICAgIG91dHB1dHM/OiBzdHJpbmdbXTtcbiAgICBxdWVyaWVzPzogRGVwc1tdOyAvLyBUT0RPXG4gICAgc2VsZWN0b3I/OiBzdHJpbmc7XG4gICAgc3R5bGVVcmxzPzogc3RyaW5nW107XG4gICAgc3R5bGVzPzogc3RyaW5nW107XG4gICAgdGVtcGxhdGU/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGVVcmw/OiBzdHJpbmdbXTtcbiAgICB2aWV3UHJvdmlkZXJzPzogc3RyaW5nW107XG5cbiAgICBpbXBsZW1lbnRzPztcbiAgICBleHRlbmRzPztcblxuICAgIGlucHV0c0NsYXNzPzogT2JqZWN0W107XG5cbiAgICAvL2NvbW1vblxuICAgIHByb3ZpZGVycz86IERlcHNbXTtcblxuICAgIC8vbW9kdWxlXG4gICAgZGVjbGFyYXRpb25zPzogRGVwc1tdO1xuICAgIGJvb3RzdHJhcD86IERlcHNbXTtcblxuICAgIGltcG9ydHM/OiBEZXBzW107XG4gICAgZXhwb3J0cz86IERlcHNbXTtcblxuICAgIHJvdXRlc1RyZWU/O1xufVxuXG5pbnRlcmZhY2UgU3ltYm9sRGVwcyB7XG4gICAgZnVsbDogc3RyaW5nO1xuICAgIGFsaWFzOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBEZXBlbmRlbmNpZXMge1xuXG4gICAgcHJpdmF0ZSBmaWxlczogc3RyaW5nW107XG4gICAgcHJpdmF0ZSBwcm9ncmFtOiB0cy5Qcm9ncmFtO1xuICAgIHByaXZhdGUgcHJvZ3JhbUNvbXBvbmVudDogdHMuUHJvZ3JhbTtcbiAgICBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcjtcbiAgICBwcml2YXRlIHR5cGVDaGVja2VyQ29tcG9uZW50OiB0cy5UeXBlQ2hlY2tlcjtcbiAgICBwcml2YXRlIGVuZ2luZTogYW55O1xuICAgIHByaXZhdGUgX19jYWNoZTogYW55ID0ge307XG4gICAgcHJpdmF0ZSBfX25zTW9kdWxlOiBhbnkgPSB7fTtcbiAgICBwcml2YXRlIHVua25vd24gPSAnPz8/JztcbiAgICBwcml2YXRlIGNvbmZpZ3VyYXRpb24gPSBDb25maWd1cmF0aW9uLmdldEluc3RhbmNlKCk7XG5cbiAgICBjb25zdHJ1Y3RvcihmaWxlczogc3RyaW5nW10sIG9wdGlvbnM6IGFueSkge1xuICAgICAgICB0aGlzLmZpbGVzID0gZmlsZXM7XG4gICAgICAgIGNvbnN0IHRyYW5zcGlsZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRzLlNjcmlwdFRhcmdldC5FUzUsXG4gICAgICAgICAgICBtb2R1bGU6IHRzLk1vZHVsZUtpbmQuQ29tbW9uSlMsXG4gICAgICAgICAgICB0c2NvbmZpZ0RpcmVjdG9yeTogb3B0aW9ucy50c2NvbmZpZ0RpcmVjdG9yeVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHRoaXMuZmlsZXMsIHRyYW5zcGlsZU9wdGlvbnMsIGNvbXBpbGVySG9zdCh0cmFuc3BpbGVPcHRpb25zKSk7XG4gICAgfVxuXG4gICAgZ2V0RGVwZW5kZW5jaWVzKCkge1xuICAgICAgICBsZXQgZGVwczogYW55ID0ge1xuICAgICAgICAgICAgJ21vZHVsZXMnOiBbXSxcbiAgICAgICAgICAgICdjb21wb25lbnRzJzogW10sXG4gICAgICAgICAgICAnaW5qZWN0YWJsZXMnOiBbXSxcbiAgICAgICAgICAgICdwaXBlcyc6IFtdLFxuICAgICAgICAgICAgJ2RpcmVjdGl2ZXMnOiBbXSxcbiAgICAgICAgICAgICdyb3V0ZXMnOiBbXSxcbiAgICAgICAgICAgICdjbGFzc2VzJzogW10sXG4gICAgICAgICAgICAnaW50ZXJmYWNlcyc6IFtdLFxuICAgICAgICAgICAgJ21pc2NlbGxhbmVvdXMnOiB7XG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBbXSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbnM6IFtdLFxuICAgICAgICAgICAgICAgIHR5cGVhbGlhc2VzOiBbXSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhdGlvbnM6IFtdLFxuICAgICAgICAgICAgICAgIHR5cGVzOiBbXVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsZXQgc291cmNlRmlsZXMgPSB0aGlzLnBhcnNlRmlsZXModGhpcy5maWxlcykgfHwgW107XG5cbiAgICAgICAgc291cmNlRmlsZXMubWFwKChmaWxlOiB0cy5Tb3VyY2VGaWxlKSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBmaWxlUGF0aCA9IGZpbGUuZmlsZU5hbWU7XG5cbiAgICAgICAgICAgIGlmIChwYXRoLmV4dG5hbWUoZmlsZVBhdGgpID09PSAnLnRzJykge1xuXG4gICAgICAgICAgICAgICAgaWYgKGZpbGVQYXRoLmxhc3RJbmRleE9mKCcuZC50cycpID09PSAtMSAmJiBmaWxlUGF0aC5sYXN0SW5kZXhPZignc3BlYy50cycpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygncGFyc2luZycsIGZpbGVQYXRoKTtcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRTb3VyY2VGaWxlRGVjb3JhdG9ycyhmaWxlLCBkZXBzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGUsIGZpbGUuZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkZXBzO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vUm91dGVyUGFyc2VyLnByaW50TW9kdWxlc1JvdXRlcygpO1xuICAgICAgICAvL1JvdXRlclBhcnNlci5wcmludFJvdXRlcygpO1xuXG4gICAgICAgIC8qaWYgKFJvdXRlclBhcnNlci5pbmNvbXBsZXRlUm91dGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChkZXBzWydtaXNjZWxsYW5lb3VzJ11bJ3ZhcmlhYmxlcyddLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBSb3V0ZXJQYXJzZXIuZml4SW5jb21wbGV0ZVJvdXRlcyhkZXBzWydtaXNjZWxsYW5lb3VzJ11bJ3ZhcmlhYmxlcyddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSovXG5cbiAgICAgICAgLy8kY29tcG9uZW50c1RyZWVFbmdpbmUuY3JlYXRlVHJlZXNGb3JDb21wb25lbnRzKCk7XG5cbiAgICAgICAgUm91dGVyUGFyc2VyLmxpbmtNb2R1bGVzQW5kUm91dGVzKCk7XG4gICAgICAgIFJvdXRlclBhcnNlci5jb25zdHJ1Y3RNb2R1bGVzVHJlZSgpO1xuXG4gICAgICAgIGRlcHMucm91dGVzVHJlZSA9IFJvdXRlclBhcnNlci5jb25zdHJ1Y3RSb3V0ZXNUcmVlKCk7XG5cbiAgICAgICAgcmV0dXJuIGRlcHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwYXJzZUZpbGVzKGZpbGVOYW1lczogc3RyaW5nW10pIHtcblxuICAgICAgICBsZXQgX3BhcnNlZEZpbGVzID0gW107XG5cbiAgICAgICAgZmlsZU5hbWVzLmZvckVhY2goZmlsZU5hbWUgPT4ge1xuICAgICAgICAgICAgbGV0IHNvdXJjZUNvZGUgPSBzdHJpcEJvbShyZWFkRmlsZVN5bmMoZmlsZU5hbWUpLnRvU3RyaW5nKCkpLFxuICAgICAgICAgICAgICAgIHNvdXJjZUZpbGUgPSB0cy5jcmVhdGVTb3VyY2VGaWxlKGZpbGVOYW1lLCBzb3VyY2VDb2RlLCB0cy5TY3JpcHRUYXJnZXQuRVM1LCB0cnVlKTtcbiAgICAgICAgICAgIF9wYXJzZWRGaWxlcy5wdXNoKHNvdXJjZUZpbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gX3BhcnNlZEZpbGVzO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBnZXRTb3VyY2VGaWxlRGVjb3JhdG9ycyhzcmNGaWxlOiB0cy5Tb3VyY2VGaWxlLCBvdXRwdXRTeW1ib2xzOiBPYmplY3QpOiB2b2lkIHtcblxuICAgICAgICBsZXQgY2xlYW5lciA9IChwcm9jZXNzLmN3ZCgpICsgcGF0aC5zZXApLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgbGV0IGZpbGUgPSBzcmNGaWxlLmZpbGVOYW1lLnJlcGxhY2UoY2xlYW5lciwgJycpO1xuXG4gICAgICAgIHRoaXMucHJvZ3JhbUNvbXBvbmVudCA9IHRzLmNyZWF0ZVByb2dyYW0oW2ZpbGVdLCB7fSk7XG4gICAgICAgIGxldCBzb3VyY2VGaWxlID0gdGhpcy5wcm9ncmFtQ29tcG9uZW50LmdldFNvdXJjZUZpbGUoZmlsZSk7XG4gICAgICAgIHRoaXMudHlwZUNoZWNrZXJDb21wb25lbnQgPSB0aGlzLnByb2dyYW1Db21wb25lbnQuZ2V0VHlwZUNoZWNrZXIodHJ1ZSk7XG5cbiAgICAgICAgdHMuZm9yRWFjaENoaWxkKHNyY0ZpbGUsIChub2RlOiB0cy5Ob2RlKSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBkZXBzOiBEZXBzID0gPERlcHM+e307XG4gICAgICAgICAgICBpZiAobm9kZS5kZWNvcmF0b3JzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHZpc2l0Tm9kZSA9ICh2aXNpdGVkTm9kZSwgaW5kZXgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0YWRhdGEgPSBub2RlLmRlY29yYXRvcnM7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuYW1lID0gdGhpcy5nZXRTeW1ib2xlTmFtZShub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BzID0gdGhpcy5maW5kUHJvcHModmlzaXRlZE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgSU8gPSB0aGlzLmdldENvbXBvbmVudElPKGZpbGUsIHNvdXJjZUZpbGUsIG5vZGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTW9kdWxlKG1ldGFkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXJzOiB0aGlzLmdldE1vZHVsZVByb3ZpZGVycyhwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjbGFyYXRpb25zOiB0aGlzLmdldE1vZHVsZURlY2xhdGlvbnMocHJvcHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHM6IHRoaXMuZ2V0TW9kdWxlSW1wb3J0cyhwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0czogdGhpcy5nZXRNb2R1bGVFeHBvcnRzKHByb3BzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib290c3RyYXA6IHRoaXMuZ2V0TW9kdWxlQm9vdHN0cmFwKHByb3BzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogSU8uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29kZTogc291cmNlRmlsZS5nZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoUm91dGVyUGFyc2VyLmhhc1JvdXRlck1vZHVsZUluSW1wb3J0cyhkZXBzLmltcG9ydHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUm91dGVyUGFyc2VyLmFkZE1vZHVsZVdpdGhSb3V0ZXMobmFtZSwgdGhpcy5nZXRNb2R1bGVJbXBvcnRzUmF3KHByb3BzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBSb3V0ZXJQYXJzZXIuYWRkTW9kdWxlKG5hbWUsIGRlcHMuaW1wb3J0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRTeW1ib2xzWydtb2R1bGVzJ10ucHVzaChkZXBzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmlzQ29tcG9uZW50KG1ldGFkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYocHJvcHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChwcm9wcywgeyBzaG93SGlkZGVuOiB0cnVlLCBkZXB0aDogMTAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9hbmltYXRpb25zPzogc3RyaW5nW107IC8vIFRPRE9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VEZXRlY3Rpb246IHRoaXMuZ2V0Q29tcG9uZW50Q2hhbmdlRGV0ZWN0aW9uKHByb3BzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNhcHN1bGF0aW9uOiB0aGlzLmdldENvbXBvbmVudEVuY2Fwc3VsYXRpb24ocHJvcHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZW50cnlDb21wb25lbnRzPzogc3RyaW5nOyAvLyBUT0RPIHdhaXRpbmcgZG9jIGluZm9zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0QXM6IHRoaXMuZ2V0Q29tcG9uZW50RXhwb3J0QXMocHJvcHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvc3Q6IHRoaXMuZ2V0Q29tcG9uZW50SG9zdChwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRzOiB0aGlzLmdldENvbXBvbmVudElucHV0c01ldGFkYXRhKHByb3BzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2ludGVycG9sYXRpb24/OiBzdHJpbmc7IC8vIFRPRE8gd2FpdGluZyBkb2MgaW5mb3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVJZDogdGhpcy5nZXRDb21wb25lbnRNb2R1bGVJZChwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogdGhpcy5nZXRDb21wb25lbnRPdXRwdXRzKHByb3BzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlcnM6IHRoaXMuZ2V0Q29tcG9uZW50UHJvdmlkZXJzKHByb3BzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3F1ZXJpZXM/OiBEZXBzW107IC8vIFRPRE9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcjogdGhpcy5nZXRDb21wb25lbnRTZWxlY3Rvcihwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVVcmxzOiB0aGlzLmdldENvbXBvbmVudFN0eWxlVXJscyhwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVzOiB0aGlzLmdldENvbXBvbmVudFN0eWxlcyhwcm9wcyksIC8vIFRPRE8gZml4IGFyZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5nZXRDb21wb25lbnRUZW1wbGF0ZShwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IHRoaXMuZ2V0Q29tcG9uZW50VGVtcGxhdGVVcmwocHJvcHMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdQcm92aWRlcnM6IHRoaXMuZ2V0Q29tcG9uZW50Vmlld1Byb3ZpZGVycyhwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRzQ2xhc3M6IElPLmlucHV0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRzQ2xhc3M6IElPLm91dHB1dHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc0NsYXNzOiBJTy5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZHNDbGFzczogSU8ubWV0aG9kcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogSU8uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29kZTogc291cmNlRmlsZS5nZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSU8uanNkb2N0YWdzICYmIElPLmpzZG9jdGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5qc2RvY3RhZ3MgPSBJTy5qc2RvY3RhZ3NbMF0udGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoSU8uY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBzLmNvbnN0cnVjdG9yT2JqID0gSU8uY29uc3RydWN0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSU8uZXh0ZW5kcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuZXh0ZW5kcyA9IElPLmV4dGVuZHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSU8uaW1wbGVtZW50cyAmJiBJTy5pbXBsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBzLmltcGxlbWVudHMgPSBJTy5pbXBsZW1lbnRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbXBvbmVudHNUcmVlRW5naW5lLmFkZENvbXBvbmVudChkZXBzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFN5bWJvbHNbJ2NvbXBvbmVudHMnXS5wdXNoKGRlcHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaXNJbmplY3RhYmxlKG1ldGFkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2luamVjdGFibGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IElPLnByb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kczogSU8ubWV0aG9kcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogSU8uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29kZTogc291cmNlRmlsZS5nZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihJTy5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuY29uc3RydWN0b3JPYmogPSBJTy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFN5bWJvbHNbJ2luamVjdGFibGVzJ10ucHVzaChkZXBzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmlzUGlwZShtZXRhZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwaXBlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogSU8uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29kZTogc291cmNlRmlsZS5nZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSU8uanNkb2N0YWdzICYmIElPLmpzZG9jdGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5qc2RvY3RhZ3MgPSBJTy5qc2RvY3RhZ3NbMF0udGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0U3ltYm9sc1sncGlwZXMnXS5wdXNoKGRlcHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaXNEaXJlY3RpdmUobWV0YWRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihwcm9wcy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXJlY3RpdmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBJTy5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VDb2RlOiBzb3VyY2VGaWxlLmdldFRleHQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcjogdGhpcy5nZXRDb21wb25lbnRTZWxlY3Rvcihwcm9wcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXJzOiB0aGlzLmdldENvbXBvbmVudFByb3ZpZGVycyhwcm9wcyksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHNDbGFzczogSU8uaW5wdXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dHNDbGFzczogSU8ub3V0cHV0cyxcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXNDbGFzczogSU8ucHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2RzQ2xhc3M6IElPLm1ldGhvZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoSU8uanNkb2N0YWdzICYmIElPLmpzZG9jdGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5qc2RvY3RhZ3MgPSBJTy5qc2RvY3RhZ3NbMF0udGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKElPLmltcGxlbWVudHMgJiYgSU8uaW1wbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5pbXBsZW1lbnRzID0gSU8uaW1wbGVtZW50cztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKElPLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5jb25zdHJ1Y3Rvck9iaiA9IElPLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0U3ltYm9sc1snZGlyZWN0aXZlcyddLnB1c2goZGVwcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlYnVnKGRlcHMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19jYWNoZVtuYW1lXSA9IGRlcHM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGZpbHRlckJ5RGVjb3JhdG9ycyA9IChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmV4cHJlc3Npb24gJiYgbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAvKE5nTW9kdWxlfENvbXBvbmVudHxJbmplY3RhYmxlfFBpcGV8RGlyZWN0aXZlKS8udGVzdChub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbi50ZXh0KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgbm9kZS5kZWNvcmF0b3JzXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZmlsdGVyQnlEZWNvcmF0b3JzKVxuICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaCh2aXNpdE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobm9kZS5zeW1ib2wpIHtcbiAgICAgICAgICAgICAgICBpZihub2RlLnN5bWJvbC5mbGFncyA9PT0gdHMuU3ltYm9sRmxhZ3MuQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5hbWUgPSB0aGlzLmdldFN5bWJvbGVOYW1lKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgSU8gPSB0aGlzLmdldENsYXNzSU8oZmlsZSwgc291cmNlRmlsZSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGRlcHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjbGFzcycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VDb2RlOiBzb3VyY2VGaWxlLmdldFRleHQoKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZihJTy5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5jb25zdHJ1Y3Rvck9iaiA9IElPLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKElPLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMucHJvcGVydGllcyA9IElPLnByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoSU8uZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuZGVzY3JpcHRpb24gPSBJTy5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihJTy5tZXRob2RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLm1ldGhvZHMgPSBJTy5tZXRob2RzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChJTy5leHRlbmRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLmV4dGVuZHMgPSBJTy5leHRlbmRzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChJTy5pbXBsZW1lbnRzICYmIElPLmltcGxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5pbXBsZW1lbnRzID0gSU8uaW1wbGVtZW50cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlYnVnKGRlcHMpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRTeW1ib2xzWydjbGFzc2VzJ10ucHVzaChkZXBzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYobm9kZS5zeW1ib2wuZmxhZ3MgPT09IHRzLlN5bWJvbEZsYWdzLkludGVyZmFjZSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IHRoaXMuZ2V0U3ltYm9sZU5hbWUobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBJTyA9IHRoaXMuZ2V0SW50ZXJmYWNlSU8oZmlsZSwgc291cmNlRmlsZSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGRlcHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbnRlcmZhY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29kZTogc291cmNlRmlsZS5nZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYoSU8ucHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5wcm9wZXJ0aWVzID0gSU8ucHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihJTy5pbmRleFNpZ25hdHVyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuaW5kZXhTaWduYXR1cmVzID0gSU8uaW5kZXhTaWduYXR1cmVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKElPLmtpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMua2luZCA9IElPLmtpbmQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoSU8uZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuZGVzY3JpcHRpb24gPSBJTy5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihJTy5tZXRob2RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLm1ldGhvZHMgPSBJTy5tZXRob2RzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVidWcoZGVwcyk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFN5bWJvbHNbJ2ludGVyZmFjZXMnXS5wdXNoKGRlcHMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkZ1bmN0aW9uRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluZm9zID0gdGhpcy52aXNpdEZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gaW5mb3MubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgZGVwcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm9zLmFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuYXJncyA9IGluZm9zLmFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0U3ltYm9sc1snbWlzY2VsbGFuZW91cyddLmZ1bmN0aW9ucy5wdXNoKGRlcHMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkVudW1EZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5mb3MgPSB0aGlzLnZpc2l0RW51bURlY2xhcmF0aW9uKG5vZGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG5vZGUubmFtZS50ZXh0O1xuICAgICAgICAgICAgICAgICAgICBkZXBzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkczogaW5mb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0U3ltYm9sc1snbWlzY2VsbGFuZW91cyddLmVudW1lcmF0aW9ucy5wdXNoKGRlcHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IElPID0gdGhpcy5nZXRSb3V0ZUlPKGZpbGUsIHNvdXJjZUZpbGUpO1xuICAgICAgICAgICAgICAgIGlmKElPLnJvdXRlcykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3Um91dGVzO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Um91dGVzID0gUm91dGVyUGFyc2VyLmNsZWFuUmF3Um91dGVQYXJzZWQoSU8ucm91dGVzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdSb3V0ZXMgcGFyc2luZyBlcnJvciwgbWF5YmUgYSB0cmFpbGluZyBjb21tYSBvciBhbiBleHRlcm5hbCB2YXJpYWJsZSwgdHJ5aW5nIHRvIGZpeCB0aGF0IGxhdGVyIGFmdGVyIHNvdXJjZXMgc2Nhbm5pbmcuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdSb3V0ZXMgPSBJTy5yb3V0ZXMucmVwbGFjZSgvIC9nbSwgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICBSb3V0ZXJQYXJzZXIuYWRkSW5jb21wbGV0ZVJvdXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdSb3V0ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRTeW1ib2xzWydyb3V0ZXMnXSA9IFsuLi5vdXRwdXRTeW1ib2xzWydyb3V0ZXMnXSwgLi4ubmV3Um91dGVzXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuYW1lID0gdGhpcy5nZXRTeW1ib2xlTmFtZShub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IElPID0gdGhpcy5nZXRDbGFzc0lPKGZpbGUsIHNvdXJjZUZpbGUsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBkZXBzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2xhc3MnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29kZTogc291cmNlRmlsZS5nZXRUZXh0KClcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYoSU8uY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuY29uc3RydWN0b3JPYmogPSBJTy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihJTy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLnByb3BlcnRpZXMgPSBJTy5wcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKElPLmluZGV4U2lnbmF0dXJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5pbmRleFNpZ25hdHVyZXMgPSBJTy5pbmRleFNpZ25hdHVyZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoSU8uZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMuZGVzY3JpcHRpb24gPSBJTy5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihJTy5tZXRob2RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLm1ldGhvZHMgPSBJTy5tZXRob2RzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChJTy5leHRlbmRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLmV4dGVuZHMgPSBJTy5leHRlbmRzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChJTy5pbXBsZW1lbnRzICYmIElPLmltcGxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5pbXBsZW1lbnRzID0gSU8uaW1wbGVtZW50cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlYnVnKGRlcHMpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRTeW1ib2xzWydjbGFzc2VzJ10ucHVzaChkZXBzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5FeHByZXNzaW9uU3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBib290c3RyYXBNb2R1bGVSZWZlcmVuY2UgPSAnYm9vdHN0cmFwTW9kdWxlJztcbiAgICAgICAgICAgICAgICAgICAgLy9GaW5kIHRoZSByb290IG1vZHVsZSB3aXRoIGJvb3RzdHJhcE1vZHVsZSBjYWxsXG4gICAgICAgICAgICAgICAgICAgIC8vMS4gZmluZCBhIHNpbXBsZSBjYWxsIDogcGxhdGZvcm1Ccm93c2VyRHluYW1pYygpLmJvb3RzdHJhcE1vZHVsZShBcHBNb2R1bGUpO1xuICAgICAgICAgICAgICAgICAgICAvLzIuIG9yIGluc2lkZSBhIGNhbGwgOlxuICAgICAgICAgICAgICAgICAgICAvLyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljKCkuYm9vdHN0cmFwTW9kdWxlKEFwcE1vZHVsZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLzMuIHdpdGggYSBjYXRjaCA6IHBsYXRmb3JtQnJvd3NlckR5bmFtaWMoKS5ib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlKS5jYXRjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XG4gICAgICAgICAgICAgICAgICAgIC8vNC4gd2l0aCBwYXJhbWV0ZXJzIDogcGxhdGZvcm1Ccm93c2VyRHluYW1pYygpLmJvb3RzdHJhcE1vZHVsZShBcHBNb2R1bGUsIHt9KS5jYXRjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XG4gICAgICAgICAgICAgICAgICAgIC8vRmluZCByZWN1c2l2ZWx5IGluIGV4cHJlc3Npb24gbm9kZXMgb25lIHdpdGggbmFtZSAnYm9vdHN0cmFwTW9kdWxlJ1xuICAgICAgICAgICAgICAgICAgICBsZXQgcm9vdE1vZHVsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VGaWxlLnRleHQuaW5kZXhPZihib290c3RyYXBNb2R1bGVSZWZlcmVuY2UpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdE5vZGUgPSB0aGlzLmZpbmRFeHByZXNzaW9uQnlOYW1lSW5FeHByZXNzaW9ucyhub2RlLmV4cHJlc3Npb24sICdib290c3RyYXBNb2R1bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmV4cHJlc3Npb24gJiYgbm9kZS5leHByZXNzaW9uLmFyZ3VtZW50cyAmJiBub2RlLmV4cHJlc3Npb24uYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Tm9kZSA9IHRoaXMuZmluZEV4cHJlc3Npb25CeU5hbWVJbkV4cHJlc3Npb25Bcmd1bWVudHMobm9kZS5leHByZXNzaW9uLmFyZ3VtZW50cywgJ2Jvb3RzdHJhcE1vZHVsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHJlc3VsdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihyZXN1bHROb2RlLmFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uZm9yRWFjaChyZXN1bHROb2RlLmFyZ3VtZW50cywgZnVuY3Rpb24oYXJndW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFyZ3VtZW50LnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290TW9kdWxlID0gYXJndW1lbnQudGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb290TW9kdWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJvdXRlclBhcnNlci5zZXRSb290TW9kdWxlKHJvb3RNb2R1bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLlZhcmlhYmxlU3RhdGVtZW50ICYmICF0aGlzLmlzVmFyaWFibGVSb3V0ZXMobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluZm9zID0gdGhpcy52aXNpdFZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gaW5mb3MubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgZGVwcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVwcy50eXBlID0gKGluZm9zLnR5cGUpID8gaW5mb3MudHlwZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mb3MuZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLmRlZmF1bHRWYWx1ZSA9IGluZm9zLmRlZmF1bHRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5qc0RvYyAmJiBub2RlLmpzRG9jLmxlbmd0aCA+IDAgJiYgbm9kZS5qc0RvY1swXS5jb21tZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBzLmRlc2NyaXB0aW9uID0gbWFya2VkKG5vZGUuanNEb2NbMF0uY29tbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0U3ltYm9sc1snbWlzY2VsbGFuZW91cyddLnZhcmlhYmxlcy5wdXNoKGRlcHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLlR5cGVBbGlhc0RlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmZvcyA9IHRoaXMudmlzaXRUeXBlRGVjbGFyYXRpb24obm9kZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gaW5mb3MubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgZGVwcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0U3ltYm9sc1snbWlzY2VsbGFuZW91cyddLnR5cGVzLnB1c2goZGVwcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRnVuY3Rpb25EZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5mb3MgPSB0aGlzLnZpc2l0RnVuY3Rpb25EZWNsYXJhdGlvbihub2RlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSBpbmZvcy5uYW1lO1xuICAgICAgICAgICAgICAgICAgICBkZXBzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mb3MuYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcy5hcmdzID0gaW5mb3MuYXJncztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRTeW1ib2xzWydtaXNjZWxsYW5lb3VzJ10uZnVuY3Rpb25zLnB1c2goZGVwcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRW51bURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmZvcyA9IHRoaXMudmlzaXRFbnVtRGVjbGFyYXRpb24obm9kZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gbm9kZS5uYW1lLnRleHQ7XG4gICAgICAgICAgICAgICAgICAgIGRlcHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRzOiBpbmZvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRTeW1ib2xzWydtaXNjZWxsYW5lb3VzJ10uZW51bWVyYXRpb25zLnB1c2goZGVwcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH1cbiAgICBwcml2YXRlIGRlYnVnKGRlcHM6IERlcHMpIHtcbiAgICAgICAgbG9nZ2VyLmRlYnVnKCdmb3VuZCcsIGAke2RlcHMubmFtZX1gKTtcbiAgICAgICAgW1xuICAgICAgICAgICAgJ2ltcG9ydHMnLCAnZXhwb3J0cycsICdkZWNsYXJhdGlvbnMnLCAncHJvdmlkZXJzJywgJ2Jvb3RzdHJhcCdcbiAgICAgICAgXS5mb3JFYWNoKHN5bWJvbHMgPT4ge1xuICAgICAgICAgICAgaWYgKGRlcHNbc3ltYm9sc10gJiYgZGVwc1tzeW1ib2xzXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCcnLCBgLSAke3N5bWJvbHN9OmApO1xuICAgICAgICAgICAgICAgIGRlcHNbc3ltYm9sc10ubWFwKGkgPT4gaS5uYW1lKS5mb3JFYWNoKGQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZGVidWcoJycsIGBcXHQtICR7ZH1gKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzVmFyaWFibGVSb3V0ZXMobm9kZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIGlmKCBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMgKSB7XG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0gbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihpOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYobm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLnR5cGUudHlwZU5hbWUgJiYgbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLnR5cGUudHlwZU5hbWUudGV4dCA9PT0gJ1JvdXRlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZpbmRFeHByZXNzaW9uQnlOYW1lSW5FeHByZXNzaW9ucyhlbnRyeU5vZGUsIG5hbWUpIHtcbiAgICAgICAgbGV0IHJlc3VsdCxcbiAgICAgICAgICAgIGxvb3AgPSBmdW5jdGlvbihub2RlLCBuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYobm9kZS5leHByZXNzaW9uICYmICFub2RlLmV4cHJlc3Npb24ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBsb29wKG5vZGUuZXhwcmVzc2lvbiwgbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKG5vZGUuZXhwcmVzc2lvbiAmJiBub2RlLmV4cHJlc3Npb24ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZihub2RlLmV4cHJlc3Npb24ubmFtZS50ZXh0ID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9vcChub2RlLmV4cHJlc3Npb24sIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBsb29wKGVudHJ5Tm9kZSwgbmFtZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaW5kRXhwcmVzc2lvbkJ5TmFtZUluRXhwcmVzc2lvbkFyZ3VtZW50cyhhcmcsIG5hbWUpIHtcbiAgICAgICAgbGV0IHJlc3VsdCxcbiAgICAgICAgICAgIHRoYXQgPSB0aGlzLFxuICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICBsZW4gPSBhcmcubGVuZ3RoLFxuICAgICAgICAgICAgbG9vcCA9IGZ1bmN0aW9uKG5vZGUsIG5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZihub2RlLmJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuYm9keS5zdGF0ZW1lbnRzICYmIG5vZGUuYm9keS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBqID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5nID0gbm9kZS5ib2R5LnN0YXRlbWVudHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqOyBqPGxlbmc7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoYXQuZmluZEV4cHJlc3Npb25CeU5hbWVJbkV4cHJlc3Npb25zKG5vZGUuYm9keS5zdGF0ZW1lbnRzW2pdLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgZm9yIChpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGxvb3AoYXJnW2ldLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgcGFyc2VEZWNvcmF0b3JzKGRlY29yYXRvcnMsIHR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIGlmIChkZWNvcmF0b3JzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIF8uZm9yRWFjaChkZWNvcmF0b3JzLCBmdW5jdGlvbihkZWNvcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdG9yLmV4cHJlc3Npb24uZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdG9yLmV4cHJlc3Npb24uZXhwcmVzc2lvbi50ZXh0ID09PSB0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoZGVjb3JhdG9yc1swXS5leHByZXNzaW9uLmV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdG9yc1swXS5leHByZXNzaW9uLmV4cHJlc3Npb24udGV4dCA9PT0gdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNDb21wb25lbnQobWV0YWRhdGFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRGVjb3JhdG9ycyhtZXRhZGF0YXMsICdDb21wb25lbnQnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzUGlwZShtZXRhZGF0YXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEZWNvcmF0b3JzKG1ldGFkYXRhcywgJ1BpcGUnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzRGlyZWN0aXZlKG1ldGFkYXRhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURlY29yYXRvcnMobWV0YWRhdGFzLCAnRGlyZWN0aXZlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0luamVjdGFibGUobWV0YWRhdGFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRGVjb3JhdG9ycyhtZXRhZGF0YXMsICdJbmplY3RhYmxlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc01vZHVsZShtZXRhZGF0YXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEZWNvcmF0b3JzKG1ldGFkYXRhcywgJ05nTW9kdWxlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRUeXBlKG5hbWUpIHtcbiAgICAgICAgbGV0IHR5cGU7XG4gICAgICAgIGlmKCBuYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignY29tcG9uZW50JykgIT09IC0xICkge1xuICAgICAgICAgICAgdHlwZSA9ICdjb21wb25lbnQnO1xuICAgICAgICB9IGVsc2UgaWYoIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdwaXBlJykgIT09IC0xICkge1xuICAgICAgICAgICAgdHlwZSA9ICdwaXBlJztcbiAgICAgICAgfSBlbHNlIGlmKCBuYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbW9kdWxlJykgIT09IC0xICkge1xuICAgICAgICAgICAgdHlwZSA9ICdtb2R1bGUnO1xuICAgICAgICB9IGVsc2UgaWYoIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdkaXJlY3RpdmUnKSAhPT0gLTEgKSB7XG4gICAgICAgICAgICB0eXBlID0gJ2RpcmVjdGl2ZSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRTeW1ib2xlTmFtZShub2RlKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIG5vZGUubmFtZS50ZXh0O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50U2VsZWN0b3IocHJvcHM6IE5vZGVPYmplY3RbXSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICdzZWxlY3RvcicpLnBvcCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50RXhwb3J0QXMocHJvcHM6IE5vZGVPYmplY3RbXSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICdleHBvcnRBcycpLnBvcCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0TW9kdWxlUHJvdmlkZXJzKHByb3BzOiBOb2RlT2JqZWN0W10pOiBEZXBzW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAncHJvdmlkZXJzJykubWFwKChwcm92aWRlck5hbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRGVlcEluZGVudGlmaWVyKHByb3ZpZGVyTmFtZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZmluZFByb3BzKHZpc2l0ZWROb2RlKSB7XG4gICAgICAgIGlmKHZpc2l0ZWROb2RlLmV4cHJlc3Npb24uYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB2aXNpdGVkTm9kZS5leHByZXNzaW9uLmFyZ3VtZW50cy5wb3AoKS5wcm9wZXJ0aWVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRNb2R1bGVEZWNsYXRpb25zKHByb3BzOiBOb2RlT2JqZWN0W10pOiBEZXBzW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAnZGVjbGFyYXRpb25zJykubWFwKChuYW1lKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5maW5kQ29tcG9uZW50U2VsZWN0b3JCeU5hbWUobmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURlZXBJbmRlbnRpZmllcihuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRNb2R1bGVJbXBvcnRzUmF3KHByb3BzOiBOb2RlT2JqZWN0W10pOiBEZXBzW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzUmF3KHByb3BzLCAnaW1wb3J0cycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0TW9kdWxlSW1wb3J0cyhwcm9wczogTm9kZU9iamVjdFtdKTogRGVwc1tdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3ltYm9sRGVwcyhwcm9wcywgJ2ltcG9ydHMnKS5tYXAoKG5hbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRGVlcEluZGVudGlmaWVyKG5hbWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldE1vZHVsZUV4cG9ydHMocHJvcHM6IE5vZGVPYmplY3RbXSk6IERlcHNbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICdleHBvcnRzJykubWFwKChuYW1lKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURlZXBJbmRlbnRpZmllcihuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRIb3N0KHByb3BzOiBOb2RlT2JqZWN0W10pOiBPYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzT2JqZWN0KHByb3BzLCAnaG9zdCcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0TW9kdWxlQm9vdHN0cmFwKHByb3BzOiBOb2RlT2JqZWN0W10pOiBEZXBzW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAnYm9vdHN0cmFwJykubWFwKChuYW1lKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURlZXBJbmRlbnRpZmllcihuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRJbnB1dHNNZXRhZGF0YShwcm9wczogTm9kZU9iamVjdFtdKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAnaW5wdXRzJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXREZWNvcmF0b3JPZlR5cGUobm9kZSwgZGVjb3JhdG9yVHlwZSkge1xuICAgICAgdmFyIGRlY29yYXRvcnMgPSBub2RlLmRlY29yYXRvcnMgfHwgW107XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVjb3JhdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChkZWNvcmF0b3JzW2ldLmV4cHJlc3Npb24uZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICBpZiAoZGVjb3JhdG9yc1tpXS5leHByZXNzaW9uLmV4cHJlc3Npb24udGV4dCA9PT0gZGVjb3JhdG9yVHlwZSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcnNbaV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgdmlzaXRJbnB1dChwcm9wZXJ0eSwgaW5EZWNvcmF0b3IsIHNvdXJjZUZpbGU/KSB7XG4gICAgICAgIHZhciBpbkFyZ3MgPSBpbkRlY29yYXRvci5leHByZXNzaW9uLmFyZ3VtZW50cyxcbiAgICAgICAgX3JldHVybiA9IHtcbiAgICAgICAgICAgIG5hbWU6IGluQXJncy5sZW5ndGggPyBpbkFyZ3NbMF0udGV4dCA6IHByb3BlcnR5Lm5hbWUudGV4dCxcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogcHJvcGVydHkuaW5pdGlhbGl6ZXIgPyB0aGlzLnN0cmluZ2lmeURlZmF1bHRWYWx1ZShwcm9wZXJ0eS5pbml0aWFsaXplcikgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogbWFya2VkKExpbmtQYXJzZXIucmVzb2x2ZUxpbmtzKHRzLmRpc3BsYXlQYXJ0c1RvU3RyaW5nKHByb3BlcnR5LnN5bWJvbC5nZXREb2N1bWVudGF0aW9uQ29tbWVudCgpKSkpLFxuICAgICAgICAgICAgbGluZTogdGhpcy5nZXRQb3NpdGlvbihwcm9wZXJ0eSwgc291cmNlRmlsZSkubGluZSArIDFcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHByb3BlcnR5LnR5cGUpIHtcbiAgICAgICAgICAgIF9yZXR1cm4udHlwZSA9IHRoaXMudmlzaXRUeXBlKHByb3BlcnR5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGhhbmRsZSBOZXdFeHByZXNzaW9uXG4gICAgICAgICAgICBpZiAocHJvcGVydHkuaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkuaW5pdGlhbGl6ZXIua2luZCA9PT0gdHMuU3ludGF4S2luZC5OZXdFeHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eS5pbml0aWFsaXplci5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfcmV0dXJuLnR5cGUgPSBwcm9wZXJ0eS5pbml0aWFsaXplci5leHByZXNzaW9uLnRleHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXR1cm47XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2aXNpdFR5cGUobm9kZSkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29weXJpZ2h0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZy1ib290c3RyYXAvbmctYm9vdHN0cmFwXG4gICAgICAgICAqL1xuICAgICAgICBsZXQgX3JldHVybiA9ICd2b2lkJztcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX3JldHVybiA9IHRoaXMudHlwZUNoZWNrZXJDb21wb25lbnQudHlwZVRvU3RyaW5nKHRoaXMudHlwZUNoZWNrZXJDb21wb25lbnQuZ2V0VHlwZUF0TG9jYXRpb24obm9kZSkpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgX3JldHVybiA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmV0dXJuO1xuICAgIH1cblxuICAgIHByaXZhdGUgdmlzaXRPdXRwdXQocHJvcGVydHksIG91dERlY29yYXRvciwgc291cmNlRmlsZT8pIHtcbiAgICAgICAgdmFyIG91dEFyZ3MgPSBvdXREZWNvcmF0b3IuZXhwcmVzc2lvbi5hcmd1bWVudHMsXG4gICAgICAgIF9yZXR1cm4gPSB7XG4gICAgICAgICAgICBuYW1lOiBvdXRBcmdzLmxlbmd0aCA/IG91dEFyZ3NbMF0udGV4dCA6IHByb3BlcnR5Lm5hbWUudGV4dCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBtYXJrZWQoTGlua1BhcnNlci5yZXNvbHZlTGlua3ModHMuZGlzcGxheVBhcnRzVG9TdHJpbmcocHJvcGVydHkuc3ltYm9sLmdldERvY3VtZW50YXRpb25Db21tZW50KCkpKSksXG4gICAgICAgICAgICBsaW5lOiB0aGlzLmdldFBvc2l0aW9uKHByb3BlcnR5LCBzb3VyY2VGaWxlKS5saW5lICsgMVxuICAgICAgICB9O1xuICAgICAgICBpZiAocHJvcGVydHkudHlwZSkge1xuICAgICAgICAgICAgX3JldHVybi50eXBlID0gdGhpcy52aXNpdFR5cGUocHJvcGVydHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gaGFuZGxlIE5ld0V4cHJlc3Npb25cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eS5pbml0aWFsaXplcikge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eS5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLk5ld0V4cHJlc3Npb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LmluaXRpYWxpemVyLmV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9yZXR1cm4udHlwZSA9IHByb3BlcnR5LmluaXRpYWxpemVyLmV4cHJlc3Npb24udGV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3JldHVybjtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzUHVibGljKG1lbWJlcik6IGJvb2xlYW4ge1xuICAgICAgICBpZiAobWVtYmVyLm1vZGlmaWVycykge1xuICAgICAgICAgICAgY29uc3QgaXNQdWJsaWM6IGJvb2xlYW4gPSBtZW1iZXIubW9kaWZpZXJzLnNvbWUoZnVuY3Rpb24obW9kaWZpZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kaWZpZXIua2luZCA9PT0gdHMuU3ludGF4S2luZC5QdWJsaWNLZXl3b3JkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoaXNQdWJsaWMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5pc0hpZGRlbk1lbWJlcihtZW1iZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNQcml2YXRlKG1lbWJlcik6IGJvb2xlYW4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29weXJpZ2h0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZy1ib290c3RyYXAvbmctYm9vdHN0cmFwXG4gICAgICAgICAqL1xuICAgICAgICBpZiAobWVtYmVyLm1vZGlmaWVycykge1xuICAgICAgICAgICAgY29uc3QgaXNQcml2YXRlOiBib29sZWFuID0gbWVtYmVyLm1vZGlmaWVycy5zb21lKG1vZGlmaWVyID0+IG1vZGlmaWVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuUHJpdmF0ZUtleXdvcmQpO1xuICAgICAgICAgICAgaWYgKGlzUHJpdmF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmlzSGlkZGVuTWVtYmVyKG1lbWJlcik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0ludGVybmFsKG1lbWJlcik6IGJvb2xlYW4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29weXJpZ2h0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZy1ib290c3RyYXAvbmctYm9vdHN0cmFwXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBpbnRlcm5hbFRhZ3M6IHN0cmluZ1tdID0gWydpbnRlcm5hbCddO1xuICAgICAgICBpZiAobWVtYmVyLmpzRG9jKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRvYyBvZiBtZW1iZXIuanNEb2MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgZG9jLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcm5hbFRhZ3MuaW5kZXhPZih0YWcudGFnTmFtZS50ZXh0KSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNIaWRkZW5NZW1iZXIobWVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb3B5cmlnaHQgaHR0cHM6Ly9naXRodWIuY29tL25nLWJvb3RzdHJhcC9uZy1ib290c3RyYXBcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGludGVybmFsVGFnczogc3RyaW5nW10gPSBbJ2hpZGRlbiddO1xuICAgICAgICBpZiAobWVtYmVyLmpzRG9jKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRvYyBvZiBtZW1iZXIuanNEb2MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgZG9jLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcm5hbFRhZ3MuaW5kZXhPZih0YWcudGFnTmFtZS50ZXh0KSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNBbmd1bGFyTGlmZWN5Y2xlSG9vayhtZXRob2ROYW1lKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb3B5cmlnaHQgaHR0cHM6Ly9naXRodWIuY29tL25nLWJvb3RzdHJhcC9uZy1ib290c3RyYXBcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IEFOR1VMQVJfTElGRUNZQ0xFX01FVEhPRFMgPSBbXG4gICAgICAgICAgICAnbmdPbkluaXQnLCAnbmdPbkNoYW5nZXMnLCAnbmdEb0NoZWNrJywgJ25nT25EZXN0cm95JywgJ25nQWZ0ZXJDb250ZW50SW5pdCcsICduZ0FmdGVyQ29udGVudENoZWNrZWQnLFxuICAgICAgICAgICAgJ25nQWZ0ZXJWaWV3SW5pdCcsICduZ0FmdGVyVmlld0NoZWNrZWQnLCAnd3JpdGVWYWx1ZScsICdyZWdpc3Rlck9uQ2hhbmdlJywgJ3JlZ2lzdGVyT25Ub3VjaGVkJywgJ3NldERpc2FibGVkU3RhdGUnXG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiBBTkdVTEFSX0xJRkVDWUNMRV9NRVRIT0RTLmluZGV4T2YobWV0aG9kTmFtZSkgPj0gMDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZpc2l0Q29uc3RydWN0b3JEZWNsYXJhdGlvbihtZXRob2QsIHNvdXJjZUZpbGU/KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb3B5cmlnaHQgaHR0cHM6Ly9naXRodWIuY29tL25nLWJvb3RzdHJhcC9uZy1ib290c3RyYXBcbiAgICAgICAgICovXG4gICAgICAgIHZhciByZXN1bHQgPSB7XG4gICAgICAgICAgICBuYW1lOiAnY29uc3RydWN0b3InLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG1hcmtlZChMaW5rUGFyc2VyLnJlc29sdmVMaW5rcyh0cy5kaXNwbGF5UGFydHNUb1N0cmluZyhtZXRob2Quc3ltYm9sLmdldERvY3VtZW50YXRpb25Db21tZW50KCkpKSksXG4gICAgICAgICAgICBhcmdzOiBtZXRob2QucGFyYW1ldGVycyA/IG1ldGhvZC5wYXJhbWV0ZXJzLm1hcCgocHJvcCkgPT4gdGhpcy52aXNpdEFyZ3VtZW50KHByb3ApKSA6IFtdLFxuICAgICAgICAgICAgbGluZTogdGhpcy5nZXRQb3NpdGlvbihtZXRob2QsIHNvdXJjZUZpbGUpLmxpbmUgKyAxXG4gICAgICAgIH0sXG4gICAgICAgICAgICBqc2RvY3RhZ3MgPSBKU0RvY1RhZ3NQYXJzZXIuZ2V0SlNEb2NzKG1ldGhvZCksXG5cbiAgICAgICAgICAgIG1hcmtlZHRhZ3MgPSBmdW5jdGlvbih0YWdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG10YWdzID0gdGFncztcbiAgICAgICAgICAgICAgICBfLmZvckVhY2gobXRhZ3MsICh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNvbW1lbnQgPSBtYXJrZWQoTGlua1BhcnNlci5yZXNvbHZlTGlua3ModGFnLmNvbW1lbnQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbXRhZ3M7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmIChtZXRob2QubW9kaWZpZXJzKSB7XG4gICAgICAgICAgICBpZiAobWV0aG9kLm1vZGlmaWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm1vZGlmaWVyS2luZCA9IG1ldGhvZC5tb2RpZmllcnNbMF0ua2luZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoanNkb2N0YWdzICYmIGpzZG9jdGFncy5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgaWYgKGpzZG9jdGFnc1swXS50YWdzKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmpzZG9jdGFncyA9IG1hcmtlZHRhZ3MoanNkb2N0YWdzWzBdLnRhZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2aXNpdENvbnN0cnVjdG9yUHJvcGVydGllcyhtZXRob2QpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBpZiAobWV0aG9kLnBhcmFtZXRlcnMpIHtcbiAgICAgICAgICAgIHZhciBfcGFyYW1ldGVycyA9IFtdLFxuICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgIGxlbiA9IG1ldGhvZC5wYXJhbWV0ZXJzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5pc1B1YmxpYyhtZXRob2QucGFyYW1ldGVyc1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgX3BhcmFtZXRlcnMucHVzaCh0aGF0LnZpc2l0QXJndW1lbnQobWV0aG9kLnBhcmFtZXRlcnNbaV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gX3BhcmFtZXRlcnM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHZpc2l0Q2FsbERlY2xhcmF0aW9uKG1ldGhvZCwgc291cmNlRmlsZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IG1hcmtlZChMaW5rUGFyc2VyLnJlc29sdmVMaW5rcyh0cy5kaXNwbGF5UGFydHNUb1N0cmluZyhtZXRob2Quc3ltYm9sLmdldERvY3VtZW50YXRpb25Db21tZW50KCkpKSksXG4gICAgICAgICAgICBhcmdzOiBtZXRob2QucGFyYW1ldGVycyA/IG1ldGhvZC5wYXJhbWV0ZXJzLm1hcCgocHJvcCkgPT4gdGhpcy52aXNpdEFyZ3VtZW50KHByb3ApKSA6IFtdLFxuICAgICAgICAgICAgcmV0dXJuVHlwZTogdGhpcy52aXNpdFR5cGUobWV0aG9kLnR5cGUpLFxuICAgICAgICAgICAgbGluZTogdGhpcy5nZXRQb3NpdGlvbihtZXRob2QsIHNvdXJjZUZpbGUpLmxpbmUgKyAxXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHZpc2l0SW5kZXhEZWNsYXJhdGlvbihtZXRob2QsIHNvdXJjZUZpbGU/KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogbWFya2VkKExpbmtQYXJzZXIucmVzb2x2ZUxpbmtzKHRzLmRpc3BsYXlQYXJ0c1RvU3RyaW5nKG1ldGhvZC5zeW1ib2wuZ2V0RG9jdW1lbnRhdGlvbkNvbW1lbnQoKSkpKSxcbiAgICAgICAgICAgIGFyZ3M6IG1ldGhvZC5wYXJhbWV0ZXJzID8gbWV0aG9kLnBhcmFtZXRlcnMubWFwKChwcm9wKSA9PiB0aGlzLnZpc2l0QXJndW1lbnQocHJvcCkpIDogW10sXG4gICAgICAgICAgICByZXR1cm5UeXBlOiB0aGlzLnZpc2l0VHlwZShtZXRob2QudHlwZSksXG4gICAgICAgICAgICBsaW5lOiB0aGlzLmdldFBvc2l0aW9uKG1ldGhvZCwgc291cmNlRmlsZSkubGluZSArIDFcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UG9zaXRpb24obm9kZSwgc291cmNlRmlsZSk6IHRzLkxpbmVBbmRDaGFyYWN0ZXIge1xuICAgICAgICB2YXIgcG9zaXRpb246dHMuTGluZUFuZENoYXJhY3RlcjtcbiAgICAgICAgaWYgKG5vZGVbJ25hbWUnXSAmJiBub2RlWyduYW1lJ10uZW5kKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIG5vZGVbJ25hbWUnXS5lbmQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2VGaWxlLCBub2RlLnBvcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH1cblxuICAgIHByaXZhdGUgdmlzaXRNZXRob2REZWNsYXJhdGlvbihtZXRob2QsIHNvdXJjZUZpbGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIG5hbWU6IG1ldGhvZC5uYW1lLnRleHQsXG4gICAgICAgICAgICBhcmdzOiBtZXRob2QucGFyYW1ldGVycyA/IG1ldGhvZC5wYXJhbWV0ZXJzLm1hcCgocHJvcCkgPT4gdGhpcy52aXNpdEFyZ3VtZW50KHByb3ApKSA6IFtdLFxuICAgICAgICAgICAgcmV0dXJuVHlwZTogdGhpcy52aXNpdFR5cGUobWV0aG9kLnR5cGUpLFxuICAgICAgICAgICAgbGluZTogdGhpcy5nZXRQb3NpdGlvbihtZXRob2QsIHNvdXJjZUZpbGUpLmxpbmUgKyAxXG4gICAgICAgIH0sXG4gICAgICAgICAgICBqc2RvY3RhZ3MgPSBKU0RvY1RhZ3NQYXJzZXIuZ2V0SlNEb2NzKG1ldGhvZCksXG5cbiAgICAgICAgICAgIG1hcmtlZHRhZ3MgPSBmdW5jdGlvbih0YWdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG10YWdzID0gdGFncztcbiAgICAgICAgICAgICAgICBfLmZvckVhY2gobXRhZ3MsICh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNvbW1lbnQgPSBtYXJrZWQoTGlua1BhcnNlci5yZXNvbHZlTGlua3ModGFnLmNvbW1lbnQpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbXRhZ3M7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmIChtZXRob2Quc3ltYm9sKSB7XG4gICAgICAgICAgICByZXN1bHQuZGVzY3JpcHRpb24gPSBtYXJrZWQoTGlua1BhcnNlci5yZXNvbHZlTGlua3ModHMuZGlzcGxheVBhcnRzVG9TdHJpbmcobWV0aG9kLnN5bWJvbC5nZXREb2N1bWVudGF0aW9uQ29tbWVudCgpKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldGhvZC5kZWNvcmF0b3JzKSB7XG4gICAgICAgICAgICByZXN1bHQuZGVjb3JhdG9ycyA9IHRoaXMuZm9ybWF0RGVjb3JhdG9ycyhtZXRob2QuZGVjb3JhdG9ycyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWV0aG9kLm1vZGlmaWVycykge1xuICAgICAgICAgICAgaWYgKG1ldGhvZC5tb2RpZmllcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5tb2RpZmllcktpbmQgPSBtZXRob2QubW9kaWZpZXJzWzBdLmtpbmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGpzZG9jdGFncyAmJiBqc2RvY3RhZ3MubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIGlmIChqc2RvY3RhZ3NbMF0udGFncykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5qc2RvY3RhZ3MgPSBtYXJrZWR0YWdzKGpzZG9jdGFnc1swXS50YWdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgdmlzaXRBcmd1bWVudChhcmcpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvcHlyaWdodCBodHRwczovL2dpdGh1Yi5jb20vbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcFxuICAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZy5uYW1lLnRleHQsXG4gICAgICAgICAgICB0eXBlOiB0aGlzLnZpc2l0VHlwZShhcmcpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldE5hbWVzQ29tcGFyZUZuKG5hbWUpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvcHlyaWdodCBodHRwczovL2dpdGh1Yi5jb20vbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcFxuICAgICAgICAgKi9cbiAgICAgICAgbmFtZSA9IG5hbWUgfHwgJ25hbWUnO1xuICAgICAgICB2YXIgdCA9IChhLCBiKSA9PiB7XG4gICAgICAgICAgICBpZiAoYVtuYW1lXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhW25hbWVdLmxvY2FsZUNvbXBhcmUoYltuYW1lXSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0O1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RyaW5naWZ5RGVmYXVsdFZhbHVlKG5vZGUpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvcHlyaWdodCBodHRwczovL2dpdGh1Yi5jb20vbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcFxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKG5vZGUudGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUudGV4dDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRmFsc2VLZXl3b3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2ZhbHNlJztcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQpIHtcbiAgICAgICAgICAgIHJldHVybiAndHJ1ZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGZvcm1hdERlY29yYXRvcnMoZGVjb3JhdG9ycykge1xuICAgICAgICBsZXQgX2RlY29yYXRvcnMgPSBbXTtcblxuICAgICAgICBfLmZvckVhY2goZGVjb3JhdG9ycywgKGRlY29yYXRvcikgPT4ge1xuICAgICAgICAgICAgaWYgKGRlY29yYXRvci5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRvci5leHByZXNzaW9uLnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgX2RlY29yYXRvcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZWNvcmF0b3IuZXhwcmVzc2lvbi50ZXh0XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdG9yLmV4cHJlc3Npb24uZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24udGV4dFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uLmFyZ3VtZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24uYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmFyZ3MgPSBkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uLmFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfZGVjb3JhdG9ycy5wdXNoKGluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIF9kZWNvcmF0b3JzO1xuICAgIH1cblxuICAgIHByaXZhdGUgdmlzaXRQcm9wZXJ0eShwcm9wZXJ0eSwgc291cmNlRmlsZSkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29weXJpZ2h0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZy1ib290c3RyYXAvbmctYm9vdHN0cmFwXG4gICAgICAgICAqL1xuICAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICBuYW1lOiBwcm9wZXJ0eS5uYW1lLnRleHQsXG4gICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiBwcm9wZXJ0eS5pbml0aWFsaXplciA/IHRoaXMuc3RyaW5naWZ5RGVmYXVsdFZhbHVlKHByb3BlcnR5LmluaXRpYWxpemVyKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICB0eXBlOiB0aGlzLnZpc2l0VHlwZShwcm9wZXJ0eSksXG4gICAgICAgICAgICAgZGVzY3JpcHRpb246IG1hcmtlZChMaW5rUGFyc2VyLnJlc29sdmVMaW5rcyh0cy5kaXNwbGF5UGFydHNUb1N0cmluZyhwcm9wZXJ0eS5zeW1ib2wuZ2V0RG9jdW1lbnRhdGlvbkNvbW1lbnQoKSkpKSxcbiAgICAgICAgICAgICBsaW5lOiB0aGlzLmdldFBvc2l0aW9uKHByb3BlcnR5LCBzb3VyY2VGaWxlKS5saW5lICsgMVxuICAgICAgICAgfVxuXG4gICAgICAgICBpZiAocHJvcGVydHkuZGVjb3JhdG9ycykge1xuICAgICAgICAgICAgIHJlc3VsdC5kZWNvcmF0b3JzID0gdGhpcy5mb3JtYXREZWNvcmF0b3JzKHByb3BlcnR5LmRlY29yYXRvcnMpO1xuICAgICAgICAgfVxuXG4gICAgICAgICBpZiAocHJvcGVydHkubW9kaWZpZXJzKSB7XG4gICAgICAgICAgICAgaWYgKHByb3BlcnR5Lm1vZGlmaWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgIHJlc3VsdC5tb2RpZmllcktpbmQgPSBwcm9wZXJ0eS5tb2RpZmllcnNbMF0ua2luZDtcbiAgICAgICAgICAgICB9XG4gICAgICAgICB9XG4gICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgdmlzaXRNZW1iZXJzKG1lbWJlcnMsIHNvdXJjZUZpbGUpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvcHlyaWdodCBodHRwczovL2dpdGh1Yi5jb20vbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcFxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGlucHV0cyA9IFtdLFxuICAgICAgICAgICAgb3V0cHV0cyA9IFtdLFxuICAgICAgICAgICAgbWV0aG9kcyA9IFtdLFxuICAgICAgICAgICAgcHJvcGVydGllcyA9IFtdLFxuICAgICAgICAgICAgaW5kZXhTaWduYXR1cmVzID0gW10sXG4gICAgICAgICAgICBraW5kLFxuICAgICAgICAgICAgaW5wdXREZWNvcmF0b3IsXG4gICAgICAgICAgICBjb25zdHJ1Y3RvcixcbiAgICAgICAgICAgIG91dERlY29yYXRvcjtcblxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVtYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaW5wdXREZWNvcmF0b3IgPSB0aGlzLmdldERlY29yYXRvck9mVHlwZShtZW1iZXJzW2ldLCAnSW5wdXQnKTtcbiAgICAgICAgICAgIG91dERlY29yYXRvciA9IHRoaXMuZ2V0RGVjb3JhdG9yT2ZUeXBlKG1lbWJlcnNbaV0sICdPdXRwdXQnKTtcblxuICAgICAgICAgICAga2luZCA9IG1lbWJlcnNbaV0ua2luZDtcblxuICAgICAgICAgICAgaWYgKGlucHV0RGVjb3JhdG9yKSB7XG4gICAgICAgICAgICAgICAgaW5wdXRzLnB1c2godGhpcy52aXNpdElucHV0KG1lbWJlcnNbaV0sIGlucHV0RGVjb3JhdG9yLCBzb3VyY2VGaWxlKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG91dERlY29yYXRvcikge1xuICAgICAgICAgICAgICAgIG91dHB1dHMucHVzaCh0aGlzLnZpc2l0T3V0cHV0KG1lbWJlcnNbaV0sIG91dERlY29yYXRvciwgc291cmNlRmlsZSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5pc0hpZGRlbk1lbWJlcihtZW1iZXJzW2ldKSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCAodGhpcy5pc1ByaXZhdGUobWVtYmVyc1tpXSkgfHwgdGhpcy5pc0ludGVybmFsKG1lbWJlcnNbaV0pKSAmJiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuZGlzYWJsZVByaXZhdGVPckludGVybmFsU3VwcG9ydCkge30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgobWVtYmVyc1tpXS5raW5kID09PSB0cy5TeW50YXhLaW5kLk1ldGhvZERlY2xhcmF0aW9uIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1iZXJzW2ldLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuTWV0aG9kU2lnbmF0dXJlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kcy5wdXNoKHRoaXMudmlzaXRNZXRob2REZWNsYXJhdGlvbihtZW1iZXJzW2ldLCBzb3VyY2VGaWxlKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1iZXJzW2ldLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuUHJvcGVydHlEZWNsYXJhdGlvbiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVtYmVyc1tpXS5raW5kID09PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5U2lnbmF0dXJlIHx8IG1lbWJlcnNbaV0ua2luZCA9PT0gdHMuU3ludGF4S2luZC5HZXRBY2Nlc3Nvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKHRoaXMudmlzaXRQcm9wZXJ0eShtZW1iZXJzW2ldLCBzb3VyY2VGaWxlKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWVtYmVyc1tpXS5raW5kID09PSB0cy5TeW50YXhLaW5kLkNhbGxTaWduYXR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaCh0aGlzLnZpc2l0Q2FsbERlY2xhcmF0aW9uKG1lbWJlcnNbaV0sIHNvdXJjZUZpbGUpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtZW1iZXJzW2ldLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuSW5kZXhTaWduYXR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4U2lnbmF0dXJlcy5wdXNoKHRoaXMudmlzaXRJbmRleERlY2xhcmF0aW9uKG1lbWJlcnNbaV0sIHNvdXJjZUZpbGUpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtZW1iZXJzW2ldLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBfY29uc3RydWN0b3JQcm9wZXJ0aWVzID0gdGhpcy52aXNpdENvbnN0cnVjdG9yUHJvcGVydGllcyhtZW1iZXJzW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW4gPSBfY29uc3RydWN0b3JQcm9wZXJ0aWVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqOyBqPGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKF9jb25zdHJ1Y3RvclByb3BlcnRpZXNbal0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RydWN0b3IgPSB0aGlzLnZpc2l0Q29uc3RydWN0b3JEZWNsYXJhdGlvbihtZW1iZXJzW2ldLCBzb3VyY2VGaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlucHV0cy5zb3J0KHRoaXMuZ2V0TmFtZXNDb21wYXJlRm4oKSk7XG4gICAgICAgIG91dHB1dHMuc29ydCh0aGlzLmdldE5hbWVzQ29tcGFyZUZuKCkpO1xuICAgICAgICBwcm9wZXJ0aWVzLnNvcnQodGhpcy5nZXROYW1lc0NvbXBhcmVGbigpKTtcbiAgICAgICAgaW5kZXhTaWduYXR1cmVzLnNvcnQodGhpcy5nZXROYW1lc0NvbXBhcmVGbigpKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5wdXRzLFxuICAgICAgICAgICAgb3V0cHV0cyxcbiAgICAgICAgICAgIG1ldGhvZHMsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLFxuICAgICAgICAgICAgaW5kZXhTaWduYXR1cmVzLFxuICAgICAgICAgICAga2luZCxcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2aXNpdERpcmVjdGl2ZURlY29yYXRvcihkZWNvcmF0b3IpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvcHlyaWdodCBodHRwczovL2dpdGh1Yi5jb20vbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcFxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHNlbGVjdG9yO1xuICAgICAgICB2YXIgZXhwb3J0QXM7XG4gICAgICAgIHZhciBwcm9wZXJ0aWVzID0gZGVjb3JhdG9yLmV4cHJlc3Npb24uYXJndW1lbnRzWzBdLnByb3BlcnRpZXM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocHJvcGVydGllc1tpXS5uYW1lLnRleHQgPT09ICdzZWxlY3RvcicpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiB0aGlzIHdpbGwgb25seSB3b3JrIGlmIHNlbGVjdG9yIGlzIGluaXRpYWxpemVkIGFzIGEgc3RyaW5nIGxpdGVyYWxcbiAgICAgICAgICAgICAgICBzZWxlY3RvciA9IHByb3BlcnRpZXNbaV0uaW5pdGlhbGl6ZXIudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW2ldLm5hbWUudGV4dCA9PT0gJ2V4cG9ydEFzJykge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IHRoaXMgd2lsbCBvbmx5IHdvcmsgaWYgc2VsZWN0b3IgaXMgaW5pdGlhbGl6ZWQgYXMgYSBzdHJpbmcgbGl0ZXJhbFxuICAgICAgICAgICAgICAgIGV4cG9ydEFzID0gcHJvcGVydGllc1tpXS5pbml0aWFsaXplci50ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLFxuICAgICAgICAgICAgZXhwb3J0QXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlzUGlwZURlY29yYXRvcihkZWNvcmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIChkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uKSA/IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24udGV4dCA9PT0gJ1BpcGUnIDogZmFsc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc01vZHVsZURlY29yYXRvcihkZWNvcmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIChkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uKSA/IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24udGV4dCA9PT0gJ05nTW9kdWxlJyA6IGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNEaXJlY3RpdmVEZWNvcmF0b3IoZGVjb3JhdG9yKSB7XG4gICAgICAgIGlmIChkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICB2YXIgZGVjb3JhdG9ySWRlbnRpZmllclRleHQgPSBkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uLnRleHQ7XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9ySWRlbnRpZmllclRleHQgPT09ICdEaXJlY3RpdmUnIHx8IGRlY29yYXRvcklkZW50aWZpZXJUZXh0ID09PSAnQ29tcG9uZW50JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaXNTZXJ2aWNlRGVjb3JhdG9yKGRlY29yYXRvcikge1xuICAgICAgICByZXR1cm4gKGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24pID8gZGVjb3JhdG9yLmV4cHJlc3Npb24uZXhwcmVzc2lvbi50ZXh0ID09PSAnSW5qZWN0YWJsZScgOiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZpc2l0Q2xhc3NEZWNsYXJhdGlvbihmaWxlTmFtZSwgY2xhc3NEZWNsYXJhdGlvbiwgc291cmNlRmlsZT8pIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvcHlyaWdodCBodHRwczovL2dpdGh1Yi5jb20vbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcFxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHN5bWJvbCA9IHRoaXMucHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpLmdldFN5bWJvbEF0TG9jYXRpb24oY2xhc3NEZWNsYXJhdGlvbi5uYW1lKTtcbiAgICAgICAgdmFyIGRlc2NyaXB0aW9uID0gbWFya2VkKExpbmtQYXJzZXIucmVzb2x2ZUxpbmtzKHRzLmRpc3BsYXlQYXJ0c1RvU3RyaW5nKHN5bWJvbC5nZXREb2N1bWVudGF0aW9uQ29tbWVudCgpKSkpO1xuICAgICAgICB2YXIgY2xhc3NOYW1lID0gY2xhc3NEZWNsYXJhdGlvbi5uYW1lLnRleHQ7XG4gICAgICAgIHZhciBkaXJlY3RpdmVJbmZvO1xuICAgICAgICB2YXIgbWVtYmVycztcbiAgICAgICAgdmFyIGltcGxlbWVudHNFbGVtZW50cyA9IFtdO1xuICAgICAgICB2YXIgZXh0ZW5kc0VsZW1lbnQ7XG4gICAgICAgIHZhciBqc2RvY3RhZ3MgPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIHRzLmdldENsYXNzSW1wbGVtZW50c0hlcml0YWdlQ2xhdXNlRWxlbWVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgaW1wbGVtZW50ZWRUeXBlcyA9IHRzLmdldENsYXNzSW1wbGVtZW50c0hlcml0YWdlQ2xhdXNlRWxlbWVudHMoY2xhc3NEZWNsYXJhdGlvbik7XG4gICAgICAgICAgICBpZiAoaW1wbGVtZW50ZWRUeXBlcykge1xuICAgICAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gaW1wbGVtZW50ZWRUeXBlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGltcGxlbWVudGVkVHlwZXNbaV0uZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1wbGVtZW50c0VsZW1lbnRzLnB1c2goaW1wbGVtZW50ZWRUeXBlc1tpXS5leHByZXNzaW9uLnRleHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0cy5nZXRDbGFzc0V4dGVuZHNIZXJpdGFnZUNsYXVzZUVsZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgZXh0ZW5kc1R5cGVzID0gdHMuZ2V0Q2xhc3NFeHRlbmRzSGVyaXRhZ2VDbGF1c2VFbGVtZW50KGNsYXNzRGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgaWYgKGV4dGVuZHNUeXBlcykge1xuICAgICAgICAgICAgICAgIGlmIChleHRlbmRzVHlwZXMuZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgICAgICBleHRlbmRzRWxlbWVudCA9IGV4dGVuZHNUeXBlcy5leHByZXNzaW9uLnRleHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgIGpzZG9jdGFncyA9IEpTRG9jVGFnc1BhcnNlci5nZXRKU0RvY3Moc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNsYXNzRGVjbGFyYXRpb24uZGVjb3JhdG9ycykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0RlY2xhcmF0aW9uLmRlY29yYXRvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0RpcmVjdGl2ZURlY29yYXRvcihjbGFzc0RlY2xhcmF0aW9uLmRlY29yYXRvcnNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZUluZm8gPSB0aGlzLnZpc2l0RGlyZWN0aXZlRGVjb3JhdG9yKGNsYXNzRGVjbGFyYXRpb24uZGVjb3JhdG9yc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIG1lbWJlcnMgPSB0aGlzLnZpc2l0TWVtYmVycyhjbGFzc0RlY2xhcmF0aW9uLm1lbWJlcnMsIHNvdXJjZUZpbGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHM6IG1lbWJlcnMuaW5wdXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogbWVtYmVycy5vdXRwdXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogbWVtYmVycy5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kczogbWVtYmVycy5tZXRob2RzLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhTaWduYXR1cmVzOiBtZW1iZXJzLmluZGV4U2lnbmF0dXJlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1lbWJlcnMua2luZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBtZW1iZXJzLmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAganNkb2N0YWdzOiBqc2RvY3RhZ3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzOiBleHRlbmRzRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcGxlbWVudHM6IGltcGxlbWVudHNFbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc1NlcnZpY2VEZWNvcmF0b3IoY2xhc3NEZWNsYXJhdGlvbi5kZWNvcmF0b3JzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICBtZW1iZXJzID0gdGhpcy52aXNpdE1lbWJlcnMoY2xhc3NEZWNsYXJhdGlvbi5tZW1iZXJzLCBzb3VyY2VGaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kczogbWVtYmVycy5tZXRob2RzLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhTaWduYXR1cmVzOiBtZW1iZXJzLmluZGV4U2lnbmF0dXJlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IG1lbWJlcnMucHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1lbWJlcnMua2luZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBtZW1iZXJzLmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kczogZXh0ZW5kc0VsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBsZW1lbnRzOiBpbXBsZW1lbnRzRWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzUGlwZURlY29yYXRvcihjbGFzc0RlY2xhcmF0aW9uLmRlY29yYXRvcnNbaV0pIHx8IHRoaXMuaXNNb2R1bGVEZWNvcmF0b3IoY2xhc3NEZWNsYXJhdGlvbi5kZWNvcmF0b3JzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBqc2RvY3RhZ3M6IGpzZG9jdGFnc1xuICAgICAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdjdXN0b20gZGVjb3JhdG9yJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICBtZW1iZXJzID0gdGhpcy52aXNpdE1lbWJlcnMoY2xhc3NEZWNsYXJhdGlvbi5tZW1iZXJzLCBzb3VyY2VGaWxlKTtcblxuICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgbWV0aG9kczogbWVtYmVycy5tZXRob2RzLFxuICAgICAgICAgICAgICAgIGluZGV4U2lnbmF0dXJlczogbWVtYmVycy5pbmRleFNpZ25hdHVyZXMsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogbWVtYmVycy5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgIGtpbmQ6IG1lbWJlcnMua2luZCxcbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvcjogbWVtYmVycy5jb25zdHJ1Y3RvcixcbiAgICAgICAgICAgICAgICBleHRlbmRzOiBleHRlbmRzRWxlbWVudCxcbiAgICAgICAgICAgICAgICBpbXBsZW1lbnRzOiBpbXBsZW1lbnRzRWxlbWVudHNcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVtYmVycyA9IHRoaXMudmlzaXRNZW1iZXJzKGNsYXNzRGVjbGFyYXRpb24ubWVtYmVycywgc291cmNlRmlsZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIG1ldGhvZHM6IG1lbWJlcnMubWV0aG9kcyxcbiAgICAgICAgICAgICAgICBpbmRleFNpZ25hdHVyZXM6IG1lbWJlcnMuaW5kZXhTaWduYXR1cmVzLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IG1lbWJlcnMucHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICBraW5kOiBtZW1iZXJzLmtpbmQsXG4gICAgICAgICAgICAgICAgY29uc3RydWN0b3I6IG1lbWJlcnMuY29uc3RydWN0b3IsXG4gICAgICAgICAgICAgICAgZXh0ZW5kczogZXh0ZW5kc0VsZW1lbnQsXG4gICAgICAgICAgICAgICAgaW1wbGVtZW50czogaW1wbGVtZW50c0VsZW1lbnRzXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZpc2l0VHlwZURlY2xhcmF0aW9uKHR5cGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdDphbnkgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogdHlwZS5uYW1lLnRleHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBqc2RvY3RhZ3MgPSBKU0RvY1RhZ3NQYXJzZXIuZ2V0SlNEb2NzKHR5cGUpO1xuXG4gICAgICAgIHZhciBtYXJrZWR0YWdzID0gZnVuY3Rpb24odGFncykge1xuICAgICAgICAgICAgICAgIHZhciBtdGFncyA9IHRhZ3M7XG4gICAgICAgICAgICAgICAgXy5mb3JFYWNoKG10YWdzLCAodGFnKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRhZy5jb21tZW50ID0gbWFya2VkKExpbmtQYXJzZXIucmVzb2x2ZUxpbmtzKHRhZy5jb21tZW50KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG10YWdzO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoanNkb2N0YWdzICYmIGpzZG9jdGFncy5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgaWYgKGpzZG9jdGFnc1swXS50YWdzKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmpzZG9jdGFncyA9IG1hcmtlZHRhZ3MoanNkb2N0YWdzWzBdLnRhZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2aXNpdEZ1bmN0aW9uRGVjbGFyYXRpb24obWV0aG9kKSB7XG4gICAgICAgIGxldCBtYXBUeXBlcyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgOTQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnTnVsbCc7XG4gICAgICAgICAgICAgICAgY2FzZSAxMTg6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnQW55JztcbiAgICAgICAgICAgICAgICBjYXNlIDEyMTpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdCb29sZWFuJztcbiAgICAgICAgICAgICAgICBjYXNlIDEyOTpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdOZXZlcic7XG4gICAgICAgICAgICAgICAgY2FzZSAxMzI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnTnVtYmVyJztcbiAgICAgICAgICAgICAgICBjYXNlIDEzNDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdTdHJpbmcnO1xuICAgICAgICAgICAgICAgIGNhc2UgMTM3OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1VuZGVmaW5lZCc7XG4gICAgICAgICAgICAgICAgY2FzZSAxNTc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnVHlwZVJlZmVyZW5jZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHZpc2l0QXJndW1lbnQgPSBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQ6IGFueSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBhcmcubmFtZS50ZXh0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGFyZy50eXBlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnR5cGUgPSBtYXBUeXBlcyhhcmcudHlwZS5raW5kKTtcbiAgICAgICAgICAgICAgICBpZiAoYXJnLnR5cGUua2luZCA9PT0gMTU3KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdHJ5IHJlcGxhY2UgVHlwZVJlZmVyZW5jZSB3aXRoIHR5cGVOYW1lXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmcudHlwZS50eXBlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnR5cGUgPSBhcmcudHlwZS50eXBlTmFtZS50ZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHQ6YW55ID0ge1xuICAgICAgICAgICAgbmFtZTogbWV0aG9kLm5hbWUudGV4dCxcbiAgICAgICAgICAgIGFyZ3M6IG1ldGhvZC5wYXJhbWV0ZXJzID8gbWV0aG9kLnBhcmFtZXRlcnMubWFwKChwcm9wKSA9PiB2aXNpdEFyZ3VtZW50KHByb3ApKSA6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIGpzZG9jdGFncyA9IEpTRG9jVGFnc1BhcnNlci5nZXRKU0RvY3MobWV0aG9kKTtcblxuICAgICAgICB2YXIgbWFya2VkdGFncyA9IGZ1bmN0aW9uKHRhZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXRhZ3MgPSB0YWdzO1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChtdGFncywgKHRhZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0YWcuY29tbWVudCA9IG1hcmtlZChMaW5rUGFyc2VyLnJlc29sdmVMaW5rcyh0YWcuY29tbWVudCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBtdGFncztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QudHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJlc3VsdC5yZXR1cm5UeXBlID0gdGhpcy52aXNpdFR5cGUobWV0aG9kLnR5cGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldGhvZC5tb2RpZmllcnMpIHtcbiAgICAgICAgICAgIGlmIChtZXRob2QubW9kaWZpZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQubW9kaWZpZXJLaW5kID0gbWV0aG9kLm1vZGlmaWVyc1swXS5raW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChqc2RvY3RhZ3MgJiYganNkb2N0YWdzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBpZiAoanNkb2N0YWdzWzBdLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuanNkb2N0YWdzID0gbWFya2VkdGFncyhqc2RvY3RhZ3NbMF0udGFncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZpc2l0VmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIGlmKCBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMgKSB7XG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0gbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihpOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLm5hbWUudGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnNbaV0uaW5pdGlhbGl6ZXIgPyB0aGlzLnN0cmluZ2lmeURlZmF1bHRWYWx1ZShub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnNbaV0uaW5pdGlhbGl6ZXIpIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKG5vZGUuZGVjbGFyYXRpb25MaXN0LmRlY2xhcmF0aW9uc1tpXS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC50eXBlID0gdGhpcy52aXNpdFR5cGUobm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLnR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2aXNpdEVudW1EZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXSxcbiAgICAgICAgaWYoIG5vZGUubWVtYmVycyApIHtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSBub2RlLm1lbWJlcnMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgbWVtYmVyID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm1lbWJlcnNbaV0ubmFtZS50ZXh0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub2RlLm1lbWJlcnNbaV0uaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtYmVyLnZhbHVlID0gbm9kZS5tZW1iZXJzW2ldLmluaXRpYWxpemVyLnRleHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG1lbWJlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZpc2l0RW51bURlY2xhcmF0aW9uRm9yUm91dGVzKGZpbGVOYW1lLCBub2RlKSB7XG4gICAgICAgIGlmKCBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMgKSB7XG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0gbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihpOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYobm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLnR5cGUudHlwZU5hbWUgJiYgbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLnR5cGUudHlwZU5hbWUudGV4dCA9PT0gJ1JvdXRlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGUobm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zW2ldLmluaXRpYWxpemVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgUm91dGVyUGFyc2VyLmFkZFJvdXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnNbaV0ubmFtZS50ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IFJvdXRlclBhcnNlci5jbGVhblJhd1JvdXRlKGRhdGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlczogZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Um91dGVJTyhmaWxlbmFtZSwgc291cmNlRmlsZSkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29weXJpZ2h0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZy1ib290c3RyYXAvbmctYm9vdHN0cmFwXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgcmVzID0gc291cmNlRmlsZS5zdGF0ZW1lbnRzLnJlZHVjZSgoZGlyZWN0aXZlLCBzdGF0ZW1lbnQpID0+IHtcblxuICAgICAgICAgICAgaWYgKHN0YXRlbWVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLlZhcmlhYmxlU3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGl2ZS5jb25jYXQodGhpcy52aXNpdEVudW1EZWNsYXJhdGlvbkZvclJvdXRlcyhmaWxlbmFtZSwgc3RhdGVtZW50KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkaXJlY3RpdmU7XG4gICAgICAgIH0sIFtdKVxuXG4gICAgICAgIHJldHVybiByZXNbMF0gfHwge307XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRJTyhmaWxlbmFtZTogc3RyaW5nLCBzb3VyY2VGaWxlLCBub2RlKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb3B5cmlnaHQgaHR0cHM6Ly9naXRodWIuY29tL25nLWJvb3RzdHJhcC9uZy1ib290c3RyYXBcbiAgICAgICAgICovXG4gICAgICAgIHZhciByZXMgPSBzb3VyY2VGaWxlLnN0YXRlbWVudHMucmVkdWNlKChkaXJlY3RpdmUsIHN0YXRlbWVudCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc3RhdGVtZW50LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZW1lbnQucG9zID09PSBub2RlLnBvcyAmJiBzdGF0ZW1lbnQuZW5kID09PSBub2RlLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aXZlLmNvbmNhdCh0aGlzLnZpc2l0Q2xhc3NEZWNsYXJhdGlvbihmaWxlbmFtZSwgc3RhdGVtZW50LCBzb3VyY2VGaWxlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGlyZWN0aXZlO1xuICAgICAgICB9LCBbXSlcblxuICAgICAgICByZXR1cm4gcmVzWzBdIHx8IHt9O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q2xhc3NJTyhmaWxlbmFtZTogc3RyaW5nLCBzb3VyY2VGaWxlLCBub2RlKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb3B5cmlnaHQgaHR0cHM6Ly9naXRodWIuY29tL25nLWJvb3RzdHJhcC9uZy1ib290c3RyYXBcbiAgICAgICAgICovXG4gICAgICAgIHZhciByZXMgPSBzb3VyY2VGaWxlLnN0YXRlbWVudHMucmVkdWNlKChkaXJlY3RpdmUsIHN0YXRlbWVudCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc3RhdGVtZW50LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZW1lbnQucG9zID09PSBub2RlLnBvcyAmJiBzdGF0ZW1lbnQuZW5kID09PSBub2RlLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aXZlLmNvbmNhdCh0aGlzLnZpc2l0Q2xhc3NEZWNsYXJhdGlvbihmaWxlbmFtZSwgc3RhdGVtZW50LCBzb3VyY2VGaWxlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGlyZWN0aXZlO1xuICAgICAgICB9LCBbXSlcblxuICAgICAgICByZXR1cm4gcmVzWzBdIHx8IHt9O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0SW50ZXJmYWNlSU8oZmlsZW5hbWU6IHN0cmluZywgc291cmNlRmlsZSwgbm9kZSkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29weXJpZ2h0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZy1ib290c3RyYXAvbmctYm9vdHN0cmFwXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgcmVzID0gc291cmNlRmlsZS5zdGF0ZW1lbnRzLnJlZHVjZSgoZGlyZWN0aXZlLCBzdGF0ZW1lbnQpID0+IHtcblxuICAgICAgICAgICAgaWYgKHN0YXRlbWVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLkludGVyZmFjZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlbWVudC5wb3MgPT09IG5vZGUucG9zICYmIHN0YXRlbWVudC5lbmQgPT09IG5vZGUuZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3RpdmUuY29uY2F0KHRoaXMudmlzaXRDbGFzc0RlY2xhcmF0aW9uKGZpbGVuYW1lLCBzdGF0ZW1lbnQsIHNvdXJjZUZpbGUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkaXJlY3RpdmU7XG4gICAgICAgIH0sIFtdKVxuXG4gICAgICAgIHJldHVybiByZXNbMF0gfHwge307XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRPdXRwdXRzKHByb3BzOiBOb2RlT2JqZWN0W10pOiBzdHJpbmdbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICdvdXRwdXRzJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRQcm92aWRlcnMocHJvcHM6IE5vZGVPYmplY3RbXSk6IERlcHNbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICdwcm92aWRlcnMnKS5tYXAoKG5hbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRGVlcEluZGVudGlmaWVyKG5hbWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbXBvbmVudFZpZXdQcm92aWRlcnMocHJvcHM6IE5vZGVPYmplY3RbXSk6IERlcHNbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICd2aWV3UHJvdmlkZXJzJykubWFwKChuYW1lKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURlZXBJbmRlbnRpZmllcihuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnREaXJlY3RpdmVzKHByb3BzOiBOb2RlT2JqZWN0W10pOiBEZXBzW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAnZGlyZWN0aXZlcycpLm1hcCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGlkZW50aWZpZXIgPSB0aGlzLnBhcnNlRGVlcEluZGVudGlmaWVyKG5hbWUpO1xuICAgICAgICAgICAgaWRlbnRpZmllci5zZWxlY3RvciA9IHRoaXMuZmluZENvbXBvbmVudFNlbGVjdG9yQnlOYW1lKG5hbWUpO1xuICAgICAgICAgICAgaWRlbnRpZmllci5sYWJlbCA9ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGlkZW50aWZpZXI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgcGFyc2VEZWVwSW5kZW50aWZpZXIobmFtZTogc3RyaW5nKTogYW55IHtcbiAgICAgICAgbGV0IG5zTW9kdWxlID0gbmFtZS5zcGxpdCgnLicpLFxuICAgICAgICAgICAgdHlwZSA9IHRoaXMuZ2V0VHlwZShuYW1lKTtcbiAgICAgICAgaWYgKG5zTW9kdWxlLmxlbmd0aCA+IDEpIHtcblxuICAgICAgICAgICAgLy8gY2FjaGUgZGVwcyB3aXRoIHRoZSBzYW1lIG5hbWVzcGFjZSAoaS5lIFNoYXJlZC4qKVxuICAgICAgICAgICAgaWYgKHRoaXMuX19uc01vZHVsZVtuc01vZHVsZVswXV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fbnNNb2R1bGVbbnNNb2R1bGVbMF1dLnB1c2gobmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX19uc01vZHVsZVtuc01vZHVsZVswXV0gPSBbbmFtZV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbnM6IG5zTW9kdWxlWzBdLFxuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50VGVtcGxhdGVVcmwocHJvcHM6IE5vZGVPYmplY3RbXSk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3ltYm9sRGVwcyhwcm9wcywgJ3RlbXBsYXRlVXJsJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRUZW1wbGF0ZShwcm9wczogTm9kZU9iamVjdFtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IHQgPSB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICd0ZW1wbGF0ZScsIHRydWUpLnBvcCgpXG4gICAgICAgIGlmKHQpIHtcbiAgICAgICAgICAgIHQgPSBkZXRlY3RJbmRlbnQodCwgMCk7XG4gICAgICAgICAgICB0ID0gdC5yZXBsYWNlKC9cXG4vLCAnJyk7XG4gICAgICAgICAgICB0ID0gdC5yZXBsYWNlKC8gKyQvZ20sICcnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbXBvbmVudFN0eWxlVXJscyhwcm9wczogTm9kZU9iamVjdFtdKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5zYW5pdGl6ZVVybHModGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAnc3R5bGVVcmxzJykpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50U3R5bGVzKHByb3BzOiBOb2RlT2JqZWN0W10pOiBzdHJpbmdbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFN5bWJvbERlcHMocHJvcHMsICdzdHlsZXMnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbXBvbmVudE1vZHVsZUlkKHByb3BzOiBOb2RlT2JqZWN0W10pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAnbW9kdWxlSWQnKS5wb3AoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbXBvbmVudENoYW5nZURldGVjdGlvbihwcm9wczogTm9kZU9iamVjdFtdKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3ltYm9sRGVwcyhwcm9wcywgJ2NoYW5nZURldGVjdGlvbicpLnBvcCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50RW5jYXBzdWxhdGlvbihwcm9wczogTm9kZU9iamVjdFtdKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTeW1ib2xEZXBzKHByb3BzLCAnZW5jYXBzdWxhdGlvbicpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2FuaXRpemVVcmxzKHVybHM6IHN0cmluZ1tdKSB7XG4gICAgICAgIHJldHVybiB1cmxzLm1hcCh1cmwgPT4gdXJsLnJlcGxhY2UoJy4vJywgJycpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFN5bWJvbERlcHNPYmplY3QocHJvcHM6IE5vZGVPYmplY3RbXSwgdHlwZTogc3RyaW5nLCBtdWx0aUxpbmU/OiBib29sZWFuKTogT2JqZWN0IHtcbiAgICAgICAgbGV0IGRlcHMgPSBwcm9wcy5maWx0ZXIoKG5vZGU6IE5vZGVPYmplY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBub2RlLm5hbWUudGV4dCA9PT0gdHlwZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHBhcnNlUHJvcGVydGllcyA9IChub2RlOiBOb2RlT2JqZWN0KTogT2JqZWN0ID0+IHtcbiAgICAgICAgICAgIGxldCBvYmogPSB7fTtcbiAgICAgICAgICAgIChub2RlLmluaXRpYWxpemVyLnByb3BlcnRpZXMgfHwgW10pLmZvckVhY2goKHByb3A6IE5vZGVPYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBvYmpbcHJvcC5uYW1lLnRleHRdID0gcHJvcC5pbml0aWFsaXplci50ZXh0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBkZXBzLm1hcChwYXJzZVByb3BlcnRpZXMpLnBvcCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U3ltYm9sRGVwc1Jhdyhwcm9wczogTm9kZU9iamVjdFtdLCB0eXBlOiBzdHJpbmcsIG11bHRpTGluZT86IGJvb2xlYW4pOiBhbnkge1xuICAgICAgICBsZXQgZGVwcyA9IHByb3BzLmZpbHRlcigobm9kZTogTm9kZU9iamVjdCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUubmFtZS50ZXh0ID09PSB0eXBlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlcHMgfHwgW107XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRTeW1ib2xEZXBzKHByb3BzOiBOb2RlT2JqZWN0W10sIHR5cGU6IHN0cmluZywgbXVsdGlMaW5lPzogYm9vbGVhbik6IHN0cmluZ1tdIHtcblxuICAgICAgICBsZXQgZGVwcyA9IHByb3BzLmZpbHRlcigobm9kZTogTm9kZU9iamVjdCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUubmFtZS50ZXh0ID09PSB0eXBlO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgcGFyc2VTeW1ib2xUZXh0ID0gKHRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICBdO1xuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBidWlsZElkZW50aWZpZXJOYW1lID0gKG5vZGU6IE5vZGVPYmplY3QsIG5hbWUgPSAnJykgPT4ge1xuXG4gICAgICAgICAgICBpZiAobm9kZS5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUgPyBgLiR7bmFtZX1gIDogbmFtZTtcblxuICAgICAgICAgICAgICAgIGxldCBub2RlTmFtZSA9IHRoaXMudW5rbm93bjtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lID0gbm9kZS5uYW1lLnRleHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vZGUudGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlTmFtZSA9IG5vZGUudGV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobm9kZS5leHByZXNzaW9uKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuZXhwcmVzc2lvbi50ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlTmFtZSA9IG5vZGUuZXhwcmVzc2lvbi50ZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYobm9kZS5leHByZXNzaW9uLmVsZW1lbnRzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmV4cHJlc3Npb24ua2luZCA9PT0gdHMuU3ludGF4S2luZC5BcnJheUxpdGVyYWxFeHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWUgPSBub2RlLmV4cHJlc3Npb24uZWxlbWVudHMubWFwKCBlbCA9PiBlbC50ZXh0ICkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlTmFtZSA9IGBbJHtub2RlTmFtZX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUua2luZCA9PT0gIHRzLlN5bnRheEtpbmQuU3ByZWFkRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYC4uLiR7bm9kZU5hbWV9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke2J1aWxkSWRlbnRpZmllck5hbWUobm9kZS5leHByZXNzaW9uLCBub2RlTmFtZSl9JHtuYW1lfWBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGAke25vZGUudGV4dH0uJHtuYW1lfWA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyc2VQcm92aWRlckNvbmZpZ3VyYXRpb24gPSAobzogTm9kZU9iamVjdCk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAvLyBwYXJzZSBleHByZXNzaW9ucyBzdWNoIGFzOlxuICAgICAgICAgICAgLy8geyBwcm92aWRlOiBBUFBfQkFTRV9IUkVGLCB1c2VWYWx1ZTogJy8nIH0sXG4gICAgICAgICAgICAvLyBvclxuICAgICAgICAgICAgLy8geyBwcm92aWRlOiAnRGF0ZScsIHVzZUZhY3Rvcnk6IChkMSwgZDIpID0+IG5ldyBEYXRlKCksIGRlcHM6IFsnZDEnLCAnZDInXSB9XG5cbiAgICAgICAgICAgIGxldCBfZ2VuUHJvdmlkZXJOYW1lOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgbGV0IF9wcm92aWRlclByb3BzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgICAgICAoby5wcm9wZXJ0aWVzIHx8IFtdKS5mb3JFYWNoKChwcm9wOiBOb2RlT2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpZmllciA9IHByb3AuaW5pdGlhbGl6ZXIudGV4dDtcbiAgICAgICAgICAgICAgICBpZiAocHJvcC5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllciA9IGAnJHtpZGVudGlmaWVyfSdgO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGxhbWJkYSBmdW5jdGlvbiAoaS5lIHVzZUZhY3RvcnkpXG4gICAgICAgICAgICAgICAgaWYgKHByb3AuaW5pdGlhbGl6ZXIuYm9keSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyYW1zID0gKHByb3AuaW5pdGlhbGl6ZXIucGFyYW1ldGVycyB8fCA8YW55PltdKS5tYXAoKHBhcmFtczogTm9kZU9iamVjdCkgPT4gcGFyYW1zLm5hbWUudGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXIgPSBgKCR7cGFyYW1zLmpvaW4oJywgJyl9KSA9PiB7fWA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZmFjdG9yeSBkZXBzIGFycmF5XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocHJvcC5pbml0aWFsaXplci5lbGVtZW50cykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbWVudHMgPSAocHJvcC5pbml0aWFsaXplci5lbGVtZW50cyB8fCBbXSkubWFwKChuOiBOb2RlT2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJyR7bi50ZXh0fSdgO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbi50ZXh0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllciA9IGBbJHtlbGVtZW50cy5qb2luKCcsICcpfV1gO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF9wcm92aWRlclByb3BzLnB1c2goW1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGkuZSBwcm92aWRlXG4gICAgICAgICAgICAgICAgICAgIHByb3AubmFtZS50ZXh0LFxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGkuZSBPcGFxdWVUb2tlbiBvciAnU3RyaW5nVG9rZW4nXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXJcblxuICAgICAgICAgICAgICAgIF0uam9pbignOiAnKSk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gYHsgJHtfcHJvdmlkZXJQcm9wcy5qb2luKCcsICcpfSB9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJzZVN5bWJvbEVsZW1lbnRzID0gKG86IE5vZGVPYmplY3QgfCBhbnkpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgLy8gcGFyc2UgZXhwcmVzc2lvbnMgc3VjaCBhczogQW5ndWxhckZpcmVNb2R1bGUuaW5pdGlhbGl6ZUFwcChmaXJlYmFzZUNvbmZpZylcbiAgICAgICAgICAgIGlmIChvLmFyZ3VtZW50cykge1xuICAgICAgICAgICAgICAgIGxldCBjbGFzc05hbWUgPSBidWlsZElkZW50aWZpZXJOYW1lKG8uZXhwcmVzc2lvbik7XG5cbiAgICAgICAgICAgICAgICAvLyBmdW5jdGlvbiBhcmd1bWVudHMgY291bGQgYmUgcmVhbGx5IGNvbXBsZXhlLiBUaGVyZSBhcmUgc29cbiAgICAgICAgICAgICAgICAvLyBtYW55IHVzZSBjYXNlcyB0aGF0IHdlIGNhbid0IGhhbmRsZS4gSnVzdCBwcmludCBcImFyZ3NcIiB0byBpbmRpY2F0ZVxuICAgICAgICAgICAgICAgIC8vIHRoYXQgd2UgaGF2ZSBhcmd1bWVudHMuXG5cbiAgICAgICAgICAgICAgICBsZXQgZnVuY3Rpb25BcmdzID0gby5hcmd1bWVudHMubGVuZ3RoID4gMCA/ICdhcmdzJyA6ICcnO1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gYCR7Y2xhc3NOYW1lfSgke2Z1bmN0aW9uQXJnc30pYDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2UgZXhwcmVzc2lvbnMgc3VjaCBhczogU2hhcmVkLk1vZHVsZVxuICAgICAgICAgICAgZWxzZSBpZiAoby5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgbGV0IGlkZW50aWZpZXIgPSBidWlsZElkZW50aWZpZXJOYW1lKG8pO1xuICAgICAgICAgICAgICAgIHJldHVybiBpZGVudGlmaWVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gby50ZXh0ID8gby50ZXh0IDogcGFyc2VQcm92aWRlckNvbmZpZ3VyYXRpb24obyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IHBhcnNlU3ltYm9scyA9IChub2RlOiBOb2RlT2JqZWN0KTogc3RyaW5nW10gPT4ge1xuXG4gICAgICAgICAgICBsZXQgdGV4dCA9IG5vZGUuaW5pdGlhbGl6ZXIudGV4dDtcbiAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlU3ltYm9sVGV4dCh0ZXh0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxzZSBpZiAobm9kZS5pbml0aWFsaXplci5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgbGV0IGlkZW50aWZpZXIgPSBwYXJzZVN5bWJvbEVsZW1lbnRzKG5vZGUuaW5pdGlhbGl6ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXJcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLmluaXRpYWxpemVyLmVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuaW5pdGlhbGl6ZXIuZWxlbWVudHMubWFwKHBhcnNlU3ltYm9sRWxlbWVudHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkZXBzLm1hcChwYXJzZVN5bWJvbHMpLnBvcCgpIHx8IFtdO1xuICAgIH1cblxuICAgIHByaXZhdGUgZmluZENvbXBvbmVudFNlbGVjdG9yQnlOYW1lKG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2NhY2hlW25hbWVdO1xuICAgIH1cblxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIHByb21pc2VTZXF1ZW50aWFsKHByb21pc2VzKSB7XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZCB0byBiZSBhbiBhcnJheSBvZiBQcm9taXNlcycpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXTtcblxuICAgICAgICBjb25zdCBpdGVyYXRlZUZ1bmMgPSAocHJldmlvdXNQcm9taXNlLCBjdXJyZW50UHJvbWlzZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzUHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY291bnQrKyAhPT0gMCkgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50UHJvbWlzZShyZXN1bHQsIHJlc3VsdHMsIGNvdW50KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2VzID0gcHJvbWlzZXMuY29uY2F0KCgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcblxuICAgICAgICBwcm9taXNlc1xuICAgICAgICAgICAgLnJlZHVjZShpdGVyYXRlZUZ1bmMsIFByb21pc2UucmVzb2x2ZShmYWxzZSkpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgICAgfSlcblxuICAgIH0pO1xufTtcbiIsImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIExpdmVTZXJ2ZXIgZnJvbSAnbGl2ZS1zZXJ2ZXInO1xuaW1wb3J0ICogYXMgU2hlbGxqcyBmcm9tICdzaGVsbGpzJztcblxuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vbG9nZ2VyJztcbmltcG9ydCB7IEh0bWxFbmdpbmUgfSBmcm9tICcuL2VuZ2luZXMvaHRtbC5lbmdpbmUnO1xuaW1wb3J0IHsgTWFya2Rvd25FbmdpbmUgfSBmcm9tICcuL2VuZ2luZXMvbWFya2Rvd24uZW5naW5lJztcbmltcG9ydCB7IEZpbGVFbmdpbmUgfSBmcm9tICcuL2VuZ2luZXMvZmlsZS5lbmdpbmUnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vY29uZmlndXJhdGlvbic7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uSW50ZXJmYWNlIH0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbmZpZ3VyYXRpb24uaW50ZXJmYWNlJztcbmltcG9ydCB7ICRkZXBlbmRlbmNpZXNFbmdpbmUgfSBmcm9tICcuL2VuZ2luZXMvZGVwZW5kZW5jaWVzLmVuZ2luZSc7XG5pbXBvcnQgeyBOZ2RFbmdpbmUgfSBmcm9tICcuL2VuZ2luZXMvbmdkLmVuZ2luZSc7XG5pbXBvcnQgeyBTZWFyY2hFbmdpbmUgfSBmcm9tICcuL2VuZ2luZXMvc2VhcmNoLmVuZ2luZSc7XG5pbXBvcnQgeyBEZXBlbmRlbmNpZXMgfSBmcm9tICcuL2NvbXBpbGVyL2RlcGVuZGVuY2llcyc7XG5pbXBvcnQgeyBSb3V0ZXJQYXJzZXIgfSBmcm9tICcuLi91dGlscy9yb3V0ZXIucGFyc2VyJztcblxuaW1wb3J0IHsgQ09NUE9ET0NfREVGQVVMVFMgfSBmcm9tICcuLi91dGlscy9kZWZhdWx0cyc7XG5cbmltcG9ydCB7IGNsZWFuTmFtZVdpdGhvdXRTcGFjZUFuZFRvTG93ZXJDYXNlLCBmaW5kTWFpblNvdXJjZUZvbGRlciB9IGZyb20gJy4uL3V0aWxpdGllcyc7XG5cbmltcG9ydCB7IHByb21pc2VTZXF1ZW50aWFsIH0gZnJvbSAnLi4vdXRpbHMvcHJvbWlzZS1zZXF1ZW50aWFsJztcblxuY29uc3QgZ2xvYjogYW55ID0gcmVxdWlyZSgnZ2xvYicpLFxuICAgICAgbWFya2VkID0gcmVxdWlyZSgnbWFya2VkJyksXG4gICAgICBjaG9raWRhciA9IHJlcXVpcmUoJ2Nob2tpZGFyJyk7XG5cbmxldCBwa2cgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKSxcbiAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpLFxuICAgICRodG1sZW5naW5lID0gbmV3IEh0bWxFbmdpbmUoKSxcbiAgICAkZmlsZWVuZ2luZSA9IG5ldyBGaWxlRW5naW5lKCksXG4gICAgJG1hcmtkb3duZW5naW5lID0gbmV3IE1hcmtkb3duRW5naW5lKCksXG4gICAgJG5nZGVuZ2luZSA9IG5ldyBOZ2RFbmdpbmUoKSxcbiAgICAkc2VhcmNoRW5naW5lID0gbmV3IFNlYXJjaEVuZ2luZSgpLFxuICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKClcblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uIHtcbiAgICAvKipcbiAgICAgKiBGaWxlcyBwcm9jZXNzZWQgZHVyaW5nIGluaXRpYWwgc2Nhbm5pbmdcbiAgICAgKi9cbiAgICBmaWxlczogQXJyYXk8c3RyaW5nPjtcbiAgICAvKipcbiAgICAgKiBGaWxlcyBwcm9jZXNzZWQgZHVyaW5nIHdhdGNoIHNjYW5uaW5nXG4gICAgICovXG4gICAgdXBkYXRlZEZpbGVzOiBBcnJheTxzdHJpbmc+O1xuICAgIC8qKlxuICAgICAqIENvbXBvZG9jIGNvbmZpZ3VyYXRpb24gbG9jYWwgcmVmZXJlbmNlXG4gICAgICovXG4gICAgY29uZmlndXJhdGlvbjpDb25maWd1cmF0aW9uSW50ZXJmYWNlO1xuICAgIC8qKlxuICAgICAqIEJvb2xlYW4gZm9yIHdhdGNoaW5nIHN0YXR1c1xuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzV2F0Y2hpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBjb21wb2RvYyBhcHBsaWNhdGlvbiBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBvcHRpb25zIHRoYXQgc2hvdWxkIGJlIHVzZWQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86T2JqZWN0KSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IENvbmZpZ3VyYXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuICAgICAgICBmb3IgKGxldCBvcHRpb24gaW4gb3B0aW9ucyApIHtcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGFbb3B0aW9uXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGFbb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGNvbXBvZG9jIHByb2Nlc3NcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2VuZXJhdGUoKSB7XG4gICAgICAgICRodG1sZW5naW5lLmluaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1BhY2thZ2VKc29uKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IGNvbXBvZG9jIGRvY3VtZW50YXRpb24gY292ZXJhZ2VcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgdGVzdENvdmVyYWdlKCkge1xuICAgICAgICB0aGlzLmdldERlcGVuZGVuY2llc0RhdGEoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBmaWxlcyBmb3IgaW5pdGlhbCBwcm9jZXNzaW5nXG4gICAgICogQHBhcmFtICB7QXJyYXk8c3RyaW5nPn0gZmlsZXMgRmlsZXMgZm91bmQgZHVyaW5nIHNvdXJjZSBmb2xkZXIgYW5kIHRzY29uZmlnIHNjYW5cbiAgICAgKi9cbiAgICBzZXRGaWxlcyhmaWxlczpBcnJheTxzdHJpbmc+KSB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSBmaWxlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBmaWxlcyBmb3Igd2F0Y2ggcHJvY2Vzc2luZ1xuICAgICAqIEBwYXJhbSAge0FycmF5PHN0cmluZz59IGZpbGVzIEZpbGVzIGZvdW5kIGR1cmluZyBzb3VyY2UgZm9sZGVyIGFuZCB0c2NvbmZpZyBzY2FuXG4gICAgICovXG4gICAgc2V0VXBkYXRlZEZpbGVzKGZpbGVzOkFycmF5PHN0cmluZz4pIHtcbiAgICAgICAgdGhpcy51cGRhdGVkRmlsZXMgPSBmaWxlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYSBib29sZWFuIGluZGljYXRpbmcgcHJlc2VuY2Ugb2Ygb25lIFR5cGVTY3JpcHQgZmlsZSBpbiB1cGRhdGVkRmlsZXMgbGlzdFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFJlc3VsdCBvZiBzY2FuXG4gICAgICovXG4gICAgaGFzV2F0Y2hlZEZpbGVzVFNGaWxlcygpOiBib29sZWFuIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgIF8uZm9yRWFjaCh0aGlzLnVwZGF0ZWRGaWxlcywgKGZpbGUpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXRoLmV4dG5hbWUoZmlsZSkgPT09ICcudHMnKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFyIGZpbGVzIGZvciB3YXRjaCBwcm9jZXNzaW5nXG4gICAgICovXG4gICAgY2xlYXJVcGRhdGVkRmlsZXMoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlZEZpbGVzID0gW107XG4gICAgfVxuXG4gICAgcHJvY2Vzc1BhY2thZ2VKc29uKCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdTZWFyY2hpbmcgcGFja2FnZS5qc29uIGZpbGUnKTtcbiAgICAgICAgJGZpbGVlbmdpbmUuZ2V0KCdwYWNrYWdlLmpzb24nKS50aGVuKChwYWNrYWdlRGF0YSkgPT4ge1xuICAgICAgICAgICAgbGV0IHBhcnNlZERhdGEgPSBKU09OLnBhcnNlKHBhY2thZ2VEYXRhKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2VkRGF0YS5uYW1lICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuZG9jdW1lbnRhdGlvbk1haW5OYW1lID09PSBDT01QT0RPQ19ERUZBVUxUUy50aXRsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kb2N1bWVudGF0aW9uTWFpbk5hbWUgPSBwYXJzZWREYXRhLm5hbWUgKyAnIGRvY3VtZW50YXRpb24nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJzZWREYXRhLmRlc2NyaXB0aW9uICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kb2N1bWVudGF0aW9uTWFpbkRlc2NyaXB0aW9uID0gcGFyc2VkRGF0YS5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdwYWNrYWdlLmpzb24gZmlsZSBmb3VuZCcpO1xuICAgICAgICAgICAgdGhpcy5wcm9jZXNzTWFya2Rvd24oKTtcbiAgICAgICAgfSwgKGVycm9yTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbnRpbnVpbmcgd2l0aG91dCBwYWNrYWdlLmpzb24gZmlsZScpO1xuICAgICAgICAgICAgdGhpcy5wcm9jZXNzTWFya2Rvd24oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvY2Vzc01hcmtkb3duKCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdTZWFyY2hpbmcgUkVBRE1FLm1kIGZpbGUnKTtcbiAgICAgICAgJG1hcmtkb3duZW5naW5lLmdldFJlYWRtZUZpbGUoKS50aGVuKChyZWFkbWVEYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5hZGRQYWdlKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdyZWFkbWUnLFxuICAgICAgICAgICAgICAgIGRlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHBhZ2VUeXBlOiBDT01QT0RPQ19ERUZBVUxUUy5QQUdFX1RZUEVTLlJPT1RcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmFkZFBhZ2Uoe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdvdmVydmlldycsXG4gICAgICAgICAgICAgICAgY29udGV4dDogJ292ZXJ2aWV3JyxcbiAgICAgICAgICAgICAgICBwYWdlVHlwZTogQ09NUE9ET0NfREVGQVVMVFMuUEFHRV9UWVBFUy5ST09UXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5yZWFkbWUgPSByZWFkbWVEYXRhO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1JFQURNRS5tZCBmaWxlIGZvdW5kJyk7XG4gICAgICAgICAgICB0aGlzLmdldERlcGVuZGVuY2llc0RhdGEoKTtcbiAgICAgICAgfSwgKGVycm9yTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbnRpbnVpbmcgd2l0aG91dCBSRUFETUUubWQgZmlsZScpO1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmFkZFBhZ2Uoe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbmRleCcsXG4gICAgICAgICAgICAgICAgY29udGV4dDogJ292ZXJ2aWV3J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmdldERlcGVuZGVuY2llc0RhdGEoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGRlcGVuZGVuY3kgZGF0YSBmb3Igc21hbGwgZ3JvdXAgb2YgdXBkYXRlZCBmaWxlcyBkdXJpbmcgd2F0Y2ggcHJvY2Vzc1xuICAgICAqL1xuICAgIGdldE1pY3JvRGVwZW5kZW5jaWVzRGF0YSgpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICBsb2dnZXIuaW5mbygnR2V0IGRpZmYgZGVwZW5kZW5jaWVzIGRhdGEnKTtcbiAgICAgICAgbGV0IGNyYXdsZXIgPSBuZXcgRGVwZW5kZW5jaWVzKFxuICAgICAgICAgIHRoaXMudXBkYXRlZEZpbGVzLCB7XG4gICAgICAgICAgICB0c2NvbmZpZ0RpcmVjdG9yeTogcGF0aC5kaXJuYW1lKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS50c2NvbmZpZylcbiAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgbGV0IGRlcGVuZGVuY2llc0RhdGEgPSBjcmF3bGVyLmdldERlcGVuZGVuY2llcygpO1xuXG4gICAgICAgICRkZXBlbmRlbmNpZXNFbmdpbmUudXBkYXRlKGRlcGVuZGVuY2llc0RhdGEpO1xuXG4gICAgICAgIHRoaXMucHJlcGFyZUp1c3RBRmV3VGhpbmdzKGRlcGVuZGVuY2llc0RhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYnVpbGQgZXh0ZXJuYWwgZG9jdW1lbnRhdGlvbiBkdXJpbmcgd2F0Y2ggcHJvY2Vzc1xuICAgICAqL1xuICAgIHJlYnVpbGRFeHRlcm5hbERvY3VtZW50YXRpb24oKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1JlYnVpbGQgZXh0ZXJuYWwgZG9jdW1lbnRhdGlvbicpO1xuXG4gICAgICAgIGxldCBhY3Rpb25zID0gW107XG5cbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLnJlc2V0QWRkaXRpb25hbFBhZ2VzKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmNsdWRlcyAhPT0gJycpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVFeHRlcm5hbEluY2x1ZGVzKCk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZVNlcXVlbnRpYWwoYWN0aW9ucylcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzUGFnZXMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVXBkYXRlZEZpbGVzKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yTWVzc2FnZSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXREZXBlbmRlbmNpZXNEYXRhKCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdHZXQgZGVwZW5kZW5jaWVzIGRhdGEnKTtcblxuICAgICAgICBsZXQgY3Jhd2xlciA9IG5ldyBEZXBlbmRlbmNpZXMoXG4gICAgICAgICAgdGhpcy5maWxlcywge1xuICAgICAgICAgICAgdHNjb25maWdEaXJlY3Rvcnk6IHBhdGguZGlybmFtZSh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEudHNjb25maWcpXG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIGxldCBkZXBlbmRlbmNpZXNEYXRhID0gY3Jhd2xlci5nZXREZXBlbmRlbmNpZXMoKTtcblxuICAgICAgICAkZGVwZW5kZW5jaWVzRW5naW5lLmluaXQoZGVwZW5kZW5jaWVzRGF0YSk7XG5cbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnJvdXRlc0xlbmd0aCA9IFJvdXRlclBhcnNlci5yb3V0ZXNMZW5ndGgoKTtcblxuICAgICAgICB0aGlzLnByZXBhcmVFdmVyeXRoaW5nKCk7XG4gICAgfVxuXG4gICAgcHJlcGFyZUp1c3RBRmV3VGhpbmdzKGRpZmZDcmF3bGVkRGF0YSkge1xuICAgICAgICBsZXQgYWN0aW9ucyA9IFtdO1xuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5yZXNldFBhZ2VzKCk7XG5cbiAgICAgICAgYWN0aW9ucy5wdXNoKCgpID0+IHsgcmV0dXJuIHRoaXMucHJlcGFyZVJvdXRlcygpOyB9KTtcblxuICAgICAgICBpZiAoZGlmZkNyYXdsZWREYXRhLm1vZHVsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKCgpID0+IHsgcmV0dXJuIHRoaXMucHJlcGFyZU1vZHVsZXMoZGlmZkNyYXdsZWREYXRhLm1vZHVsZXMpOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlmZkNyYXdsZWREYXRhLmNvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKCgpID0+IHsgcmV0dXJuIHRoaXMucHJlcGFyZUNvbXBvbmVudHMoZGlmZkNyYXdsZWREYXRhLmNvbXBvbmVudHMpOyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaWZmQ3Jhd2xlZERhdGEuZGlyZWN0aXZlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goKCkgPT4geyByZXR1cm4gdGhpcy5wcmVwYXJlRGlyZWN0aXZlcyhkaWZmQ3Jhd2xlZERhdGEuZGlyZWN0aXZlcyk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRpZmZDcmF3bGVkRGF0YS5pbmplY3RhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goKCkgPT4geyByZXR1cm4gdGhpcy5wcmVwYXJlSW5qZWN0YWJsZXMoZGlmZkNyYXdsZWREYXRhLmluamVjdGFibGVzKTsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlmZkNyYXdsZWREYXRhLnBpcGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVQaXBlcyhkaWZmQ3Jhd2xlZERhdGEucGlwZXMpOyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaWZmQ3Jhd2xlZERhdGEuY2xhc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goKCkgPT4geyByZXR1cm4gdGhpcy5wcmVwYXJlQ2xhc3NlcyhkaWZmQ3Jhd2xlZERhdGEuY2xhc3Nlcyk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRpZmZDcmF3bGVkRGF0YS5pbnRlcmZhY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVJbnRlcmZhY2VzKGRpZmZDcmF3bGVkRGF0YS5pbnRlcmZhY2VzKTsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlmZkNyYXdsZWREYXRhLm1pc2NlbGxhbmVvdXMudmFyaWFibGVzLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgICAgIGRpZmZDcmF3bGVkRGF0YS5taXNjZWxsYW5lb3VzLmZ1bmN0aW9ucy5sZW5ndGggPiAwIHx8XG4gICAgICAgICAgICBkaWZmQ3Jhd2xlZERhdGEubWlzY2VsbGFuZW91cy50eXBlYWxpYXNlcy5sZW5ndGggPiAwIHx8XG4gICAgICAgICAgICBkaWZmQ3Jhd2xlZERhdGEubWlzY2VsbGFuZW91cy5lbnVtZXJhdGlvbnMubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICAgZGlmZkNyYXdsZWREYXRhLm1pc2NlbGxhbmVvdXMudHlwZXMubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVNaXNjZWxsYW5lb3VzKGRpZmZDcmF3bGVkRGF0YS5taXNjZWxsYW5lb3VzKTsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kaXNhYmxlQ292ZXJhZ2UpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVDb3ZlcmFnZSgpOyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2VTZXF1ZW50aWFsKGFjdGlvbnMpXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0dyYXBocygpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJVcGRhdGVkRmlsZXMoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3JNZXNzYWdlID0+IHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZXBhcmVFdmVyeXRoaW5nKCkge1xuICAgICAgICBsZXQgYWN0aW9ucyA9IFtdO1xuXG4gICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVNb2R1bGVzKCk7IH0pO1xuICAgICAgICBhY3Rpb25zLnB1c2goKCkgPT4geyByZXR1cm4gdGhpcy5wcmVwYXJlQ29tcG9uZW50cygpOyB9KTtcblxuICAgICAgICBpZiAoJGRlcGVuZGVuY2llc0VuZ2luZS5kaXJlY3RpdmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVEaXJlY3RpdmVzKCk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRkZXBlbmRlbmNpZXNFbmdpbmUuaW5qZWN0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKCgpID0+IHsgcmV0dXJuIHRoaXMucHJlcGFyZUluamVjdGFibGVzKCk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRkZXBlbmRlbmNpZXNFbmdpbmUucm91dGVzICYmICRkZXBlbmRlbmNpZXNFbmdpbmUucm91dGVzLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVSb3V0ZXMoKTsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJGRlcGVuZGVuY2llc0VuZ2luZS5waXBlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goKCkgPT4geyByZXR1cm4gdGhpcy5wcmVwYXJlUGlwZXMoKTsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJGRlcGVuZGVuY2llc0VuZ2luZS5jbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVDbGFzc2VzKCk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRkZXBlbmRlbmNpZXNFbmdpbmUuaW50ZXJmYWNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goKCkgPT4geyByZXR1cm4gdGhpcy5wcmVwYXJlSW50ZXJmYWNlcygpOyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkZGVwZW5kZW5jaWVzRW5naW5lLm1pc2NlbGxhbmVvdXMudmFyaWFibGVzLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgICAgICRkZXBlbmRlbmNpZXNFbmdpbmUubWlzY2VsbGFuZW91cy5mdW5jdGlvbnMubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICAgJGRlcGVuZGVuY2llc0VuZ2luZS5taXNjZWxsYW5lb3VzLnR5cGVhbGlhc2VzLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgICAgICRkZXBlbmRlbmNpZXNFbmdpbmUubWlzY2VsbGFuZW91cy5lbnVtZXJhdGlvbnMubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICAgJGRlcGVuZGVuY2llc0VuZ2luZS5taXNjZWxsYW5lb3VzLnR5cGVzLmxlbmd0aCA+IDAgKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goKCkgPT4geyByZXR1cm4gdGhpcy5wcmVwYXJlTWlzY2VsbGFuZW91cygpOyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmRpc2FibGVDb3ZlcmFnZSkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKCgpID0+IHsgcmV0dXJuIHRoaXMucHJlcGFyZUNvdmVyYWdlKCk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmNsdWRlcyAhPT0gJycpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaCgoKSA9PiB7IHJldHVybiB0aGlzLnByZXBhcmVFeHRlcm5hbEluY2x1ZGVzKCk7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZVNlcXVlbnRpYWwoYWN0aW9ucylcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzR3JhcGhzKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yTWVzc2FnZSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcmVwYXJlRXh0ZXJuYWxJbmNsdWRlcygpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICBsb2dnZXIuaW5mbygnQWRkaW5nIGV4dGVybmFsIG1hcmtkb3duIGZpbGVzJyk7XG4gICAgICAgIC8vU2NhbiBpbmNsdWRlIGZvbGRlciBmb3IgZmlsZXMgZGV0YWlsZWQgaW4gc3VtbWFyeS5qc29uXG4gICAgICAgIC8vRm9yIGVhY2ggZmlsZSwgYWRkIHRvIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5hZGRpdGlvbmFsUGFnZXNcbiAgICAgICAgLy9FYWNoIGZpbGUgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gaHRtbCBwYWdlLCBpbnNpZGUgQ09NUE9ET0NfREVGQVVMVFMuYWRkaXRpb25hbEVudHJ5UGF0aFxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAkZmlsZWVuZ2luZS5nZXQodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmluY2x1ZGVzICsgcGF0aC5zZXAgKyAnc3VtbWFyeS5qc29uJykudGhlbigoc3VtbWFyeURhdGEpID0+IHtcbiAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdBZGRpdGlvbmFsIGRvY3VtZW50YXRpb246IHN1bW1hcnkuanNvbiBmaWxlIGZvdW5kJyk7XG5cbiAgICAgICAgICAgICAgIGxldCBwYXJzZWRTdW1tYXJ5RGF0YSA9IEpTT04ucGFyc2Uoc3VtbWFyeURhdGEpLFxuICAgICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgICAgIGxlbiA9IHBhcnNlZFN1bW1hcnlEYXRhLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICBsb29wID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmKCBpIDw9IGxlbi0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICRtYXJrZG93bmVuZ2luZS5nZXQodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmluY2x1ZGVzICsgcGF0aC5zZXAgKyBwYXJzZWRTdW1tYXJ5RGF0YVtpXS5maWxlKS50aGVuKChtYXJrZWREYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uYWRkQWRkaXRpb25hbFBhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHBhcnNlZFN1bW1hcnlEYXRhW2ldLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBjbGVhbk5hbWVXaXRob3V0U3BhY2VBbmRUb0xvd2VyQ2FzZShwYXJzZWRTdW1tYXJ5RGF0YVtpXS50aXRsZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ2FkZGl0aW9uYWwtcGFnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmluY2x1ZGVzRm9sZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxQYWdlOiBtYXJrZWREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VUeXBlOiBDT01QT0RPQ19ERUZBVUxUUy5QQUdFX1RZUEVTLklOVEVSTkFMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlZFN1bW1hcnlEYXRhW2ldLmNoaWxkcmVuICYmIHBhcnNlZFN1bW1hcnlEYXRhW2ldLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaiA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbmcgPSBwYXJzZWRTdW1tYXJ5RGF0YVtpXS5jaGlsZHJlbi5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb29wQ2hpbGQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoIGogPD0gbGVuZy0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtYXJrZG93bmVuZ2luZS5nZXQodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmluY2x1ZGVzICsgcGF0aC5zZXAgKyBwYXJzZWRTdW1tYXJ5RGF0YVtpXS5jaGlsZHJlbltqXS5maWxlKS50aGVuKChtYXJrZWREYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uYWRkQWRkaXRpb25hbFBhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHBhcnNlZFN1bW1hcnlEYXRhW2ldLmNoaWxkcmVuW2pdLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBjbGVhbk5hbWVXaXRob3V0U3BhY2VBbmRUb0xvd2VyQ2FzZShwYXJzZWRTdW1tYXJ5RGF0YVtpXS5jaGlsZHJlbltqXS50aXRsZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ2FkZGl0aW9uYWwtcGFnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmluY2x1ZGVzRm9sZGVyICsgJy8nICsgY2xlYW5OYW1lV2l0aG91dFNwYWNlQW5kVG9Mb3dlckNhc2UocGFyc2VkU3VtbWFyeURhdGFbaV0udGl0bGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxQYWdlOiBtYXJrZWREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VUeXBlOiBDT01QT0RPQ19ERUZBVUxUUy5QQUdFX1RZUEVTLklOVEVSTkFMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3BDaGlsZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb29wQ2hpbGQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgfSwgKGVycm9yTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICAgICByZWplY3QoJ0Vycm9yIGR1cmluZyBBZGRpdGlvbmFsIGRvY3VtZW50YXRpb24gZ2VuZXJhdGlvbicpO1xuICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJlcGFyZU1vZHVsZXMoc29tZU1vZHVsZXM/KSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1ByZXBhcmUgbW9kdWxlcycpO1xuICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICBfbW9kdWxlcyA9IChzb21lTW9kdWxlcykgPyBzb21lTW9kdWxlcyA6ICRkZXBlbmRlbmNpZXNFbmdpbmUuZ2V0TW9kdWxlcygpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5tb2R1bGVzID0gX21vZHVsZXMubWFwKG5nTW9kdWxlID0+IHtcbiAgICAgICAgICAgICAgICBbJ2RlY2xhcmF0aW9ucycsICdib290c3RyYXAnLCAnaW1wb3J0cycsICdleHBvcnRzJ10uZm9yRWFjaChtZXRhZGF0YVR5cGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBuZ01vZHVsZVttZXRhZGF0YVR5cGVdID0gbmdNb2R1bGVbbWV0YWRhdGFUeXBlXS5maWx0ZXIobWV0YURhdGFJdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobWV0YURhdGFJdGVtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdkaXJlY3RpdmUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGRlcGVuZGVuY2llc0VuZ2luZS5nZXREaXJlY3RpdmVzKCkuc29tZShkaXJlY3RpdmUgPT4gZGlyZWN0aXZlLm5hbWUgPT09IG1ldGFEYXRhSXRlbS5uYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZGVwZW5kZW5jaWVzRW5naW5lLmdldENvbXBvbmVudHMoKS5zb21lKGNvbXBvbmVudCA9PiBjb21wb25lbnQubmFtZSA9PT0gbWV0YURhdGFJdGVtLm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbW9kdWxlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRkZXBlbmRlbmNpZXNFbmdpbmUuZ2V0TW9kdWxlcygpLnNvbWUobW9kdWxlID0+IG1vZHVsZS5uYW1lID09PSBtZXRhRGF0YUl0ZW0ubmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwaXBlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRkZXBlbmRlbmNpZXNFbmdpbmUuZ2V0UGlwZXMoKS5zb21lKHBpcGUgPT4gcGlwZS5uYW1lID09PSBtZXRhRGF0YUl0ZW0ubmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbmdNb2R1bGUucHJvdmlkZXJzID0gbmdNb2R1bGUucHJvdmlkZXJzLmZpbHRlcihwcm92aWRlciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkZGVwZW5kZW5jaWVzRW5naW5lLmdldEluamVjdGFibGVzKCkuc29tZShpbmplY3RhYmxlID0+IGluamVjdGFibGUubmFtZSA9PT0gcHJvdmlkZXIubmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5nTW9kdWxlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uYWRkUGFnZSh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21vZHVsZXMnLFxuICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdtb2R1bGVzJyxcbiAgICAgICAgICAgICAgICBkZXB0aDogMCxcbiAgICAgICAgICAgICAgICBwYWdlVHlwZTogQ09NUE9ET0NfREVGQVVMVFMuUEFHRV9UWVBFUy5ST09UXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IGxlbiA9IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5tb2R1bGVzLmxlbmd0aDtcblxuICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uYWRkUGFnZSh7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6ICdtb2R1bGVzJyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm1vZHVsZXNbaV0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dDogJ21vZHVsZScsXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZTogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm1vZHVsZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgIGRlcHRoOiAxLFxuICAgICAgICAgICAgICAgICAgICBwYWdlVHlwZTogQ09NUE9ET0NfREVGQVVMVFMuUEFHRV9UWVBFUy5JTlRFUk5BTFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZXBhcmVQaXBlcyA9IChzb21lUGlwZXM/KSA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1ByZXBhcmUgcGlwZXMnKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnBpcGVzID0gKHNvbWVQaXBlcykgPyBzb21lUGlwZXMgOiAkZGVwZW5kZW5jaWVzRW5naW5lLmdldFBpcGVzKCk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEucGlwZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICBmb3IoaTsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5hZGRQYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogJ3BpcGVzJyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnBpcGVzW2ldLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdwaXBlJyxcbiAgICAgICAgICAgICAgICAgICAgcGlwZTogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnBpcGVzW2ldLFxuICAgICAgICAgICAgICAgICAgICBkZXB0aDogMSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZVR5cGU6IENPTVBPRE9DX0RFRkFVTFRTLlBBR0VfVFlQRVMuSU5URVJOQUxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJlcGFyZUNsYXNzZXMgPSAoc29tZUNsYXNzZXM/KSA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1ByZXBhcmUgY2xhc3NlcycpO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY2xhc3NlcyA9IChzb21lQ2xhc3NlcykgPyBzb21lQ2xhc3NlcyA6ICRkZXBlbmRlbmNpZXNFbmdpbmUuZ2V0Q2xhc3NlcygpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0gdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNsYXNzZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICBmb3IoaTsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5hZGRQYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogJ2NsYXNzZXMnLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY2xhc3Nlc1tpXS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiAnY2xhc3MnLFxuICAgICAgICAgICAgICAgICAgICBjbGFzczogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNsYXNzZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgIGRlcHRoOiAxLFxuICAgICAgICAgICAgICAgICAgICBwYWdlVHlwZTogQ09NUE9ET0NfREVGQVVMVFMuUEFHRV9UWVBFUy5JTlRFUk5BTFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcmVwYXJlSW50ZXJmYWNlcyhzb21lSW50ZXJmYWNlcz8pIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICBsb2dnZXIuaW5mbygnUHJlcGFyZSBpbnRlcmZhY2VzJyk7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbnRlcmZhY2VzID0gKHNvbWVJbnRlcmZhY2VzKSA/IHNvbWVJbnRlcmZhY2VzIDogJGRlcGVuZGVuY2llc0VuZ2luZS5nZXRJbnRlcmZhY2VzKCk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuaW50ZXJmYWNlcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IoaTsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5hZGRQYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogJ2ludGVyZmFjZXMnLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuaW50ZXJmYWNlc1tpXS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiAnaW50ZXJmYWNlJyxcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJmYWNlOiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuaW50ZXJmYWNlc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgZGVwdGg6IDEsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VUeXBlOiBDT01QT0RPQ19ERUZBVUxUUy5QQUdFX1RZUEVTLklOVEVSTkFMXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZXBhcmVNaXNjZWxsYW5lb3VzKHNvbWVNaXNjPykge1xuICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdQcmVwYXJlIG1pc2NlbGxhbmVvdXMnKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm1pc2NlbGxhbmVvdXMgPSAoc29tZU1pc2MpID8gc29tZU1pc2MgOiAkZGVwZW5kZW5jaWVzRW5naW5lLmdldE1pc2NlbGxhbmVvdXMoKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmFkZFBhZ2Uoe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdtaXNjZWxsYW5lb3VzJyxcbiAgICAgICAgICAgICAgICBjb250ZXh0OiAnbWlzY2VsbGFuZW91cycsXG4gICAgICAgICAgICAgICAgZGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgcGFnZVR5cGU6IENPTVBPRE9DX0RFRkFVTFRTLlBBR0VfVFlQRVMuUk9PVFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZXBhcmVDb21wb25lbnRzKHNvbWVDb21wb25lbnRzPykge1xuICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdQcmVwYXJlIGNvbXBvbmVudHMnKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvbXBvbmVudHMgPSAoc29tZUNvbXBvbmVudHMpID8gc29tZUNvbXBvbmVudHMgOiAkZGVwZW5kZW5jaWVzRW5naW5lLmdldENvbXBvbmVudHMoKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKG1haW5SZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgbG9vcCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYoIGkgPD0gbGVuLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5jb21wb25lbnRzW2ldLmZpbGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVRlbXBsYXRldXJsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlUGF0aCA9IHBhdGgucmVzb2x2ZShkaXJuYW1lICsgcGF0aC5zZXAgKyB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50c1tpXS50ZW1wbGF0ZVVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyh0ZW1wbGF0ZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMucmVhZEZpbGUodGVtcGxhdGVQYXRoLCAndXRmOCcsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5jb21wb25lbnRzW2ldLnRlbXBsYXRlRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGBDYW5ub3QgcmVhZCB0ZW1wbGF0ZSBmb3IgJHt0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50c1tpXS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRtYXJrZG93bmVuZ2luZS5jb21wb25lbnRIYXNSZWFkbWVGaWxlKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5jb21wb25lbnRzW2ldLmZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYCR7dGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvbXBvbmVudHNbaV0ubmFtZX0gaGFzIGEgUkVBRE1FIGZpbGUsIGluY2x1ZGUgaXRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVhZG1lRmlsZSA9ICRtYXJrZG93bmVuZ2luZS5jb21wb25lbnRSZWFkbWVGaWxlKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5jb21wb25lbnRzW2ldLmZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKHJlYWRtZUZpbGUsICd1dGY4JywgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5jb21wb25lbnRzW2ldLnJlYWRtZSA9IG1hcmtlZChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmFkZFBhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJ2NvbXBvbmVudHMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvbXBvbmVudHNbaV0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdjb21wb25lbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50c1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHRoOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFnZVR5cGU6IENPTVBPRE9DX0RFRkFVTFRTLlBBR0VfVFlQRVMuSU5URVJOQUxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50c1tpXS50ZW1wbGF0ZVVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbyhgJHt0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50c1tpXS5uYW1lfSBoYXMgYSB0ZW1wbGF0ZVVybCwgaW5jbHVkZSBpdGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlVGVtcGxhdGV1cmwoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5hZGRQYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJ2NvbXBvbmVudHMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50c1tpXS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY29tcG9uZW50c1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VUeXBlOiBDT01QT0RPQ19ERUZBVUxUUy5QQUdFX1RZUEVTLklOVEVSTkFMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5jb21wb25lbnRzW2ldLnRlbXBsYXRlVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYCR7dGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvbXBvbmVudHNbaV0ubmFtZX0gaGFzIGEgdGVtcGxhdGVVcmwsIGluY2x1ZGUgaXRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlVGVtcGxhdGV1cmwoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluUmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJlcGFyZURpcmVjdGl2ZXMgPSAoc29tZURpcmVjdGl2ZXM/KSA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1ByZXBhcmUgZGlyZWN0aXZlcycpO1xuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kaXJlY3RpdmVzID0gKHNvbWVEaXJlY3RpdmVzKSA/IHNvbWVEaXJlY3RpdmVzIDogJGRlcGVuZGVuY2llc0VuZ2luZS5nZXREaXJlY3RpdmVzKCk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCBpID0gMCxcbiAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuZGlyZWN0aXZlcy5sZW5ndGg7XG5cbiAgICAgICAgICAgIGZvcihpOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmFkZFBhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiAnZGlyZWN0aXZlcycsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kaXJlY3RpdmVzW2ldLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6ICdkaXJlY3RpdmUnLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmU6IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kaXJlY3RpdmVzW2ldLFxuICAgICAgICAgICAgICAgICAgICBkZXB0aDogMSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZVR5cGU6IENPTVBPRE9DX0RFRkFVTFRTLlBBR0VfVFlQRVMuSU5URVJOQUxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJlcGFyZUluamVjdGFibGVzKHNvbWVJbmplY3RhYmxlcz8pIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICBsb2dnZXIuaW5mbygnUHJlcGFyZSBpbmplY3RhYmxlcycpO1xuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmplY3RhYmxlcyA9IChzb21lSW5qZWN0YWJsZXMpID8gc29tZUluamVjdGFibGVzIDogJGRlcGVuZGVuY2llc0VuZ2luZS5nZXRJbmplY3RhYmxlcygpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgaSA9IDAsXG4gICAgICAgICAgICAgICAgbGVuID0gdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmluamVjdGFibGVzLmxlbmd0aDtcblxuICAgICAgICAgICAgZm9yKGk7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uYWRkUGFnZSh7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6ICdpbmplY3RhYmxlcycsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmplY3RhYmxlc1tpXS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiAnaW5qZWN0YWJsZScsXG4gICAgICAgICAgICAgICAgICAgIGluamVjdGFibGU6IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmplY3RhYmxlc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgZGVwdGg6IDEsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VUeXBlOiBDT01QT0RPQ19ERUZBVUxUUy5QQUdFX1RZUEVTLklOVEVSTkFMXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZXBhcmVSb3V0ZXMoKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1Byb2Nlc3Mgcm91dGVzJyk7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5yb3V0ZXMgPSAkZGVwZW5kZW5jaWVzRW5naW5lLmdldFJvdXRlcygpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5hZGRQYWdlKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncm91dGVzJyxcbiAgICAgICAgICAgICAgICBjb250ZXh0OiAncm91dGVzJyxcbiAgICAgICAgICAgICAgICBkZXB0aDogMCxcbiAgICAgICAgICAgICAgICBwYWdlVHlwZTogQ09NUE9ET0NfREVGQVVMVFMuUEFHRV9UWVBFUy5ST09UXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgUm91dGVyUGFyc2VyLmdlbmVyYXRlUm91dGVzSW5kZXgodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm91dHB1dCwgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnJvdXRlcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1JvdXRlcyBpbmRleCBnZW5lcmF0ZWQnKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9LCAoZSkgPT7CoHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcmVwYXJlQ292ZXJhZ2UoKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1Byb2Nlc3MgZG9jdW1lbnRhdGlvbiBjb3ZlcmFnZSByZXBvcnQnKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIGxvb3Agd2l0aCBjb21wb25lbnRzLCBjbGFzc2VzLCBpbmplY3RhYmxlcywgaW50ZXJmYWNlcywgcGlwZXNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdmFyIGZpbGVzID0gW10sXG4gICAgICAgICAgICAgICAgdG90YWxQcm9qZWN0U3RhdGVtZW50RG9jdW1lbnRlZCA9IDAsXG4gICAgICAgICAgICAgICAgZ2V0U3RhdHVzID0gZnVuY3Rpb24ocGVyY2VudCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVyY2VudCA8PSAyNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gJ2xvdyc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGVyY2VudCA+IDI1ICYmIHBlcmNlbnQgPD0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyA9ICdtZWRpdW0nO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBlcmNlbnQgPiA1MCAmJiBwZXJjZW50IDw9IDc1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAnZ29vZCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAnZ29vZCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBfLmZvckVhY2godGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvbXBvbmVudHMsIChjb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXBvbmVudC5wcm9wZXJ0aWVzQ2xhc3MgfHxcbiAgICAgICAgICAgICAgICAgICAgIWNvbXBvbmVudC5tZXRob2RzQ2xhc3MgfHxcbiAgICAgICAgICAgICAgICAgICAgIWNvbXBvbmVudC5pbnB1dHNDbGFzcyB8fFxuICAgICAgICAgICAgICAgICAgICAhY29tcG9uZW50Lm91dHB1dHNDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGNsOmFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBjb21wb25lbnQuZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNvbXBvbmVudC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGlua3R5cGU6IGNvbXBvbmVudC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY29tcG9uZW50Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkID0gMCxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnRzID0gY29tcG9uZW50LnByb3BlcnRpZXNDbGFzcy5sZW5ndGggKyBjb21wb25lbnQubWV0aG9kc0NsYXNzLmxlbmd0aCArIGNvbXBvbmVudC5pbnB1dHNDbGFzcy5sZW5ndGggKyBjb21wb25lbnQub3V0cHV0c0NsYXNzLmxlbmd0aCArIDE7IC8vICsxIGZvciBjb21wb25lbnQgZGVjb3JhdG9yIGNvbW1lbnRcblxuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQuY29uc3RydWN0b3JPYmopIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnRzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQuY29uc3RydWN0b3JPYmouZGVzY3JpcHRpb24gIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LmRlc2NyaXB0aW9uICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfLmZvckVhY2goY29tcG9uZW50LnByb3BlcnRpZXNDbGFzcywgKHByb3BlcnR5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eS5tb2RpZmllcktpbmQgPT09IDExMSkgeyAvLyBEb2Vzbid0IGhhbmRsZSBwcml2YXRlIGZvciBjb3ZlcmFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnRzIC09IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYocHJvcGVydHkuZGVzY3JpcHRpb24gIT09ICcnICYmIHByb3BlcnR5Lm1vZGlmaWVyS2luZCAhPT0gMTExKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChjb21wb25lbnQubWV0aG9kc0NsYXNzLCAobWV0aG9kKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXRob2QubW9kaWZpZXJLaW5kID09PSAxMTEpIHsgLy8gRG9lc24ndCBoYW5kbGUgcHJpdmF0ZSBmb3IgY292ZXJhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50cyAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKG1ldGhvZC5kZXNjcmlwdGlvbiAhPT0gJycgJiYgbWV0aG9kLm1vZGlmaWVyS2luZCAhPT0gMTExKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChjb21wb25lbnQuaW5wdXRzQ2xhc3MsIChpbnB1dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQubW9kaWZpZXJLaW5kID09PSAxMTEpIHsgLy8gRG9lc24ndCBoYW5kbGUgcHJpdmF0ZSBmb3IgY292ZXJhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50cyAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKGlucHV0LmRlc2NyaXB0aW9uICE9PSAnJyAmJiBpbnB1dC5tb2RpZmllcktpbmQgIT09IDExMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfLmZvckVhY2goY29tcG9uZW50Lm91dHB1dHNDbGFzcywgKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0Lm1vZGlmaWVyS2luZCA9PT0gMTExKSB7IC8vIERvZXNuJ3QgaGFuZGxlIHByaXZhdGUgZm9yIGNvdmVyYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudHMgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihvdXRwdXQuZGVzY3JpcHRpb24gIT09ICcnICYmIG91dHB1dC5tb2RpZmllcktpbmQgIT09IDExMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGNsLmNvdmVyYWdlUGVyY2VudCA9IE1hdGguZmxvb3IoKHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCAvIHRvdGFsU3RhdGVtZW50cykgKiAxMDApO1xuICAgICAgICAgICAgICAgIGlmKHRvdGFsU3RhdGVtZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjbC5jb3ZlcmFnZVBlcmNlbnQgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjbC5jb3ZlcmFnZUNvdW50ID0gdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkICsgJy8nICsgdG90YWxTdGF0ZW1lbnRzO1xuICAgICAgICAgICAgICAgIGNsLnN0YXR1cyA9IGdldFN0YXR1cyhjbC5jb3ZlcmFnZVBlcmNlbnQpO1xuICAgICAgICAgICAgICAgIHRvdGFsUHJvamVjdFN0YXRlbWVudERvY3VtZW50ZWQgKz0gY2wuY292ZXJhZ2VQZXJjZW50O1xuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goY2wpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF8uZm9yRWFjaCh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuY2xhc3NlcywgKGNsYXNzZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghY2xhc3NlLnByb3BlcnRpZXMgfHxcbiAgICAgICAgICAgICAgICAgICAgIWNsYXNzZS5tZXRob2RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgY2w6YW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGNsYXNzZS5maWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NsYXNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmt0eXBlOiAnY2xhc3NlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNsYXNzZS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCA9IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50cyA9IGNsYXNzZS5wcm9wZXJ0aWVzLmxlbmd0aCArIGNsYXNzZS5tZXRob2RzLmxlbmd0aCArIDE7IC8vICsxIGZvciBjbGFzcyBpdHNlbGZcblxuICAgICAgICAgICAgICAgIGlmIChjbGFzc2UuY29uc3RydWN0b3JPYmopIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnRzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc2UuY29uc3RydWN0b3JPYmouZGVzY3JpcHRpb24gIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2xhc3NlLmRlc2NyaXB0aW9uICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfLmZvckVhY2goY2xhc3NlLnByb3BlcnRpZXMsIChwcm9wZXJ0eSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkubW9kaWZpZXJLaW5kID09PSAxMTEpIHsgLy8gRG9lc24ndCBoYW5kbGUgcHJpdmF0ZSBmb3IgY292ZXJhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50cyAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHByb3BlcnR5LmRlc2NyaXB0aW9uICE9PSAnJyAmJiBwcm9wZXJ0eS5tb2RpZmllcktpbmQgIT09IDExMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfLmZvckVhY2goY2xhc3NlLm1ldGhvZHMsIChtZXRob2QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1ldGhvZC5tb2RpZmllcktpbmQgPT09IDExMSkgeyAvLyBEb2Vzbid0IGhhbmRsZSBwcml2YXRlIGZvciBjb3ZlcmFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnRzIC09IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYobWV0aG9kLmRlc2NyaXB0aW9uICE9PSAnJyAmJiBtZXRob2QubW9kaWZpZXJLaW5kICE9PSAxMTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBjbC5jb3ZlcmFnZVBlcmNlbnQgPSBNYXRoLmZsb29yKCh0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgLyB0b3RhbFN0YXRlbWVudHMpICogMTAwKTtcbiAgICAgICAgICAgICAgICBpZih0b3RhbFN0YXRlbWVudHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY2wuY292ZXJhZ2VQZXJjZW50ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2wuY292ZXJhZ2VDb3VudCA9IHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCArICcvJyArIHRvdGFsU3RhdGVtZW50cztcbiAgICAgICAgICAgICAgICBjbC5zdGF0dXMgPSBnZXRTdGF0dXMoY2wuY292ZXJhZ2VQZXJjZW50KTtcbiAgICAgICAgICAgICAgICB0b3RhbFByb2plY3RTdGF0ZW1lbnREb2N1bWVudGVkICs9IGNsLmNvdmVyYWdlUGVyY2VudDtcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGNsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXy5mb3JFYWNoKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmplY3RhYmxlcywgKGluamVjdGFibGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWluamVjdGFibGUucHJvcGVydGllcyB8fFxuICAgICAgICAgICAgICAgICAgICAhaW5qZWN0YWJsZS5tZXRob2RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgY2w6YW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGluamVjdGFibGUuZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGluamVjdGFibGUudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmt0eXBlOiBpbmplY3RhYmxlLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBpbmplY3RhYmxlLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkID0gMCxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnRzID0gaW5qZWN0YWJsZS5wcm9wZXJ0aWVzLmxlbmd0aCArIGluamVjdGFibGUubWV0aG9kcy5sZW5ndGggKyAxOyAvLyArMSBmb3IgaW5qZWN0YWJsZSBpdHNlbGZcblxuICAgICAgICAgICAgICAgIGlmIChpbmplY3RhYmxlLmNvbnN0cnVjdG9yT2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50cyArPSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5qZWN0YWJsZS5jb25zdHJ1Y3Rvck9iai5kZXNjcmlwdGlvbiAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmplY3RhYmxlLmRlc2NyaXB0aW9uICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfLmZvckVhY2goaW5qZWN0YWJsZS5wcm9wZXJ0aWVzLCAocHJvcGVydHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5Lm1vZGlmaWVyS2luZCA9PT0gMTExKSB7IC8vIERvZXNuJ3QgaGFuZGxlIHByaXZhdGUgZm9yIGNvdmVyYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudHMgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihwcm9wZXJ0eS5kZXNjcmlwdGlvbiAhPT0gJycgJiYgcHJvcGVydHkubW9kaWZpZXJLaW5kICE9PSAxMTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgXy5mb3JFYWNoKGluamVjdGFibGUubWV0aG9kcywgKG1ldGhvZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kLm1vZGlmaWVyS2luZCA9PT0gMTExKSB7IC8vIERvZXNuJ3QgaGFuZGxlIHByaXZhdGUgZm9yIGNvdmVyYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudHMgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZihtZXRob2QuZGVzY3JpcHRpb24gIT09ICcnICYmIG1ldGhvZC5tb2RpZmllcktpbmQgIT09IDExMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGNsLmNvdmVyYWdlUGVyY2VudCA9IE1hdGguZmxvb3IoKHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCAvIHRvdGFsU3RhdGVtZW50cykgKiAxMDApO1xuICAgICAgICAgICAgICAgIGlmKHRvdGFsU3RhdGVtZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjbC5jb3ZlcmFnZVBlcmNlbnQgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjbC5jb3ZlcmFnZUNvdW50ID0gdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkICsgJy8nICsgdG90YWxTdGF0ZW1lbnRzO1xuICAgICAgICAgICAgICAgIGNsLnN0YXR1cyA9IGdldFN0YXR1cyhjbC5jb3ZlcmFnZVBlcmNlbnQpO1xuICAgICAgICAgICAgICAgIHRvdGFsUHJvamVjdFN0YXRlbWVudERvY3VtZW50ZWQgKz0gY2wuY292ZXJhZ2VQZXJjZW50O1xuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goY2wpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfLmZvckVhY2godGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmludGVyZmFjZXMsIChpbnRlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghaW50ZXIucHJvcGVydGllcyB8fFxuICAgICAgICAgICAgICAgICAgICAhaW50ZXIubWV0aG9kcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGNsOmFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBpbnRlci5maWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaW50ZXIudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmt0eXBlOiBpbnRlci50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogaW50ZXIubmFtZVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgPSAwLFxuICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudHMgPSBpbnRlci5wcm9wZXJ0aWVzLmxlbmd0aCArIGludGVyLm1ldGhvZHMubGVuZ3RoICsgMTsgLy8gKzEgZm9yIGludGVyZmFjZSBpdHNlbGZcblxuICAgICAgICAgICAgICAgIGlmIChpbnRlci5jb25zdHJ1Y3Rvck9iaikge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudHMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyLmNvbnN0cnVjdG9yT2JqLmRlc2NyaXB0aW9uICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnREb2N1bWVudGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGludGVyLmRlc2NyaXB0aW9uICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfLmZvckVhY2goaW50ZXIucHJvcGVydGllcywgKHByb3BlcnR5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eS5tb2RpZmllcktpbmQgPT09IDExMSkgeyAvLyBEb2Vzbid0IGhhbmRsZSBwcml2YXRlIGZvciBjb3ZlcmFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxTdGF0ZW1lbnRzIC09IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYocHJvcGVydHkuZGVzY3JpcHRpb24gIT09ICcnICYmIHByb3BlcnR5Lm1vZGlmaWVyS2luZCAhPT0gMTExKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChpbnRlci5tZXRob2RzLCAobWV0aG9kKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXRob2QubW9kaWZpZXJLaW5kID09PSAxMTEpIHsgLy8gRG9lc24ndCBoYW5kbGUgcHJpdmF0ZSBmb3IgY292ZXJhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50cyAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKG1ldGhvZC5kZXNjcmlwdGlvbiAhPT0gJycgJiYgbWV0aG9kLm1vZGlmaWVyS2luZCAhPT0gMTExKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY2wuY292ZXJhZ2VQZXJjZW50ID0gTWF0aC5mbG9vcigodG90YWxTdGF0ZW1lbnREb2N1bWVudGVkIC8gdG90YWxTdGF0ZW1lbnRzKSAqIDEwMCk7XG4gICAgICAgICAgICAgICAgaWYodG90YWxTdGF0ZW1lbnRzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsLmNvdmVyYWdlUGVyY2VudCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNsLmNvdmVyYWdlQ291bnQgPSB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKyAnLycgKyB0b3RhbFN0YXRlbWVudHM7XG4gICAgICAgICAgICAgICAgY2wuc3RhdHVzID0gZ2V0U3RhdHVzKGNsLmNvdmVyYWdlUGVyY2VudCk7XG4gICAgICAgICAgICAgICAgdG90YWxQcm9qZWN0U3RhdGVtZW50RG9jdW1lbnRlZCArPSBjbC5jb3ZlcmFnZVBlcmNlbnQ7XG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChjbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF8uZm9yRWFjaCh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEucGlwZXMsIChwaXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNsOmFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBwaXBlLmZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBwaXBlLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rdHlwZTogcGlwZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcGlwZS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCA9IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50cyA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHBpcGUuZGVzY3JpcHRpb24gIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCArPSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNsLmNvdmVyYWdlUGVyY2VudCA9IE1hdGguZmxvb3IoKHRvdGFsU3RhdGVtZW50RG9jdW1lbnRlZCAvIHRvdGFsU3RhdGVtZW50cykgKiAxMDApO1xuICAgICAgICAgICAgICAgIGNsLmNvdmVyYWdlQ291bnQgPSB0b3RhbFN0YXRlbWVudERvY3VtZW50ZWQgKyAnLycgKyB0b3RhbFN0YXRlbWVudHM7XG4gICAgICAgICAgICAgICAgY2wuc3RhdHVzID0gZ2V0U3RhdHVzKGNsLmNvdmVyYWdlUGVyY2VudCk7XG4gICAgICAgICAgICAgICAgdG90YWxQcm9qZWN0U3RhdGVtZW50RG9jdW1lbnRlZCArPSBjbC5jb3ZlcmFnZVBlcmNlbnQ7XG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChjbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpbGVzID0gXy5zb3J0QnkoZmlsZXMsIFsnZmlsZVBhdGgnXSk7XG4gICAgICAgICAgICB2YXIgY292ZXJhZ2VEYXRhID0ge1xuICAgICAgICAgICAgICAgIGNvdW50OiAoZmlsZXMubGVuZ3RoID4gMCkgPyBNYXRoLmZsb29yKHRvdGFsUHJvamVjdFN0YXRlbWVudERvY3VtZW50ZWQgLyBmaWxlcy5sZW5ndGgpIDogMCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICcnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY292ZXJhZ2VEYXRhLnN0YXR1cyA9IGdldFN0YXR1cyhjb3ZlcmFnZURhdGEuY291bnQpO1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmFkZFBhZ2Uoe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjb3ZlcmFnZScsXG4gICAgICAgICAgICAgICAgY29udGV4dDogJ2NvdmVyYWdlJyxcbiAgICAgICAgICAgICAgICBmaWxlczogZmlsZXMsXG4gICAgICAgICAgICAgICAgZGF0YTogY292ZXJhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGRlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHBhZ2VUeXBlOiBDT01QT0RPQ19ERUZBVUxUUy5QQUdFX1RZUEVTLlJPT1RcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0bWxlbmdpbmUuZ2VuZXJhdGVDb3ZlcmFnZUJhZGdlKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5vdXRwdXQsIGNvdmVyYWdlRGF0YSk7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvdmVyYWdlVGVzdCkge1xuICAgICAgICAgICAgICAgIGlmIChjb3ZlcmFnZURhdGEuY291bnQgPj0gdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvdmVyYWdlVGVzdFRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnRG9jdW1lbnRhdGlvbiBjb3ZlcmFnZSBpcyBvdmVyIHRocmVzaG9sZCcpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdEb2N1bWVudGF0aW9uIGNvdmVyYWdlIGlzIG5vdCBvdmVyIHRocmVzaG9sZCcpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2Nlc3NQYWdlcygpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICBsb2dnZXIuaW5mbygnUHJvY2VzcyBwYWdlcycpO1xuICAgICAgICBsZXQgcGFnZXMgPSB0aGlzLmNvbmZpZ3VyYXRpb24ucGFnZXMsXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbiA9IHBhZ2VzLmxlbmd0aCxcbiAgICAgICAgICAgIGxvb3AgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIGkgPD0gbGVuLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1Byb2Nlc3MgcGFnZScsIHBhZ2VzW2ldLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAkaHRtbGVuZ2luZS5yZW5kZXIodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLCBwYWdlc1tpXSkudGhlbigoaHRtbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5hbFBhdGggPSB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3V0cHV0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm91dHB1dC5sYXN0SW5kZXhPZignLycpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsUGF0aCArPSAnLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFnZXNbaV0ucGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsUGF0aCArPSBwYWdlc1tpXS5wYXRoICsgJy8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxQYXRoICs9IHBhZ2VzW2ldLm5hbWUgKyAnLmh0bWwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNlYXJjaEVuZ2luZS5pbmRleFBhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm9zOiBwYWdlc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdEYXRhOiBodG1sRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGZpbmFsUGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcy5vdXRwdXRGaWxlKHBhdGgucmVzb2x2ZShmaW5hbFBhdGgpLCBodG1sRGF0YSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkdXJpbmcgJyArIHBhZ2VzW2ldLm5hbWUgKyAnIHBhZ2UgZ2VuZXJhdGlvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCAoZXJyb3JNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHNlYXJjaEVuZ2luZS5nZW5lcmF0ZVNlYXJjaEluZGV4SnNvbih0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3V0cHV0KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuYWRkaXRpb25hbFBhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NBZGRpdGlvbmFsUGFnZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5hc3NldHNGb2xkZXIgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Fzc2V0c0ZvbGRlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXNvdXJjZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgKGUpID0+wqB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIGxvb3AoKTtcbiAgICB9XG5cbiAgICBwcm9jZXNzQWRkaXRpb25hbFBhZ2VzKCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdQcm9jZXNzIGFkZGl0aW9uYWwgcGFnZXMnKTtcbiAgICAgICAgbGV0IHBhZ2VzID0gdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmFkZGl0aW9uYWxQYWdlcyxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgbGVuID0gcGFnZXMubGVuZ3RoLFxuICAgICAgICAgICAgbG9vcCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiggaSA8PSBsZW4tMSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnUHJvY2VzcyBwYWdlJywgcGFnZXNbaV0ubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICRodG1sZW5naW5lLnJlbmRlcih0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEsIHBhZ2VzW2ldKS50aGVuKChodG1sRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpbmFsUGF0aCA9IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5vdXRwdXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3V0cHV0Lmxhc3RJbmRleE9mKCcvJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxQYXRoICs9ICcvJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYWdlc1tpXS5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxQYXRoICs9IHBhZ2VzW2ldLnBhdGggKyAnLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbFBhdGggKz0gcGFnZXNbaV0uZmlsZW5hbWUgKyAnLmh0bWwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNlYXJjaEVuZ2luZS5pbmRleFBhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm9zOiBwYWdlc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdEYXRhOiBodG1sRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGZpbmFsUGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcy5vdXRwdXRGaWxlKHBhdGgucmVzb2x2ZShmaW5hbFBhdGgpLCBodG1sRGF0YSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkdXJpbmcgJyArIHBhZ2VzW2ldLm5hbWUgKyAnIHBhZ2UgZ2VuZXJhdGlvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCAoZXJyb3JNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHNlYXJjaEVuZ2luZS5nZW5lcmF0ZVNlYXJjaEluZGV4SnNvbih0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3V0cHV0KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuYXNzZXRzRm9sZGVyICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Fzc2V0c0ZvbGRlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzb3VyY2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIChlKSA9PsKge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICBsb29wKCk7XG4gICAgfVxuXG4gICAgcHJvY2Vzc0Fzc2V0c0ZvbGRlcigpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICBsb2dnZXIuaW5mbygnQ29weSBhc3NldHMgZm9sZGVyJyk7XG5cbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5hc3NldHNGb2xkZXIpKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoYFByb3ZpZGVkIGFzc2V0cyBmb2xkZXIgJHt0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuYXNzZXRzRm9sZGVyfSBkaWQgbm90IGV4aXN0YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcy5jb3B5KHBhdGgucmVzb2x2ZSh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuYXNzZXRzRm9sZGVyKSwgcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCkgKyBwYXRoLnNlcCArIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5vdXRwdXQgKyBwYXRoLnNlcCArIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5hc3NldHNGb2xkZXIpLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgZHVyaW5nIHJlc291cmNlcyBjb3B5ICcsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9jZXNzUmVzb3VyY2VzKCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdDb3B5IG1haW4gcmVzb3VyY2VzJyk7XG5cbiAgICAgICAgY29uc3Qgb25Db21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGxldCBmaW5hbFRpbWUgPSAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ0RvY3VtZW50YXRpb24gZ2VuZXJhdGVkIGluICcgKyB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3V0cHV0ICsgJyBpbiAnICsgZmluYWxUaW1lICsgJyBzZWNvbmRzIHVzaW5nICcgKyB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEudGhlbWUgKyAnIHRoZW1lJyk7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnNlcnZlKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYFNlcnZpbmcgZG9jdW1lbnRhdGlvbiBmcm9tICR7dGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm91dHB1dH0gYXQgaHR0cDovLzEyNy4wLjAuMToke3RoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5wb3J0fWApO1xuICAgICAgICAgICAgICAgIHRoaXMucnVuV2ViU2VydmVyKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5vdXRwdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBmaW5hbE91dHB1dCA9IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5vdXRwdXQucmVwbGFjZShwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgICAgICAgZnMuY29weShwYXRoLnJlc29sdmUoX19kaXJuYW1lICsgJy8uLi9zcmMvcmVzb3VyY2VzLycpLCBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSArIHBhdGguc2VwICsgZmluYWxPdXRwdXQpLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGR1cmluZyByZXNvdXJjZXMgY29weSAnLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5leHRUaGVtZSkge1xuICAgICAgICAgICAgICAgICAgICBmcy5jb3B5KHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpICsgcGF0aC5zZXAgKyB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuZXh0VGhlbWUpLCBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSArIHBhdGguc2VwICsgZmluYWxPdXRwdXQgKyAnL3N0eWxlcy8nKSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgZHVyaW5nIGV4dGVybmFsIHN0eWxpbmcgdGhlbWUgY29weSAnLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnRXh0ZXJuYWwgc3R5bGluZyB0aGVtZSBjb3B5IHN1Y2NlZWRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9jZXNzR3JhcGhzKCkge1xuXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuZGlzYWJsZUdyYXBoKSB7XG5cbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdHcmFwaCBnZW5lcmF0aW9uIGRpc2FibGVkJyk7XG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NQYWdlcygpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdQcm9jZXNzIG1haW4gZ3JhcGgnKTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICAgICAgICAgIGxldCBtb2R1bGVzID0gdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm1vZHVsZXMsXG4gICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICBsZW4gPSBtb2R1bGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgbG9vcCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmKCBpIDw9IGxlbi0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1Byb2Nlc3MgbW9kdWxlIGdyYXBoJywgbW9kdWxlc1tpXS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICBsZXQgZmluYWxQYXRoID0gdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm91dHB1dDtcbiAgICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3V0cHV0Lmxhc3RJbmRleE9mKCcvJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsUGF0aCArPSAnLyc7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGZpbmFsUGF0aCArPSAnbW9kdWxlcy8nICsgbW9kdWxlc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICRuZ2RlbmdpbmUucmVuZGVyR3JhcGgobW9kdWxlc1tpXS5maWxlLCBmaW5hbFBhdGgsICdmJywgbW9kdWxlc1tpXS5uYW1lKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJG5nZGVuZ2luZS5yZWFkR3JhcGgocGF0aC5yZXNvbHZlKGZpbmFsUGF0aCArIHBhdGguc2VwICsgJ2RlcGVuZGVuY2llcy5zdmcnKSwgbW9kdWxlc1tpXS5uYW1lKS50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVzW2ldLmdyYXBoID0gPHN0cmluZz5kYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9vcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGR1cmluZyBncmFwaCByZWFkOiAnLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9LCAoZXJyb3JNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NQYWdlcygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IGZpbmFsTWFpbkdyYXBoUGF0aCA9IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5vdXRwdXQ7XG4gICAgICAgICAgICBpZihmaW5hbE1haW5HcmFwaFBhdGgubGFzdEluZGV4T2YoJy8nKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBmaW5hbE1haW5HcmFwaFBhdGggKz0gJy8nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxNYWluR3JhcGhQYXRoICs9ICdncmFwaCc7XG4gICAgICAgICAgICAkbmdkZW5naW5lLnJlbmRlckdyYXBoKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS50c2NvbmZpZywgcGF0aC5yZXNvbHZlKGZpbmFsTWFpbkdyYXBoUGF0aCksICdwJykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgJG5nZGVuZ2luZS5yZWFkR3JhcGgocGF0aC5yZXNvbHZlKGZpbmFsTWFpbkdyYXBoUGF0aCArIHBhdGguc2VwICsgJ2RlcGVuZGVuY2llcy5zdmcnKSwgJ01haW4gZ3JhcGgnKS50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5tYWluR3JhcGggPSA8c3RyaW5nPmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgZHVyaW5nIGdyYXBoIHJlYWQ6ICcsIGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkdXJpbmcgZ3JhcGggZ2VuZXJhdGlvbjogJywgZXJyKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW5XZWJTZXJ2ZXIoZm9sZGVyKSB7XG4gICAgICAgIGlmKCF0aGlzLmlzV2F0Y2hpbmcpIHtcbiAgICAgICAgICAgIExpdmVTZXJ2ZXIuc3RhcnQoe1xuICAgICAgICAgICAgICAgIHJvb3Q6IGZvbGRlcixcbiAgICAgICAgICAgICAgICBvcGVuOiB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEub3BlbixcbiAgICAgICAgICAgICAgICBxdWlldDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBsb2dMZXZlbDogMCxcbiAgICAgICAgICAgICAgICB3YWl0OiAxMDAwLFxuICAgICAgICAgICAgICAgIHBvcnQ6IHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5wb3J0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLndhdGNoICYmICF0aGlzLmlzV2F0Y2hpbmcpIHtcbiAgICAgICAgICAgIHRoaXMucnVuV2F0Y2goKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEud2F0Y2ggJiYgdGhpcy5pc1dhdGNoaW5nKSB7XG4gICAgICAgICAgICBsZXQgc3JjRm9sZGVyID0gZmluZE1haW5Tb3VyY2VGb2xkZXIodGhpcy5maWxlcyk7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhgQWxyZWFkeSB3YXRjaGluZyBzb3VyY2VzIGluICR7c3JjRm9sZGVyfSBmb2xkZXJgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bldhdGNoKCkge1xuICAgICAgICBsZXQgc3JjRm9sZGVyID0gZmluZE1haW5Tb3VyY2VGb2xkZXIodGhpcy5maWxlcyksXG4gICAgICAgICAgICB3YXRjaENoYW5nZWRGaWxlcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuaXNXYXRjaGluZyA9IHRydWU7XG5cbiAgICAgICAgbG9nZ2VyLmluZm8oJycpO1xuICAgICAgICBsb2dnZXIuaW5mbyhgV2F0Y2hpbmcgc291cmNlcyBpbiAke3NyY0ZvbGRlcn0gZm9sZGVyYCk7XG5cbiAgICAgICAgbGV0IHdhdGNoZXIgPSBjaG9raWRhci53YXRjaChzcmNGb2xkZXIsIHtcbiAgICAgICAgICAgICAgICBhd2FpdFdyaXRlRmluaXNoOiB0cnVlLFxuICAgICAgICAgICAgICAgIGlnbm9yZWQ6IC8oc3BlY3xcXC5kKVxcLnRzL1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB0aW1lckFkZEFuZFJlbW92ZVJlZixcbiAgICAgICAgICAgIHRpbWVyQ2hhbmdlUmVmLFxuICAgICAgICAgICAgd2FpdGVyQWRkQW5kUmVtb3ZlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lckFkZEFuZFJlbW92ZVJlZik7XG4gICAgICAgICAgICAgICAgdGltZXJBZGRBbmRSZW1vdmVSZWYgPSBzZXRUaW1lb3V0KHJ1bm5lckFkZEFuZFJlbW92ZSwgMTAwMCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcnVubmVyQWRkQW5kUmVtb3ZlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3YWl0ZXJDaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyQ2hhbmdlUmVmKTtcbiAgICAgICAgICAgICAgICB0aW1lckNoYW5nZVJlZiA9IHNldFRpbWVvdXQocnVubmVyQ2hhbmdlLCAxMDAwKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBydW5uZXJDaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRVcGRhdGVkRmlsZXMod2F0Y2hDaGFuZ2VkRmlsZXMpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc1dhdGNoZWRGaWxlc1RTRmlsZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldE1pY3JvRGVwZW5kZW5jaWVzRGF0YSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVidWlsZEV4dGVybmFsRG9jdW1lbnRhdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmNsdWRlcyAhPT0gJycpIHtcbiAgICAgICAgICAgIHdhdGNoZXIuYWRkKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmNsdWRlcyk7XG4gICAgICAgIH1cblxuICAgICAgICB3YXRjaGVyXG4gICAgICAgICAgICAub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHdhdGNoZXJcbiAgICAgICAgICAgICAgICAgICAgLm9uKCdhZGQnLCAoZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKGBGaWxlICR7ZmlsZX0gaGFzIGJlZW4gYWRkZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRlc3QgZXh0ZW5zaW9uLCBpZiB0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzY2FuIGV2ZXJ5dGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmV4dG5hbWUoZmlsZSkgPT09ICcudHMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FpdGVyQWRkQW5kUmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5vbignY2hhbmdlJywgKGZpbGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZyhgRmlsZSAke2ZpbGV9IGhhcyBiZWVuIGNoYW5nZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRlc3QgZXh0ZW5zaW9uLCBpZiB0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzY2FuIG9ubHkgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguZXh0bmFtZShmaWxlKSA9PT0gJy50cycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXRjaENoYW5nZWRGaWxlcy5wdXNoKHBhdGguam9pbihwcm9jZXNzLmN3ZCgpICsgcGF0aC5zZXAgKyBmaWxlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FpdGVyQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5leHRuYW1lKGZpbGUpID09PSAnLm1kJyB8fCBwYXRoLmV4dG5hbWUoZmlsZSkgPT09ICcuanNvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXRjaENoYW5nZWRGaWxlcy5wdXNoKHBhdGguam9pbihwcm9jZXNzLmN3ZCgpICsgcGF0aC5zZXAgKyBmaWxlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FpdGVyQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5vbigndW5saW5rJywgKGZpbGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZyhgRmlsZSAke2ZpbGV9IGhhcyBiZWVuIHJlbW92ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRlc3QgZXh0ZW5zaW9uLCBpZiB0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzY2FuIGV2ZXJ5dGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmV4dG5hbWUoZmlsZSkgPT09ICcudHMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FpdGVyQWRkQW5kUmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBhcHBsaWNhdGlvbiAvIHJvb3QgY29tcG9uZW50IGluc3RhbmNlLlxuICAgICAqL1xuICAgIGdldCBhcHBsaWNhdGlvbigpOkFwcGxpY2F0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cbiAgICBnZXQgaXNDTEkoKTpib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7IEFwcGxpY2F0aW9uIH0gZnJvbSAnLi9hcHAvYXBwbGljYXRpb24nO1xuXG5pbXBvcnQgeyBDT01QT0RPQ19ERUZBVUxUUyB9IGZyb20gJy4vdXRpbHMvZGVmYXVsdHMnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgcmVhZENvbmZpZywgaGFuZGxlUGF0aCB9IGZyb20gJy4vdXRpbHMvdXRpbHMnO1xuXG5sZXQgcGtnID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyksXG4gICAgcHJvZ3JhbSA9IHJlcXVpcmUoJ2NvbW1hbmRlcicpLFxuICAgIGdsb2IgPSByZXF1aXJlKCdnbG9iJyksXG4gICAgb3MgPSByZXF1aXJlKCdvcycpLFxuICAgIG9zTmFtZSA9IHJlcXVpcmUoJ29zLW5hbWUnKSxcbiAgICBmaWxlcyA9IFtdLFxuICAgIGN3ZCA9IHByb2Nlc3MuY3dkKCk7XG5cbnByb2Nlc3Muc2V0TWF4TGlzdGVuZXJzKDApO1xuXG5leHBvcnQgY2xhc3MgQ2xpQXBwbGljYXRpb24gZXh0ZW5kcyBBcHBsaWNhdGlvblxue1xuICAgIC8qKlxuICAgICAqIFJ1biBjb21wb2RvYyBmcm9tIHRoZSBjb21tYW5kIGxpbmUuXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdlbmVyYXRlKCkge1xuXG4gICAgICAgIGZ1bmN0aW9uIGxpc3QodmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsLnNwbGl0KCcsJyk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9ncmFtXG4gICAgICAgICAgICAudmVyc2lvbihwa2cudmVyc2lvbilcbiAgICAgICAgICAgIC51c2FnZSgnPHNyYz4gW29wdGlvbnNdJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1wLCAtLXRzY29uZmlnIFtjb25maWddJywgJ0EgdHNjb25maWcuanNvbiBmaWxlJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1kLCAtLW91dHB1dCBbZm9sZGVyXScsICdXaGVyZSB0byBzdG9yZSB0aGUgZ2VuZXJhdGVkIGRvY3VtZW50YXRpb24gKGRlZmF1bHQ6IC4vZG9jdW1lbnRhdGlvbiknLCBDT01QT0RPQ19ERUZBVUxUUy5mb2xkZXIpXG4gICAgICAgICAgICAub3B0aW9uKCcteSwgLS1leHRUaGVtZSBbZmlsZV0nLCAnRXh0ZXJuYWwgc3R5bGluZyB0aGVtZSBmaWxlJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1uLCAtLW5hbWUgW25hbWVdJywgJ1RpdGxlIGRvY3VtZW50YXRpb24nLCBDT01QT0RPQ19ERUZBVUxUUy50aXRsZSlcbiAgICAgICAgICAgIC5vcHRpb24oJy1hLCAtLWFzc2V0c0ZvbGRlciBbZm9sZGVyXScsICdFeHRlcm5hbCBhc3NldHMgZm9sZGVyIHRvIGNvcHkgaW4gZ2VuZXJhdGVkIGRvY3VtZW50YXRpb24gZm9sZGVyJylcbiAgICAgICAgICAgIC5vcHRpb24oJy1vLCAtLW9wZW4nLCAnT3BlbiB0aGUgZ2VuZXJhdGVkIGRvY3VtZW50YXRpb24nLCBmYWxzZSlcbiAgICAgICAgICAgIC5vcHRpb24oJy10LCAtLXNpbGVudCcsICdJbiBzaWxlbnQgbW9kZSwgbG9nIG1lc3NhZ2VzIGFyZW5cXCd0IGxvZ2dlZCBpbiB0aGUgY29uc29sZScsIGZhbHNlKVxuICAgICAgICAgICAgLm9wdGlvbignLXMsIC0tc2VydmUnLCAnU2VydmUgZ2VuZXJhdGVkIGRvY3VtZW50YXRpb24gKGRlZmF1bHQgaHR0cDovL2xvY2FsaG9zdDo4MDgwLyknLCBmYWxzZSlcbiAgICAgICAgICAgIC5vcHRpb24oJy1yLCAtLXBvcnQgW3BvcnRdJywgJ0NoYW5nZSBkZWZhdWx0IHNlcnZpbmcgcG9ydCcsIENPTVBPRE9DX0RFRkFVTFRTLnBvcnQpXG4gICAgICAgICAgICAub3B0aW9uKCctdywgLS13YXRjaCcsICdXYXRjaCBzb3VyY2UgZmlsZXMgYWZ0ZXIgc2VydmUgYW5kIGZvcmNlIGRvY3VtZW50YXRpb24gcmVidWlsZCcsIGZhbHNlKVxuICAgICAgICAgICAgLm9wdGlvbignLS10aGVtZSBbdGhlbWVdJywgJ0Nob29zZSBvbmUgb2YgYXZhaWxhYmxlIHRoZW1lcywgZGVmYXVsdCBpcyBcXCdnaXRib29rXFwnIChsYXJhdmVsLCBvcmlnaW5hbCwgcG9zdG1hcmssIHJlYWR0aGVkb2NzLCBzdHJpcGUsIHZhZ3JhbnQpJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0taGlkZUdlbmVyYXRvcicsICdEbyBub3QgcHJpbnQgdGhlIENvbXBvZG9jIGxpbmsgYXQgdGhlIGJvdHRvbSBvZiB0aGUgcGFnZScsIGZhbHNlKVxuICAgICAgICAgICAgLm9wdGlvbignLS10b2dnbGVNZW51SXRlbXMgPGl0ZW1zPicsICdDbG9zZSBieSBkZWZhdWx0IGl0ZW1zIGluIHRoZSBtZW51IGV4YW1wbGU6IFxcJ2FsbFxcJyBvciBcXCdtb2R1bGVzXFwnLFxcJ2NvbXBvbmVudHNcXCcsXFwnZGlyZWN0aXZlc1xcJyxcXCdjbGFzc2VzXFwnLFxcJ2luamVjdGFibGVzXFwnLFxcJ2ludGVyZmFjZXNcXCcsXFwncGlwZXNcXCcsXFwnYWRkaXRpb25hbFBhZ2VzXFwnJywgbGlzdClcbiAgICAgICAgICAgIC5vcHRpb24oJy0taW5jbHVkZXMgW3BhdGhdJywgJ1BhdGggb2YgZXh0ZXJuYWwgbWFya2Rvd24gZmlsZXMgdG8gaW5jbHVkZScpXG4gICAgICAgICAgICAub3B0aW9uKCctLWluY2x1ZGVzTmFtZSBbbmFtZV0nLCAnTmFtZSBvZiBpdGVtIG1lbnUgb2YgZXh0ZXJuYWxzIG1hcmtkb3duIGZpbGVzIChkZWZhdWx0IFwiQWRkaXRpb25hbCBkb2N1bWVudGF0aW9uXCIpJywgQ09NUE9ET0NfREVGQVVMVFMuYWRkaXRpb25hbEVudHJ5TmFtZSlcbiAgICAgICAgICAgIC5vcHRpb24oJy0tY292ZXJhZ2VUZXN0IFt0aHJlc2hvbGRdJywgJ1Rlc3QgY29tbWFuZCBvZiBkb2N1bWVudGF0aW9uIGNvdmVyYWdlIHdpdGggYSB0aHJlc2hvbGQgKGRlZmF1bHQgNzApJylcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZGlzYWJsZVNvdXJjZUNvZGUnLCAnRG8gbm90IGFkZCBzb3VyY2UgY29kZSB0YWInLCBmYWxzZSlcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZGlzYWJsZUdyYXBoJywgJ0RvIG5vdCBhZGQgdGhlIGRlcGVuZGVuY3kgZ3JhcGgnLCBmYWxzZSlcbiAgICAgICAgICAgIC5vcHRpb24oJy0tZGlzYWJsZUNvdmVyYWdlJywgJ0RvIG5vdCBhZGQgdGhlIGRvY3VtZW50YXRpb24gY292ZXJhZ2UgcmVwb3J0JywgZmFsc2UpXG4gICAgICAgICAgICAub3B0aW9uKCctLWRpc2FibGVQcml2YXRlT3JJbnRlcm5hbFN1cHBvcnQnLCAnRG8gbm90IHNob3cgcHJpdmF0ZSBvciBAaW50ZXJuYWwgaW4gZ2VuZXJhdGVkIGRvY3VtZW50YXRpb24nLCBmYWxzZSlcbiAgICAgICAgICAgIC5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuXG4gICAgICAgIGxldCBvdXRwdXRIZWxwID0gKCkgPT4ge1xuICAgICAgICAgICAgcHJvZ3JhbS5vdXRwdXRIZWxwKClcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLm91dHB1dCkge1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLm91dHB1dCA9IHByb2dyYW0ub3V0cHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyYW0uZXh0VGhlbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5leHRUaGVtZSA9IHByb2dyYW0uZXh0VGhlbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS50aGVtZSkge1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnRoZW1lID0gcHJvZ3JhbS50aGVtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kb2N1bWVudGF0aW9uTWFpbk5hbWUgPSBwcm9ncmFtLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS5hc3NldHNGb2xkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5hc3NldHNGb2xkZXIgPSBwcm9ncmFtLmFzc2V0c0ZvbGRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLm9wZW4pIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5vcGVuID0gcHJvZ3JhbS5vcGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyYW0udG9nZ2xlTWVudUl0ZW1zKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEudG9nZ2xlTWVudUl0ZW1zID0gcHJvZ3JhbS50b2dnbGVNZW51SXRlbXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS5pbmNsdWRlcykge1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmluY2x1ZGVzICA9IHByb2dyYW0uaW5jbHVkZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS5pbmNsdWRlc05hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5pbmNsdWRlc05hbWUgID0gcHJvZ3JhbS5pbmNsdWRlc05hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS5zaWxlbnQpIHtcbiAgICAgICAgICAgIGxvZ2dlci5zaWxlbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLnNlcnZlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuc2VydmUgID0gcHJvZ3JhbS5zZXJ2ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLnBvcnQpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5wb3J0ID0gcHJvZ3JhbS5wb3J0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyYW0ud2F0Y2gpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS53YXRjaCA9IHByb2dyYW0ud2F0Y2g7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS5oaWRlR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuaGlkZUdlbmVyYXRvciA9IHByb2dyYW0uaGlkZUdlbmVyYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLmluY2x1ZGVzKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuaW5jbHVkZXMgPSBwcm9ncmFtLmluY2x1ZGVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyYW0uaW5jbHVkZXNOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuaW5jbHVkZXNOYW1lID0gcHJvZ3JhbS5pbmNsdWRlc05hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS5jb3ZlcmFnZVRlc3QpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5jb3ZlcmFnZVRlc3QgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmNvdmVyYWdlVGVzdFRocmVzaG9sZCA9ICh0eXBlb2YgcHJvZ3JhbS5jb3ZlcmFnZVRlc3QgPT09ICdzdHJpbmcnKSA/IHBhcnNlSW50KHByb2dyYW0uY292ZXJhZ2VUZXN0KSA6IENPTVBPRE9DX0RFRkFVTFRTLmRlZmF1bHRDb3ZlcmFnZVRocmVzaG9sZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLmRpc2FibGVTb3VyY2VDb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuZGlzYWJsZVNvdXJjZUNvZGUgPSBwcm9ncmFtLmRpc2FibGVTb3VyY2VDb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyYW0uZGlzYWJsZUdyYXBoKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEuZGlzYWJsZUdyYXBoID0gcHJvZ3JhbS5kaXNhYmxlR3JhcGg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvZ3JhbS5kaXNhYmxlQ292ZXJhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kaXNhYmxlQ292ZXJhZ2UgPSBwcm9ncmFtLmRpc2FibGVDb3ZlcmFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmFtLmRpc2FibGVQcml2YXRlT3JJbnRlcm5hbFN1cHBvcnQpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS5kaXNhYmxlUHJpdmF0ZU9ySW50ZXJuYWxTdXBwb3J0ID0gcHJvZ3JhbS5kaXNhYmxlUHJpdmF0ZU9ySW50ZXJuYWxTdXBwb3J0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzV2F0Y2hpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vc3JjL3Jlc291cmNlcy9pbWFnZXMvYmFubmVyJykpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocGtnLnZlcnNpb24pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYE5vZGUuanMgdmVyc2lvbiA6ICR7cHJvY2Vzcy52ZXJzaW9ufWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYE9wZXJhdGluZyBzeXN0ZW0gOiAke29zTmFtZShvcy5wbGF0Zm9ybSgpLCBvcy5yZWxlYXNlKCkpfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyYW0uc2VydmUgJiYgIXByb2dyYW0udHNjb25maWcgJiYgcHJvZ3JhbS5vdXRwdXQpIHtcbiAgICAgICAgICAgIC8vIGlmIC1zICYgLWQsIHNlcnZlIGl0XG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocHJvZ3JhbS5vdXRwdXQpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGAke3Byb2dyYW0ub3V0cHV0fSBmb2xkZXIgZG9lc24ndCBleGlzdGApO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYFNlcnZpbmcgZG9jdW1lbnRhdGlvbiBmcm9tICR7cHJvZ3JhbS5vdXRwdXR9IGF0IGh0dHA6Ly8xMjcuMC4wLjE6JHtwcm9ncmFtLnBvcnR9YCk7XG4gICAgICAgICAgICAgICAgc3VwZXIucnVuV2ViU2VydmVyKHByb2dyYW0ub3V0cHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChwcm9ncmFtLnNlcnZlICYmICFwcm9ncmFtLnRzY29uZmlnICYmICFwcm9ncmFtLm91dHB1dCkge1xuICAgICAgICAgICAgLy8gaWYgb25seSAtcyBmaW5kIC4vZG9jdW1lbnRhdGlvbiwgaWYgb2sgc2VydmUsIGVsc2UgZXJyb3IgcHJvdmlkZSAtZFxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHByb2dyYW0ub3V0cHV0KSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignUHJvdmlkZSBvdXRwdXQgZ2VuZXJhdGVkIGZvbGRlciB3aXRoIC1kIGZsYWcnKTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBTZXJ2aW5nIGRvY3VtZW50YXRpb24gZnJvbSAke3Byb2dyYW0ub3V0cHV0fSBhdCBodHRwOi8vMTI3LjAuMC4xOiR7cHJvZ3JhbS5wb3J0fWApO1xuICAgICAgICAgICAgICAgIHN1cGVyLnJ1bldlYlNlcnZlcihwcm9ncmFtLm91dHB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocHJvZ3JhbS5oaWRlR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLmhpZGVHZW5lcmF0b3IgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgZGVmYXVsdFdhbGtGT2xkZXIgPSBjd2QgfHwgJy4nLFxuICAgICAgICAgICAgICAgIHdhbGsgPSAoZGlyLCBleGNsdWRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGxldCBsaXN0ID0gZnMucmVhZGRpclN5bmMoZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhjbHVkZVRlc3QgPSBfLmZpbmQoZXhjbHVkZSwgZnVuY3Rpb24obykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBnbG9iRmlsZXMgPSBnbG9iLnN5bmMobywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjd2Q6IGN3ZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnbG9iRmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmlsZU5hbWVGb3JHbG9iU2VhcmNoID0gcGF0aC5qb2luKGRpciwgZmlsZSkucmVwbGFjZShjd2QgKyBwYXRoLnNlcCwgJycpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0R2xvYlNlYXJjaCA9IGdsb2JGaWxlcy5maW5kSW5kZXgoKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudCA9PT0gZmlsZU5hbWVGb3JHbG9iU2VhcmNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0ID0gcmVzdWx0R2xvYlNlYXJjaCAhPT0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybignRXhjbHVkaW5nJywgcGF0aC5qb2luKGRpciwgZmlsZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZXN0ID0gcGF0aC5iYXNlbmFtZShvKSA9PT0gZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdFeGNsdWRpbmcnLCBwYXRoLmpvaW4oZGlyLCBmaWxlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRlc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGV4Y2x1ZGVUZXN0ID09PSAndW5kZWZpbmVkJyAmJiBkaXIuaW5kZXhPZignbm9kZV9tb2R1bGVzJykgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdGF0ID0gZnMuc3RhdFN5bmMoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXQgJiYgc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh3YWxrKGZpbGUsIGV4Y2x1ZGUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoLyhzcGVjfFxcLmQpXFwudHMvLnRlc3QoZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0lnbm9yaW5nJywgZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhdGguZXh0bmFtZShmaWxlKSA9PT0gJy50cycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdJbmNsdWRpbmcnLCBmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChwcm9ncmFtLnRzY29uZmlnICYmIHByb2dyYW0uYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEudHNjb25maWcgPSBwcm9ncmFtLnRzY29uZmlnO1xuICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwcm9ncmFtLnRzY29uZmlnKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYFwiJHtwcm9ncmFtLnRzY29uZmlnfVwiIGZpbGUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBkaXJlY3RvcnlgKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBfZmlsZSA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBwYXRoLmRpcm5hbWUodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnRzY29uZmlnKSksXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmJhc2VuYW1lKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS50c2NvbmZpZylcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXNlIHRoZSBjdXJyZW50IGRpcmVjdG9yeSBvZiB0c2NvbmZpZy5qc29uIGFzIGEgd29ya2luZyBkaXJlY3RvcnlcbiAgICAgICAgICAgICAgICAgICAgY3dkID0gX2ZpbGUuc3BsaXQocGF0aC5zZXApLnNsaWNlKDAsIC0xKS5qb2luKHBhdGguc2VwKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1VzaW5nIHRzY29uZmlnJywgX2ZpbGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCB0c0NvbmZpZ0ZpbGUgPSByZWFkQ29uZmlnKF9maWxlKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMgPSB0c0NvbmZpZ0ZpbGUuZmlsZXM7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMgPSBoYW5kbGVQYXRoKGZpbGVzLCBjd2QpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaWxlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGV4Y2x1ZGUgPSB0c0NvbmZpZ0ZpbGUuZXhjbHVkZSB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzID0gd2Fsayhjd2QgfHwgJy4nLCBleGNsdWRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLnNldEZpbGVzKGZpbGVzKTtcbiAgICAgICAgICAgICAgICAgICAgc3VwZXIuZ2VuZXJhdGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ICBlbHNlIGlmIChwcm9ncmFtLnRzY29uZmlnICYmIHByb2dyYW0uYXJncy5sZW5ndGggPiAwICYmIHByb2dyYW0uY292ZXJhZ2VUZXN0KSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1J1biBkb2N1bWVudGF0aW9uIGNvdmVyYWdlIHRlc3QnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24ubWFpbkRhdGEudHNjb25maWcgPSBwcm9ncmFtLnRzY29uZmlnO1xuICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwcm9ncmFtLnRzY29uZmlnKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYFwiJHtwcm9ncmFtLnRzY29uZmlnfVwiIGZpbGUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBkaXJlY3RvcnlgKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBfZmlsZSA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgcGF0aC5kaXJuYW1lKHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS50c2NvbmZpZykpLFxuICAgICAgICAgICAgICAgICAgICAgIHBhdGguYmFzZW5hbWUodGhpcy5jb25maWd1cmF0aW9uLm1haW5EYXRhLnRzY29uZmlnKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAvLyB1c2UgdGhlIGN1cnJlbnQgZGlyZWN0b3J5IG9mIHRzY29uZmlnLmpzb24gYXMgYSB3b3JraW5nIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgICAgICBjd2QgPSBfZmlsZS5zcGxpdChwYXRoLnNlcCkuc2xpY2UoMCwgLTEpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnVXNpbmcgdHNjb25maWcnLCBfZmlsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHRzQ29uZmlnRmlsZSA9IHJlYWRDb25maWcoX2ZpbGUpO1xuICAgICAgICAgICAgICAgICAgICBmaWxlcyA9IHRzQ29uZmlnRmlsZS5maWxlcztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlcyA9IGhhbmRsZVBhdGgoZmlsZXMsIGN3ZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZXhjbHVkZSA9IHRzQ29uZmlnRmlsZS5leGNsdWRlIHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlcyA9IHdhbGsoY3dkIHx8ICcuJywgZXhjbHVkZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzdXBlci5zZXRGaWxlcyhmaWxlcyk7XG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLnRlc3RDb3ZlcmFnZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvZ3JhbS50c2NvbmZpZyAmJiBwcm9ncmFtLmFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5tYWluRGF0YS50c2NvbmZpZyA9IHByb2dyYW0udHNjb25maWc7XG4gICAgICAgICAgICAgICAgbGV0IHNvdXJjZUZvbGRlciA9IHByb2dyYW0uYXJnc1swXTtcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoc291cmNlRm9sZGVyKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYFByb3ZpZGVkIHNvdXJjZSBmb2xkZXIgJHtzb3VyY2VGb2xkZXJ9IHdhcyBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5YCk7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnVXNpbmcgcHJvdmlkZWQgc291cmNlIGZvbGRlcicpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzID0gd2FsayhwYXRoLnJlc29sdmUoc291cmNlRm9sZGVyKSwgW10pO1xuXG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLnNldEZpbGVzKGZpbGVzKTtcbiAgICAgICAgICAgICAgICAgICAgc3VwZXIuZ2VuZXJhdGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcigndHNjb25maWcuanNvbiBmaWxlIHdhcyBub3QgZm91bmQsIHBsZWFzZSB1c2UgLXAgZmxhZycpO1xuICAgICAgICAgICAgICAgIG91dHB1dEhlbHAoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiJdLCJuYW1lcyI6WyJwa2ciLCJfLmZvckVhY2giLCJfLnNvcnRCeSIsIl8uY2xvbmVEZWVwIiwiXy5maW5kSW5kZXgiLCJfLmNvbmNhdCIsIl8uZmluZCIsIl8uZ3JvdXBCeSIsIkhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIiLCJIYW5kbGViYXJzLlV0aWxzIiwiSGFuZGxlYmFycy5TYWZlU3RyaW5nIiwicGF0aCIsInJlc29sdmUiLCJmcy5yZWFkRmlsZSIsInBhdGgucmVzb2x2ZSIsIkhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsIiwiSGFuZGxlYmFycy5jb21waWxlIiwiZnMub3V0cHV0RmlsZSIsInBhdGguc2VwIiwibWFya2VkIiwiZGlybmFtZSIsInBhdGguZGlybmFtZSIsInBhdGguYmFzZW5hbWUiLCJmcy5leGlzdHNTeW5jIiwicGF0aC5pc0Fic29sdXRlIiwicGF0aC5qb2luIiwiZnMucmVhZEZpbGVTeW5jIiwidHMuY3JlYXRlU291cmNlRmlsZSIsIl8udW5pcSIsInNlcCIsIl8udW5pcVdpdGgiLCJfLmlzRXF1YWwiLCJ0cy5TeW50YXhLaW5kIiwic3lzIiwicmVhZENvbmZpZ0ZpbGUiLCJmb3JtYXREaWFnbm9zdGljcyIsInRzLlNjcmlwdFRhcmdldCIsInRzLk1vZHVsZUtpbmQiLCJ0cy5jcmVhdGVQcm9ncmFtIiwicGF0aC5leHRuYW1lIiwicmVhZEZpbGVTeW5jIiwidHMuZm9yRWFjaENoaWxkIiwidHMuU3ltYm9sRmxhZ3MiLCJ0cy5kaXNwbGF5UGFydHNUb1N0cmluZyIsInRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uIiwidHMuZ2V0Q2xhc3NJbXBsZW1lbnRzSGVyaXRhZ2VDbGF1c2VFbGVtZW50cyIsInRzLmdldENsYXNzRXh0ZW5kc0hlcml0YWdlQ2xhdXNlRWxlbWVudCIsImZzLmNvcHkiLCJMaXZlU2VydmVyLnN0YXJ0IiwiZ2xvYiIsImN3ZCIsImZzLnJlYWRkaXJTeW5jIiwiZnMuc3RhdFN5bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBQ2hDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDckIsSUFBSUEsS0FBRyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBRXJDLElBQUssS0FLSjtBQUxELFdBQUssS0FBSztJQUNULGlDQUFJLENBQUE7SUFDSixtQ0FBSyxDQUFBO0lBQ0YsbUNBQUssQ0FBQTtJQUNMLGlDQUFJLENBQUE7Q0FDUCxFQUxJLEtBQUssS0FBTCxLQUFLLFFBS1Q7QUFFRDtJQU9DO1FBQ0MsSUFBSSxDQUFDLElBQUksR0FBR0EsS0FBRyxDQUFDLElBQUksQ0FBQztRQUNyQixJQUFJLENBQUMsT0FBTyxHQUFHQSxLQUFHLENBQUMsT0FBTyxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztLQUNuQjtJQUVELHFCQUFJLEdBQUo7UUFBSyxjQUFPO2FBQVAsVUFBTyxFQUFQLHFCQUFPLEVBQVAsSUFBTztZQUFQLHlCQUFPOztRQUNYLElBQUcsQ0FBQyxJQUFJLENBQUMsTUFB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
