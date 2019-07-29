<?php

$image = new Image($params['image']);

$transformations = $params['transformations'];

foreach ($transformations as $transformation => $transformation_params) {
    if (method_exists($image, $transformation)) {
        $image->{$transformation}($transformation_params);
    }
}

Log::info('Transform image checker', [
    'image' => $image,
    'input' => $params,
    'output' => $image->modifiers(),
]);

Response::success([
    'params' => $params,
    'image' => $image,
    'modifiers' => $image->modifiers()
]);
