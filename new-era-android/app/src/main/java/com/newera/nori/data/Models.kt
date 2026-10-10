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

enum class MentorAction {
    CONTINUE, START_SESSION, END_SESSION, REPLAN, REQUEST_REVIEW,
    REQUEST_RECOVERY, ASK_USER, NO_ACTION,
}

enum class DecisionStatus { ACCEPTED, NEEDS_CONFIRMATION, REJECTED }

val MentorAction.label: String
    get() = when (this) {
        MentorAction.CONTINUE -> "Continue"
        MentorAction.START_SESSION -> "Start study session"
        MentorAction.END_SESSION -> "End study session"
        MentorAction.REPLAN -> "Replan"
        MentorAction.REQUEST_REVIEW -> "Review the evidence"
        MentorAction.REQUEST_RECOVERY -> "Consider recovery"
        MentorAction.ASK_USER -> "Ask for clarification"
        MentorAction.NO_ACTION -> "No action"
    }

/** Untrusted model output. It must never be executed directly. */
data class MentorProposal(
    val action: MentorAction,
    val headline: String,
    val assessment: String,
    val reason: String,
    val targetTaskId: String? = null,
    val requestedMinutes: Int? = null,
)

/** Locally validated proposal. Device actions require explicit confirmation. */
data class MentorDecision(
    val headline: String,
    val assessment: String,
    val action: MentorAction,
    val reason: String,
    val status: DecisionStatus = DecisionStatus.ACCEPTED,
    val targetTaskId: String? = null,
    val requestedMinutes: Int? = null,
    val requiresConfirmation: Boolean = false,
)

data class MentorContext(
    val currentTask: Task?,
    val session: StudySession?,
    val recentEvent: String? = null,
    val availableTasks: List<Task> = emptyList(),
    val restRequired: Boolean = false,
)
