<?php

class Response
{
    public static function success($data)
    {
        $data = [ 'data' => $data ];

        return self::resp($data, 200);
    }

    public static function error($data, $code = 400)
    {
        $data = [ 'errors' => $data ];

        return self::resp($data, $code);
    }

    private static function resp($data, $code)
    {
        $data['http_code'] = $code;

        header('Content-type: application/json; charset=utf-8');
        http_response_code($code);

        exit(json_encode($data));
    }
}
