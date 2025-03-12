package com.example.intellidish.models

import com.google.gson.annotations.SerializedName

data class CreateRecipeResponse(
    @SerializedName("message")
    val message: String,
    @SerializedName("recipeId")
    val recipeId: String? = null
) 