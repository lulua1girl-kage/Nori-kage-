package com.newera.nori.learning

import kotlin.math.roundToInt

enum class RecallError {
    NONE, CONCEPT_GAP, RECALL_FAILURE, PROCEDURE, CARELESS, MISREAD, TIME_PRESSURE, UNKNOWN
}

data class RecallAttempt(
    val topicId: String,
    val subject: String,
    val attemptedAtMillis: Long,
    val correct: Boolean,
    val confidence: Int,
    val error: RecallError = RecallError.NONE,
)

data class TopicMastery(
    val topicId: String,
    val subject: String,
    val mastery: Float,
    val attempts: Int,
    val lastAttemptAtMillis: Long,
    val nextReviewAtMillis: Long,
    val intervalDays: Int,
    val lastError: RecallError,
    val lastConfidence: Int,
    val lastWasCorrect: Boolean,
    /** Positive values indicate overconfidence; negative values indicate underconfidence. */
    val calibrationError: Float,
)

data class ReviewRecommendation(
    val topicId: String,
    val subject: String,
    val dueAtMillis: Long,
    val mastery: Float,
    val reason: String,
)

class AdaptiveLearningEngine {
    fun record(previous: TopicMastery?, attempt: RecallAttempt): TopicMastery {
        require(attempt.topicId.isNotBlank() && attempt.subject.isNotBlank())
        require(attempt.confidence in 1..5)

        val oldMastery = previous?.mastery ?: 0.40f
        val outcome = if (attempt.correct) {
            0.70f + attempt.confidence * 0.06f
        } else {
            0.35f - attempt.confidence * 0.05f
        }
        val mastery = (oldMastery * 0.70f + outcome * 0.30f).coerceIn(0f, 1f)
        val interval = nextInterval(previous, attempt)
        val calibration = attempt.confidence / 5f - if (attempt.correct) 1f else 0f

        return TopicMastery(
            topicId = attempt.topicId,
            subject = attempt.subject,
            mastery = mastery,
            attempts = (previous?.attempts ?: 0) + 1,
            lastAttemptAtMillis = attempt.attemptedAtMillis,
            nextReviewAtMillis = attempt.attemptedAtMillis + interval * DAY_MILLIS,
            intervalDays = interval,
            lastError = attempt.error,
            lastConfidence = attempt.confidence,
            lastWasCorrect = attempt.correct,
            calibrationError = calibration,
        )
    }

    fun dueReviews(topics: Collection<TopicMastery>, nowMillis: Long): List<ReviewRecommendation> =
        topics.asSequence()
            .filter { it.nextReviewAtMillis <= nowMillis }
            .sortedWith(compareBy<TopicMastery> { it.nextReviewAtMillis }.thenBy { it.mastery })
            .map { topic ->
                ReviewRecommendation(
                    topicId = topic.topicId,
                    subject = topic.subject,
                    dueAtMillis = topic.nextReviewAtMillis,
                    mastery = topic.mastery,
                    reason = when {
                        !topic.lastWasCorrect || topic.lastError == RecallError.CONCEPT_GAP ->
                            "Review now: the last attempt exposed a knowledge gap."
                        topic.calibrationError > 0.35f ->
                            "Review now: confidence was much higher than the result justified."
                        else -> "Scheduled retrieval review is due."
                    },
                )
            }.toList()

    private fun nextInterval(previous: TopicMastery?, attempt: RecallAttempt): Int {
        if (!attempt.correct || attempt.error == RecallError.CONCEPT_GAP) return 0
        val old = previous?.intervalDays ?: 0
        return when (attempt.confidence) {
            1, 2 -> 1
            3 -> maxOf(2, old + 1)
            4 -> maxOf(4, (old * 1.7f).roundToInt())
            else -> maxOf(7, (old * 2.2f).roundToInt())
        }.coerceAtMost(MAX_INTERVAL_DAYS)
    }

    companion object {
        const val MAX_INTERVAL_DAYS = 30
        const val DAY_MILLIS = 86_400_000L
    }
}
