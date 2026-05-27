<?php

namespace App\Http\Controllers;

use App\Http\FileUtils;
use App\Models\Card;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Section::where('section_id', 0)->get();
    }

    public function adminIndex()
    {
        return Inertia::render('Section/IndexAdmin', [
            'sections' => Section::where('section_id', 0)
                ->withCount(['subSections', 'cards'])
                ->latest()
                ->paginate(10),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render("Sections/Create");
    }

    public function manage(Request $request, Section $section)
    {
        $section->load(['parent']);

        $cardSearch = trim((string) $request->query('card_search', ''));

        $cardsQuery = $section->cards()
            ->select([
                'id',
                'name',
                'section_id',
                'sort_order',
                'subcategory_id',
                'provider_source_id',
                'provider_product_id',
                'price',
                'cost_price',
                'provider_cost_price',
                'is_active',
                'manual_unavailable',
            ])
            ->when($cardSearch !== '', function ($query) use ($cardSearch) {
                $query->where(function ($inner) use ($cardSearch) {
                    $inner->where('name', 'like', "%{$cardSearch}%")
                        ->orWhere('provider_product_id', 'like', "%{$cardSearch}%");
                });
            })
            ->orderByRaw('CASE WHEN COALESCE(sort_order, 0) > 0 THEN 0 ELSE 1 END ASC')
            ->orderByRaw('COALESCE(sort_order, 0) ASC')
            ->orderByRaw('CAST(price AS DECIMAL(30,8)) ASC')
            ->orderBy('name');

        return Inertia::render('Sections/Manage', [
            'section' => $section,
            'subSections' => $section->subSections()->withCount(['subSections', 'cards'])->orderBy('name')->get(),
            'cards' => $cardsQuery->paginate(25, ['*'], 'cards_page')->withQueryString(),
            'cardFilters' => [
                'search' => $cardSearch,
            ],
            'sectionOptions' => $this->sectionOptions(),
        ]);
    }


    protected function sectionOptions(): array
    {
        $sections = Section::query()
            ->orderBy('section_id')
            ->orderBy('name')
            ->get(['id', 'name', 'section_id']);

        $byParent = $sections->groupBy(fn ($item) => (int) ($item->section_id ?? 0));
        $result = [];

        $walk = function (int $parentId, string $prefix = '') use (&$walk, $byParent, &$result) {
            foreach ($byParent->get($parentId, collect()) as $section) {
                $path = trim($prefix === '' ? $section->name : $prefix . ' / ' . $section->name);
                $result[] = [
                    'id' => $section->id,
                    'name' => $section->name,
                    'path' => $path,
                    'parent_id' => $section->section_id,
                ];

                $walk((int) $section->id, $path);
            }
        };

        $walk(0);

        return $result;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
           'name' => 'required',
           'icon' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $section = new Section();
        $section->name = $request->name;
        if($request->description) $section->description = $request->description;
        // save the Icon and the background Image
        $iconFile = $request->file('icon');
        $section->icon = Storage::url($iconFile->storePublicly('images/sections'));

        $backgroundFile = $request->file('backgroundImage');
        if($backgroundFile) {
            $section->background = Storage::url($backgroundFile->storePublicly('images/sections'));
        }
        if($request->sectionId) $section->section_id = $request->sectionId;

        $section->save();

        if($request->sectionId){
            return redirect()->route('sections.show', $request->sectionId);
        }
        else {
            return redirect()->route('sections.main');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Section $section)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Section $section)
    {
        return Inertia::render('Sections/Edit', [
            'section' => $section,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => 'required',
//            'icon' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $section->name = $request->name;
        if($request->description) $section->description = $request->description;
        // save the Icon and the background Image
        $iconFile = $request->file('icon');
        if($iconFile) {
            // remove the old image from the storage
            FileUtils::deleteImage($section->icon);

            $section->icon = Storage::url($iconFile->storePublicly('images/sections'));
        }

        $backgroundFile = $request->file('backgroundImage');
        if($backgroundFile) {
            // remove the old image from the storage
            if($section->background) FileUtils::deleteImage($section->background);

            $section->background = Storage::url($backgroundFile->storePublicly('images/sections'));
        }
//        if($request->sectionId) $section->section_id = $request->sectionId;

        $section->save();

        if($section->section_id){
            return redirect()->route('sections.show', $section->section_id);
        }
        else {
            return redirect()->route('sections.main');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Section $section)
    {
        if(!!$section->subSections->count() > 0){
            return;
        }
        if(!!$section->cards->count() > 0){
            return;
        }

        // remove the icon and background images from the storage
        FileUtils::deleteImage($section->icon);
        if($section->background) FileUtils::deleteImage($section->background);

        $section->delete();
    }

    public function getChildren(Request $request, Section $section){
        $section->load('parent', 'subSections');

        $visibleSubSections = $section->subSections()
            ->withCount([
                'subSections',
                'cards as active_cards_count' => fn ($query) => $query->where('is_active', true),
            ])
            ->orderBy('name')
            ->get()
            ->filter(fn ($item) => ((int) $item->sub_sections_count + (int) $item->active_cards_count) > 0)
            ->values();

        return Inertia::render('Sections/Index', [
            'parentSection' => $section,
            'sections' => $visibleSubSections,
            // Important: imported provider products can be attached directly to a section that also has child sections.
            // The store must show both child sections and direct active products instead of hiding products until all child sections are gone.
            'cards' => $section->cards()->where('is_active', true)->orderByRaw('CASE WHEN COALESCE(sort_order, 0) > 0 THEN 0 ELSE 1 END ASC')->orderByRaw('COALESCE(sort_order, 0) ASC')->orderByRaw('CAST(price AS DECIMAL(30,8)) ASC')->orderBy('name')->get(),
        ]);
    }

    public function main(){
        $visibleMainSections = Section::where('section_id', 0)
            ->withCount([
                'subSections',
                'cards as active_cards_count' => fn ($query) => $query->where('is_active', true),
            ])
            ->orderBy('name')
            ->get()
            ->filter(fn ($item) => ((int) $item->sub_sections_count + (int) $item->active_cards_count) > 0)
            ->values();

        return Inertia::render('Sections/Index', [
            'sections' => $visibleMainSections,
            'cards' => collect(),
        ]);
    }

    public function createSubSection(Request $request, Section $section){
        return Inertia::render("Sections/Create", [
            'section' => $section,
        ]);
    }

    public function createCard(Request $request, Section $section){
        return Inertia::render('Card/Create', [
            'sections' => Section::all(),
            'initialSectionId' => $section->id,
        ]);
    }



}
