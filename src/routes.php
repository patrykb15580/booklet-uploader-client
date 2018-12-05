<?php
Routing::map('GET', '/file/[:hash_id]', 'file_info');
Routing::map('POST', '/file/create', 'file_create');
Routing::map('POST', '/file/[:hash_id]', 'file_update');
