<?php
namespace Booklet\Uploader\Utils;

class StringUtils
{
    public static function isAspectRatioString($string)
    {
        return (is_string($string) && preg_match('/\d+\/\d+/i', $string)) ? true : false;
    }
}
