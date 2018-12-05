<?php

$method = Routing::getMethod('file_info');
$resource = Routing::generatePath('file_info', ['hash_id' => $params['hash_id']]);

$request = new Request($method, $resource);
$response = $request->makeRequest();

$response_body = $response->body();
$file = $response_body->data ?? null;

if ($file) {
    Response::success([
        'file' => $file,
        'modifiers' => Modifiers::listFromString($file->modifiers)
    ]);
}

Log::error('Create file error', [ 'response' => $response_body ]);
Response::error([
    'config' => Config::all(),
    'routing' => Routing::routes(),
    'method' => $method,
    'route' => $resource,
    'request' => $request,
    'response' => $response,
    'response_body' => $response_body
]);
