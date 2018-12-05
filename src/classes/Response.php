<?php

class Response
{
    public $http_code;
    public $header;
    public $body;

    public function __construct($http_code, $header, $body)
    {
        $this->http_code = $http_code;
        $this->header = $header;
        $this->body = $body;
    }

    public function body()
    {
        return json_decode($this->body);
    }

    public static function success($data)
    {
        $data = [ 'data' => $data ];

        return self::response($data, 200);
    }

    public static function error($data, $code = 400)
    {
        $data = [ 'errors' => $data ];

        return self::response($data, $code);
    }

    private static function response($data, $code)
    {
        $data['http_code'] = $code;

        header('Content-type: application/json; charset=utf-8');
        http_response_code($code);

        exit(json_encode($data));
    }
}
