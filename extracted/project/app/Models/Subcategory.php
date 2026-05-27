<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subcategory extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'category_id', 'background', 'icon', 'description'];

    public function category(){
        return $this->belongsTo(Category::class);
    }

    public function cards(){
        return $this->hasMany(Card::class);
    }
}
