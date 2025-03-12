package com.example.intellidish.api

sealed class NetworkError {
    object SSLHandshakeError : NetworkError()
    object CertificateError : NetworkError()
    object ConnectionTimeout : NetworkError()
    object ServerUnreachable : NetworkError()
    object NoInternetConnection : NetworkError()
    data class Other(val throwable: Throwable) : NetworkError()
} 