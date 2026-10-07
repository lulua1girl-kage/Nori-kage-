package com.newera.nori.mentor

import android.net.Uri
import java.security.MessageDigest
import java.util.Base64
import java.util.UUID

/**
 * Configuration/PKCE helper for the documented open-source Sign in with
 * ChatGPT flow. Credential validation, secure persistence and refresh are
 * intentionally separate concerns and must be completed before release.
 */
object ChatGptOAuthSpec {
    private const val AUTHORIZE_URL = "https://auth.openai.com/api/accounts/authorize"
    const val TOKEN_URL = "https://auth.openai.com/api/accounts/oauth/token"
    const val RESOURCE = "https://api.openai.com/v1"
    const val DYNAMIC_CLIENT_ID = "dynamic_agent_client"
    const val REDIRECT_URI = "http://127.0.0.1:1455/auth/callback"

    fun newHostId(): String = "urn:uuid:" + UUID.randomUUID().toString()

    fun newState(): String = UUID.randomUUID().toString().replace("-", "")

    fun newNonce(): String = UUID.randomUUID().toString().replace("-", "")

    fun newVerifier(): String = UUID.randomUUID().toString() + UUID.randomUUID().toString()

    fun challenge(verifier: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray())
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest)
    }

    fun authorizationUri(
        hostId: String,
        state: String,
        nonce: String,
        verifier: String,
        agentName: String = "New Era",
    ): Uri = Uri.parse(AUTHORIZE_URL).buildUpon()
        .appendQueryParameter("client_id", DYNAMIC_CLIENT_ID)
        .appendQueryParameter("agent_name_hint", agentName)
        .appendQueryParameter("ext_agent_host_id", hostId)
        .appendQueryParameter("response_type", "code")
        .appendQueryParameter("redirect_uri", REDIRECT_URI)
        .appendQueryParameter("scope", "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct")
        .appendQueryParameter("resource", RESOURCE)
        .appendQueryParameter("state", state)
        .appendQueryParameter("nonce", nonce)
        .appendQueryParameter("code_challenge_method", "S256")
        .appendQueryParameter("code_challenge", challenge(verifier))
        .build()
}
