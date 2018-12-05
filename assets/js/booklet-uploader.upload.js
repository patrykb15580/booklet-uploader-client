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
