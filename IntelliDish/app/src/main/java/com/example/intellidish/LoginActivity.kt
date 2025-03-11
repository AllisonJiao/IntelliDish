package com.example.intellidish

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.utils.NetworkUtils
import com.example.intellidish.utils.UserManager
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
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
                    Toast.makeText(
                        this@LoginActivity,
                        "Failed to sign in: ${exception.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: IOException) {
                Log.e("LoginActivity", "Error during sign in", e)
                Toast.makeText(
                    this@LoginActivity,
                    "Error signing in. Please try again.",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
} 