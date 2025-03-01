package com.example.intellidish

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.material.card.MaterialCardView
import com.example.intellidish.utils.UserManager

class HomePage : AppCompatActivity() {

    private lateinit var googleSignInClient: GoogleSignInClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_menu)

        // Make sure UserManager is initialized
        if (!UserManager.isInitialized()) {
            UserManager.init(applicationContext)
        }

        // Check if user is logged in, if not redirect to login
        if (!UserManager.isUserLoggedIn()) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        // Initialize Google Sign-In Client
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // Set up button click listeners
        findViewById<MaterialCardView>(R.id.btn_get_recommendations).setOnClickListener {
            startActivity(Intent(this, RecommendationActivity::class.java))
        }

        findViewById<MaterialCardView>(R.id.btn_my_recipes).setOnClickListener {
            startActivity(Intent(this, ManageRecipes::class.java))
        }

        findViewById<MaterialCardView>(R.id.btn_manage_friends).setOnClickListener {
            if (UserManager.isUserLoggedIn()) {
                val userEmail = UserManager.getUserEmail()
                startActivity(Intent(this, ManageFriends::class.java).apply {
                    putExtra("userEmail", userEmail)
                })
            } else {
                Toast.makeText(
                    this,
                    "Please sign in to access this feature",
                    Toast.LENGTH_LONG
                ).show()
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            }
        }

        findViewById<MaterialCardView>(R.id.btn_potluck).setOnClickListener {
            startActivity(Intent(this, PotluckActivity::class.java))
        }

        findViewById<MaterialCardView>(R.id.btn_sign_out).setOnClickListener {
            signOut()
        }
    }

    private fun signOut() {
        googleSignInClient.signOut().addOnCompleteListener {
            UserManager.clearUserInfo() // Clear user info when signing out
            Toast.makeText(this, "Signed out successfully!", Toast.LENGTH_SHORT).show()
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }
}

