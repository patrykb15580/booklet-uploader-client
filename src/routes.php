<?php
Routing::map('GET', '/file/[:hash_id]', 'file_info');
Routing::map('POST', '/files', 'file_create');
Routing::map('POST', '/file/[:hash_id]', 'file_update');
