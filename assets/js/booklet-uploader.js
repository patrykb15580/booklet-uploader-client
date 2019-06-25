var BookletUploader = (function($) {
    var plugin = {};
    var self = {};

    var locale = {
        'header.uploader': 'Wybierz pliki do przesłania',
        'header.editor': 'Edycja zdjęcia',
        'effect.crop': 'Kadrowanie',
        'effect.rotate': 'Obrót',
        'crop.free': 'Dowolny',
        'done': 'Zakończ',
        'done.upload': 'Wyślij',
        'done.save': 'Zapisz',
        'done.apply': 'Zatwierdź',
        'reject': 'Anuluj',
        'picker.single': 'Wybierz plik',
        'picker.multiple': 'Wybierz pliki',
        'picker.max_files_number': 'Maksymalna ilość plików wynosi %files_number%',
        'picker.max_file_size': 'Maksymalny rozmiar pliku wynosi %max_size%',
        'counter': 'Przesłano %files_number% %file%',
        'counter.limited': 'Przesłano %files_number% z %max_files_number% %file%',
        'file': 'plik',
        'image': 'zdjęcie',
        'from': ' z %number%',
        'error': 'Błąd',
        'error.load_file': 'Błąd ładowania pliku',
        'error.is_not_image': 'Wybrany plik nie jest obrazem',
        'error.invalid_file_type': 'Nieprawidłowy format pliku',
        'error.file_too_large': 'Zbyt duży rozmiar pliku',
        'error.file_too_small': 'Zbyt mały rozmiar pliku',
        'error.upload': 'Błąd podczas wysyłania',
        'error.upload_aborted': 'Wysyłanie przerwane',
        'error.file_not_editable': 'Tego pliku nie można edytować',
    }

    var _locale = function(key, variables = {}) {
        if (locale.hasOwnProperty(key)) {
            var text = locale[key];

            for (var variable in variables) {
                text = text.replace('%' + variable + '%', variables[variable]);
            }

            return text;
        }

        return null;
    }

    var _elements = {
        panel: '<div class="booklet-uploader bu--panel">\
            <div class="bu--panel-container">\
                <div class="bu--panel-header">{{header}}</div>\
                <div class="bu--panel-body"></div>\
                <div class="bu--panel-footer">\
                    <div class="bu--footer-nav">\
                        <div class="bu--footer-nav_left"><button class="bu--panel-close bu--button bu--button-outline">{{reject}}</button></div>\
                        <div class="bu--footer-nav_center"></div>\
                        <div class="bu--footer-nav_right"><button class="bu--panel-done bu--button bu--button-primary">{{done}}</button></div>\
                    </div>\
                </div>\
            </div>\
        </div>',
        panel_menu: '<ul class="bu-panel__menu"></ul>',
        panel_menu_item: '<li class="bu-panel__menu__item">{{content}}</li>',
        uploader: '<input id="bu--files-picker" class="bu--files-picker" type="file" />\
        <div class="bu--uploader-header">\
            <label class="bu--button bu--button-primary bu--select-files" for="bu--files-picker">{{files_picker}}</label>\
            {{#max_size_info}}<div class="bu--max-file-size-info">{{max_size_info}}</div>{{/max_size_info}}\
        </div>\
        <ul class="bu--uploads-list"></ul>\
        <div class="bu--files-counter">{{files_counter}}</div>',
        upload: '<li class="bu--upload upload-{{upload_id}}" data-id="{{upload_id}}">\
            <div class="bu--upload-preview"></div>\
            <div class="bu--upload-details">\
                <div class="bu--file-name">{{file_name}}</div>\
                <div class="bu--file-size">{{file_size}}</div>\
                <div class="bu--upload-progress">\
                    <div class="bu--progressbar"><div class="bu--progress"></div></div>\
                    <div class="bu--upload-error"></div>\
                </div>\
            </div>\
            <ul class="bu--upload-actions">\
                <li class="bu--upload-action-button upload--cancel"><i class="fa fa-trash"></i></li>\
            </ul>\
        </li>',
        editor: '<div class="bu--editor-preview"></div>',
        effect_selector: '<div class="bu--effects"></div>',
        effect_button: '<div class="bu--effect-button bu--effect-{{effect}}" title="{{label}}"><i class="bu--effect-icon bu--icon_{{effect}}"></i></div>',
        cropper: '<div class="bu--cropper-widget"></div>',
        crop_sizes: '<div class="bu--crop-sizes"></div>',
        crop_size_button: '<div class="bu--crop-size-button" data-label="{{label}}"><i class="bu--crop-size-icon"></i></div>',
        panel_error: '<div class="bu--panel-error">{{message}}</div>',
        loader: '<div class="bu--loader"></div>',
    };

    var _renderElement = function(elem_name, data = {}) {
        return Mustache.render(_elements[elem_name], data);
    }

    var $_renderElement = function(elem_name, data = {}) {
        return $(Mustache.render(_elements[elem_name], data));
    }

    var _image_mime_types = [ 'image/jpeg', 'image/png' ];

    var _isInt = function(value) { return Number(value) === value && value % 1 === 0; };
    var _isFloat = function(value) { return Number(value) === value && value % 1 !== 0; };
    var _isNumber = function(value) { return _isInt(value) || _isFloat(value); };
    var _sizeToSizeString = function(bytes) {
        var units = ['B','kB','MB','GB','TB','PB','EB','ZB','YB'];
        var size = bytes;
        var unit_index = 0;

        while (Math.abs(size) >= 1024 && unit_index < units.length) {
            size /= 1024;
            ++unit_index;
        }

        return Math.round(size * 10) / 10 + ' ' + units[unit_index];
    };

    var _inArray = function(needle, haystack, strict = false) {
        if (Array.isArray(haystack)) {
            for (var i = 0; i < haystack.length; i++) {
                if (strict && needle === haystack[i]) {
                    return true;
                } else if (!strict && needle == haystack[i]) {
                    return true;
                }
            }

            return false;
        }

        console.error('Haystack must be Array');

        return false;
    };

    var _arrayEnd = function(array) {
        if (Array.isArray(array) && array.length > 0) {
            return array[array.length - 1];
        }

        return false;
    }

    var _clearArrayKeysByValues = function(array, values, remove_cleared_keys = false) {
        if (!Array.isArray(array)) {
            return array;
        }

        if (!Array.isArray(values)) {
            values = [values];
        }

        var cleared_array = [];

        for (var i = 0; i < array.length; i++) {
            var value = array[i];

            if (!_inArray(value, values)) {
                cleared_array.push(value);
            } else if (!remove_cleared_keys) {
                cleared_array.push(null);
            }
        }

        return cleared_array;
    };

    var _isAspectRatioString = function(variable) {
        let reg = new RegExp(/^\d+\/\d+$/);

        return (typeof variable == 'string' && reg.test(variable));
    }

    var _aspectRatioStringToProportions = function(string) {
        if (_isAspectRatioString(string)) {
            let v = string.split('/');

            return v[0] / v[1];
        }

        return false;
    }

    var _uid = function() {
        var hex_chr = '0123456789abcdef';
        var uid = '';
        for (var i = 0; i < 32; i++) {
            var a = Math.floor(Math.random() * (hex_chr.length - 1));

            uid += hex_chr.charAt(a);
        }

        return uid;
    };

    var _pluralize = function(word, number) {
        var definitions = [
            ['zdjęcie', 'zdjęcia', 'zdjęć', 'zdjęcia'],
            ['plik', 'pliki', 'plików', 'pliku'],
        ];

        var rules_to_words_definition_index = { 'one': 0, 'few': 1, 'many': 2, 'other': 3 };
        var rule = 'other';

        if (number === 1) {
            return 'one';
        }

        var integer = Number.isInteger(number);
        var mod10 = number % 10;
        var mod100 = number % 100;

        if (integer && ((mod10 >= 2 && mod10 <= 4) && (mod100 < 12 || mod100 > 14))) {
            return 'few';
        }

        if (integer && ((mod10 === 0 || mod10 === 1) || (mod10 >= 5 && mod10 <= 9 || mod100 >= 12 && mod100 <= 14))) {
            return 'many';
        }

        for (var i = 0; i < definitions.length; i++) {
            if (_inArray(word, definitions[i])) {
                return definitions[i][rules_to_words_definition_index[rule]];
            }
        }

        return word;
    };

    var _Request = function(action, data = {}, options = {}) {
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

    var _Upload = function(file, options) {
        var upload = $.Deferred();
        var _data = new FormData();
        var options = $.extend({}, options);

        _data.append('action', 'upload');
        _data.append('file[hash_id]', file.attributes.hash_id);
        _data.append('file[name]', file.attributes.name);
        _data.append('file[size]', file.attributes.size);
        _data.append('file[type]', file.attributes.type);
        _data.append('file[source]', 'local');
        _data.append(0, file.source, file.attributes.name);

        $.each(options, function(key, value) {
            if (Array.isArray(value)) {
                value = value.join(',');
            }

            _data.append('options[' + key + ']', value);
        });

        upload.id = _uid();
        upload.file = file;
        upload.start = function(callback = null) {
            upload.request = _Request('upload', _data, {
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
                let file_info = response.data.file;

                upload.file.attributes.hash_id      = file_info.hash;
                upload.file.attributes.name         = file_info.name;
                upload.file.attributes.type         = file_info.type;
                upload.file.attributes.size         = file_info.size;
                upload.file.attributes.url          = file_info.url;
                upload.file.attributes.original_url = file_info.original_url;
                upload.file.attributes.is_stored    = true;
                upload.file.attributes.modifiers    = file_info.modifiers;
                upload.file.attributes.preview      = file_info.preview;

                // upload.file.is_image = file_info.is_image;

                if (typeof file_info.image_info === 'object') {
                    upload.file.image_info = file_info.image_info;
                }

                upload.resolve(upload.file);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                upload.reject(jqXHR, textStatus, errorThrown);
            }).always(function() {
                delete upload.request;
            });

            if (typeof callback == 'function') {
                callback.call(upload);
            }

            delete upload.start;

            return upload;
        }
        upload.stop = function(callback = null) {
            if (upload.hasOwnProperty('request') && upload.request.readyState !== 4) {
                upload.request.abort();
            }

            upload.reject();

            if (typeof callback == 'function') {
                callback.call(upload);
            }

            return upload;
        }

        return upload;
    };

    var _File = function(attributes = {}) {
        var _file = {}

        _file.attributes = $.extend({
            id: null,
            hash_id: _uid(),
            name: null,
            size: null,
            type: null,
            is_stored: null,
            original_url: null,
            url: null,
            modifiers: null,
            preview: null,
        }, attributes);

        _file.source = null;

        _file.find = function(hash_id) {
            return _Request('info', { 'hash_id': hash_id }).done(function(response) {
                var data = response.data;

                _file.attributes.hash_id      = data.file.hash;
                _file.attributes.name         = data.file.name;
                _file.attributes.size         = data.file.size;
                _file.attributes.type         = data.file.type;
                _file.attributes.modifiers    = data.file.modifiers;
                _file.attributes.url          = data.file.url;
                _file.attributes.original_url = data.file.original_url;
                _file.attributes.preview      = data.file.preview;

                if (typeof data.file.image_info === 'object') {
                    _file.image_info = data.file.image_info;
                }

                if (typeof data.modifiers === 'object') {
                    _file.modifiers = data.modifiers;
                }
            });
        };

        _file.update = function(data) {
            return _Request('update', { hash_id: _file.attributes.hash_id, file: data }).done(function(response) {
                var data = response.data;

                _file.attributes.hash_id      = data.file.hash || _file.attributes.hash;
                _file.attributes.name         = data.file.name || _file.attributes.name;
                _file.attributes.size         = data.file.size || _file.attributes.size;
                _file.attributes.type         = data.file.type || _file.attributes.type;
                _file.attributes.modifiers    = data.file.modifiers || _file.attributes.modifiers;
                _file.attributes.url          = data.file.url || _file.attributes.url;
                _file.attributes.original_url = data.file.original_url || _file.attributes.original_url;
                _file.attributes.preview      = data.file.preview || _file.attributes.preview;

                if (typeof data.file.image_info === 'object') {
                    _file.image_info = data.file.image_info;
                }

                if (typeof data.modifiers === 'object') {
                    _file.modifiers = data.modifiers;
                }
            });
        };

        _file.isImage = function() {
            return _inArray(_file.attributes.type, _image_mime_types);
        };

        return _file;
    };

    plugin.init = function(api) {
        plugin.api = api;

        delete plugin.init;

        plugin.upload = function(input, options = {}) {
            var file_info = input.files[0];
            var file = new _File({
                name: file_info.name,
                size: file_info.size,
                type: file_info.type,
            });

            file.source = file_info;

            var upload = new _Upload(file, options);
            upload.start();

            return upload;
        }

        plugin.openUploader = function(options = {}) {
            var uploader = $.Deferred();
            var defaults = {
                multiple: false,
                max_files: false,
                drag_and_drop: false,
                images_only: false,
                max_size: false,
                crop: false,
            };

            var options = $.extend(defaults, options);

            if (!options.multiple) {
                options.max_files = 1;
            }

            if (options.max_files && options.max_files <= 0) {
                options.max_files = null;
            }

            var _files_counter = $.Deferred();
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

            var _onFilesSelect = function(files) {
                done_button.removeClass('bu--panel-done bu--button-primary').addClass('bu--button-disabled');

                $.each(files, function(i, source_file) {
                    if (_isMaxFilesNumberSelected()) {
                        return false; // break
                    }

                    var file = new _File({
                        name: source_file.name,
                        size: source_file.size,
                        type: source_file.type,
                    });

                    file.source = source_file;

                    if (options.images_only && !file.isImage()) {
                        return true; // continue
                    }

                    if (options.max_size && file.attributes.size > options.max_size) {
                        return true; // continue
                    }

                    let upload_options = {};

                    if (options.crop && (options.crop !== null || options.crop !== false)) {
                        upload_options.crop = options.crop;
                    }

                    var upload = new _Upload(file, upload_options);
                    var $upload = $(_renderElement('upload', {
                        upload_id: upload.id,
                        file_name: file.attributes.name,
                        file_size: _sizeToSizeString(file.attributes.size),
                    }));

                    upload.element = $upload;

                    $upload.find('.bu--progressbar').hide();

                    upload.start(function() {
                        _panel.find('.bu--uploads-list').append($upload);

                        $upload.find('.bu--progressbar').show();

                        active_uploads[this.id] = this;
                        uploads.push(this);
                    });

                    upload.done(function(file) {
                        delete file.source;
                        delete file.update;
                        delete file.find;

                        var preview = '<img src="' + file.attributes.preview + '" alt="" />';
                        var $preview_wrapper = $upload.find('.bu--upload-preview');

                        uploaded_files[file.attributes.hash_id] = file;

                        $upload.addClass('uploaded');
                        $preview_wrapper.append('<div class="bu--loader sm"></div>');
                        $preview_wrapper.append(preview);

                        $(preview).on('load error', function() {
                            $upload.find('.bu--upload-preview .bu--loader').remove();
                        });
                    }).fail(function() {
                        // code...
                    }).always(function() {
                        $upload.find('.bu--progressbar').hide();
                    }).always(function() {
                        delete active_uploads[upload.id];

                        _files_counter.notify();
                    }).progress(function(progress) {
                        $upload.find('.bu--progress').css({ 'width': progress + '%' });
                    });

                    $upload.on('click', '.bu--upload-action-button.upload--cancel', function() {
                        upload.stop(function() {
                            let f = this.file;

                            if (uploaded_files.hasOwnProperty(f.attributes.hash_id)) {
                                delete uploaded_files[f.attributes.hash_id];

                                _files_counter.notify();
                            }
                        });

                        $upload.fadeOut(300, function() { $(this).remove(); });
                    });
                });

                $.when.apply($, uploads).always(function() {
                    done_button.removeClass('bu--button-disabled').addClass('bu--panel-done bu--button-primary');
                });
            };


            /*
             *  Build panel
             */

            var _panel_id = _uid();
            var _panel = $(_renderElement('panel', {
                header: _locale('header.uploader'),
                done: _locale('done.upload'),
                reject: _locale('reject'),
            }));

            var done_button = _panel.find('.bu--panel-done');

            var _d = {
                files_picker: _locale('picker.single'),
                files_counter: _locale('counter', { files_number: _uploadedFilesNumber(), file: _pluralize('plik', _uploadedFilesNumber()) }),
            };

            if (options.multiple) {
                _d.files_picker = _locale('picker.multiple');
            }

            if (options.max_size) {
                _d.max_size_info = _locale('picker.max_file_size', { max_size: _sizeToSizeString(options.max_size) });
            }

            if (options.max_files) {
                _d.files_counter = _locale('counter.limited', { files_number: _uploadedFilesNumber(), max_files_number: options.max_files, file: _pluralize('plik', options.max_files) });
            }

            _panel.find('.bu--panel-body').append(_renderElement('uploader', _d));
            _panel.addClass('bu--panel-uploader bu--panel-small');
            _panel.attr({ id: 'bu--panel_' + _panel_id });
            _panel.hide();

            _panel.find('.bu--files-picker').attr({
                accept: (options.images_only) ? _image_mime_types.join(',') : '*',
                multiple: options.multiple,
            }).hide();


            /*
             *  Bind events
             */

            $(window).resize(function() { _panel.css({ height: window.innerHeight }); });

            _files_counter.progress(function() {
                var $counter = _panel.find('.bu--files-counter');
                var uploaded_files_number = _uploadedFilesNumber();

                var text = _locale('counter', {
                    files_number: uploaded_files_number,
                    file: _pluralize('plik', uploaded_files_number)
                });

                if (options.max_files) {
                    text = _locale('counter.limited', {
                        files_number: _uploadedFilesNumber(),
                        max_files_number: options.max_files,
                        file: _pluralize('plik', options.max_files)
                    });
                };

                $counter.html(text);

                if (_isMaxFilesNumberUploaded()) {
                    $counter.css('color', '#53be31');
                } else {
                    $counter.removeAttr('style');
                }
            });

            _panel.on('click', '.bu--panel-done', function() {
                // Prevent close uploader before all uploads are done
                if (Object.keys(active_uploads).length) {
                    // Highlight uploads in progress
                    $.each(active_uploads, function(id, upl) {
                        upl.element.css('background-color', '#fce9e9');
                        upl.always(function() { upl.element.css('background-color', ''); });
                    });
                } else {
                    uploader.resolve(Object.values(uploaded_files));
                }
            });
            _panel.on('click', '.bu--panel-close', function() { uploader.reject(); });

            _panel.on('click', '.bu--files-picker', function(e) {
                if (_isMaxFilesNumberSelected()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            _panel.on('change', '.bu--files-picker', function(e) {
                _onFilesSelect(this.files);
            });

            _panel.on('dragover dragleave drop', function(e) {
                 e.preventDefault();
                 e.stopPropagation();
            });

            if (options.drag_and_drop) {
                _panel.on({
                    dragover: function(e) {
                        if (!_isMaxFilesNumberSelected()) {
                            _panel.addClass('bu--dragin');
                        }
                    },
                    dragleave: function(e) {
                        _panel.removeClass('bu--dragin');
                    },
                    drop: function(e) {
                        _panel.removeClass('bu--dragin');

                        if (!_isMaxFilesNumberSelected()) {
                            _onFilesSelect(e.originalEvent.dataTransfer.files);
                        }
                    }
                });
            }


            // Show uploader
            _panel.appendTo('body').fadeIn(200);

            uploader.done(function() {
                // code...
            }).fail(function() {
                for (var upload_id in active_uploads) {
                    if (active_uploads.hasOwnProperty(upload_id)) {
                        active_uploads[upload_id].stop();
                    }
                }
            }).always(function() {
                _panel.fadeOut(200, function() { _panel.remove(); });
            });

            return uploader;
        }

        plugin.openEditor = function(file_hash_id, options) {
            var editor = $.Deferred();
            var file = new _File();

            var defaults = {
                effects: ['crop', 'rotate'],
                crop: false,
            };
            var options = $.extend(defaults, options);

            if (!options.crop || !Array.isArray(options.crop)) {
                options.crop = [ options.crop ];
            }

            var default_aspect_ratio = null;
            var crop_sizes = [];

            for (var i = 0; i < options.crop.length; i++) {
                let crop_size = options.crop[i];

                if (!_isAspectRatioString(crop_size)) {
                    crop_size = null;
                }

                if (!_inArray(crop_size, crop_sizes)) {
                    crop_sizes.push(crop_size);
                }
            }

            var $loader = $(_renderElement('loader')).addClass('bu--loader-size-lg');

            var $preview = null;
            var $effects_selector = null;

            var image = {};
            image.image = new Image();
            image.image.alt = '';
            image.$ = $(image.image).addClass('bu--preview-image');
            image.refresh = function() {
                let $preview = _panel.find('.bu--editor-preview');

                $preview.append($loader);
                image.$.detach();

                image.image.onload = function() {
                    $loader.detach();
                    $preview.append(image.$);
                }

                image.image.onerror = function() {
                    let error_message = _locale('errors.load_file');

                    $loader.detach();

                    _error(error_message);
                }
            };
            image.setSrc = function(src) {
                image.refresh();
                image.image.src = src;
            };

            var modifiers = '';
            var transformations = $.extend($.Deferred(), {
                rotate: false,
                crop: false,
                mirror: false,
                flip: false,
                grayscale: false
            });

            var _Cropper = function() {
                var def = $.Deferred();

                var cimg = new Image;
                var $cimg = $(cimg);

                var widget = $(_renderElement('cropper'));
                var ratio_selector = $(_renderElement('crop_sizes'));

                widget.append($cimg);

                _panel.find('.bu--footer-nav_center').append(ratio_selector);
                _panel.find('.bu--panel-body').append(widget);

                $preview.detach();
                $effects_selector.detach();

                done_button.removeClass('bu--panel-done').addClass('bu--cropper-done').html(_locale('done.apply'));
                close_button.removeClass('bu--panel-close').addClass('bu--cropper-cancel');

                var data = {
                    image: {
                        hash_id: file.attributes.hash_id,
                        filename: file.attributes.name,
                        size: file.attributes.size,
                        mime: file.attributes.type,
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

                _Request('transform', data).done(function(response) {
                    var modifiers = response.data.modifiers;

                    cimg.onload = function() {
                        var cropper = new Cropper(cimg, {
                            aspectRatio: _aspectRatioStringToProportions(default_aspect_ratio),
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

                        $.each(crop_sizes, function(i, crop_size) {
                            var aspect_ratio = _aspectRatioStringToProportions(crop_size);
                            var label = (aspect_ratio) ? crop_size : _locale('crop.free');
                            var button = $(_renderElement('crop_size_button', { label: label }));

                            var icon_width = 24;
                            var icon_height = 24;

                            if (aspect_ratio) {
                                if (aspect_ratio > 1) {
                                    icon_height = parseInt(icon_width / aspect_ratio);
                                } else {
                                    icon_width = parseInt(icon_height * aspect_ratio);
                                }
                            }

                            var icon = button.find('.bu--crop-size-icon').css({ width: icon_width + 'px', height: icon_height + 'px' });

                            button.on('click', function() {
                                ratio_selector.find('.bu--crop-size-button.active').removeClass('active');
                                cropper.setAspectRatio(aspect_ratio);

                                $(this).addClass('active');
                            });

                            if (crop_size == default_aspect_ratio) {
                                button.addClass('active');
                            }

                            ratio_selector.append(button);
                        });

                        _panel.on('click', '.bu--cropper-done', function() {
                            def.resolve(cropper.getData());
                        });

                        _panel.on('click', '.bu--cropper-cancel', function() {
                            def.reject();
                        });
                    }

                    cimg.onerror = function() {
                        _error(_locale('errors.load_file'));
                    }

                    cimg.src = file.attributes.original_url + modifiers;
                }).fail(function() {
                    _error(_locale('errors.load_file'));
                });

                def.done(function(data) {
                    transformations.crop = {
                        width: data.width,
                        height: data.height,
                        x: data.x,
                        y: data.y,
                    };

                    transformations.notify();
                }).fail(function() {
                    // code...
                }).always(function() {
                    _panel.find('.bu--panel-body').append($preview);
                    _panel.find('.bu--footer-nav_center').append($effects_selector);
                    done_button.removeClass('bu--cropper-done').addClass('bu--panel-done').html(_locale('done.save'));
                    close_button.removeClass('bu--cropper-cancel').addClass('bu--panel-close');

                    widget.remove();
                    ratio_selector.remove();
                });
            }

            var _error = function(error_message) {
                let error = _renderElement('panel_error', { message: error_message });

                _panel.find('.bu--panel-body').empty().html(error);
                _panel.find('.bu--footer-nav_center').empty();

                done_button.removeClass('bu--button-primary');
                done_button.removeClass('bu--panel-done');
                done_button.addClass('bu--button-disabled');
            }


            /*
             *  Build panel
             */

            var _panel_id = _uid();
            var _panel = $(_renderElement('panel', {
                header: _locale('header.editor'),
                done: _locale('done.save'),
                reject: _locale('reject'),
            }));

            var done_button = _panel.find('.bu--panel-done');
            var close_button = _panel.find('.bu--panel-close');

            _panel.hide().addClass('bu--panel-editor');


            /*
             *  Bind events
             */

            $(window).resize(function() { _panel.css({ height: window.innerHeight }); });

            _panel.on('click', '.bu--panel-done', function() {
                var result = $.Deferred();

                file.update({ modifiers: modifiers }).done(function() {
                    result.resolve(file);
                }).fail(function() {
                    result.reject();
                });

                editor.resolve(file);
            });

            _panel.on('click', '.bu--panel-close', function() { editor.reject(); });


            var _init = function() {
                if (!file.isImage() ) {
                    let error_message = _locale('error.is_not_image');

                    return _error(error_message);
                }

                if (!file.hasOwnProperty('image_info')) {
                    let error_message = _locale('error.load_file');

                    return _error(error_message);
                }

                // Select default aspect ratio for cropper
                $.each(crop_sizes, function(i, crop_size) {
                    let image_proportions = file.image_info.original_width / file.image_info.original_height;
                    let default_proportions = _aspectRatioStringToProportions(default_aspect_ratio) || null;
                    let proportions = _aspectRatioStringToProportions(crop_size);

                    if (proportions) {
                        let def_diff = Math.abs(image_proportions - default_proportions);
                        let diff = Math.abs(image_proportions - proportions);

                        if (diff < def_diff) {
                            default_aspect_ratio = crop_size;
                        }
                    } else {
                        default_aspect_ratio = crop_size;

                        return false; // break
                    }
                });

                if (file.hasOwnProperty('modifiers') && file.modifiers.hasOwnProperty('crop')) {
                    let dim = file.modifiers.crop[0].split('x');
                    let pos = file.modifiers.crop[1].split(',');

                    transformations.crop = {
                        width: parseInt(dim[0]),
                        height: parseInt(dim[1]),
                        x: parseInt(pos[0]),
                        y: parseInt(pos[1])
                    };
                }

                if (!transformations.crop && default_aspect_ratio) {
                    transformations.crop = { aspect_ratio: default_aspect_ratio }
                }

                if (file.hasOwnProperty('modifiers') && file.modifiers.hasOwnProperty('rotate')) {
                    transformations.rotate = parseInt(file.modifiers.rotate[0]);
                }


                /*
                 *  Render editor
                 */

                $preview = $(_renderElement('editor'));
                $effects_selector = $(_renderElement('effect_selector'));

                _panel.find('.bu--panel-body').append($preview);
                _panel.find('.bu--footer-nav_center').append($effects_selector);

                if (Array.isArray(options.effects) && options.effects.length > 0) {
                    if (_inArray('crop', options.effects)) {
                        var label = _locale('effect.crop');
                        var effect_button = $(_renderElement('effect_button', { effect: 'crop', label: label }));

                        effect_button.on('click', _Cropper);

                        $effects_selector.append(effect_button);
                    }

                    if (_inArray('rotate', options.effects)) {
                        var label = _locale('effect.rotate');
                        var effect_button = $(_renderElement('effect_button', { effect: 'rotate', label: label }));

                        effect_button.on('click', function() {
                            var current_angle = transformations.rotate || 0;
                            var angle = Math.abs(current_angle) + 90;

                            if (angle >= 360) {
                                angle -= Math.floor(angle / 360) * 360;
                            }

                            transformations.rotate = angle || false;
                            transformations.crop = { aspect_ratio: default_aspect_ratio };

                            transformations.notify();
                        });

                        $effects_selector.append(effect_button);
                    }
                }

                transformations.notify();


                /*
                 *  Bind events
                 */

                transformations.progress(function() {
                    var data = {
                        image: {
                            hash_id: file.attributes.hash_id,
                            filename: file.attributes.name,
                            size: file.attributes.size,
                            mime: file.attributes.type,
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

                    _Request('transform', data).done(function(response) {
                        modifiers = response.data.modifiers;

                        image.setSrc(file.attributes.original_url + modifiers);
                    }).fail(function() {
                        let error_message = _locale('errors.load_file');

                        _error(error_message);
                    });
                });
            }


            file.find(file_hash_id).done(function() {
                _init();
            }).fail(function() {
                let error_message = _locale('error.load_file');

                return _error(error_message);
            });


            // Show editor
            _panel.appendTo('body').fadeIn(200);

            editor.done(function() {
                // code...
            }).fail(function() {
                // code...
            }).always(function() {
                _panel.fadeOut(200, function() { _panel.remove(); });
            });

            return editor;
        }
    };

    return plugin;
})(jQuery);
