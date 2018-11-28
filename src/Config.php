<?php

abstract class Config
{
    public static $items = [];

    public static function set($key, $value)
    {
        self::$items[$key] = $value;
    }

    public static function get($key)
    {
        return self::$items[$key] ?? null;
    }

    public static function all()
    {
        return self::$items;
    }
}
