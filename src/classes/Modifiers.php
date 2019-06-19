<?php
class Modifiers
{
    const SEPARATOR = '-/';
    const DEFAULT_QUALITY = 80;
    const VALID_FORMATS = ['jpg', 'jpeg', 'png', 'tiff'];

    const MODIFIERS_ORDER = [
        'rotate',
        'crop',
        'resize',
        'rounded',
        'mirror',
        'flip',
        'negative',
        'grayscale',
        'format',
        'quality',
        'preview',
        'thumbnail',
    ];

    const MODIFIER_RESIZE = '-/resize/(:width)x(:height)/';
    const MODIFIER_ROTATE = '-/rotate/(:angle)/';
    const MODIFIER_CROP = '-/crop/(:width)x(:height)/(:x),(:y)/';
    const MODIFIER_MIRROR = '-/mirror/';
    const MODIFIER_FLIP = '-/flip/';
    const MODIFIER_ROUNDED = '-/rounded/(:radius)/';
    const MODIFIER_NEGATIVE = '-/negative/';
    const MODIFIER_GRAYSCALE = '-/grayscale/';
    const MODIFIER_FORMAT = '-/format/(:format)/';
    const MODIFIER_QUALITY = '-/quality/(:quality)/';
    const MODIFIER_PREVIEW = '-/preview/(:width)x(:height)/(:quality)/';
    const MODIFIER_THUMBNAIL = '-/thumbnail/(:width)x(:height)/';

    public static function resize(int $width, int $height)
    {
        $modifier = self::MODIFIER_RESIZE;
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

        $modifier = self::MODIFIER_ROTATE;
        $params = [ 'angle' => $angle ];

        $modifier = self::setModifierParams($modifier, $params);

        return [ 'modifier' => $modifier, 'params' => $params ];
    }

    public static function crop(int $width, int $height, int $x, int $y)
    {
        $modifier = self::MODIFIER_CROP;
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
        return [ 'modifier' => self::MODIFIER_MIRROR, 'params' => [] ];
    }

    public static function flip()
    {
        return [ 'modifier' => self::MODIFIER_MIRROR, 'params' => [] ];
    }

    public static function rounded(int $radius = 30)
    {
        if ($radius > 0) {
            $modifier = self::MODIFIER_ROUNDED;
            $params = [ 'radius' => $radius ];

            $modifier = self::setModifierParams($modifier, $params);

            return [ 'modifier' => $modifier, 'params' => $params ];
        }

        return null;
    }

    public static function negative()
    {
        return [ 'modifier' => self::MODIFIER_NEGATIVE, 'params' => [] ];
    }

    public static function grayscale()
    {
        return [ 'modifier' => self::MODIFIER_GRAYSCALE, 'params' => [] ];
    }

    public static function format(string $format)
    {
        if (in_array($format, self::VALID_FORMATS)) {
            $modifier = self::MODIFIER_FORMAT;
            $params = [ 'format' => $format ];

            $modifier = self::setModifierParams($modifier, $params);

            return [ 'modifier' => $modifier, 'params' => $params ];
        }

        return null;
    }

    public static function quality(int $quality)
    {
        if ($quality >= 0 && $quality <= 100) {
            $modifier = self::MODIFIER_QUALITY;
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

        return [
            'modifier' => self::SEPARATOR . 'preview/' . $width . 'x' . $height . '/' . $quality . '/',
            'params' => [
                'width' => $width,
                'height' => $height,
                'quality' => $quality,
            ]
        ];
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
        $modifiers = explode('-/', $string);

        array_shift($modifiers);

        $modifiers_array = [];
        foreach ($modifiers as $modifier) {
            $modifier_parts = explode('/', $modifier);
            $modifier_name = array_shift($modifier_parts);

            $modifiers_array[$modifier_name] = [];

            foreach ($modifier_parts as $modifier_param) {
                if (!empty($modifier_param) && !is_bool($modifier_param)) {
                    $modifiers_array[$modifier_name][] = $modifier_param;
                }
            }
        }

        return $modifiers_array;
    }
}
