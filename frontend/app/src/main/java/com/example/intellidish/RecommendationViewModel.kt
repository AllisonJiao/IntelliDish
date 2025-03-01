package com.example.intellidish

import androidx.lifecycle.ViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.example.intellidish.models.Recipe
import com.example.intellidish.models.Result
import com.example.intellidish.models.RecipeGenerationRequest

class RecommendationViewModel : ViewModel() {
    private val _recipes = MutableLiveData<Result<List<Recipe>>>()
    val recipes: LiveData<Result<List<Recipe>>> = _recipes

    private val recipeService = RecipeService.create()

    fun generateRecipes(ingredients: List<String>, preferences: Map<String, Boolean>) {
        viewModelScope.launch {
            _recipes.value = Result.Loading

            try {
                val request = RecipeGenerationRequest(
                    ingredients = ingredients,
                    preferences = preferences
                )
                
                val response = recipeService.generateRecipes(request)
                _recipes.value = Result.Success(response)
            } catch (e: Exception) {
                _recipes.value = Result.Error(e)
            }
        }
    }
}