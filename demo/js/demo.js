(function($) {
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            var name = this.name.replace('[]', '');

            if (this.value === 'true') {
                this.value = true;
            }

            if (o[name]) {
                if (!o[name].push) {
                    o[name] = [o[name]];
                }
                o[name].push(this.value || null);
            } else {
                o[name] = this.value || null;
            }
        });

        return o;
    };

    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    $(function() {
        // var file_hash = null;
        BookletUploader.init('/src/');

        $('#option--multiple').on('change', function(e) {
            if ($(this).is(':checked')) {
                $('#option--max-files').removeAttr('disabled');
            } else {
                $('#option--max-files').attr('disabled', true);
            }
        });

        $('#effect--crop').on('click', function(e) {
            e.preventDefault();
        });

        $('#open-uploader').on('click', function() {
            var options = $('#uploader-settings').serializeObject();

            var uploader = BookletUploader.openUploader(options);

            uploader.done(function(files) {
                var json = JSON.stringify(files, undefined, 4);
                var text = syntaxHighlight(json);

                $('#uploader-result').html(text);
            }).fail(function() {
                var json = JSON.stringify({
                    status: 'error',
                    message: 'Uploader closed or error occured'
                }, undefined, 4);
                var text = syntaxHighlight(json);

                $('#uploader-result').html(text);
            });
        });

        $('#upload').on('change', function() {
            var input = this;
            var options = $('#uploader-settings').serializeObject();
            var upload = BookletUploader.upload(input, {
                autoCropTo: options.crop
            }).done(function(file) {
                var json = JSON.stringify(file, undefined, 4);
                var text = syntaxHighlight(json);

                $('#uploader-result').html(text);
            }).fail(function() {
                var json = JSON.stringify({
                    status: 'error',
                    message: 'Upload error'
                }, undefined, 4);
                var text = syntaxHighlight(json);

                $('#uploader-result').html(text);
            }).progress(function(progress) {
                var json = JSON.stringify({ progress: Math.round(progress) + '%' }, undefined, 4);
                var text = syntaxHighlight(json);

                $('#uploader-result').html(text);
            });
        });

        $('#open-editor').on('click', function() {
            var file_hash = $('#file-id').val();
            var options = $('#editor-settings').serializeObject();
            var editor = BookletUploader.openEditor(file_hash, options);

            editor.done(function(file) {
                var json = JSON.stringify(file, undefined, 4);
                var text = syntaxHighlight(json);

                $('#editor-result').html(text);
            }).fail(function() {
                var json = JSON.stringify({
                    status: 'error',
                    message: 'Editor closed or error occured'
                }, undefined, 4);
                var text = syntaxHighlight(json);

                $('#editor-result').html(text);
            });
        });
    });
})(jQuery);
