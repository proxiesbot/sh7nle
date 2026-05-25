<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Section;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Schema;

class SeoController extends Controller
{
    public function robots(): Response
    {
        $content = implode("\n", [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin/',
            'Disallow: /users',
            'Disallow: /payment',
            'Disallow: /deposit',
            'Sitemap: '.url('/sitemap.xml'),
            '',
        ]);

        return response($content, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function sitemap(): Response
    {
        $urls = collect([
            ['loc' => url('/main'), 'priority' => '1.0', 'changefreq' => 'daily'],
            ['loc' => url('/about'), 'priority' => '0.5', 'changefreq' => 'monthly'],
        ]);

        if (Schema::hasTable('sections')) {
            Section::query()->select('id', 'updated_at')->orderBy('id')->chunkById(200, function ($sections) use ($urls) {
                foreach ($sections as $section) {
                    $urls->push([
                        'loc' => route('sections.show', $section, false),
                        'priority' => '0.8',
                        'changefreq' => 'daily',
                        'lastmod' => optional($section->updated_at)->toAtomString(),
                    ]);
                }
            });
        }

        if (Schema::hasTable('cards')) {
            Card::query()
                ->where('is_active', true)
                ->whereNotNull('section_id')
                ->select('id', 'section_id', 'updated_at')
                ->orderBy('id')
                ->chunkById(300, function ($cards) use ($urls) {
                    foreach ($cards as $card) {
                        $urls->push([
                            'loc' => url('/sections/'.$card->section_id.'?product='.$card->id),
                            'priority' => '0.7',
                            'changefreq' => 'weekly',
                            'lastmod' => optional($card->updated_at)->toAtomString(),
                        ]);
                    }
                });
        }

        $xml = view('seo.sitemap', ['urls' => $urls])->render();

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}
