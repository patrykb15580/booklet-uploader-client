var BookletUploader = (function($) {
    var plugin = {};
    var self = {};

    plugin.imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/tiff',
        'image/bmp',
    ];

    plugin.editableMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/tiff',
    ];

    plugin.utils = {};
    plugin.utils.isInt = function(value){
        return Number(value) === value && value % 1 === 0;
    };
    plugin.utils.isFloat = function(value){
        return Number(value) === value && value % 1 !== 0;
    };
    plugin.utils.isNumber = function(value) {
        return plugin.utils.isInt(value) || plugin.utils.isFloat(value);
    };
    plugin.utils.uid = function() {
        var hex_chr = '0123456789abcdef';
        var uid = '';
        for (var i = 0; i < 32; i++) {
            var a = Math.floor(Math.random() * (hex_chr.length - 1));

             uid += hex_chr.charAt(a);
        }

        return uid;
    };
    plugin.utils.sizeToSizeString = function(bytes) {
        var units = ['B','kB','MB','GB','TB','PB','EB','ZB','YB'];
        var size = bytes;
        var unit_index = 0;

        while (Math.abs(size) >= 1024 && unit_index < units.length) {
            size /= 1024;
            ++unit_index;
        }

        return Math.round(size * 10) / 10 + ' ' + units[unit_index];
    };

    plugin.utils.array = {};
    plugin.utils.array.end = function(array) {
        if (Array.isArray(array) && array.length > 0) {
            return array[array.length - 1];
        }

        return null;
    };
    plugin.utils.array.inArray = function(needle, haystack, strict = false) {
        if (!Array.isArray(haystack)) {
            console.error('Haystack must be Array');

            return false;
        }

        for (var i = 0; i < haystack.length; i++) {
            if (strict && needle === haystack[i]) {
                return true;
            } else if (!strict && needle == haystack[i]) {
                return true;
            }
        }

        return false;
    };
    plugin.utils.array.clearKeysByValues = function(array, values) {
        if (!Array.isArray(array)) {
            return array;
        }

        for (var i = 0; i < array.length; i++) {
            var value = array[i];

            if (!plugin.utils.array.inArray(value, values)) {
                array[i] = null;
            }
        }

        return array;
    };
    plugin.utils.array.removeKeysByValues = function(array, values) {
        if (!Array.isArray(array)) {
            return array;
        }

        if (!Array.isArray(values)) {
            values = [values];
        }

        var cleared_array = [];

        for (var i = 0; i < array.length; i++) {
            var value = array[i];

            if (!plugin.utils.array.inArray(value, values)) {
                cleared_array.push(value);
            }
        }

        return cleared_array;
    };

    plugin.utils.string = {};

    plugin.utils.number = {};
    plugin.utils.number.greatestCommonDivisor = function(a, b) {
        var large = a > b ? a: b;
        var small = a > b ? b: a;
        var remainder = large % small;

        while (remainder !== 0) {
            large = small > remainder ? small: remainder;
            small = small > remainder ? remainder: small;
            remainder = large % small;
        }

        return small;
    };
    plugin.utils.number.decimalPlaces = function(value) {
        if (plugin.utils.isFloat(value)) {
            return value.toString().split(".")[1].length || 0;
        }

        return 0;
    };

    plugin.utils.aspect_ratio = {};
    plugin.utils.aspect_ratio.isAspectRatioString = function(string) {
        return new RegExp(/\d\/\d/gi).test(string);
    };
    plugin.utils.aspect_ratio.calculateAspectRatio = function(value) {
        if (plugin.utils.aspect_ratio.isAspectRatioString(value)) {
            return eval(value);
        }

        if ((plugin.utils.isInt(value) || plugin.utils.isFloat(value)) && value > 0) {
            return value;
        }

        return null;
    };
    plugin.utils.aspect_ratio.toString = function(aspect_ratio) {
        if ((plugin.utils.isInt(aspect_ratio) || plugin.utils.isFloat(aspect_ratio)) && aspect_ratio > 0) {
            var w = 100;
            var h = 100;

            if (aspect_ratio > 1) {
                h = w / aspect_ratio;

                if (plugin.utils.isFloat(h)) {
                    w = w * Math.pow(10, plugin.utils.number.decimalPlaces(h));
                    h = w / aspect_ratio;
                }
            } else {
                w = h * aspect_ratio;

                if (plugin.utils.isFloat(w)) {
                    h = h * Math.pow(10, plugin.utils.number.decimalPlaces(w));
                    w = h * aspect_ratio;
                }

            }

            var gcd = plugin.utils.number.greatestCommonDivisor(w, h);

            w = Math.round(w / gcd);
            h = Math.round(h / gcd);

            return w + '/' + h;
        }

        return plugin.locale.get('crop_free');
    };

    plugin.utils.editor = {};
    plugin.utils.editor.cropSizeIconDimensions = function(aspect_ratio) {
        var width = 24;
        var height = 24;

        if (aspect_ratio) {
            if (aspect_ratio > 1) {
                height = parseInt(width / aspect_ratio);
            } else {
                width = parseInt(height * aspect_ratio);
            }
        }

        return { width: width + 'px', height: height + 'px' };
    };

    plugin.isImage = function(mime_type) {
        return plugin.utils.array.inArray(mime_type, plugin.imageMimeTypes);
    };

    plugin.isEditable = function(mime_type) {
        return plugin.utils.array.inArray(mime_type, plugin.editableMimeTypes);
    };

    plugin.request = function(action, data = {}, options = {}) {
        var defaults = {
            dataType: 'json',
            cache: false,
            contentType: false,
            processData: false,
        }

        data.action = action;

        if (action !== 'upload') {
            data = JSON.stringify(data);
        }

        var options = $.extend(defaults, options, {
            url: plugin.api,
            type: 'POST',
            data: data,
            dataType:'json',
        });

        return $.ajax(options);
    };

    plugin.loadFile = function(file_hash) {
        var loader = $.Deferred();

        plugin.request('info', { file_hash: file_hash }).done(function(response) {
            var file = plugin.file.call(plugin, {});

            loader.resolve(file);
        }).fail(function(xhr) {
            loader.reject(xhr);
        });

        return loader;
    };

    var _modules = $.Deferred();

    _modules.required = [
        'locale', 'template', 'file', 'upload', 'panel', 'editor', 'uploader', 'cropper'
    ];
    _modules.loaded = {};
    _modules.allLoaded = function() {
        for (var i = 0; i < _modules.required.length; i++) {
            var module_name = _modules.required[i];

            if (!_modules.loaded.hasOwnProperty(module_name)) {
                return false;
            }
        }

        return true;
    };
    _modules.import = function(name, module) {
        for (var i = 0; i < _modules.required.length; i++) {
            if (name == _modules.required[i] && !_modules.loaded.hasOwnProperty(name)) {
                _modules.loaded[name] = module;
                _modules.notify();

                return true;
            }
        }

        return false;
    };


    _modules.done(function() {
        delete self.registerModule;

        for (var module_name in _modules.loaded) {
            plugin[module_name] = _modules.loaded[module_name];
        }
    }).progress(function() {
        if (_modules.allLoaded()) {
            _modules.resolve();
        }
    });

    self.init = function(api) {
        plugin.api = api;

        delete self.init;

        self.openUploader = function(options = {}) {
            return plugin.uploader.call(plugin, options);
        };

        self.openEditor = function(file_hash, options = {}) {
            return plugin.editor.call(plugin, file_hash, options);
        };

        return self;
    }

    self.registerModule = _modules.import;

    return self;
})(jQuery);
