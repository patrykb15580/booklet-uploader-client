<?php
$file_data = $_FILES[0];
$file = new CURLFile($file_data['tmp_name'], $file_data['type'], $file_data['name']);

$data = [];
$data[] = $file;
$data['file'] = [
    'name' => $file_data['name'],
    'type' => $file_data['type'],
    'size' => $file_data['size'],
];
$data['options'] = $params['options'] ?? [];

$method = Routing::getMethod('file_create');
$resource = Routing::generatePath('file_create');

$request = new Request($method, $resource, $data);
$response = $request->makeRequest();

$http_code = $response->http_code;
$response_body = $response->body();

if (empty($response_body->errors) && in_array($http_code, [200, 201])) {
    Response::success(['file' => $response_body->data]);
}

Log::error('Create file error', ['response' => $response_body]);
Response::error([
    'response' => $response,
    'response_body' => $response_body,
]);
