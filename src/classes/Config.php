<?php

abstract class Config
{
    public static $items = [];

    public static function init()
    {
        self::set('DIR', __DIR__);
        self::set('LOGS_DIRECTORY', dirname(__DIR__) . '/logs');
        self::set('BASE_URL', 'http://kreator.fotobum.test');
    }

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
