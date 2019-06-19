<?php

class CropHelper
{
    const PROPORTIONS_TOLLERANCE = 0.01;

    public static function aspectRatioStringToProportions(string $aspect_ratio)
    {
        $aspect_ratio = str_replace(':', '/', $aspect_ratio);

        if (preg_match('/\d+\/\d+/i', $aspect_ratio)) {
            list($w, $h) = explode('/', $aspect_ratio);

            return $w / $h;
        }

        return false;
    }

    public static function calcCropParamsForCropToProportionsTransformation(int $source_width, int $source_height, $target_ratio)
    {
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
            Log::error('Calculate crop params error', [
                'source_width' => $source_width,
                'source_height' => $source_height,
                'target_ratio' => $target_ratio,
                'width' => $width,
                'height' => $height,
                'image_ratio' => $image_ratio,
                'x' => $x,
                'y' => $y,
                'diff' => abs($image_ratio - $target_ratio)
            ]);

            return false;
        }

        Log::info('Crop params check', [ $width, $height, $x, $y ]);

        return [ $width, $height, $x, $y ];
    }
}
