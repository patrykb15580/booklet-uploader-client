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
require_once __DIR__ . '/classes/ExifFixer.php';

// Utils
require_once __DIR__ . '/classes/utils/StringUtils.php';
require_once __DIR__ . '/classes/utils/CropUtils.php';

// Load helpers
require_once __DIR__ . '/helpers/CropHelper.php';
require_once __DIR__ . '/helpers/MimeHelper.php';

// Load config and routing
require_once __DIR__ . '/routes.php';
require_once __DIR__ . '/config.php';

$params = Request::params();
$action = $params['action'] ?? 'info';

require_once __DIR__ . '/actions/' . $action . '.php';
