<?php
$transformations = $params['options'] ?? [];

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
    if (!empty($transformations['crop'])) {
        $crop_ratios = explode(',', $transformations['crop']);

        list($image_width, $image_height) = getimagesize($file_data['tmp_name']);
        $image_proportions = $image_width / $image_height;

        $target_ratio = $crop_ratios[0];

        foreach ($crop_ratios as $crop_ratio) {
            if (!Booklet\Uploader\Utils\StringUtils::isAspectRatioString($crop_ratio)) {
                $target_ratio = $crop_ratio;
                break;
            }

            $proportions = Booklet\Uploader\Utils\CropUtils::aspectRatioStringToProportions($crop_ratio);

            if ($proportions && $proportions < 1 && $image_proportions < 1) {
                $target_ratio = $crop_ratio;
                break;
            }

            if ($proportions && $proportions > 1 && $image_proportions > 1) {
                $target_ratio = $crop_ratio;
                break;
            }
        }

        if (Booklet\Uploader\Utils\StringUtils::isAspectRatioString($target_ratio)) {
            $modifier = Modifiers::cropToProportions($image_width, $image_height, $target_ratio);
            $modifiers = $modifier['modifier'];
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
