<?php

class Log
{
    const TYPES = [ 'info', 'transform', 'warning', 'danger', 'error' ];

    public static function __callStatic($type, $arguments)
    {
        if (in_array($type, self::TYPES)) {
            $message = $arguments[0];
            $description = $arguments[1] ?? [];
            $options = $arguments[2] ?? [];

            return self::writeToFile([
                'type' => $type,
                'message' => $message,
                'description' => $description,
                'filename' => $options['filename'] ?? null,
            ]);
        }

        return false;
    }

    static private function getFilename(string $type)
    {
        return $type . '_' . date('Y-m-d') . '.txt';
    }

    private static function writeToFile(array $data)
    {
        $dir = Config::get('LOGS_DIRECTORY');

        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        $filename = $data['filename'] ?? self::getFilename($data['type']);
        $file_path = $dir . '/' . $filename;

        $text = "=============================================================";
        $text .= "========================================================\n\n";
        $text .= mb_strtoupper($data['type']) . " [" . date('Y-m-d H:i:s') . "]\n\n";
        $text .= $data['message'] . "\n";
        $text .= print_r($data['description'], true) . "\n";

        return file_put_contents($file_path, $text, FILE_APPEND);
    }
}
