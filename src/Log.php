<?php

class Log
{
    const LOGS_FILE_NAME = 'logs.txt';
    const INFO_LOGS_FILE_NAME = 'info.txt';
    const ERROR_LOGS_FILE_NAME = 'errors.txt';

    public static function info(string $message, $description = '')
    {
        return self::writeToFile([
            'type' => 'INFO',
            'message' => $message,
            'description' => $description
        ]);
    }

    public static function error(string $message, $description = '')
    {
        return self::writeToFile([
            'type' => 'ERROR',
            'message' => $message,
            'description' => $description
        ]);
    }

    static private function getFilename(string $type)
    {
        $filename = self::LOGS_FILE_NAME;

        if ($type == 'INFO') {
            $filename = self::INFO_LOGS_FILE_NAME;
        }

        if ($type == 'ERROR') {
            $filename = self::ERROR_LOGS_FILE_NAME;
        }

        return $filename;
    }

    private static function writeToFile(array $data)
    {
        $dir = Config::get('LOGS_DIRECTORY');

        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        $filename = $dir . '/' . self::getFilename($data['type']);

        $text = "=============================================================";
        $text .= "========================================================\n\n";
        $text .= $data['type'] . " [" . date('Y-m-d H:i:s') . "]\n\n";
        $text .= $data['message'] . "\n";
        $text .= print_r($data['description'], true) . "\n";

        return file_put_contents($filename, $text, FILE_APPEND);
    }
}
