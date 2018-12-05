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
