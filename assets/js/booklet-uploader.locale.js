(function($) {
    var locale = {
        header: {
            uploader: 'Wybierz pliki do przesłania',
            editor: 'Edycja zdjęcia',
        },
        done: {
            default: 'Zakończ',
            upload: 'Wyślij',
            save: 'Zapisz',
            apply: 'Zatwierdź',
        },
        reject: 'Anuluj',
        crop_free: 'Dowolny',
        effects: {
            crop: 'Kadrowanie',
            rotate: 'Obrót',
            flip: 'Odbicie poziome',
            mirror: 'Odbicie pionowe',
            grayscale: 'Szarość',
            negative: 'Negatyw',
        },
        file_picker: {
            single: 'Wybierz plik',
            multiple: 'Wybierz pliki',
        },
        files_counter: {
            default: 'Przesłano %files_number% %file%',
            limited: 'Przesłano %files_number% z %max_files_number% %file%'
        },
        from: ' z %number%',
        file: {
            default: 'plik',
            multiple: 'pliki',
            pluralized: 'plików'
        },
        image: {
            default: 'zdjęcie',
            multiple: 'zdjęcia',
            pluralized: 'zdjęć'
        },
        images: 'zdjecia',
        max_file_size: 'Maksymalny rozmiar pliku wynosi %max_size%',
        errors: {
            load_file: 'Błąd ładowania pliku',
            invalid_file_type: 'Nieprawidłowy format pliku',
            file_too_large: 'Zbyt duży rozmiar pliku',
            file_too_small: 'Zbyt mały rozmiar pliku',
            upload: 'Błąd podczas wysyłania',
            upload_abort: 'Wysyłanie przerwane',
            not_editable: 'Tego pliku nie można edytować',
        },
    }

    var localeGet = function(key, variables = {}) {
        var texts = locale;
        var key_parts = key.split('.');

        var text = null;
        for (var i = 0; i < key_parts.length; i++) {
            var key = key_parts[i];

            texts = texts[key];
        }

        text = texts;

        for (var variable in variables) {
            text = text.replace('%' + variable + '%', variables[variable]);
        }

        return text;
    };

    var localePluralize = function(val, word) {
        if (word == 'zdjęcie') {
            if (val == 1) {
                return 'zdjęcie';
            } else if (val >= 2 && val <= 4) {
                return 'zdjęcia';
            } else if (val == 0 || (val > 4 && val < 20)) {
                return 'zdjęć';
            } else if (val >= 20) {
                var sub_val = val - (Math.floor(val / 10) * 10);

                if (sub_val < 2 || $sub_val > 4) {
                    return 'zdjęć';
                } else if ($sub_val >= 2 && $sub_val <= 4) {
                    return 'zdjęcia';
                }
            }
        } else if (word == 'zdjęć') {
            if (val == 1) {
                return 'zdjęcia';
            } else {
                return 'zdjęć';
            }
        } else if (word == 'plik') {
            if (val == 1) {
                return 'plik';
            } else if (val >= 2 && val <= 4) {
                return 'pliki';
            } else if (val == 0 || (val > 4 && val < 20)) {
                return 'plików';
            } else if (val >= 20) {
                var sub_val = val - (Math.floor(val / 10) * 10);

                if (sub_val < 2 || sub_val > 4) {
                    return 'plików';
                } else if (sub_val >= 2 && sub_val <= 4) {
                    return 'pliki';
                }
            }
        } else if (word == 'plików') {
            if (val == 1) {
                return 'pliku';
            } else {
                return 'plików';
            }
        }

        return word;
    }

    BookletUploader.registerModule('locale', {
        locale: locale,
        get: localeGet,
        pluralize: localePluralize
    });
})(jQuery);
