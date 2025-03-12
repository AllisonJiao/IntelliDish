package com.example.intellidish

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.utils.NetworkUtils
import com.example.intellidish.utils.UserManager
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import java.io.IOException

class LoginActivity : AppCompatActivity() {
    private fun handleSignInResult(account: GoogleSignInAccount) {
        val email = account.email ?: return
        val name = account.displayName ?: email.substringBefore('@')
        
        lifecycleScope.launch {
            try {
                val result = UserManager.ensureUserInDatabase(email, name)
                result.onSuccess { user ->
                    // Save user info locally
                    UserManager.saveUserInfo(email, name, user._id!!)
                    Log.d("LoginActivity", "Successfully saved user info")
                    
                    // Navigate to main activity
                    startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                    finish()
                }.onFailure { exception ->
                    Log.e("LoginActivity", "Failed to save user info", exception)
                    Snackbar.make(findViewById(android.R.id.content), "Failed to sign in: ${exception.message}", Snackbar.LENGTH_SHORT).show()
                }
            } catch (e: IOException) {
                Log.e("LoginActivity", "Error during sign in", e)
                Snackbar.make(findViewById(android.R.id.content), "Error signing in. Please try again.", Snackbar.LENGTH_SHORT).show()
            }
        }
    }
} 