package com.example.intellidish.utils

import com.example.intellidish.api.NetworkError
import com.example.intellidish.models.ApiResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import retrofit2.Response
import javax.net.ssl.SSLHandshakeException
import javax.net.ssl.SSLPeerUnverifiedException
import java.net.SocketTimeoutException

object NetworkUtils {
    fun handleNetworkException(throwable: Throwable): NetworkError {
        return when (throwable) {
            is SSLHandshakeException -> NetworkError.SSLHandshakeError
            is SSLPeerUnverifiedException -> NetworkError.CertificateError
            is SocketTimeoutException -> NetworkError.ConnectionTimeout
            is java.net.ConnectException -> NetworkError.ServerUnreachable
            is java.net.UnknownHostException -> NetworkError.NoInternetConnection
            is HttpException -> {
                val errorBody = throwable.response()?.errorBody()?.string()
                NetworkError.Other(Exception(errorBody ?: throwable.message()))
            }
            else -> NetworkError.Other(throwable)
        }
    }

    fun getErrorMessage(error: NetworkError): String {
        return when (error) {
            is NetworkError.SSLHandshakeError -> "SSL Handshake failed. Please check your connection."
            is NetworkError.CertificateError -> "Certificate verification failed."
            is NetworkError.ConnectionTimeout -> "Connection timed out. Please try again."
            is NetworkError.ServerUnreachable -> "Server is currently unreachable. Please try again later."
            is NetworkError.NoInternetConnection -> "No internet connection. Please check your network settings."
            is NetworkError.Other -> error.throwable.message ?: "An unexpected error occurred"
        }
    }

    suspend fun <T> safeApiCall(apiCall: suspend () -> Response<ApiResponse<T>>): Result<T> {
        return try {
            withContext(Dispatchers.IO) {
                val response = apiCall()
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    apiResponse.data?.let {
                        Result.success(it)
                    } ?: Result.failure(Exception("Response data is null"))
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Unknown error"
                    Result.failure(Exception("API call failed: $errorBody"))
                }
            }
        } catch (e: IOException) {
            val networkError = handleNetworkException(e)
            Result.failure(Exception(getErrorMessage(networkError)))
        }
    }

    suspend fun <T> safeApiCallDirect(apiCall: suspend () -> Response<T>): Result<T> {
        return try {
            val response = apiCall()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body)
                } else {
                    Result.failure(Exception("Response body was null"))
                }
            } else {
                val errorBody = response.errorBody()?.string() ?: "Unknown error"
                Result.failure(Exception("API call failed with code ${response.code()}: $errorBody"))
            }
        } catch (e: IOException) {
            Result.failure(e)
        }
    }

    suspend fun <T> safeApiCallWithWrapper(apiCall: suspend () -> Response<ApiResponse<T>>): Result<T> {
        return try {
            val response = apiCall()
            if (response.isSuccessful) {
                val wrapper = response.body()
                if (wrapper?.data != null) {
                    Result.success(wrapper.data)
                } else {
                    Result.failure(Exception("Response body or data was null"))
                }
            } else {
                val errorBody = response.errorBody()?.string() ?: "Unknown error"
                Result.failure(Exception("API call failed with code ${response.code()}: $errorBody"))
            }
        } catch (e: IOException) {
            Result.failure(e)
        }
    }
} 