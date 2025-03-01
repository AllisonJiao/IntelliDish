package com.example.intellidish.models

data class Friend(
    val name: String,
    val email: String,
    val recipesShared: Int = 0,
    val potlucksAttended: Int = 0
) 