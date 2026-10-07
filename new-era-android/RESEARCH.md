# New Era native research map

## Product thesis

New Era is a mentoring-first Android system, not a timer with an AI logo.

**AI = mentor/advisor**
- reasoning
- tutoring
- planning
- investigation
- adaptive study strategy
- explanations

**Nori local layer = authority**
- current state
- handbook/rules
- allowed actions
- focus state
- protected transitions
- audit log

**Android = executor**
- timers
- foreground app observation
- user-authorized blocking layer
- notifications

**Student = owner**
- can override legitimate circumstances
- owns the rules
- remains responsible for decisions

## Current research conclusions

### ChatGPT connection

The current OpenAI open-source Sign in with ChatGPT flow can let eligible users authorize an app to use their ChatGPT plan for eligible AI requests without giving the app an API key. The app still does not receive the user's ChatGPT conversations or memories automatically.

The production adapter should therefore:
1. create/persist a stable host identifier
2. use PKCE/state/nonce
3. use the documented loopback redirect
4. request the ChatGPT plan usage scope
5. validate identity/scopes
6. protect access + refresh tokens
7. stream Responses API requests with store=false
8. refresh rotating tokens safely

The native project contains the inference adapter but deliberately does not pretend the OAuth credential-management/security layer is complete.

### Android enforcement

UsageStatsManager can provide usage information with the required usage permission. Accessibility services can observe window/activity changes and can provide accessibility overlays. Google Play requires disclosure/consent for non-accessibility uses of Accessibility and restricts autonomous action; therefore New Era must keep blocking deterministic and user-authored.

The AI never decides which package is blocked by itself.

### Learning science

The academic layer should measure:
- retrieval
- retention
- accuracy
- error type
- confidence vs actual performance
- spacing/revisit needs

Raw “minutes studied” are a weak proxy for learning.

Metacognitive planning, monitoring, and evaluation should be embedded into subject-specific workflows rather than presented as a generic productivity score.

## Product loop

PLAN -> ACT -> OBSERVE -> ASSESS -> UNDERSTAND -> ADJUST -> RECOVER -> ACT AGAIN

## Primary navigation

TODAY
- current objective
- next action
- active Nori assessment
- current task queue

MENTOR
- ask Nori
- challenge reasoning
- evaluate current state
- tutor
- plan/re-plan
- integrity review

FOCUS
- active session
- local rules
- permitted/blocked apps
- session result

PROGRESS
- mastery
- error notebook
- retrieval history
- spacing
- assessments

## P0 build target

The first useful product milestone is:

**current state -> ChatGPT mentor -> typed proposal -> local validation -> Android action -> recorded result**

Not 50 screens. Not a custom Notion clone. Not an unrestricted AI agent.

## Main sources

OpenAI:
- https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites
- https://developers.openai.com/siwc/token-sharing-open-source
- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations

Android:
- https://developer.android.com/develop/ui/compose/designsystems/material3
- https://developer.android.com/develop/ui/compose/bom
- https://developer.android.com/reference/android/app/usage/UsageStatsManager
- https://developer.android.com/reference/android/app/usage/UsageEvents.Event
- https://developer.android.com/topic/libraries/architecture/datastore
- https://developer.android.com/reference/androidx/work/WorkManager.html
- https://developer.android.com/develop/ui/compose/system/setup-e2e

Google Play policy:
- https://support.google.com/googleplay/android-developer/answer/16558241

Learning:
- https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition
- https://pmc.ncbi.nlm.nih.gov/

Open source patterns:
- https://github.com/android/compose-samples
- https://github.com/android/architecture-samples
- https://github.com/cylldby/blocker
- https://github.com/1372Slash/Zenith
- https://github.com/nichsedge/deepfocus

## Design direction

Use Kotlin + Jetpack Compose + Material 3, dark-first with a calm Nori accent, adaptive layouts, large information hierarchy, restrained motion, and a home screen that answers:

1. What am I doing now?
2. What comes next?
3. What does Nori think about the current situation?
4. What evidence supports that decision?

Avoid:
- fake productivity gamification
- automatic punishment escalation
- unlimited AI autonomy
- excessive notifications
- giant analytics dashboards
