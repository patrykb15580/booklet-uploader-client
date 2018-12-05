(function($) {
    var isInt = function(variable){
        return Number(variable) === variable && variable % 1 === 0;
    };

    var isFloat = function(variable){
        return Number(variable) === variable && variable % 1 !== 0;
    };

    var isNumber = function(variable) {
        return typeof variable === 'number';
    };

    var isAspectRatioString = function(string) {
        return new RegExp(/\d\/\d/gi).test(string);
    };

    var inArray = function(needle, haystack, strict = false) {
        if (!Array.isArray(haystack)) {
            console.error('Haystack must be Array');

            return false;
        }

        for (var i = 0; i < haystack.length; i++) {
            if (strict && needle === haystack[i]) {
                return true;
            } else if (!strict && needle == haystack[i]) {
                return true;
            }
        }

        return false;
    };

    var clearKeysByValues = function(array, values) {
        if (!Array.isArray(array)) {
            return array;
        }

        for (var i = 0; i < array.length; i++) {
            var value = array[i];

            if (!inArray(value, values)) {
                array[i] = null;
            }
        }

        return array;
    };

    var removeKeysByValues = function(array, values) {
        if (!Array.isArray(array)) {
            return array;
        }

        if (!Array.isArray(values)) {
            values = [values];
        }

        var cleared_array = [];

        for (var i = 0; i < array.length; i++) {
            var value = array[i];

            if (!inArray(value, values)) {
                cleared_array.push(value);
            }
        }

        return cleared_array;
    };

    var greatestCommonDivisor = function(a, b) {
        var large = a > b ? a: b;
        var small = a > b ? b: a;
        var remainder = large % small;

        while (remainder !== 0) {
            large = small > remainder ? small: remainder;
            small = small > remainder ? remainder: small;
            remainder = large % small;
        }

        return small;
    };

    var decimalPlaces = function(value) {
        if (isFloat(value) || Math.floor(value) !== value) {
            return value.toString().split(".")[1].length || 0;
        }

        return 0;
    };

    BookletUploader.registerModule('utils', {
        isInt: isInt,
        isFloat: isFloat,
        number: {
            greatestCommonDivisor: greatestCommonDivisor,
            isInt: isInt,
            isFloat: isFloat,
            isNumber: isNumber,
            decimalPlaces: decimalPlaces,
        },
        uid: function() {
            var hex_chr = '0123456789abcdef';
            var uid = '';
            for (var i = 0; i < 32; i++) {
                var a = Math.floor(Math.random() * (hex_chr.length - 1));

                 uid += hex_chr.charAt(a);
            }

            return uid;
        },
        sizeToSizeString: function(bytes) {
            var units = ['B','kB','MB','GB','TB','PB','EB','ZB','YB'];
            var size = bytes;
            var unit_index = 0;

            while (Math.abs(size) >= 1024 && unit_index < units.length) {
                size /= 1024;
                ++unit_index;
            }

            return Math.round(size * 10) / 10 + ' ' + units[unit_index];
        },
        array: {
            inArray: inArray,
            clearKeysByValues: clearKeysByValues,
            removeKeysByValues: removeKeysByValues,
            end: function(array) {
                if (Array.isArray(array) && array.length > 0) {
                    return array[array.length - 1];
                }

                return null;
            }
        },
        string: {
            setVariables: function(text, params = {}) {
                for (var param in params) {
                    text = text.replace('%' + param + '%', params[param]);
                }

                return text;
            },
        },
        aspect_ratio: {
            isAspectRatioString: isAspectRatioString,
            calculateAspectRatio: function(variable) {
                if (isAspectRatioString(variable)) {
                    return eval(variable);
                }

                if ((isInt(variable) || isFloat(variable)) && variable > 0) {
                    return variable;
                }

                return null;
            },
            toString: function(aspect_ratio) {
                if ((isInt(aspect_ratio) || isFloat(aspect_ratio)) && aspect_ratio > 0) {
                    var w = 100;
                    var h = 100;

                    if (aspect_ratio > 1) {
                        h = w / aspect_ratio;

                        if (isFloat(h)) {
                            w = w * Math.pow(10, decimalPlaces(h));
                            h = w / aspect_ratio;
                        }
                    } else {
                        w = h * aspect_ratio;

                        if (isFloat(w)) {
                            h = h * Math.pow(10, decimalPlaces(w));
                            w = h * aspect_ratio;
                        }

                    }

                    var gcd = greatestCommonDivisor(w, h);

                    w = Math.round(w / gcd);
                    h = Math.round(h / gcd);

                    return w + '/' + h;
                }

                return 'free';
            }
        },
        editor: {
            cropSizeIconDimensions: function(aspect_ratio) {
                var width = 24;
                var height = 24;

                if (aspect_ratio) {
                    if (aspect_ratio > 1) {
                        height = parseInt(width / aspect_ratio);
                    } else {
                        width = parseInt(height * aspect_ratio);
                    }
                }

                return { width: width + 'px', height: height + 'px' };
            },
        },
    });
})(jQuery);
