package com.newera.nori.mentor

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class ChatGptPlanClient {
    suspend fun ask(
        accessToken: String,
        model: String,
        instructions: String,
        userText: String,
    ): String = withContext(Dispatchers.IO) {
        val connection = (URL("https://api.openai.com/v1/responses").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("Authorization", "Bearer $accessToken")
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "text/event-stream")
            connectTimeout = 20_000
            readTimeout = 90_000
        }

        val body = JSONObject().apply {
            put("model", model)
            put("instructions", instructions)
            put("store", false)
            put("stream", true)
            put(
                "input",
                JSONArray().put(
                    JSONObject()
                        .put("role", "user")
                        .put(
                            "content",
                            JSONArray().put(
                                JSONObject()
                                    .put("type", "input_text")
                                    .put("text", userText)
                            )
                        )
                )
            )
        }

        connection.outputStream.use { it.write(body.toString().toByteArray()) }

        if (connection.responseCode !in 200..299) {
            val error = connection.errorStream?.bufferedReader()?.readText().orEmpty()
            throw IllegalStateException("Responses API ${connection.responseCode}: $error")
        }

        val output = StringBuilder()
        BufferedReader(InputStreamReader(connection.inputStream)).use { reader ->
            var completed = false
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                val raw = line ?: continue
                if (!raw.startsWith("data:")) continue
                val payload = raw.removePrefix("data:").trim()
                if (payload == "[DONE]") break
                val json = runCatching { JSONObject(payload) }.getOrNull() ?: continue
                when (json.optString("type")) {
                    "response.output_text.delta" -> output.append(json.optString("delta"))
                    "response.completed" -> completed = true
                    "response.failed" -> {
                        val error = json.optJSONObject("response")?.optJSONObject("error")
                        throw IllegalStateException(error?.optString("message") ?: "Response failed")
                    }
                }
            }
            if (!completed) throw IllegalStateException("Stream ended before response.completed")
        }

        output.toString().trim()
    }
}
