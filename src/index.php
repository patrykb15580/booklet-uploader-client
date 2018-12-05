<?php

if (!defined('__DIR__')) {
    define('__DIR__', dirname(__FILE__));
}

// Load classes
require_once __DIR__ . '/classes/Config.php';
require_once __DIR__ . '/classes/Routing.php';
require_once __DIR__ . '/classes/Request.php';
require_once __DIR__ . '/classes/Response.php';
require_once __DIR__ . '/classes/Log.php';
require_once __DIR__ . '/classes/Modifiers.php';
require_once __DIR__ . '/classes/Image.php';


// Load helpers
require_once __DIR__ . '/helpers/CropHelper.php';

require_once __DIR__ . '/routes.php';

Config::set('DIR', __DIR__);
Config::set('LOGS_DIRECTORY', dirname(__DIR__) . '/logs');
Config::set('BASE_URL', 'http://kreator.fotobum.test');
Config::set('IMAGE_MIME_TYPES', ['image/jpeg', 'image/png', 'image/tiff']);

$params = Request::params();
$action = $params['action'] ?? 'info';

require_once __DIR__ . '/actions/' . $action . '.php';
