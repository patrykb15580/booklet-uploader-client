<?php
$transformations = $params['transformations'] ?? [];

$file_data = $_FILES[0];
$file = new CURLFile( $file_data['tmp_name'], $file_data['type'], $file_data['name'] );

$data = [ $file ];
$data['file'] = [
    'name' => $file_data['name'],
    'type' => $file_data['type'],
    'size' => $file_data['size'],
];

// If is editable image
if (in_array($file_data['type'], Config::get('IMAGE_MIME_TYPES'))) {

    // Generate crop modifier if required
    if (!empty($transformations['cropToProportions'])) {
        list($source_width, $source_height) = getimagesize($file_data['tmp_name']);
        $target_ratio = $transformations['cropToProportions'];

        $modifier = Modifiers::cropToProportions($source_width, $source_height, $target_ratio)['modifier'];

        if (!$modifier) {
            Log::error('Build modifiers error', [
                'transformations' => $transformations,
                'source_width' => $source_width,
                'source' => $source_height,
                'target' => $target_ratio,
            ]);
            Response::error([ 'Build modifiers error' ], 500);
        }

        $data['file']['modifiers'] = $modifier;
    }
}

$method = Routing::getMethod('file_create');
$resource = Routing::generatePath('file_create');

$request = new Request($method, $resource, $data);
$response = $request->makeRequest();

$response_body = $response->body();

if (isset($response_body->errors)) {
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
}

Response::success([ 'file' => $response_body->data ]);
