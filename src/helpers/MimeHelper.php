<?php

class MimeHelper
{
    public static function isImage($mime)
    {
        return in_array($mime, Config::get('IMAGE_MIME_TYPES'));
    }
}
