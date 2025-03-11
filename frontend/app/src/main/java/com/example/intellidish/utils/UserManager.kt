package com.example.intellidish.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.models.User
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

object UserManager {
    private const val PREF_NAME = "user_prefs"
    private const val KEY_EMAIL = "user_email"
    private const val KEY_NAME = "user_name"
    private const val KEY_USER_ID = "user_id"
    private var userEmail: String? = null
    private var userName: String? = null

    private lateinit var prefs: SharedPreferences
    private lateinit var context: Context

    private const val PREF_CUISINE_TYPE = "cuisine_type"
    private const val PREF_USER_PREFERENCES = "user_preferences"

    fun init(context: Context) {
        if (!::context.isInitialized) {
            this.context = context.applicationContext
            prefs = this.context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            // Try to load saved data
            loadUserData()
            Log.d("UserManager", "Initialized with email: $userEmail, name: $userName")
        }
    }

    private fun loadUserData() {
        userEmail = prefs.getString(KEY_EMAIL, null)
        userName = prefs.getString(KEY_NAME, null)
        Log.d("UserManager", "Loaded user data - Email: $userEmail, Name: $userName")
    }

    fun getUserEmail(): String? {
        if (!isInitialized()) {
            Log.e("UserManager", "UserManager not initialized!")
            return null
        }
        
        // If email is null, try reloading from preferences
        if (userEmail == null) {
            loadUserData()
        }
        
        Log.d("UserManager", "Getting user email: $userEmail")
        return userEmail
    }

    fun saveUserInfo(email: String, name: String, userId: String) {
        if (!isInitialized()) {
            Log.e("UserManager", "UserManager not initialized!")
            return
        }

        Log.d("UserManager", "Saving user info - Email: $email, Name: $name")
        userEmail = email
        userName = name
        
        prefs.edit().apply {
            putString(KEY_EMAIL, email)
            putString(KEY_NAME, name)
            putString(KEY_USER_ID, userId)
            apply()
        }
    }

    fun clearUserInfo() {
        if (!isInitialized()) {
            Log.e("UserManager", "UserManager not initialized!")
            return
        }

        userEmail = null
        userName = null
        prefs.edit().clear().apply()
        Log.d("UserManager", "User info cleared")
    }

    fun isUserLoggedIn(): Boolean {
        return getUserEmail() != null
    }

    fun isInitialized(): Boolean {
        return ::prefs.isInitialized && ::context.isInitialized
    }

    fun getUserName(): String? {
        if (userName == null) {
            userName = prefs.getString(KEY_NAME, null)
        }
        return userName
    }

    suspend fun ensureUserInDatabase(email: String, name: String): Result<User> {
        return withContext(Dispatchers.IO) {
            try {
                // First try to get existing user
                NetworkUtils.safeApiCallDirect {
                    NetworkClient.apiService.getUserByEmail(email)
                }.fold(
                    onSuccess = { user ->
                        Result.success(user)
                    },
                    onFailure = { _ ->
                        // User doesn't exist, create new one
                        val newUser = User(
                            _id = null,
                            name = name,
                            email = email,
                            friends = emptyList(),
                            recipes = emptyList(),
                            ingredients = emptyList(),
                            potluck = emptyList()
                        )
                        
                        NetworkUtils.safeApiCallDirect {
                            NetworkClient.apiService.createUser(newUser)
                        }.map { response ->
                            val idMatch = Regex("Created user with id: (.+)").find(response)
                            val userId = idMatch?.groupValues?.get(1)
                                ?: throw Exception("Failed to parse user ID from response")
                            newUser.copy(_id = userId)
                        }
                    }
                )
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    private suspend fun fetchUserFromServer(email: String): Result<User> {
        return NetworkUtils.safeApiCallDirect {
            NetworkClient.apiService.getUserByEmail(email)
        }
    }

    suspend fun getUserByEmail(email: String): Result<User> {
        return NetworkUtils.safeApiCallDirect {
            NetworkClient.apiService.getUserByEmail(email)
        }
    }

    fun getUserPreferences(): Map<String, Boolean>? {
        val prefsJson = prefs?.getString(PREF_USER_PREFERENCES, null)
        return if (prefsJson != null) {
            Gson().fromJson(prefsJson, object : TypeToken<Map<String, Boolean>>() {}.type)
        } else null
    }

    fun saveUserPreferences(preferences: Map<String, Boolean>) {
        prefs?.edit()?.apply {
            putString(PREF_USER_PREFERENCES, Gson().toJson(preferences))
            apply()
        }
    }

    fun getUserCuisinePreference(): String? {
        return prefs?.getString(PREF_CUISINE_TYPE, null)
    }

    fun saveCuisinePreference(cuisineType: String) {
        prefs?.edit()?.apply {
            putString(PREF_CUISINE_TYPE, cuisineType)
            apply()
        }
    }

    fun getUserId(): String? {
        if (!isInitialized()) {
            Log.e("UserManager", "UserManager not initialized!")
            return null
        }
        return prefs.getString(KEY_USER_ID, null)
    }
} 