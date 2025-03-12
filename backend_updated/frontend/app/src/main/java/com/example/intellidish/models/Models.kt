package com.example.intellidish.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

// @Parcelize
// data class Recipe(
//     val _id: String = "",
//     val name: String,
//     val ingredients: List<String>,
//     val instructions: List<String>,
//     val userId: String = "",
//     val createdAt: String = "",
//     val updatedAt: String = ""
// ) : Parcelable

data class RecipeGenerationRequest(
    val ingredients: List<String>,
    val preferences: Map<String, Boolean>
)

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Exception) : Result<Nothing>()
    object Loading : Result<Nothing>()
}