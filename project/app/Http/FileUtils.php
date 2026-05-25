<?php

namespace App\Http;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Image;
use Intervention\Image\ImageManager;

class FileUtils
{
    public static function deleteImage($image){
        Storage::disk('public')->delete(Str::substr($image, strpos($image, 'images/')));
    }

}
