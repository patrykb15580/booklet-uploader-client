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
