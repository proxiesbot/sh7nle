<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasFactory;
    protected $fillable = [ 'name', 'section_id', 'description', 'background', 'icon' ];

    public function cards(){
        return $this->hasMany(Card::class);
    }

    public function parent(){
        return $this->belongsTo(Section::class, 'section_id');
    }
    public function subSections(){
        return $this->hasMany(Section::class);
    }

}
