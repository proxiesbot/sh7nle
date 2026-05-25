<?php

namespace App\Http\Controllers;

use App\Models\ContentText;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentTextController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:190', 'regex:/^[A-Za-z0-9_.:-]+$/'],
            'text' => ['required', 'string', 'max:5000'],
            'defaultText' => ['nullable', 'string', 'max:5000'],
            'context' => ['nullable', 'string', 'max:190'],
        ]);

        $contentText = ContentText::query()->updateOrCreate(
            ['key' => $validated['key']],
            [
                'text' => $validated['text'],
                'default_text' => $validated['defaultText'] ?? $validated['text'],
                'context' => $validated['context'] ?? null,
            ],
        );

        return response()->json([
            'success' => true,
            'key' => $contentText->key,
            'text' => $contentText->text,
        ]);
    }
}
