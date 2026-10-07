package com.newera.nori.mentor

import com.newera.nori.data.MentorContext
import com.newera.nori.data.MentorDecision

interface MentorService {
    suspend fun evaluate(context: MentorContext): MentorDecision
    suspend fun answer(context: MentorContext, message: String): String
}

class LocalMentorService : MentorService {
    override suspend fun evaluate(context: MentorContext): MentorDecision =
        when {
            context.session == null -> MentorDecision(
                headline = "Start with one concrete action",
                assessment = "There is no active study session to evaluate.",
                action = "Start the highest-priority task.",
                reason = "Nori should not manufacture a problem when there is no evidence of one.",
            )
            context.recentEvent != null -> MentorDecision(
                headline = "Investigate before escalating",
                assessment = context.recentEvent,
                action = "Finish the recoverable work, then review the cause.",
                reason = "A single event is evidence for investigation, not automatic punishment.",
            )
            context.session.completedSeconds >= context.session.totalSeconds -> MentorDecision(
                headline = "Session complete",
                assessment = "The planned focus target was reached.",
                action = "Log the result and move to the next priority.",
                reason = "Completion evidence should drive the next decision.",
            )
            else -> MentorDecision(
                headline = "Continue",
                assessment = "The current evidence does not justify changing the plan.",
                action = "Keep working until the session target is reached.",
                reason = "Stable execution should not be disrupted by unnecessary intervention.",
            )
        }

    override suspend fun answer(context: MentorContext, message: String): String =
        "Local Nori heard: ${message.trim()}. The production build replaces this fallback with the authorized ChatGPT mentor connection."
}
