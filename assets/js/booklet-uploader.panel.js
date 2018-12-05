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
