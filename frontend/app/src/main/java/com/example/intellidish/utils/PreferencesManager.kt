package com.example.intellidish.utils

import android.content.Context
import android.content.SharedPreferences
import com.example.intellidish.models.Recipe

class PreferencesManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "IntelliDishPrefs", Context.MODE_PRIVATE
    )
    private val MAX_VALUE = 10

    fun saveCuisinePreference(cuisine: String) {
        prefs.edit().putString(PREF_CUISINE, cuisine).apply()
    }

    fun getSavedCuisine(): String {
        return prefs.getString(PREF_CUISINE, "Any") ?: "Any"
    }

    fun savePrepTime(value: Int) {
        prefs.edit().putInt(PREF_PREP_TIME, value.coerceIn(0, MAX_VALUE)).apply()
    }

    fun getSavedPrepTime(): Int {
        return prefs.getInt(PREF_PREP_TIME, 0).coerceIn(0, MAX_VALUE)
    }

    fun saveComplexity(value: Int) {
        prefs.edit().putInt(PREF_COMPLEXITY, value.coerceIn(0, MAX_VALUE)).apply()
    }

    fun getSavedComplexity(): Int {
        return prefs.getInt(PREF_COMPLEXITY, 0).coerceIn(0, MAX_VALUE)
    }

    fun saveCalories(value: Int) {
        prefs.edit().putInt(PREF_CALORIES, value.coerceIn(0, MAX_VALUE)).apply()
    }

    fun getSavedCalories(): Int {
        return prefs.getInt(PREF_CALORIES, 0).coerceIn(0, MAX_VALUE)
    }

    fun saveNutrition(value: Int) {
        prefs.edit().putInt(PREF_NUTRITION, value.coerceIn(0, MAX_VALUE)).apply()
    }

    fun getSavedNutrition(): Int {
        return prefs.getInt(PREF_NUTRITION, 0).coerceIn(0, MAX_VALUE)
    }

    fun saveSpice(value: Int) {
        prefs.edit().putInt(PREF_SPICE, value.coerceIn(0, MAX_VALUE)).apply()
    }

    fun getSavedSpice(): Int {
        return prefs.getInt(PREF_SPICE, 0).coerceIn(0, MAX_VALUE)
    }

    fun savePrice(value: Int) {
        prefs.edit().putInt(PREF_PRICE, value.coerceIn(0, MAX_VALUE)).apply()
    }

    fun getSavedPrice(): Int {
        return prefs.getInt(PREF_PRICE, 0).coerceIn(0, MAX_VALUE)
    }

    fun saveIngredientsList(ingredients: List<String>) {
        prefs.edit().putStringSet(PREF_INGREDIENTS, ingredients.toSet()).apply()
    }

    fun getSavedIngredientsList(): List<String> {
        return prefs.getStringSet(PREF_INGREDIENTS, emptySet())?.toList() ?: emptyList()
    }

    fun saveImageUri(uri: String?) {
        prefs.edit().putString(PREF_IMAGE_URI, uri).apply()
    }

    fun getSavedImageUri(): String? {
        return prefs.getString(PREF_IMAGE_URI, null)
    }

    fun clearAllPreferences() {
        prefs.edit().clear().apply()
    }

    fun resetPreferences() {
        prefs.edit().apply {
            putInt(PREF_PREP_TIME, 0)
            putInt(PREF_COMPLEXITY, 0)
            putInt(PREF_CALORIES, 0)
            putInt(PREF_NUTRITION, 0)
            putInt(PREF_SPICE, 0)
            putInt(PREF_PRICE, 0)
            putString(PREF_CUISINE, "Any")
        }.apply()
    }

    fun addFavoriteRecipe(recipe: Recipe) {
        val favoriteRecipes = getFavoriteRecipes().toMutableSet()
        favoriteRecipes.add(recipe.name)
        prefs.edit().putStringSet(PREF_FAVORITE_RECIPES, favoriteRecipes).apply()
    }

    fun getFavoriteRecipes(): Set<String> {
        return prefs.getStringSet(PREF_FAVORITE_RECIPES, setOf()) ?: setOf()
    }

    fun removeFavoriteRecipe(recipeName: String) {
        val favoriteRecipes = getFavoriteRecipes().toMutableSet()
        favoriteRecipes.remove(recipeName)
        prefs.edit().putStringSet(PREF_FAVORITE_RECIPES, favoriteRecipes).apply()
    }

    companion object {
        private const val PREF_CUISINE = "preferred_cuisine"
        private const val PREF_PREP_TIME = "prep_time"
        private const val PREF_COMPLEXITY = "complexity"
        private const val PREF_CALORIES = "calories"
        private const val PREF_NUTRITION = "nutrition"
        private const val PREF_SPICE = "spice"
        private const val PREF_PRICE = "price"
        private const val PREF_INGREDIENTS = "saved_ingredients"
        private const val PREF_IMAGE_URI = "saved_image_uri"
        private const val PREF_FAVORITE_RECIPES = "favorite_recipes"
    }
} 