package com.example.intellidish.models

data class ApiResponse<T>(
    val data: T?
)

data class CreateUserResponse(
    val message: String,
    val userId: String? = null
)

data class ApiError(
    val value: String,
    val msg: String,
    val param: String,
    val location: String
) 