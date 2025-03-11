package com.example.intellidish

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import java.security.MessageDigest
import java.util.UUID
import com.google.android.gms.common.SignInButton
import android.view.View.OnClickListener
import androidx.lifecycle.lifecycleScope
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.utils.NetworkUtils
import com.example.intellidish.models.User
import com.example.intellidish.utils.UserManager
import kotlinx.coroutines.withContext
import com.google.android.gms.auth.api.signin.GoogleSignInAccount

class MainActivity : AppCompatActivity() {

    private val TAG = "GoogleSignIn"
    private val activityScope = CoroutineScope(Dispatchers.Main)

    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        // Initialize UserManager
        UserManager.init(applicationContext)

        // Hide the action bar for a more immersive look
        supportActionBar?.hide()

        // Initialize Google Sign-In Button - update to use sign_in_button instead of login_button
        findViewById<SignInButton>(R.id.sign_in_button).setOnClickListener {
            Log.d(TAG, "Sign in button clicked")
            signInWithGoogle()
        }
    }

    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    private fun signInWithGoogle() {
        val credentialManager = CredentialManager.create(this)

        val signInWithGoogleOption: GetSignInWithGoogleOption = GetSignInWithGoogleOption
            .Builder(BuildConfig.WEB_CLIENT_ID) // Use your Web Client ID from Google Console
            .setNonce(generateHashedNonce()) // Secure the request with a hashed nonce
            .build()

        val request: GetCredentialRequest = GetCredentialRequest.Builder()
            .addCredentialOption(signInWithGoogleOption)
            .build()

        // Launch Google Sign-In in Coroutine
        activityScope.launch {
            try {
                val result = credentialManager.getCredential(
                    request = request,
                    context = this@MainActivity
                )
                handleSignIn(result) // Handle successful sign-in
            } catch (e: IOException) {
                handleFailure(e) // Handle failure cases
            }
        }
    }

    private fun handleSignIn(result: GetCredentialResponse) {
        val credential = result.credential
        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            try {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                Log.d(TAG, "Received Google ID token: ${googleIdTokenCredential.idToken.take(10)}...")
                
                lifecycleScope.launch {
                    try {
                        val userEmail = googleIdTokenCredential.id
                        val displayName = googleIdTokenCredential.displayName ?: "Unknown User"

                        // Try to get existing user first
                        val response = NetworkClient.apiService.getUserByEmail(userEmail)
                        if (response.isSuccessful && response.body() != null) {
                            // User exists, save info
                            val user = response.body()!!
                            UserManager.saveUserInfo(userEmail, displayName, user._id!!)
                            Log.d(TAG, "Existing user found")
                            navigateToHomePage()
                        } else if (response.code() == 404) {
                            // User doesn't exist, create new user
                            val newUser = User(
                                _id = null,
                                name = displayName,
                                email = userEmail,
                                friends = emptyList(),
                                recipes = emptyList(),
                                ingredients = emptyList(),
                                potluck = emptyList()
                            )
                            
                            val createResponse = NetworkClient.apiService.createUser(newUser)
                            if (createResponse.isSuccessful) {
                                val responseText = createResponse.body() ?: ""
                                val idMatch = Regex("Created user with id: (.+)").find(responseText)
                                val userId = idMatch?.groupValues?.get(1)
                                
                                if (userId != null) {
                                    UserManager.saveUserInfo(userEmail, displayName, userId)
                                    Log.d(TAG, "Created new user with ID: $userId")
                                    navigateToHomePage()
                                } else {
                                    throw Exception("Failed to parse user ID from response")
                                }
                            } else {
                                val errorBody = createResponse.errorBody()?.string() ?: "Unknown error"
                                throw Exception("Failed to create user: $errorBody")
                            }
                        } else {
                            throw Exception("Failed to check if user exists. Status: ${response.code()}")
                        }
                    } catch (e: IOException) {
                        Log.e(TAG, "Error during sign in process", e)
                        withContext(Dispatchers.Main) {
                            Toast.makeText(
                                this@MainActivity,
                                "Failed to sign in: ${e.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                }
            } catch (e: IOException) {
                Log.e(TAG, "Error parsing Google ID token", e)
                Toast.makeText(this, "Failed to parse Google ID token", Toast.LENGTH_SHORT).show()
            }
        } else {
            Log.e(TAG, "Unexpected credential type")
            Toast.makeText(this, "Invalid credential type", Toast.LENGTH_SHORT).show()
        }
    }

    private fun navigateToHomePage() {
        val intent = Intent(this, HomePage::class.java)
        startActivity(intent)
        finish()
    }

    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    private fun handleFailure(e: GetCredentialException) {
        Log.e(TAG, "Error getting credential", e)
        Toast.makeText(this, "Error getting credential", Toast.LENGTH_SHORT).show()
    }

    private fun generateHashedNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }
}
