package com.example.intellidish.models

data class User(
    val _id: String? = null,
    val name: String,
    val email: String,
    val friends: List<String> = emptyList(),
    val recipes: List<String> = emptyList(),
    val ingredients: List<String> = emptyList(),
    val potluck: List<String> = emptyList()
) 