<?php
class Modifiers
{
    const SEPARATOR = '-/';
    const DEFAULT_QUALITY = 80;
    const VALID_FORMATS = ['jpg', 'jpeg', 'png', 'tiff'];

    public static function resize(int $width, int $height)
    {
        if ($width < 0 || $height < 0) {
            return null;
        }

        return [
            'modifier' => self::SEPARATOR . 'resize/' . $width . 'x' . $height . '/',
            'params' => [ 'width' => $width, 'height' => $height ]
        ];
    }

    public static function rotate(int $angle)
    {
        if ($angle == 0) {
            return null;
        }

        if ($angle < 0) {
            $angle += ceil($angle / 360) * 360;
        }

        if ($angle >= 360) {
            $angle -= floor($angle / 360) * 360;
        }

        return [
            'modifier' => self::SEPARATOR . 'rotate/' . $angle . '/',
            'params' => [ 'angle' => $angle ]
        ];
    }

    public static function crop(int $width, int $height, int $x, int $y)
    {
        if ($width < 0) { $width = 0; }
        if ($height < 0) { $height = 0; }
        if ($x < 0) { $x = 0; }
        if ($y < 0) { $y = 0; }

        return [
            'modifier' => self::SEPARATOR . 'crop/' . $width . 'x' . $height . '/' . $x . ',' . $y . '/',
            'params' => [
                'width' => $width,
                'height' => $height,
                'x' => $x,
                'y' => $y
            ]
        ];
    }

    public static function cropToProportions(int $source_width, int $source_height, float $target_ratio)
    {
        $crop_params = CropHelper::calcCropParamsForCropToProportionsTransformation($source_width, $source_height, $target_ratio);

        if ($crop_params) {
            list($width, $height, $x, $y) = $crop_params;

            return self::crop($width, $height, $x, $y);
        }

        return null;
    }

    public static function mirror()
    {
        return [ 'modifier' => self::SEPARATOR . 'mirror/', 'params' => [] ];
    }

    public static function flip()
    {
        return [ 'modifier' => self::SEPARATOR . 'flip/', 'params' => [] ];
    }

    public static function rounded(int $radius = 30)
    {
        if ($radius > 0) {

            return [ 'modifier' => self::SEPARATOR . 'rounded/' . $radius . '/', 'params' => [ 'radius' => $radius ] ];
        }

        return null;
    }

    public static function negative()
    {
        return [ 'modifier' => self::SEPARATOR . 'negative/', 'params' => [] ];
    }

    public static function grayscale()
    {
        return [ 'modifier' => self::SEPARATOR . 'grayscale/', 'params' => [] ];
    }

    public static function format(string $format)
    {
        if (in_array($format, self::VALID_FORMATS)) {
            return [ 'modifier' => self::SEPARATOR . 'format/' . $format . '/', 'params' => [ 'format' => $format ] ];
        }

        return null;
    }

    public static function quality(int $quality)
    {
        if ($quality >= 0 && $quality <= 100) {
            return [ 'modifier' => self::SEPARATOR . 'quality/' . $quality . '/', 'params' => [ 'quality' => $quality ] ];
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
            return [
                'modifier' => self::SEPARATOR . 'thumbnail/' . $width . 'x' . $height . '/',
                'params' => [
                    'width' => $width,
                    'height' => $height,
                ]
            ];
        }

        return null;
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

/*<?php

class Modifiers
{
    const SEPARATOR = '-/';
    const DEFAULT_QUALITY = 80;
    const VALID_FORMATS = ['jpg', 'jpeg', 'png', 'tiff'];
    const PROPORTIONS_TOLLERANCE = 0.01;

    public static function resize(array $params)
    {
        $width = $params['width'];
        $height = $params['height'];

        if ($width < 0 || $height < 0) {
            return null;
        }

        return self::SEPARATOR . 'resize/' . $width . 'x' . $height . '/';
    }

    public static function rotate(array $params)
    {
        $angle = $params['angle'];

        if ($angle == 0) {
            return null;
        }

        if ($angle < 0) {
            $angle += ceil($angle / 360) * 360;
        }

        if ($angle >= 360) {
            $angle -= floor($angle / 360) * 360;
        }

        return self::SEPARATOR . 'rotate/' . $angle . '/';
    }

    public static function crop(array $params)
    {
        $width = $params['width'];
        $height = $params['height'];
        $x = $params['x'];
        $y = $params['y'];

        if ($width < 0) { $width = 0; }
        if ($height < 0) { $height = 0; }
        if ($x < 0) { $x = 0; }
        if ($y < 0) { $y = 0; }

        return self::SEPARATOR . 'crop/' . $width . 'x' . $height . '/' . $x . ',' . $y . '/';
    }

    public static function cropToProportions(array $params)
    {
        $source_width = $params['source_width'];
        $source_height = $params['source_height'];
        $target_ratio = $params['target_ratio'];

        $width = $source_width;
        $height = $source_height;

        $source_ratio = $width / $height;

        $x = 0;
        $y = 0;

        if ($source_ratio !== $target_ratio) {
            if ($source_ratio > $target_ratio) {
                $width = round($height * $target_ratio);
                $x = round(($source_width - $width) / 2);
            } else {
                $height = round($width / $target_ratio);
                $y = round(($source_height - $height) / 2);
            }
        }

        $image_ratio = $width / $height;

        if (abs($image_ratio - $target_ratio) > self::PROPORTIONS_TOLLERANCE) {
            return false;
        }

        return self::crop($width, $height, $x, $y);
    }

    public static function mirror()
    {
        return self::SEPARATOR . 'mirror/';
    }

    public static function flip()
    {
        return self::SEPARATOR . 'flip/';
    }

    public static function rounded(array $params)
    {
        $radius = $params['radius'] ?? 30;

        if ($radius > 0) {
            return self::SEPARATOR . 'rounded/' . $radius . '/';
        }

        return null;
    }

    public static function negative()
    {
        return self::SEPARATOR . 'negative/';
    }

    public static function grayscale()
    {
        return self::SEPARATOR . 'grayscale/';
    }

    public static function format(array $params)
    {
        $format = $params['format'];

        if (in_array($format, self::VALID_FORMATS)) {
            return self::SEPARATOR . 'format/' . $format . '/';
        }

        return null;
    }

    public static function quality(array $params)
    {
        $quality = $params['quality'];

        if ($quality >= 0 && $quality <= 100) {
            return self::SEPARATOR . 'quality/' . $quality . '/';
        }

        return null;
    }

    public static function preview(array $params)
    {
        $width = $params['width'];
        $height = $params['height'];
        $quality = $params['quality'] ?? 80;

        if ($width < 0 || ($height && $height < 0) || ($quality < 0 || $quality > 100)) {
            return null;
        }

        return self::SEPARATOR . 'preview/' . $width . 'x' . $height . '/' . $quality . '/';
    }

    public static function thumbnail(array $params)
    {
        $width = $params['width'];
        $height = $params['height'] ?? null;

        if ($width > 0 && (!$height || $height > 0)) {
            return self::SEPARATOR . 'thumbnail/' . $width . 'x' . $height . '/';
        }

        return null;
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
}*/
