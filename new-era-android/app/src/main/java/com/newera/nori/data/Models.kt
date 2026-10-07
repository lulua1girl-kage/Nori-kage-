package com.newera.nori.data

data class Task(
    val id: String,
    val title: String,
    val subject: String,
    val minutes: Int,
    val priority: Priority,
    val completed: Boolean = false,
)

enum class Priority { CRITICAL, HIGH, NORMAL }

data class StudySession(
    val task: Task,
    val totalSeconds: Int,
    val completedSeconds: Int = 0,
)

data class MentorDecision(
    val headline: String,
    val assessment: String,
    val action: String,
    val reason: String,
)

data class MentorContext(
    val currentTask: Task?,
    val session: StudySession?,
    val recentEvent: String? = null,
)
