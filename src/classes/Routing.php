<?php

abstract class Routing
{
    static public $routes = [];

    public static function map(string $method, string $route, string $name)
    {
        self::$routes[] = [ 'method' => $method, 'route' => $route, 'name' => $name ];
    }

    public static function routes()
    {
        return self::$routes;
    }

    public static function route(string $route_name)
    {
        foreach (self::routes() as $route) {
            if ($route['name'] == $route_name) {
                return $route;
            }
        }

        return null;
    }

    public static function getMethod(string $route_name)
    {
        return self::route($route_name)['method'] ?? null;
    }

    public static function generatePath(string $route_name, array $route_params = [])
    {
        $route = self::route($route_name);

        if ($route) {
            $path = $route['route'];

            foreach ($route_params as $key => $value) {
                $path = str_replace('[:' . $key . ']', $value, $path);
            }

            return $path;
        }

        return null;
    }

    public static function generateUrl(string $route_name, array $route_params = [])
    {
        $path = self::path($route_name, $route_params);

        return ($path) ? Config::get('BASE_URL') . $path : null;
    }
}
