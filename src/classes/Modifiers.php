<?php
class Modifiers
{
    const SEPARATOR = '-/';
    const DEFAULT_QUALITY = 80;
    const VALID_FORMATS = ['jpg', 'jpeg', 'png', 'tiff'];

    const MODIFIERS_ORDER = [
        'rotate', 'crop', 'resize', 'rounded', 'mirror', 'flip', 'negative',
        'grayscale', 'format', 'quality', 'preview', 'thumbnail'
    ];

    const MODIFIERS = [
        'resize' => '-/resize/(:width)x(:height)/',
        'rotate' => '-/rotate/(:angle)/',
        'crop' => '-/crop/(:width)x(:height)/(:x),(:y)/',
        'mirror' => '-/mirror/',
        'flip' => '-/flip/',
        'rounded' => '-/rounded/(:radius)/',
        'negative' => '-/negative/',
        'grayscale' => '-/grayscale/',
        'format' => '-/format/(:format)/',
        'quality' => '-/quality/(:quality)/',
        'preview' => '-/preview/(:width)x(:height)/(:quality)/',
        'thumbnail' => '-/thumbnail/(:width)x(:height)/',
    ];

    const MODIFIER_PATTERNS = [
        'resize' => '/^\-\/resize\/\d+x\d+\/$/',                                     // -/resize/[width]x[height]/
        'rotate' => '/^\-\/rotate\/([1-9]|[1-8][0-9]|[12][0-9]{2}|3[0-5][0-9])\/$/', // -/rotate/[angle (1-359)]/
        'crop' => '/^\-\/crop\/\d+x\d+\/\d+\,\d+\/$/',                               // -/crop/[width]x[height]/[x]x[y]/
        'mirror' => '/^\-\/mirror\/$/',                                              // -/mirror/
        'flip' => '/^\-\/flip\/$/',                                                  // -/flip/
        'rounded' => '/^\-\/rounded\/\d+\/$/',                                       // -/rounded/[radius]/
        'negative' => '/^\-\/negative\/$/',                                          // -/negative/
        'grayscale' => '/^\-\/grayscale\/$/',                                        // -/grayscale/
        'format' => '/^\-\/format\/(jpg|jpeg|png|tiff)\/$/',                         // -/format/[format (jpg,jpeg,png,tiff)]/
        'quality' => '/^\-\/quality\/([1-9]|[1-9][0-9]|100)\/$/',                    // -/quality/[quality (1-100)]/
        'preview' => '/^\-\/preview\/\d+x\d+\/([1-9]|[1-9][0-9]|100)\/$/',           // -/preview/[width]x[height]/[quality (1-100)]/
        'thumbnail' => '/^\-\/thumbnail\/\d+(x\d+){0,1}\/$/',                        // -/thumbnail/[width]x[height]/
    ];


    public static function resize(int $width, int $height)
    {
        $modifier = self::MODIFIERS['resize'];
        $params = [ 'width' => $width, 'height' => $height ];

        if ($width < 0 || $height < 0) {
            return null;
        }

        $modifier = self::setModifierParams($modifier, $params);

        return [ 'modifier' => $modifier, 'params' => $params ];
    }

    public static function rotate(int $angle)
    {
        if ($angle == 0) { return null; }
        if ($angle < 0) { $angle += ceil(abs($angle) / 360) * 360; }
        if ($angle >= 360) { $angle -= floor($angle / 360) * 360; }

        $modifier = self::MODIFIERS['rotate'];
        $params = [ 'angle' => $angle ];

        $modifier = self::setModifierParams($modifier, $params);

        return [ 'modifier' => $modifier, 'params' => $params ];
    }

    public static function crop(int $width, int $height, int $x, int $y)
    {
        $modifier = self::MODIFIERS['crop'];
        $params = [
            'width' => ($width > 0) ? $width : 0,
            'height' => ($height > 0) ? $height : 0,
            'x' => ($x > 0) ? $x : 0,
            'y' => ($y > 0) ? $y : 0,
        ];

        $modifier = self::setModifierParams($modifier, $params);

        return [ 'modifier' => $modifier, 'params' => $params ];
    }

    public static function cropToProportions($source_width, $source_height, $target_ratio)
    {
        $width = $source_width;
        $height = $source_height;

        $source_ratio = $source_width / $source_height;

        $x = 0;
        $y = 0;

        if (Booklet\Uploader\Utils\StringUtils::isAspectRatioString($target_ratio)) {
            $target_ratio = Booklet\Uploader\Utils\CropUtils::aspectRatioStringToProportions($target_ratio);
        }

        if ($source_ratio !== $target_ratio) {
            if ($source_ratio > $target_ratio) {
                $width = round($height * $target_ratio);
                $x = round(($source_width - $width) / 2);
            } else {
                $height = round($width / $target_ratio);
                $y = round(($source_height - $height) / 2);
            }
        }

        return self::crop($width, $height, $x, $y);
    }

    public static function mirror()
    {
        return [ 'modifier' => self::MODIFIERS['mirror'], 'params' => [] ];
    }

    public static function flip()
    {
        return [ 'modifier' => self::MODIFIERS['flip'], 'params' => [] ];
    }

    public static function rounded(int $radius = 30)
    {
        if ($radius > 0) {
            $modifier = self::MODIFIERS['rounded'];
            $params = [ 'radius' => $radius ];

            $modifier = self::setModifierParams($modifier, $params);

            return [ 'modifier' => $modifier, 'params' => $params ];
        }

        return null;
    }

    public static function negative()
    {
        return [ 'modifier' => self::MODIFIERS['negative'], 'params' => [] ];
    }

    public static function grayscale()
    {
        return [ 'modifier' => self::MODIFIERS['grayscale'], 'params' => [] ];
    }

    public static function format(string $format)
    {
        if (in_array($format, self::VALID_FORMATS)) {
            $modifier = self::MODIFIERS['format'];
            $params = [ 'format' => $format ];

            $modifier = self::setModifierParams($modifier, $params);

            return [ 'modifier' => $modifier, 'params' => $params ];
        }

        return null;
    }

    public static function quality(int $quality)
    {
        if ($quality >= 0 && $quality <= 100) {
            $modifier = self::MODIFIERS['quality'];
            $params = [ 'quality' => $quality ];

            $modifier = self::setModifierParams($modifier, $params);

            return [ 'modifier' => $modifier, 'params' => $params ];
        }

        return null;
    }

    public static function preview(int $width, int $height = null, int $quality = 80)
    {
        if ($width < 0 || ($height && $height < 0) || ($quality < 0 || $quality > 100)) {
            return null;
        }

        $modifier = self::MODIFIERS['preview'];
        $params = [ 'width' => $width, 'height' => $height, 'quality' => $quality ];

        $modifier = self::setModifierParams($modifier, $params);

        return [ 'modifier' => $modifier, 'params' => $params ];
    }

    public static function thumbnail(int $width, int $height = null)
    {
        if ($width > 0 && (!$height || $height > 0)) {
            $modifier = self::MODIFIER_THUMBNAIL;
            $params = [ 'width' => $width, 'height' => $height ];

            $modifier = self::setModifierParams($modifier, $params);

            return [ 'modifier' => $modifier, 'params' => $params];
        }

        return null;
    }

    public static function setModifierParams($modifier, $params)
    {
        foreach ($params as $key => $value) {
            $modifier = str_replace('(:' . $key . ')', $value, $modifier);
        }

        return $modifier;
    }

    public static function listFromString(string $string)
    {
        $modifiers = Booklet\Uploader\Utils\StringUtils::listModifiersFromString($string);

        $modifiers_array = [];
        foreach ($modifiers as $modifier) {
            $modifier = ltrim($modifier, '-/');

            $modifier_params = explode('/', $modifier);
            $modifier_name = array_shift($modifier_params);

            $modifiers_array[$modifier_name] = $modifier_params;
        }

        return $modifiers_array;
    }
}
