package com.example.intellidish.api

import okhttp3.CertificatePinner

object CertificatePinner {
    private const val HOSTNAME = "3.21.30.112"
    
    // Replace these with your actual certificate pins
    val certificatePinner = CertificatePinner.Builder()
        .add(HOSTNAME, "sha256/rA+v2WXDZvZiqHfU4NqgroNn3k0RXwNGqkFV1qFT7g0=") // Generated from your certificate
        .add(HOSTNAME, "sha256/backup-pin-from-your-backend-certificate") // Backup pin
        .build()
} 