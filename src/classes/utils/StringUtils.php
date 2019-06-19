<?php
namespace Booklet\Uploader\Utils;

use Modifiers;

class StringUtils
{
    public static function isAspectRatioString($string)
    {
        return (is_string($string) && preg_match('/\d+\/\d+/i', $string)) ? true : false;
    }

    public static function listModifiersFromString(string $string)
    {
        $patterns = Modifiers::MODIFIER_PATTERNS;

        foreach ($patterns as $key => $pattern) {
            $patterns[$key] = str_replace(['/^', '$/'], '', $pattern);
        }

        $pattern = '/^' . join('|', $patterns) . '$/';

        preg_match_all($pattern, $string, $modifiers);

        return $modifiers[0] ?? [];
    }

    public static function isValidModifier(string $modifier)
    {
        foreach (Modifiers::MODIFIER_PATTERNS as $pattern) {
            if (preg_match($pattern, $modifier)) {
                return true;
            }
        }

        return false;
    }
}
