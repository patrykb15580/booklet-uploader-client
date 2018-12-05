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
