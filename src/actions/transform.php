<?php

$image = new Image($params['image']);

$transformations = $params['transformations'];

foreach ($transformations as $transformation => $transformation_params) {
    if (method_exists($image, $transformation)) {
        $image->{$transformation}($transformation_params);
    }
}

Response::success([
    'params' => $params,
    'image' => $image,
    'modifiers' => $image->modifiers()
]);
