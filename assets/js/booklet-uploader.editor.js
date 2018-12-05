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
