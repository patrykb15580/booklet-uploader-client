<?php
$data = [ 'file' => $params['file'] ?? [] ];

$method = Routing::getMethod('file_update');
$resource = Routing::generatePath('file_update', [ 'hash_id' => $params['hash_id'] ]);

$request = new Request($method, $resource, $data);
$response = $request->makeRequest();

$response_body = $response->body();
$file = $response_body->data ?? false;

if ($file) {
    Response::success([ 'file' => $file ]);
}

Log::error('Update file error', [ 'response' => $response_body ]);
Response::error([
    'config' => Config::all(),
    'routing' => Routing::routes(),
    'method' => $method,
    'route' => $resource,
    'request' => $request,
    'response' => $response,
    'response_body' => $response_body
]);
