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
