<?php

class Image
{
    public $hash_id;
    public $filename;
    public $mime;
    public $size;
    public $width;
    public $height;
    public $modifiers;

    const DEFAULT_MODIFIERS = [
        'rotate' => false,
        'crop' => false,
        'mirror' => false,
        'flip' => false,
        'grayscale' => false,
    ];
    const MODIFIERS_ORDER = ['rotate', 'crop', 'mirror', 'flip', 'grayscale'];

    public function __construct(array $attributes)
    {
        foreach ($this->fields() as $key => $value) {
            $this->$key = $value['default'] ?? null;
        }

        foreach ($attributes as $key => $value) {
            $this->$key = $value;
        }
    }

    public function fields()
    {
        return [
            'hash_id' => ['default' => null],
            'filename' => ['default' => null],
            'mime' => ['default' => null],
            'size' => ['default' => null],
            'width' => ['default' => null],
            'height' => ['default' => null],
            'modifiers' => ['default' => self::DEFAULT_MODIFIERS],
        ];
    }

    public function crop($params)
    {
        if (isset($params['aspect_ratio'])) {
            $angle = $this->modifiers['rotate']['params']['angle'] ?? 0;

            $aspect_ratio = $params['aspect_ratio'];
            $width = $this->width;
            $height = $this->height;

            if ($angle == 90 || $angle == 270) {
                $width = $this->height;
                $height = $this->width;
            }

            $this->modifiers['crop'] = ($aspect_ratio) ? Modifiers::cropToProportions($width, $height, $aspect_ratio) : false;

            Log::info('Crop to proportions checker', [
                'target_ratio' => $aspect_ratio,
                'original_dimensions' => $this->width . 'x' . $this->height,
                'source_dimensions' => $width . 'x' . $height,
                'angle' => $angle,
                'modifier' => $this->modifiers['crop'],
            ]);
        } else {
            $width = $params['width'] ?? false;
            $height = $params['height'] ?? false;
            $x = $params['x'] ?? false;
            $y = $params['y'] ?? false;

            if ($x < 0 && $y < 0 && $width == $this->width && $height == $this->height) {
                return false;
            }

            if ($width && $height && $x !== false && $y !== false) {
                $this->modifiers['crop'] = Modifiers::crop($width, $height, $x, $y);
            }

            Log::info('Crop checker', [
                'target_ratio' => $aspect_ratio,
                'original_dimensions' => $this->width . 'x' . $this->height,
                'source_dimensions' => $width . 'x' . $height . ' (' . $x . 'x' . $y . ')',
                'modifier' => $this->modifiers['crop'],
            ]);
        }
    }

    public function rotate($angle)
    {
        if (!is_int($angle) || $angle < 0) {
            return false;
        }

        if ($angle >= 360) {
            $angle -= floor($angle / 360) * 360;
        }

        $this->modifiers['rotate'] = ($angle > 0) ? Modifiers::rotate($angle) : false;
    }

    public function mirror($active)
    {
        $this->modifiers['mirror'] = ($active) ? Modifiers::mirror() : false;
    }

    public function flip($active)
    {
        $this->modifiers['flip'] = ($active) ? Modifiers::flip() : false;
    }

    public function grayscale($active)
    {
        $this->modifiers['grayscale'] = ($active) ? Modifiers::grayscale() : false;
    }

    public function modifiers()
    {
        $modifiers = '';

        foreach (self::MODIFIERS_ORDER as $modifier_name) {
            $modifier = $this->modifiers[$modifier_name] ?? null;
            $modifiers .= $modifier['modifier'] ?? null;
        }

        return $modifiers;
    }
}
