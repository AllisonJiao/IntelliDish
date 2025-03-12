package com.example.intellidish.models

data class PotluckIngredient(
    val name: String,
    val addedBy: String
)

data class RemoveAddIngredientsRequest(
    val participantId: String,
    val ingredients: List<String>
)

data class PotluckResponse(
    val message: String,
    val potluck: Potluck // The field name matches the JSON key
)

data class UpdateRecipesResponse(
    val message: String,
    val recipe: List<Recipe>
)