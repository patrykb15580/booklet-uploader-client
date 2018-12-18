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

        self.upload = function(input, options = {}) {
            var def = $.Deferred();
            var file_info = input.files[0];
            var file = plugin.file.call(plugin, {
                name: file_info.name,
                size: file_info.size,
                type: file_info.type,
            });

            var upload = file.upload(file_info, options).done(function() {
                def.resolve(file);
            }).fail(function() {
                def.reject();
            }).progress(function(progress) {
                def.notify(progress);
            });

            def.abort = function(callback) {
                upload.onCancel(callback);
                upload.cancel();
            }

            return def;
        }

        return self;
    }

    self.registerModule = _modules.import;

    return self;
})(jQuery);
(function($) {
    var locale = {
        header: {
            uploader: 'Wybierz pliki do przesłania',
            editor: 'Edycja zdjęcia',
        },
        done: {
            default: 'Zakończ',
            upload: 'Wyślij',
            save: 'Zapisz',
            apply: 'Zatwierdź',
        },
        reject: 'Anuluj',
        crop_free: 'Dowolny',
        effects: {
            crop: 'Kadrowanie',
            rotate: 'Obrót',
            flip: 'Odbicie poziome',
            mirror: 'Odbicie pionowe',
            grayscale: 'Szarość',
            negative: 'Negatyw',
        },
        file_picker: {
            single: 'Wybierz plik',
            multiple: 'Wybierz pliki',
        },
        files_counter: {
            default: 'Przesłano %files_number% %file%',
            limited: 'Przesłano %files_number% z %max_files_number% %file%'
        },
        from: ' z %number%',
        file: {
            default: 'plik',
            multiple: 'pliki',
            pluralized: 'plików'
        },
        image: {
            default: 'zdjęcie',
            multiple: 'zdjęcia',
            pluralized: 'zdjęć'
        },
        images: 'zdjecia',
        max_file_size: 'Maksymalny rozmiar pliku wynosi %max_size%',
        errors: {
            load_file: 'Błąd ładowania pliku',
            invalid_file_type: 'Nieprawidłowy format pliku',
            file_too_large: 'Zbyt duży rozmiar pliku',
            file_too_small: 'Zbyt mały rozmiar pliku',
            upload: 'Błąd podczas wysyłania',
            upload_abort: 'Wysyłanie przerwane',
            not_editable: 'Tego pliku nie można edytować',
        },
    }

    var localeGet = function(key, variables = {}) {
        var texts = locale;
        var key_parts = key.split('.');

        var text = null;
        for (var i = 0; i < key_parts.length; i++) {
            var key = key_parts[i];

            texts = texts[key];
        }

        text = texts;

        for (var variable in variables) {
            text = text.replace('%' + variable + '%', variables[variable]);
        }

        return text;
    };

    var localePluralize = function(val, word) {
        if (word == 'zdjęcie') {
            if (val == 1) {
                return 'zdjęcie';
            } else if (val >= 2 && val <= 4) {
                return 'zdjęcia';
            } else if (val == 0 || (val > 4 && val < 20)) {
                return 'zdjęć';
            } else if (val >= 20) {
                var sub_val = val - (Math.floor(val / 10) * 10);

                if (sub_val < 2 || $sub_val > 4) {
                    return 'zdjęć';
                } else if ($sub_val >= 2 && $sub_val <= 4) {
                    return 'zdjęcia';
                }
            }
        } else if (word == 'zdjęć') {
            if (val == 1) {
                return 'zdjęcia';
            } else {
                return 'zdjęć';
            }
        } else if (word == 'plik') {
            if (val == 1) {
                return 'plik';
            } else if (val >= 2 && val <= 4) {
                return 'pliki';
            } else if (val == 0 || (val > 4 && val < 20)) {
                return 'plików';
            } else if (val >= 20) {
                var sub_val = val - (Math.floor(val / 10) * 10);

                if (sub_val < 2 || sub_val > 4) {
                    return 'plików';
                } else if (sub_val >= 2 && sub_val <= 4) {
                    return 'pliki';
                }
            }
        } else if (word == 'plików') {
            if (val == 1) {
                return 'pliku';
            } else {
                return 'plików';
            }
        }

        return word;
    }

    BookletUploader.registerModule('locale', {
        locale: locale,
        get: localeGet,
        pluralize: localePluralize
    });
})(jQuery);
(function($) {
    var template_html = {
        panel: '<div class="booklet-uploader bu--panel">\
            <div class="bu--panel-container">\
                <div class="bu--panel-header">{{header}}</div>\
                <div class="bu--panel-body"></div>\
                <div class="bu--panel-footer">\
                    <div class="bu--footer-nav">\
                        <div class="bu--footer-nav_left">\
                            <button class="bu--panel-close bu--button bu--button-outline">{{reject}}</button>\
                        </div>\
                        <div class="bu--footer-nav_center"></div>\
                        <div class="bu--footer-nav_right">\
                            <button class="bu--panel-done bu--button bu--button-primary">{{done}}</button>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>',

        uploader: '<input id="bu--files-picker" class="bu--files-picker" type="file" />\
        <div class="bu--uploader-header">\
            <label class="bu--button bu--button-primary bu--select-files" for="bu--files-picker">\
                {{files_picker}}\
            </label>\
            {{#max_size_info}}\
                <div class="bu--max-file-size-info">\
                    {{max_size_info}}\
                </div>\
            {{/max_size_info}}\
        </div>\
        <ul class="bu--uploads-list"></ul>\
        <div class="bu--files-counter">{{files_counter}}</div>',
        upload: '<li class="bu--upload upload-{{upload_id}}" data-id="{{upload_id}}">\
            <div class="bu--upload-preview"></div>\
            <div class="bu--upload-details">\
                <div class="bu--file-name">{{file_name}}</div>\
                <div class="bu--file-size">{{file_size}}</div>\
                <div class="bu--upload-progress">\
                    <div class="bu--progressbar">\
                        <div class="bu--progress"></div>\
                    </div>\
                    <div class="bu--upload-error"></div>\
                </div>\
            </div>\
            <ul class="bu--upload-actions">\
                <li class="bu--upload-action-button upload--cancel">\
                    <i class="fa fa-trash"></i>\
                </li>\
            </ul>\
        </li>',

        editor: '<div class="bu--editor-preview"></div>',
        effect_selector: '<div class="bu--effects"></div>',
        effect_button: '<div class="bu--effect-button bu--effect-{{effect}}" title="{{label}}">\
            <i class="bu--effect-icon bu--icon_{{effect}}"></i>\
        </div>',

        cropper: '<div class="bu--cropper-widget"></div>',
        crop_sizes: '<div class="bu--crop-sizes"></div>',
        crop_size_button: '<div class="bu--crop-size-button" data-label="{{label}}">\
            <i class="bu--crop-size-icon"></i>\
        </div>',

        panel_error: '<div class="bu--panel-error">{{message}}</div>',
        loader: '<div class="bu--loader"></div>',


    };

    var templateRender = function(elem_name, data) {
        return Mustache.render(template_html[elem_name], data);
    }

    var templateRenderElement = function(elem_name, data) {
        return $( templateRender(elem_name, data) );
    }

    BookletUploader.registerModule('template', {
        render: templateRender,
        renderElement: templateRenderElement
    });
})(jQuery);
(function($) {
    var isInt = function(variable){
        return Number(variable) === variable && variable % 1 === 0;
    };

    var isFloat = function(variable){
        return Number(variable) === variable && variable % 1 !== 0;
    };

    var isNumber = function(variable) {
        return typeof variable === 'number';
    };

    var isAspectRatioString = function(string) {
        return new RegExp(/\d\/\d/gi).test(string);
    };

    var inArray = function(needle, haystack, strict = false) {
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

    var clearKeysByValues = function(array, values) {
        if (!Array.isArray(array)) {
            return array;
        }

        for (var i = 0; i < array.length; i++) {
            var value = array[i];

            if (!inArray(value, values)) {
                array[i] = null;
            }
        }

        return array;
    };

    var removeKeysByValues = function(array, values) {
        if (!Array.isArray(array)) {
            return array;
        }

        if (!Array.isArray(values)) {
            values = [values];
        }

        var cleared_array = [];

        for (var i = 0; i < array.length; i++) {
            var value = array[i];

            if (!inArray(value, values)) {
                cleared_array.push(value);
            }
        }

        return cleared_array;
    };

    var greatestCommonDivisor = function(a, b) {
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

    var decimalPlaces = function(value) {
        if (isFloat(value) || Math.floor(value) !== value) {
            return value.toString().split(".")[1].length || 0;
        }

        return 0;
    };

    BookletUploader.registerModule('utils', {
        isInt: isInt,
        isFloat: isFloat,
        number: {
            greatestCommonDivisor: greatestCommonDivisor,
            isInt: isInt,
            isFloat: isFloat,
            isNumber: isNumber,
            decimalPlaces: decimalPlaces,
        },
        uid: function() {
            var hex_chr = '0123456789abcdef';
            var uid = '';
            for (var i = 0; i < 32; i++) {
                var a = Math.floor(Math.random() * (hex_chr.length - 1));

                 uid += hex_chr.charAt(a);
            }

            return uid;
        },
        sizeToSizeString: function(bytes) {
            var units = ['B','kB','MB','GB','TB','PB','EB','ZB','YB'];
            var size = bytes;
            var unit_index = 0;

            while (Math.abs(size) >= 1024 && unit_index < units.length) {
                size /= 1024;
                ++unit_index;
            }

            return Math.round(size * 10) / 10 + ' ' + units[unit_index];
        },
        array: {
            inArray: inArray,
            clearKeysByValues: clearKeysByValues,
            removeKeysByValues: removeKeysByValues,
            end: function(array) {
                if (Array.isArray(array) && array.length > 0) {
                    return array[array.length - 1];
                }

                return null;
            }
        },
        string: {
            setVariables: function(text, params = {}) {
                for (var param in params) {
                    text = text.replace('%' + param + '%', params[param]);
                }

                return text;
            },
        },
        aspect_ratio: {
            isAspectRatioString: isAspectRatioString,
            calculateAspectRatio: function(variable) {
                if (isAspectRatioString(variable)) {
                    return eval(variable);
                }

                if ((isInt(variable) || isFloat(variable)) && variable > 0) {
                    return variable;
                }

                return null;
            },
            toString: function(aspect_ratio) {
                if ((isInt(aspect_ratio) || isFloat(aspect_ratio)) && aspect_ratio > 0) {
                    var w = 100;
                    var h = 100;

                    if (aspect_ratio > 1) {
                        h = w / aspect_ratio;

                        if (isFloat(h)) {
                            w = w * Math.pow(10, decimalPlaces(h));
                            h = w / aspect_ratio;
                        }
                    } else {
                        w = h * aspect_ratio;

                        if (isFloat(w)) {
                            h = h * Math.pow(10, decimalPlaces(w));
                            w = h * aspect_ratio;
                        }

                    }

                    var gcd = greatestCommonDivisor(w, h);

                    w = Math.round(w / gcd);
                    h = Math.round(h / gcd);

                    return w + '/' + h;
                }

                return 'free';
            }
        },
        editor: {
            cropSizeIconDimensions: function(aspect_ratio) {
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
            },
        },
    });
})(jQuery);
(function($) {
    BookletUploader.registerModule('file', function(file_data = {}) {
        var plugin = this;

        var file = $.extend($.Deferred(), {
            hash: plugin.utils.uid(),
            name: null,
            size: null,
            type: null,
            url: null,
            original_url: null,
            is_stored: null,
        }, file_data);

        file.fileInfo = function() {
            if (file.hash) {
                return plugin.request('info', { 'hash_id': file.hash }).done(function(response) {
                    var file_data = response.data.file;

                    file.hash = file_data.hash;
                    file.name = file_data.name;
                    file.size = file_data.size;
                    file.type = file_data.type;
                    file.modifiers = file_data.modifiers;
                    file.url = file_data.url;
                    file.original_url = file_data.original_url;
                    file.preview = file_data.preview;

                    if (typeof file_data.image_info === 'object') {
                        file.image_info = file_data.image_info;
                    }
                });
            }

            return false;
        };

        file.isImage = function() {
            return plugin.isImage(file.type);
        };

        file.isEditable = function() {
            return plugin.isEditable(file.type);
        };

        file.upload = function(source_file, options = {}) {
            file.source = source_file;

            delete file.upload;

            return plugin.upload.call(plugin, file, options).start();
        };

        file.update = function(data) {
            return plugin.request('update', { hash_id: file.hash, file: data }).done(function(response) {
                var file_data = response.data.file;

                file.hash = file_data.hash || file.hash;
                file.name = file_data.name || file.name;
                file.size = file_data.size || file.size;
                file.type = file_data.type || file.type;
                file.modifiers = file_data.modifiers || file.modifiers;
                file.url = file_data.url || file.url;
                file.original_url = file_data.original_url || file.original_url;
                file.preview = file_data.preview || file.preview;

                if (typeof file_data.image_info === 'object') {
                    file.image_info = file_data.image_info;
                }
            });
        };

        return file;
    });
})(jQuery);
(function($) {
    BookletUploader.registerModule('upload', function(file, options = {}) {
        var plugin = this;
        var defaults = { autoCropTo: null };
        var options = $.extend(defaults, options);

        options.autoCropTo = plugin.utils.aspect_ratio.calculateAspectRatio(options.autoCropTo);

        var _data = new FormData();
        _data.append('action', 'upload');
        _data.append('file[hash_id]', file.hash);
        _data.append('file[name]', file.name);
        _data.append('file[size]', file.size);
        _data.append('file[type]', file.type);
        _data.append('file[source]', 'local');
        _data.append(0, file.source, file.name);

        if (options.autoCropTo) {
            _data.append('transformations[cropToProportions]', options.autoCropTo);
        }

        var _startCallback = null;
        var _cancelCallback = null;

        var upload = $.Deferred();

        upload.id = plugin.utils.uid();
        upload.file = file;
        upload.element = plugin.template.renderElement('upload', {
            upload_id: upload.id,
            file_name: file.name,
            file_size: plugin.utils.sizeToSizeString(file.size),
        });
        upload.start = function() {
            upload.element.find('.bu--progressbar').show();

            upload.request = plugin.request('upload', _data, {
                async: true,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();

                    xhr.upload.addEventListener('progress', function(e) {
                        var progress = (e.loaded * 100) / e.total;

                        upload.notify(progress);
                    });

                    return xhr;
                }
            }).done(function(response) {
                upload.resolve(response.data.file);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                upload.reject(jqXHR, textStatus, errorThrown);
            }).always(function() {
                delete upload.request;
            });

            if (typeof _startCallback == 'function') {
                _startCallback.call(upload);
            }

            delete upload.start;

            return upload;
        };
        upload.cancel = function() {
            upload.reject();

            if (upload.hasOwnProperty('request') && upload.request.readyState !== 4) {
                upload.request.abort();
            }

            if (typeof _cancelCallback == 'function') {
                _cancelCallback.call(upload);
            }

            return upload;
        };
        upload.onStart = function(callback) {
            if (typeof callback == 'function') {
                _startCallback = callback;
            }
        };
        upload.onCancel = function(callback) {
            if (typeof callback == 'function') {
                _cancelCallback = callback;
            }
        };

        upload.element.find('.bu--progressbar').hide();

        upload.done(function(file_info) {
            var preview = $('<img src="' + file_info.preview + '" alt="" />');

            upload.file.hash = file_info.hash;
            upload.file.name = file_info.name;
            upload.file.type = file_info.type;
            upload.file.size = file_info.size;
            upload.file.modifiers = file_info.modifiers;
            upload.file.preview = file_info.preview;
            upload.file.url = file_info.url;
            upload.file.original_url = file_info.original_url;
            upload.file.is_image = file_info.is_image;
            upload.file.image_info = file_info.image_info;
            upload.file.is_stored = true;

            upload.file.resolve(file_info);

            upload.element.addClass('uploaded')
                .find('.bu--upload-preview')
                .append('<div class="bu--loader sm"></div>')
                .append(preview);

            preview.on('load error', function() {
                upload.element.find('.bu--upload-preview .bu--loader').remove();
            });
        }).fail(function(xhr) {
            upload.file.reject();
        }).always(function() {
            upload.element.find('.bu--progressbar').hide();
        }).progress(function(progress) {
            upload.element.find('.bu--progress').css({ 'width': progress + '%' });
        });

        upload.element.on('click', '.bu--upload-action-button.upload--cancel', function() {
            upload.cancel().element.fadeOut(300, function() { $(this).remove(); });
        });

        return upload;
    });
})(jQuery);
(function($) {
    BookletUploader.registerModule('panel', function(data) {
        var plugin = this;
        var panel = $.Deferred();

        var html = plugin.template.render('panel', data);

        panel.id = plugin.utils.uid();
        panel.html = html;
        panel.element = $(html);
        panel.elements = {
            content: panel.element.find('.bu--panel-body'),
            addons_menu: panel.element.find('.bu--footer-nav_center'),
            done_button: panel.element.find('.bu--panel-done'),
            close_button: panel.element.find('.bu--panel-close'),
        };
        panel.append = function(element) {
            panel.element.find('.bu--panel-body').append(element);
            panel.html = panel.element[0].outerHTML;
        };
        panel.open = function() {
            panel.element.hide().appendTo('body').fadeIn(function() {
                $(window).resize(function() {
                    panel.element.css({ height: window.innerHeight });
                });

                panel.element.on('click', '.bu--panel-done', function() {
                    panel.resolve();
                });

                panel.element.on('click', '.bu--panel-close', function() {
                    panel.reject();
                });

                panel.done(function() {

                }).fail(function() {

                }).always(function() {
                    panel.close();
                });
            });
        };
        panel.close = function() {
            panel.element.fadeOut(function() {
                $(this).remove();
            });
        };
        panel.onError = null;
        panel.error = function(message, callback = null) {
            var error = plugin.template.render('panel_error', { message: message });

            panel.elements.content.html(error);
            panel.elements.addons_menu.empty();

            if (typeof panel.onError === 'function') {
                panel.onError.call(plugin);
            }

            if (typeof callback === 'function') {
                callback.call(plugin);
            }
        }

        panel.always(function() { panel.close(); });
        panel.element.attr({ id: 'bu--panel_' + panel.id });

        return panel;
    });
})(jQuery);
(function($) {
    BookletUploader.registerModule('editor', function(file_id, options = {}) {
        var plugin = this;
        var file = plugin.file.call(plugin, { hash: file_id });
        var panel = plugin.panel.call(plugin, {
            header: plugin.locale.get('header.editor'),
            done:   plugin.locale.get('done.save'),
            reject: plugin.locale.get('reject'),
        });

        var editor = $.Deferred();
        editor.close = function() { panel.reject(); }

        var image = {};
        image.image = new Image();
        image.image.alt = '';
        image.$ = $(image.image).addClass('bu--preview-image');
        image.refresh = function() {
            elements.preview.append(elements.loader);
            image.$.detach();

            image.image.onload = function() {
                elements.loader.detach();
                elements.preview.append(image.$);
            }

            image.image.onerror = function() {
                elements.loader.detach();
                panel.error(plugin.locale.get('errors.load_image'));
            }
        };
        image.setSrc = function(src) {
            image.refresh();
            image.image.src = src;
        };

        panel.append(plugin.template.render('editor'));

        editor.element = panel.element.addClass('bu--panel-editor');
        elements = $.extend(panel.elements, {
            preview: panel.element.find('.bu--editor-preview'),
            preview_image: image.$,
            effect_selector: plugin.template.renderElement('effect_selector'),
            loader: plugin.template.renderElement('loader').addClass('bu--loader-size-lg')
        });

        elements.preview.append(elements.loader);
        elements.addons_menu.append(elements.effect_selector);

        editor.always(function() {
            elements.done_button.removeClass('bu--panel-done bu--button-primary').addClass('bu--button-disabled');
        });

        var defaults = {
            crop: null,
            effects: ['crop', 'rotate', 'mirror', 'flip', 'grayscale']
        };

        var options = $.extend(defaults, options);

        if (!options.crop || !Array.isArray(options.crop)) {
            options.crop = [ options.crop ];
        }

        var crop_sizes = [];

        for (var i = 0; i < options.crop.length; i++) {
            var crop_size = options.crop[i];

            if (!plugin.utils.aspect_ratio.isAspectRatioString(crop_size)) {
                crop_size = plugin.locale.get('crop_free');
            }

            if (!plugin.utils.array.inArray(crop_size, crop_sizes)) {
                crop_sizes.push(crop_size);
            }
        }

        options.crop = crop_sizes;

        var default_aspect_ratio = plugin.utils.aspect_ratio.calculateAspectRatio(options.crop[0]);

        var modifiers = '';
        var transformations = $.extend($.Deferred(), {
            rotate: false,
            crop: false,
            mirror: false,
            flip: false,
            grayscale: false
        });

        panel.onError = function() { editor.reject(); }

        var _renderEffectButtons = function() {
            if (plugin.utils.array.inArray('rotate', options.effects)) {
                var button = plugin.template.renderElement('effect_button', {
                    effect: 'rotate',
                    label: plugin.locale.get('effects.rotate')
                }).appendTo(elements.effect_selector);

                button.on('click', function() {
                    var current_angle = transformations.rotate || 0;
                    var angle = Math.abs(current_angle) + 90;

                    if (angle >= 360) {
                        angle -= Math.floor(angle / 360) * 360;
                    }

                    transformations.rotate = angle || false;
                    transformations.crop = { aspect_ratio: default_aspect_ratio };

                    transformations.notify();
                });
            }

            if (plugin.utils.array.inArray('crop', options.effects)) {
                var button = plugin.template.renderElement('effect_button', {
                    effect: 'crop',
                    label: plugin.locale.get('effects.crop')
                }).appendTo(elements.effect_selector);

                button.on('click', function() {
                    var data = {
                        image: {
                            hash_id: file.hash,
                            filename: file.name,
                            size: file.size,
                            mime: file.type,
                            width: file.image_info.original_width,
                            height: file.image_info.original_height,
                        },
                        transformations: {
                            rotate: transformations.rotate,
                            mirror: transformations.mirror,
                            flip: transformations.flip,
                            grayscale: transformations.grayscale,
                        }
                    };

                    plugin.request('transform', data).done(function(response) {
                        var modifiers = response.data.modifiers;
                        var cropper = plugin.cropper.call(plugin, panel, {
                            image: file.original_url + modifiers,
                            crop: options.crop
                        });

                        cropper.done(function(crop_data) {
                            transformations.crop = {
                                width: crop_data.width,
                                height: crop_data.height,
                                x: crop_data.x,
                                y: crop_data.y,
                            };

                            transformations.notify();
                        }).fail(function() {

                        }).always(function() {
                            if (default_aspect_ratio && !transformations.crop) {
                                transformations.crop = { aspect_ratio: default_aspect_ratio };

                                transformations.notify();
                            }
                        });
                    }).fail(function() {
                        panel.error(plugin.locale.get('errors.load_file'));
                    });


                });
            }

            if (plugin.utils.array.inArray('flip', options.effects)) {
                var button = plugin.template.renderElement('effect_button', {
                    effect: 'flip',
                    label: plugin.locale.get('effects.flip')
                }).appendTo(elements.effect_selector);

                button.on('click', function() {
                    transformations.flip = !transformations.flip;

                    transformations.notify();
                });
            }

            if (plugin.utils.array.inArray('mirror', options.effects)) {
                var button = plugin.template.renderElement('effect_button', {
                    effect: 'mirror',
                    label: plugin.locale.get('effects.mirror')
                }).appendTo(elements.effect_selector);

                button.on('click', function() {
                    transformations.mirror = !transformations.mirror;

                    transformations.notify();
                });
            }

            if (plugin.utils.array.inArray('grayscale', options.effects)) {
                var button = plugin.template.renderElement('effect_button', {
                    effect: 'grayscale',
                    label: plugin.locale.get('effects.grayscale')
                }).appendTo(elements.effect_selector);

                button.on('click', function() {
                    transformations.grayscale = !transformations.grayscale;

                    transformations.notify();
                });
            }
        }

        _renderEffectButtons();

        file.fileInfo().done(function(response) {
            if (file.isEditable()) {
                image.setSrc(file.url);

                var modifiers = response.data.modifiers;

                if (modifiers.hasOwnProperty('crop')) {
                    var dim = modifiers.crop[0].split('x');
                    var pos = modifiers.crop[1].split(',');

                    transformations.crop = {
                        width: parseInt(dim[0]),
                        height: parseInt(dim[1]),
                        x: parseInt(pos[0]),
                        y: parseInt(pos[1])
                    };
                }

                if (!transformations.crop && default_aspect_ratio) {
                    transformations.crop = { aspect_ratio: default_aspect_ratio };
                }

                if (modifiers.hasOwnProperty('rotate')) {
                    transformations.rotate = parseInt(modifiers.rotate[0]);
                }

                if (modifiers.hasOwnProperty('mirror')) {
                    transformations.mirror = true;
                }

                if (modifiers.hasOwnProperty('flip')) {
                    transformations.flip = true;
                }

                if (modifiers.hasOwnProperty('grayscale')) {
                    transformations.grayscale = true;
                }

                modifiers = file.modifiers;
                transformations.notify();

                // Bind events
                (function() {
                    transformations.progress(function() {
                        var data = {
                            image: {
                                hash_id: file.hash,
                                filename: file.name,
                                size: file.size,
                                mime: file.type,
                                width: file.image_info.original_width,
                                height: file.image_info.original_height,
                            },
                            transformations: {
                                rotate: transformations.rotate,
                                crop: transformations.crop,
                                mirror: transformations.mirror,
                                flip: transformations.flip,
                                grayscale: transformations.grayscale,
                            }
                        };

                        plugin.request('transform', data).done(function(response) {
                            modifiers = response.data.modifiers;

                            image.setSrc(file.original_url + modifiers);
                        }).fail(function() {
                            panel.error(plugin.locale.get('errors.load_file'));
                        });
                    });

                    panel.done(function() {
                        file.update({ modifiers: modifiers }).done(function() {
                            editor.resolve(file);
                        }).fail(function() {
                            editor.reject();
                        });
                    }).fail(function () {
                        editor.reject();
                    });
                })();
            } else {
                panel.error(plugin.locale.get('errors.not_editable'));
            }
        }).fail(function() {
            panel.error(plugin.locale.get('errors.load_file'));
        });

        panel.open();

        return editor;
    });
})(jQuery);
(function($) {
    BookletUploader.registerModule('uploader', function(options) {
        var plugin = this;
        var self = {};
        var panel = plugin.panel.call(plugin, {
            header: plugin.locale.get('header.uploader'),
            done:   plugin.locale.get('done.upload'),
            reject: plugin.locale.get('reject'),
        });

        var done_button = panel.element.find('.bu--panel-done');

        var options = $.extend({
            multiple: false,
            max_files: null,
            drag_and_drop: false,
            images_only: false,
            max_size: null,
            crop: null,
        },  options);

        if (!options.multiple) {
            options.max_files = 1;
        }

        if (options.max_files && options.max_files <= 0) {
            options.max_files = null;
        }

        var uploaded_files = {};
        var active_uploads = {};
        var uploads = [];

        var _uploadedFilesNumber = function() {
            return Object.keys(uploaded_files).length;
        }

        var _activeUploadsNumber = function() {
            return Object.keys(active_uploads).length;
        }

        var _isMaxFilesNumberSelected = function() {
            var files_number_limit = options.max_files;
            var uploaded_files_number = _uploadedFilesNumber();
            var active_uploads_number = _activeUploadsNumber();

            var x = uploaded_files_number + active_uploads_number;

            if (files_number_limit && files_number_limit <= x) {
                return true;
            }

            return false;
        }

        var _isMaxFilesNumberUploaded = function() {
            var files_number_limit = options.max_files;

            if (files_number_limit && files_number_limit <= _uploadedFilesNumber()) {
                return true;
            }

            return false;
        }

        var _updateFilesCounter = function() {
            var files_counter = uploader.element.find('.bu--files-counter');
            var uploaded_files_number = _uploadedFilesNumber();

            var text = plugin.locale.get('files_counter.default', {
                files_number: uploaded_files_number,
                file: plugin.locale.pluralize(uploaded_files_number, plugin.locale.locale.file.default)
            });

            if (options.max_files) {
                text = plugin.locale.get('files_counter.limited', {
                    files_number: _uploadedFilesNumber(),
                    max_files_number: options.max_files,
                    file: plugin.locale.pluralize(options.max_files, plugin.locale.locale.file.pluralized)
                });
            };

            files_counter.html(text);

            if (_isMaxFilesNumberUploaded()) {
                files_counter.css({ color: '#53be31' });
            } else {
                files_counter.removeAttr('style');
            }
        };

        var _onFilesSelect = function(files) {
            done_button.removeClass('bu--panel-done bu--button-primary').addClass('bu--button-disabled');

            $.each(files, function(i, source_file) {
                if (_isMaxFilesNumberSelected()) {
                    return false; // break
                }

                var file = plugin.file.call(plugin, {
                    name: source_file.name,
                    size: source_file.size,
                    type: source_file.type,
                });

                if (options.images_only && !plugin.isImage(file.type)) {
                    return true; // continue
                }

                if (options.max_size && file.size > options.max_size) {
                    return true; // continue
                }

                var upload = file.upload(source_file, { autoCropTo: options.crop });

                uploader.element.find('.bu--uploads-list').append(upload.element);

                active_uploads[upload.id] = upload;
                uploads.push(upload);

                upload.done(function() {
                    uploaded_files[upload.file.hash] = file;
                }).always(function() {
                    delete active_uploads[upload.id];

                    _updateFilesCounter();
                }).onCancel(function() {
                    if (uploaded_files.hasOwnProperty(file.hash)) {
                        delete uploaded_files[file.hash];

                        _updateFilesCounter();
                    }
                });
            });

            $.when.apply($, uploads).always(function() {
                done_button.removeClass('bu--button-disabled').addClass('bu--panel-done bu--button-primary');
            });
        };

        var _templateData = function() {
            var data = {
                files_picker: plugin.locale.get((options.multiple) ? 'file_picker.multiple' : 'file_picker.single'),
                files_counter: plugin.locale.get('files_counter.default', {
                    files_number: _uploadedFilesNumber(),
                    file: plugin.locale.pluralize(_uploadedFilesNumber(), plugin.locale.locale.file.default)
                }),
            }

            if (options.max_size) {
                data.max_size_info = plugin.locale.get('max_file_size', {
                    max_size: plugin.utils.sizeToSizeString(options.max_size)
                });
            }

            if (options.max_files) {
                data.files_counter = plugin.locale.get('files_counter.limited', {
                    files_number: _uploadedFilesNumber(),
                    max_files_number: options.max_files,
                    file: plugin.locale.pluralize(options.max_files, plugin.locale.locale.file.pluralized)
                });
            };

            return data;
        }

        panel.elements.content.append(plugin.template.render('uploader', _templateData()));

        var uploader = $.Deferred();

        uploader.element = panel.element;
        uploader.element.find('.bu--files-picker').attr({
            multiple: options.multiple,
            accept: (options.images_only) ? plugin.imageMimeTypes.join(',') : '*',
        }).hide();

        uploader.element.addClass('bu--panel-uploader bu--panel-small');

        // Bind events
        (function() {
            uploader.element.on('click', '.bu--files-picker', function(e) {
                if (_isMaxFilesNumberSelected()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            uploader.element.on('change', '.bu--files-picker', function(e) {
                _onFilesSelect(this.files);
            });

            uploader.element.on('dragover dragleave drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
            });

            if (options.drag_and_drop) {
                uploader.element.on({
                    dragover: function(e) {
                        if (!_isMaxFilesNumberSelected()) {
                            uploader.element.addClass('bu--dragin');
                        }
                    },
                    dragleave: function(e) {
                        uploader.element.removeClass('bu--dragin');
                    },
                    drop: function(e) {
                        uploader.element.removeClass('bu--dragin');

                        if (!_isMaxFilesNumberSelected()) {
                            _onFilesSelect(e.originalEvent.dataTransfer.files);
                        }
                    }
                });
            }

            panel.done(function() {
                uploader.resolve(Object.values(uploaded_files));
            }).fail(function () {
                for (var upload_id in active_uploads) {
                    if (active_uploads.hasOwnProperty(upload_id)) {
                        active_uploads[upload_id].cancel();
                    }
                }

                uploader.reject();
            });
        })();

        panel.open();
        uploader.close = function() { return uploader; }

        return uploader;
    });
})(jQuery);
(function($) {
    BookletUploader.registerModule('cropper', function(panel, options) {
        var plugin = this;
        var self = $.Deferred();
        var image = $(new Image);
        var cropper = null;

        var defaults = {
            image: null,
            crop: null
        };
        var options = $.extend(defaults, options);

        if (!options.image) {
            throw 'Image url is undefined';
        }

        var widget = plugin.template.renderElement('cropper');
        var ratio_selector = plugin.template.renderElement('crop_sizes');

        $.each(options.crop, function(i, crop_size) {
            var aspect_ratio = plugin.utils.aspect_ratio.calculateAspectRatio(crop_size);
            var button = plugin.template.renderElement('crop_size_button', { label: crop_size });
            var icon = button.find('.bu--crop-size-icon').css(plugin.utils.editor.cropSizeIconDimensions(aspect_ratio));

            button.on('click', function() {
                ratio_selector.find('.bu--crop-size-button.active').removeClass('active');
                cropper.setAspectRatio(aspect_ratio);

                $(this).addClass('active');
            });

            ratio_selector.append(button);
        });

        ratio_selector.find('.bu--crop-size-button').first().addClass('active');

        panel.elements.content.append(widget);
        panel.elements.addons_menu.append(ratio_selector);
        widget.append(image);

        panel.elements.preview.detach();
        panel.elements.effect_selector.detach();
        panel.elements.done_button.removeClass('bu--panel-done').addClass('bu--cropper-done').html(plugin.locale.get('done.apply'));
        panel.elements.close_button.removeClass('bu--panel-close').addClass('bu--cropper-cancel');

        image[0].onload = function() {
            cropper = new Cropper(image[0], {
                aspectRatio: plugin.utils.aspect_ratio.calculateAspectRatio(options.crop[0]),
                autoCropArea: 1,
                dragMode: 'move',
                restore: false,
                viewMode: 1,
                movable: false,
                rotatable: false,
                scalable: false,
                zoomable: false,
                zoomOnTouch: false,
                zoomOnWheel: false,
                toggleDragModeOnDblclick: false,
                responsive: true,
                ready: function() {},
                crop: function(e) {}
            });

            // Bind events
            (function() {
                panel.element.on('click', '.bu--cropper-done', function() {
                    self.resolve(cropper.getData());
                });

                panel.element.on('click', '.bu--cropper-cancel', function() {
                    self.reject();
                });
            })();
        }

        image[0].onerror = function() {
            self.reject();
            panel.error(plugin.locale.get('errors.load_file'));
        }

        image[0].src = options.image;

        self.always(function() {
            panel.elements.content.append(panel.elements.preview);
            panel.elements.addons_menu.append(panel.elements.effect_selector);
            panel.elements.done_button.removeClass('bu--cropper-done').addClass('bu--panel-done').html(plugin.locale.get('done.save'));
            panel.elements.close_button.removeClass('bu--cropper-cancel').addClass('bu--panel-close');

            widget.remove();
            ratio_selector.remove();
        });

        return self;
    });
})(jQuery);
