<?php
namespace Booklet\Uploader\Utils;

class CropUtils
{
    public static function aspectRatioStringToProportions($string)
    {
        if (is_string($string)) {
            $string = str_replace(':', '/', $string);

            if (StringUtils::isAspectRatioString($string)) {
                list($w, $h) = explode('/', $string);

                return intval($w) / intval($h);
            }
        }

        return false;
    }
}
