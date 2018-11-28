<?php

if (!defined('__DIR__')) {
    define('__DIR__', dirname(__FILE__));
}

include __DIR__ . '/Config.php';
include __DIR__ . '/Response.php';
include __DIR__ . '/Log.php';

Config::set('DIR', __DIR__);
Config::set('LOGS_DIRECTORY', dirname(__DIR__) . '/logs');

Response::success([]);
