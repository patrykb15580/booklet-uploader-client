<?php
$transformations = $params['transformations'] ?? [];

$file_data = $_FILES[0];
$modifiers = null;

if (MimeHelper::isImage($file_data['type'])) {
    // Fix Exifs
    $exif_fixer = new ExifFixer($file_data['tmp_name']);

    if (!$exif_fixer->fix()) {
        Log::error('Upload file error (fix exifs)', [ 'file' => $file_data ]);
        Response::error(['Fix exifs error'], 500);
    }

    // Crop to given proportions if required
    if (!empty($transformations['cropToProportions'])) {
        list($source_width, $source_height) = getimagesize($file_data['tmp_name']);
        $target_ratio = $transformations['cropToProportions'];

        $modifiers = Modifiers::cropToProportions($source_width, $source_height, $target_ratio)['modifier'];

        if (!$modifiers) {
            Log::error('Build modifiers error', [
                'transformations' => $transformations,
                'dimensions' => $source_width . 'x' . $source_height,
                'target_ratio' => $target_ratio,
            ]);
            Response::error(['Build modifiers error'], 500);
        }
    }
}

$file = new CURLFile($file_data['tmp_name'], $file_data['type'], $file_data['name']);

$data = [$file];
$data['file'] = [
    'name' => $file_data['name'],
    'type' => $file_data['type'],
    'size' => $file_data['size'],
    'modifiers' => $modifiers
];

$method = Routing::getMethod('file_create');
$resource = Routing::generatePath('file_create');

$request = new Request($method, $resource, $data);
$response = $request->makeRequest();

$response_body = $response->body();

if (isset($response_body->errors) || empty($response_body)) {
    Log::error('Create file error', ['response' => $response_body]);
    Response::error([
        'method' => $method,
        'route' => $resource,
        'request' => $request,
        'response' => $response,
        'response_body' => $response_body,
    ]);
}

Response::success([ 'file' => $response_body->data ]);
