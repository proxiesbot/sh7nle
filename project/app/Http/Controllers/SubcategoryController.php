<?php

namespace App\Http\Controllers;

use App\Http\FileUtils;
use App\Models\Category;
use App\Models\Section;
use App\Models\Subcategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\In;
use Inertia\Inertia;
use function Termwind\render;

class SubcategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'categoryId' => 'required|integer',
            'name' => 'required|string',
            'icon' => 'required',
        ]);

        $subcategory = new Subcategory();
        $subcategory->category_id = $validated['categoryId'];
        $subcategory->name = $validated['name'];
        if($request->description) $subcategory->description = $request->description;

        // save the Icon and the background Image
        $iconFile = $request->file('icon');
        $subcategory->icon = Storage::url($iconFile->storePublicly('images/subcategory'));

        $backgroundFile = $request->file('backgroundImage');
        if($backgroundFile) {
            $subcategory->background = Storage::url($backgroundFile->storePublicly('images/subcategory'));
        }

        $subcategory->save();

        return redirect()->route('category.getSubcategories', $validated['categoryId']);
    }

    /**
     * Display the specified resource.
     */
    public function show(Subcategory $subcategory)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Subcategory $subcategory)
    {
        return Inertia::render('Subcategory/Edit', [
            'category' => $subcategory->category,
            'subcategory' => $subcategory,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subcategory $subcategory)
    {
        if($request->name) $subcategory->name = $request->name;
        if($request->description) $subcategory->description = $request->description;

        // save the Icon and the background Image
        $iconFile = $request->file('icon');
        if($iconFile){
            // remove the old image from the storage
            FileUtils::deleteImage($subcategory->icon);

            $subcategory->icon = Storage::url($iconFile->storePublicly('images/subcategory'));
        }

        $backgroundFile = $request->file('backgroundImage');
        if($backgroundFile) {
            // remove the old image from the storage
            if($subcategory->background) FileUtils::deleteImage($subcategory->background);

            $subcategory->background = Storage::url($backgroundFile->storePublicly('images/subcategory'));
        }

        $subcategory->save();

        return redirect()->route('category.getSubcategories', $subcategory->category_id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subcategory $subcategory)
    {
        // remove the icon and background images from the storage
        FileUtils::deleteImage($subcategory->icon);
        if($subcategory->background) FileUtils::deleteImage($subcategory->background);

        $subcategory->delete();
    }

    public function addCard(Subcategory $subcategory){
        return Inertia::render('Card/Create', [
            'sections' => Section::all(),
            'category' => $subcategory->category,
            'subcategory' => $subcategory,
            'initialSubcategoryId' => $subcategory->id,
        ]);
    }

    public function getCards(Subcategory $subcategory){
        return Inertia::render('Cards/Index', [
            'category' => $subcategory->category,
            'subcategory' => $subcategory,
            'cards' => $subcategory->cards()->latest()->get(),
        ]);
    }

}
