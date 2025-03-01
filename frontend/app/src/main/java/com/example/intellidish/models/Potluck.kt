package com.example.intellidish.models

data class Potluck(
    val _id: String? = null,  // Potluck ID (nullable for new potlucks)
    val name: String,  // Potluck name
    val date: String,  // ISO 8601 format date string
    val host: User,  // Host details (User object instead of just ID)
    var participants: List<Participant>,  // List of participants
    val ingredients: List<String> ?= null,  // List of ingredient names
    val recipes: List<Recipe> ?= null // List of recipe IDs
)

data class Participant(
    val user: User,  // User object representing the participant
    val ingredients: List<String> ?= null  // List of ingredient names
)
