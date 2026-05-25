<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_texts', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('default_text')->nullable();
            $table->text('text');
            $table->string('context')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_texts');
    }
};
