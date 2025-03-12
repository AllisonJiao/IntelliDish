package com.example.intellidish.models

data class Ingredient(
    val _id: String = "",
    val name: String,
    val category: String,
    val quantity: Int? = null,
    val unit: String? = null
) 