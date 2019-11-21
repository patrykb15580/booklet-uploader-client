var BookletUploader = (function($) {
    var plugin = {};
    var self = {};

    var _image_mime_types = [ 'image/jpeg', 'image/png' ];
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

    var BKTUploaderUtils = {
        isInt: function(variable) { return Number(variable) === variable && variable % 1 === 0 },
        isFloat: function(variable) { return Number(variable) === variable && variable % 1 !== 0 },
        isNumber: function(variable) { return Number(value) === value },
        isImageContentType: function(content_type) { return this.inArray(content_type, _image_mime_types); },
        isAspectRatioString: function(variable) {
            let reg = new RegExp(/^\d+\/\d+$/);

            if (typeof variable == 'string' && reg.test(variable)) {
                return true;
            }

            return false;
        },
        uid: function() {
            let hex_chr = '0123456789abcdef';
            let uid = '';
            for (var i = 0; i < 32; i++) {
                let a = Math.floor(Math.random() * (hex_chr.length - 1));

                uid += hex_chr.charAt(a);
            }

            return uid;
        },
        calculateProportionsFromAspectRatioString: function(aspect_ratio) {
            if (BKTUploaderUtils.isAspectRatioString(aspect_ratio)) {
                let a = aspect_ratio.split('/');

                return a[0] / a[1];
            }

            return false;
        },
        humanReadableFileSize: function(bytes) {
            let units = ['B','kB','MB','GB','TB','PB','EB','ZB','YB'];
            let size = bytes;
            let unit_index = 0;

            while (Math.abs(size) >= 1024 && unit_index < units.length) {
                size /= 1024;
                ++unit_index;
            }

            return Math.round(size * 10) / 10 + ' ' + units[unit_index];
        },
        inArray: function(value, array, strict = false) {
            if (!Array.isArray(array)) {
                console.error('Given haystack is not an array');

                return false;
            }

            for (let i = 0; i < array.length; i++) {
                if (strict && value === array[i]) {
                    return true;
                }

                if (!strict && value == array[i]) {
                    return true;
                }
            }

            return false;
        },
        clearArrayKeysByValues: function(array, values, remove_cleared_keys = false) {
            if (!Array.isArray(array)) {
                return array;
            }

            if (!Array.isArray(values)) {
                values = [values];
            }

            let cleared_array = [];

            for (var i = 0; i < array.length; i++) {
                let value = array[i];

                if (!BKTUploaderUtils.inArray(value, values)) {
                    cleared_array.push(value);
                } else if (!remove_cleared_keys) {
                    cleared_array.push(null);
                }
            }

            return cleared_array;
        },
        removeDuplicatesFromArray: function(array) {
            if (!Array.isArray(array)) {
                return array;
            }

            let cleared_array = [];

            for (var i = 0; i < array.length; i++) {
                let value = array[i];

                if (!BKTUploaderUtils.inArray(value, cleared_array, true)) {
                    cleared_array.push(value);
                }
            }

            return cleared_array;
        },
    }

    var _renderElement = function(elem_name, data = {}) {
        let _elements = {
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
        };

        return Mustache.render(_elements[elem_name], data);
    }

    var _pluralize = function(word, number) {
        var definitions = [
            ['zdjęcie', 'zdjęcia', 'zdjęć', 'zdjęcia'],
            ['plik', 'pliki', 'plików', 'pliku'],
        ];

        var rules_to_words_definition_index = { 'one': 0, 'few': 1, 'many': 2, 'other': 3 };
        var rule = 'other';

        if (number === 1) {
            rule = 'one';
        }

        var integer = Number.isInteger(number);
        var mod10 = number % 10;
        var mod100 = number % 100;

        if (integer && ((mod10 >= 2 && mod10 <= 4) && (mod100 < 12 || mod100 > 14))) {
            rule = 'few';
        }

        if (integer && ((mod10 === 0 || mod10 === 1) || (mod10 >= 5 && mod10 <= 9 || mod100 >= 12 && mod100 <= 14))) {
            rule = 'many';
        }

        for (var i = 0; i < definitions.length; i++) {
            if (BKTUploaderUtils.inArray(word, definitions[i])) {
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

    var BKTUploaderUpload = function(file, options = {}) {
        var id = BKTUploaderUtils.uid();
        var def = $.Deferred();
        var upload = {
            id: id,
            file: {
                id: null,
                name: file.name,
                size: file.size,
                type: file.type,
            },
            done: def.done,
            fail: def.fail,
            always: def.always,
            progress: def.progress,
        };

        let defaults = {
            aspect_ratio: null,
        }

        var options = $.extend(defaults, options);
        var data = new FormData();

        var request;

        data.append('action', 'upload');

        if (options.aspect_ratio) {
            data.append('options[aspect_ratio]', options.aspect_ratio);
        }

        data.append('file[name]', file.name);
        data.append('file[size]', file.size);
        data.append('file[type]', file.type);
        data.append('file[source]', 'local');
        data.append(0, file, file.name);

        upload.start = function() {
            if (typeof request !== 'undefined') {
                return;
            }

            request = _Request('upload', data, {
                async: true,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();

                    xhr.upload.addEventListener('progress', function(e) {
                        def.notify((e.loaded * 100) / e.total);
                    });

                    return xhr;
                }
            });

            request.done(function(response) {
                let file_info = response.data.file;
                let file_data = {
                    hash_id:      file_info.hash,
                    name:         file_info.name,
                    size:         file_info.size,
                    type:         file_info.type,
                    original_url: file_info.original_url,
                    url:          file_info.url,
                    is_stored:    true,
                    modifiers:    file_info.modifiers,
                    preview:      file_info.preview,
                };

                upload.file.id = file_data.hash;

                if (typeof file_info.image_info === 'object') {
                    file_data.image_info = file_info.image_info;
                }

                var file = new BKTUploaderFile(file_data);

                def.resolve(file);
            }).fail(function(xhr) {
                let error_message = _locale('error.upload');

                if (xhr.statusText == 'abort') {
                    error_message = _locale('error.upload_aborted');
                }

                def.reject(error_message);
            });
        };

        upload.stop = function() {
            if (typeof request === 'undefined' || request.readyState == 4) {
                return;
            }

            request.abort();
        };

        return upload;
    }



    var BKTUploaderFile = function(attributes = {}) {
        var file = {};
        var attributes = $.extend({
            hash_id: null,
            name: null,
            size: null,
            type: null,
            original_url: null,
            url: null,
            modifiers: null,
            preview: null,
            is_stored: null,
        },  attributes);

        var isImage = function() {
            return BKTUploaderUtils.inArray(attributes.type, _image_mime_types);
        };

        var find = function(hash_id) {
            var request = _Request('info', { 'hash_id': hash_id });

            request.done(function(response) {
                var data = response.data;

                attributes.hash_id      = data.file.hash;
                attributes.name         = data.file.name;
                attributes.size         = data.file.size;
                attributes.type         = data.file.type;
                attributes.modifiers    = data.file.modifiers;
                attributes.url          = data.file.url;
                attributes.original_url = data.file.original_url;
                attributes.preview      = data.file.preview;

                if (typeof data.file.image_info === 'object') {
                    file.image_info = data.file.image_info;
                }

                if (typeof data.modifiers === 'object') {
                    file.modifiers = data.modifiers;
                }

                delete file.find;

                file.update = update;
            });

            return request;
        }

        var update = function(data) {
            var request = _Request('update', {
                hash_id: attributes.hash_id,
                file: data,
            });

            request.done(function(response) {
                var data = response.data;

                attributes.hash_id      = data.file.hash         || attributes.hash;
                attributes.name         = data.file.name         || attributes.name;
                attributes.size         = data.file.size         || attributes.size;
                attributes.type         = data.file.type         || attributes.type;
                attributes.modifiers    = data.file.modifiers    || attributes.modifiers;
                attributes.url          = data.file.url          || attributes.url;
                attributes.original_url = data.file.original_url || attributes.original_url;
                attributes.preview      = data.file.preview      || attributes.preview;

                delete file.image_info;
                delete file.modifiers;

                if (typeof data.file.image_info === 'object') {
                    file.image_info = data.file.image_info;
                }

                if (typeof data.modifiers === 'object') {
                    file.modifiers = data.modifiers;
                }
            });

            return request;
        };

        file.attributes = attributes;
        file.isImage = isImage;

        if (file.attributes.hash_id) {
            file.update = update;
        } else {
            file.find = find;
        }

        return file;
    }

    var openUploader = function(options = {}) {
        var id = BKTUploaderUtils.uid();
        var _uploader = $.Deferred();
        var defaults = {
            multiple: false,
            max_files: false,
            drag_and_drop: false,
            images_only: false,
            max_size: false,
            crop: false,
        };

        var options = $.extend(defaults, options);

        var $uploader, $uploader_body, $files_picker, $files_picker_btn, $files_counter, $uploads_list, $done_btn, $close_btn;
        var uploader = {
            id: id,
            done: _uploader.done,
            fail: _uploader.fail,
            always: _uploader.always,
        };

        var images_aspect_ratio = null;

        if (Array.isArray(options.crop)) {
            options.crop = options.crop[0];
        }

        if (BKTUploaderUtils.isAspectRatioString(options.crop)) {
            images_aspect_ratio = BKTUploaderUtils.calculateProportionsFromAspectRatioString(options.crop);
        }

        if (typeof options.crop === 'number' && options.crop > 0) {
            images_aspect_ratio = options.crop;
        }

        var max_files_number = parseInt(options.max_files);

        if (max_files_number <= 0) {
            max_files_number = null;
        }

        if (!options.multiple) {
            max_files_number = 1;
        }

        var uploaded_files = {};
        var active_uploads = {};
        var uploads = {};

        var _uploadedFilesNumber = function() {
            return Object.keys(uploaded_files).length;
        }

        var _activeUploadsNumber = function() {
            return Object.keys(active_uploads).length;
        }

        var _areUploadsInProgress = function() {
            return (_activeUploadsNumber() > 0) ? true : false;
        }

        var _isMaxFilesNumberSelected = function() {
            if (max_files_number) {
                var uploaded_files_number = _uploadedFilesNumber();
                var active_uploads_number = _activeUploadsNumber();

                var selected_files_number = uploaded_files_number + active_uploads_number;

                if (max_files_number <= selected_files_number) {
                    return true;
                }
            }

            return false;
        }

        var _isMaxFilesNumberUploaded = function() {
            if (max_files_number && max_files_number <= _uploadedFilesNumber()) {
                return true;
            }

            return false;
        }

        var _onFilesSelect = function(files) {
            _disableDoneButton();

            $.each(files, function(i, file) {
                if (_isMaxFilesNumberSelected()) {
                    return false; // break
                }

                if (options.images_only && !BKTUploaderUtils.isImageContentType(file.type)) {
                    return true; // continue
                }

                if (options.max_size && file.size > options.max_size) {
                    return true; // continue
                }

                let upload_options = {};

                if (images_aspect_ratio) {
                    upload_options.aspect_ratio = images_aspect_ratio;
                }

                var upload = new BKTUploaderUpload(file, upload_options);

                // Render uploads list item
                var $upload = $('<li class="bu--upload"></li>');
                var $upload_preview = $('<div class="bu--upload-preview"></div>');
                var $upload_details = $('<div class="bu--upload-details"></div>');
                var $upload_actions = $('<ul class="bu--upload-actions"></ul>');
                var $upload_cancel_btn = $('<li class="bu--upload-action-button upload--cancel"><i class="fa fa-trash"></i></li>');
                var $upload_progress = $('<div class="bu--upload-progress"></div>');
                var $upload_progressbar = $('<div class="bu--progressbar"></div>');
                var $upload_progressbar_progress = $('<div class="bu--progress"></div>');
                var $upload_error = $('<div class="bu--upload-error"></div>');

                $upload_progressbar.append($upload_progressbar_progress);
                $upload_progress.append($upload_progressbar);
                $upload_progress.append($upload_error);

                $upload_details.append('<div class="bu--file-name">' + file.name + '</div>');
                $upload_details.append('<div class="bu--file-size">' + BKTUploaderUtils.humanReadableFileSize(file.size) + '</div>');
                $upload_details.append($upload_progress);
                $upload_actions.append($upload_cancel_btn);

                $upload.append($upload_preview);
                $upload.append($upload_details);
                $upload.append($upload_actions);

                $upload.addClass('upload-' + upload.id);
                $upload.attr('data-id', upload.id);

                $uploads_list.prepend($upload);

                upload.start();

                active_uploads[upload.id] = upload;
                uploads[upload.id] = upload;

                upload.done(function(file) {
                    delete file.update;

                    uploaded_files[file.attributes.hash_id] = file;

                    var preview = '<img src="' + file.attributes.preview + '" alt="" />';

                    $upload.addClass('uploaded');
                    $upload_preview.append('<div class="bu--loader sm"></div>');
                    $upload_preview.append(preview);

                    $(preview).on('load error', function() {
                        $upload.find('.bu--upload-preview .bu--loader').remove();
                    });
                }).fail(function(error_message = null) {
                    error_message = error_message || _locale('error.upload');

                    $upload_error.html(error_message);
                }).always(function() {
                    $upload_progressbar.hide();

                    delete active_uploads[upload.id];

                    _uploader.notify();
                }).progress(function(progress) {
                    $upload_progressbar_progress.css({ 'width': progress + '%' });
                });
            });
        }

        var _closeUploader = function() {
            $uploader.fadeOut(200, function() { $uploader.remove(); });
        }

        var _enableDoneButton = function() {
            $done_btn.addClass('bu--button-primary');
            $done_btn.addClass('bu--panel-done');
            $done_btn.removeClass('bu--button-disabled');
        }

        var _disableDoneButton = function() {
            $done_btn.removeClass('bu--button-primary');
            $done_btn.removeClass('bu--panel-done');
            $done_btn.addClass('bu--button-disabled');
        }

        var _renderEditor = function() {
            let panel = _renderElement('panel', {
                header: _locale('header.uploader'),
                done: _locale('done.upload'),
                reject: _locale('reject'),
            });

            let $uploader_content_header = $('<div class="bu--uploader-header"></div>');

            $uploader = $(panel);
            $uploader_body = $uploader.find('.bu--panel-body');

            $files_picker = $('<input id="bu--files-picker" class="bu--files-picker" type="file" />');

            $files_picker_btn = $('<label class="bu--button bu--button-primary bu--select-files" for="bu--files-picker"></label>');
            $files_picker_btn.html(_locale('picker.single'));

            if (options.multiple) {
                $files_picker_btn.html(_locale('picker.multiple'));
            }

            $files_counter = $('<div class="bu--files-counter"></div>');
            $uploads_list = $('<ul class="bu--uploads-list"></ul>');

            $done_btn = $uploader.find('.bu--panel-done');
            $close_btn = $uploader.find('.bu--panel-close');

            let valid_mime_types = '*';

            if (options.images_only) {
                valid_mime_types = _image_mime_types.join(',');
            }

            $files_picker.attr({accept: valid_mime_types, multiple: options.multiple});
            $files_picker.hide();

            $uploader_body.append($files_picker);
            $uploader_body.append($uploader_content_header);
            $uploader_body.append($uploads_list);
            $uploader_body.append($files_counter);

            $uploader_content_header.append($files_picker_btn);

            if (options.max_size) {
                let $max_file_size_info = $('<div class="bu--max-file-size-info"></div>');
                let text = _locale('picker.max_file_size', { max_size: BKTUploaderUtils.humanReadableFileSize(options.max_size) });

                $max_file_size_info.html(text);

                $uploader_content_header.append($max_file_size_info);
            }

            _uploader.notify();

            $uploader.addClass('btk-uploader bkt-uploader--' + uploader.id);
            $uploader.addClass('bu--panel-uploader bu--panel-small');
            $uploader.hide();
            $uploader.appendTo('body').fadeIn(200);
        }

        var _bindEvents = function() {
            $(window).resize(function() { $uploader.css({ height: window.innerHeight }); });
            $(window).trigger('resize');

            $files_picker.on('change', function(e) { _onFilesSelect(this.files); });
            $files_picker.on('click', function(e) {
                if (_isMaxFilesNumberSelected()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            $uploader.on('dragover dragleave drop', function(e) {
                 e.preventDefault();
                 e.stopPropagation();
            });

            if (options.drag_and_drop) {
                $uploader.on({
                    dragover: function(e) {
                        if (!_isMaxFilesNumberSelected()) {
                            $uploader.addClass('bu--dragin');
                        }
                    },
                    dragleave: function(e) {
                        $uploader.removeClass('bu--dragin');
                    },
                    drop: function(e) {
                        $uploader.removeClass('bu--dragin');

                        if (!_isMaxFilesNumberSelected()) {
                            _onFilesSelect(e.originalEvent.dataTransfer.files);
                        }
                    }
                });
            }

            _uploader.progress(function() {
                let uploaded_files_number = _uploadedFilesNumber();
                let text = _locale('counter', {
                    files_number: uploaded_files_number,
                    file: _pluralize('plik', uploaded_files_number)
                });

                if (max_files_number) {
                    text = _locale('counter.limited', {
                        files_number: uploaded_files_number,
                        max_files_number: max_files_number,
                        file: _pluralize('plik', max_files_number)
                    });
                };

                $files_counter.html(text);

                if (_isMaxFilesNumberUploaded()) {
                    $files_counter.css('color', '#53be31');
                } else {
                    $files_counter.removeAttr('style');
                }

                if (!_areUploadsInProgress()) {
                    _enableDoneButton();
                }
            });

            $uploader.on('click', '.bu--panel-close', _uploader.reject);
            $uploader.on('click', '.bu--panel-done', function() {
                if (_areUploadsInProgress()) {
                    _disableDoneButton();

                    $.each(active_uploads, function(id, upload) {
                        var $upload = $uploads_list.find('.upload-' + id);

                        $upload.css('background-color', '#FBFFE4');
                        upload.always(function() {
                            $upload.css('background-color', '');
                        });
                    });
                } else {
                    var files = Object.values(uploaded_files);

                    _uploader.resolve(files);
                }
            });

            uploader.always(_closeUploader);
            uploader.fail(function() {
                for (let upload_id in active_uploads) {
                    if (active_uploads.hasOwnProperty(upload_id)) {
                        active_uploads[upload_id].stop();
                    }
                }
            });

            $uploads_list.on('click', '.bu--upload .bu--upload-action-button.upload--cancel', function() {
                var $upload = $(this).closest('.bu--upload');
                var upload_id = $upload.data('id');

                var upload = uploads[upload_id];

                upload.stop();

                delete uploads[upload.id];
                delete uploaded_files[upload.file.id];

                $upload.fadeOut(200, function() { $upload.remove(); });
                _uploader.notify();
            });
        }

        _renderEditor();
        _bindEvents();

        return uploader;
    };

    var openEditor = function(file_hash_id, options) {
        var editor = $.Deferred();
        var file = new BKTUploaderFile();
        var image = new Image();
        var $image = $(image);
        var cropper;

        var $editor, $editor_body, $editor_content, $editor_actions, $aspect_ratio_selector, $done_btn, $close_btn, $loader;

        var defaults = {
            effects: ['crop', 'rotate'],
            crop: null,
        };

        var options = $.extend(defaults, options);

        const AVAILABLE_EFFECTS = ['crop', 'rotate'];

        var angle = 0;

        var aspect_ratios = [];
        var effects = [];

        var _init = function() {
            // Get effects list
            if (!Array.isArray(options.effects)) {
                options.effects = [ options.effects ];
            }

            if (options.effects.length == 0) {
                throw 'No effect selected';
            }

            for (var i = 0; i < options.effects.length; i++) {
                let effect = options.effects[i];

                if (BKTUploaderUtils.inArray(effect, AVAILABLE_EFFECTS)) {
                    effects.push(effect);
                }
            }

            effects = BKTUploaderUtils.removeDuplicatesFromArray(effects);

            // Get aspect ratios list
            if (!Array.isArray(options.crop)) {
                options.crop = [ options.crop ];
            }

            for (var i = 0; i < options.crop.length; i++) {
                let aspect_ratio = options.crop[i];

                if (!BKTUploaderUtils.isAspectRatioString(aspect_ratio)) {
                    aspect_ratio = null;
                }

                aspect_ratios.push(aspect_ratio);
            }

            aspect_ratios = BKTUploaderUtils.removeDuplicatesFromArray(aspect_ratios);
        }

        var _renderEditor = function() {
            let panel = _renderElement('panel', {
                header: _locale('header.editor'),
                done: _locale('done.save'),
                reject: _locale('reject'),
            });

            $editor = $(panel);
            $editor_body = $editor.find('.bu--panel-body');
            $editor_content = $('<div class="bu--editor-preview"></div>');
            $editor_actions = $('<div class="bkt-editor__actions"></div>');
            $aspect_ratio_selector = $('<div class="bkt-editor__actions-group bkt-editor__actions-group--aspect-ratio-selector"></div>');
            $done_btn = $editor.find('.bu--panel-done');
            $close_btn = $editor.find('.bu--panel-close');
            $loader = $('<div class="bu--loader"></div>');

            $editor_actions.append($aspect_ratio_selector);

            $.each(aspect_ratios, function(i, aspect_ratio) {
                let label = aspect_ratio;

                if (!BKTUploaderUtils.isAspectRatioString(aspect_ratio)) {
                    aspect_ratio = 'free';
                    label = _locale('crop.free');
                }

                let $btn = $('<div></div>');
                    $btn.addClass('bkt-editor__action');
                    $btn.addClass('bkt-editor__action--change-aspect-ratio');
                    $btn.attr('data-aspect-ratio', aspect_ratio);
                    $btn.attr('data-label', label);

                let $icon = $('<i class="bkt-editor__aspect-ratio-icon"></i>')

                let icon_width = 24;
                let icon_height = 24;
                let proportions = BKTUploaderUtils.calculateProportionsFromAspectRatioString(aspect_ratio);

                if (proportions) {
                    if (proportions > 1) {
                        icon_height = parseInt(icon_width / proportions);
                    } else {
                        icon_width = parseInt(icon_height * proportions);
                    }
                }

                $icon.css({ width: icon_width + 'px', height: icon_height + 'px' });
                $btn.append($icon);

                if (aspect_ratio == aspect_ratios[0]) {
                    $btn.addClass('bkt-editor__action--active');
                }

                $aspect_ratio_selector.append($btn);
            });

            if (BKTUploaderUtils.inArray('rotate', effects)) {
                let $rotate_left_action = $('<div class="bkt-editor__action"></div>');
                    $rotate_left_action.addClass('bkt-editor__action--rotate-left');
                    $rotate_left_action.append('<i class="bkt-editor__icon bkt-editor__icon--rotate-left"></i>');

                let $rotate_right_action = $('<div class="bkt-editor__action"></div>');
                    $rotate_right_action.addClass('bkt-editor__action--rotate-right');
                    $rotate_right_action.append('<i class="bkt-editor__icon bkt-editor__icon--rotate-right"></i>');

                $editor_actions.prepend($rotate_left_action);
                $editor_actions.append($rotate_right_action);
            }

            $editor_body.append($editor_content);
            $editor_content.append($loader);
            $editor.find('.bu--footer-nav_center').append($editor_actions);

            $editor.addClass('bu--panel-editor').hide();
            $editor.appendTo('body').fadeIn(200);
            $loader.addClass('bu--loader-size-lg');
        }

        var _rotateLeft = function() {
            angle -= 90;

            if (angle < 0) {
                angle += 360;
            }

            _rotate();
        }

        var _rotateRight = function() {
            angle += 90;

            if (angle >= 360) {
                angle -= 360;
            }

            _rotate();
        }

        var _rotate = function() {
            let url = _imageUrl();

            $image.css('opacity', 0);
            $editor_content.append($loader);

            cropper.replace(url);
        }

        var _bindEvents = function() {
            $(window).resize(function() {
                $editor.css({ height: window.innerHeight });
                $editor_content.css({ height: $editor_body.height() });
                $image.css({
                    'max-width': $editor_content.width(),
                    'max-height': $editor_content.height(),
                })
            });
            $(window).trigger('resize');

            $editor.on('BKTEditorReady', function(e) {
                $editor.off('BKTEditorReady');
                $editor.on('click', '.bu--panel-done', function() {
                    let result = $.Deferred();
                    let data = cropper.getData();
                    let image_data = cropper.getImageData();
                    let original_width = file.image_info.original_width;
                    let original_height = file.image_info.original_height;

                    if (angle == 90 || angle == 270) {
                        original_width = file.image_info.original_height;
                        original_height = file.image_info.original_width;
                    }

                    let scale = image_data.naturalWidth / original_width;

                    let width = Math.round(data.width / scale);
                    let height = Math.round(data.height / scale);
                    let x = Math.round(data.x / scale);
                    let y = Math.round(data.y / scale);
                    let m = '';

                    if (angle > 0) {
                        m += '-/rotate/' + angle + '/';
                    }

                    m += '-/crop/' + width + 'x' + height + '/' + x + ',' + y + '/';

                    file.update({ modifiers: m }).done(function() {
                        result.resolve(file);
                    }).fail(function() {
                        result.reject();
                    });

                    editor.resolve(result);
                });

                $editor_actions.on('click', '.bkt-editor__action.bkt-editor__action--rotate-left', _rotateLeft);
                $editor_actions.on('click', '.bkt-editor__action.bkt-editor__action--rotate-right', _rotateRight);
                $editor_actions.on('click', '.bkt-editor__action.bkt-editor__action--change-aspect-ratio', function() {
                    let $active_btn = $editor_actions.find('.bkt-editor__action.bkt-editor__action--change-aspect-ratio.bkt-editor__action--active');
                    let $btn = $(this);
                    let aspect_ratio = $btn.data('aspect-ratio');
                    let proportions = BKTUploaderUtils.calculateProportionsFromAspectRatioString(aspect_ratio);

                    $active_btn.removeClass('bkt-editor__action--active');
                    $btn.addClass('bkt-editor__action--active');

                    cropper.setAspectRatio(proportions);
                });

                _enableDoneButton();
            });

            $editor.on('BKTEditorCropperReady', function() {
                $image.css('opacity', 1);
                $loader.detach();
            });

            $editor.on('BKTEditorError', function(e, message) {
                let $error = $('<div class="bu--panel-error"></div>');

                $error.html(message);

                $editor_body.empty();
                $editor_body.html($error);
                $editor.find('.bu--footer-nav_center').empty();

                _disableDoneButton();
            });

            $editor.on('click', '.bu--panel-close', function() {
                editor.reject();
            });

            editor.always(_closeEditor);
        }

        var _enableDoneButton = function() {
            $done_btn.addClass('bu--button-primary');
            $done_btn.addClass('bu--panel-done');
            $done_btn.removeClass('bu--button-disabled');
        }

        var _disableDoneButton = function() {
            $done_btn.removeClass('bu--button-primary');
            $done_btn.removeClass('bu--panel-done');
            $done_btn.addClass('bu--button-disabled');
        }

        var _loadFile = function(success, error) {
            file.find(file_hash_id).done(success).fail(error);
        }

        var _loadPreview = function(success, error) {
            image.onload = function() {
                $editor_content.append($image);
                $loader.detach();

                success.call();
            }

            image.onerror = function() {
                success.call();
            }

            image.src = _imageUrl();
        }

        var _openCropper = function(success) {
            cropper = new Cropper(image, {
                aspectRatio: BKTUploaderUtils.calculateProportionsFromAspectRatioString(aspect_ratios[0]),
                background: false,
                autoCropArea: 1,
                dragMode: 'move',
                restore: false,
                viewMode: 1,
                movable: false,
                rotatable: true,
                scalable: false,
                zoomable: false,
                zoomOnTouch: false,
                zoomOnWheel: false,
                toggleDragModeOnDblclick: false,
                responsive: true,
                ready: function() {
                    $editor.trigger('BKTEditorCropperReady');
                    success.call();
                },
                crop: function(e) {},
            });
        }

        var _closeEditor = function() {
            $editor.fadeOut(200, function() { $editor.remove(); });
        }

        var _imageUrl = function() {
            let url  = file.attributes.original_url;
            let width = parseInt($editor_content.width());
            let height = parseInt($editor_content.height());
            let quality = 75;

            url += '-/preview/' + width + 'x' + height + '/' + quality + '/';

            if (angle > 0) {
                url += '-/rotate/' + angle + '/';
            }

            return url;
        }

        _init();
        _renderEditor();
        _disableDoneButton();
        _bindEvents();
        _loadFile(function() {
            if (file.isImage()) {
                $image.css('opacity', 0);

                _loadPreview(function() {
                    $editor_content.append($loader);

                    _openCropper(function() {
                        $editor.trigger('BKTEditorReady');
                    });
                }, function() {
                    $editor.trigger('BKTEditorError', [_locale('errors.load_file')]);
                });
            } else {
                $editor.trigger('BKTEditorError', [_locale('error.is_not_image')]);
            }
        }, function() {
            $editor.trigger('BKTEditorError', [_locale('error.load_file')]);
        });

        return editor;
    };

    plugin.init = function(api) {
        plugin.api = api;

        delete plugin.init;

        plugin.upload = function(input, options = {}) {
            var file = input.files[0];
            var upload = new BKTUploaderUpload(file, options);

            let defaults = {
                autoStart: true,
            }

            var options = $.extend(defaults, options);

            if (options.autoStart) {
                upload.start();
            }

            return upload;
        }

        plugin.openUploader = openUploader;
        plugin.openEditor = openEditor;
    };

    return plugin;
})(jQuery);
