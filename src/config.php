<?php
if (!file_exists('config.json')) {
    Response::error([ 'message' => 'Missing config.json file' ]);
}

$config = json_decode(file_get_contents('config.json'));
foreach ($config as $key => $value) {
    Config::set($key, $value);
}

Config::set('DIR', __DIR__);
Config::set('LOGS_DIRECTORY', dirname(__DIR__) . '/logs');
Config::set('IMAGE_MIME_TYPES', ['image/jpeg', 'image/png']);

if (!Config::get('BASE_URL')) {
    Response::error([ 'message' => 'BASE_URL is not set in config.json file' ]);
}
