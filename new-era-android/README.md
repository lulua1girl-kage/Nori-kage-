# New Era Native Android Foundation

This folder is the first native Android foundation for New Era.

## What is here

- Kotlin + Jetpack Compose
- Material 3 / modern Android project structure
- Today / Mentor / Focus / Progress surfaces
- Local deterministic focus state
- User-configured Instagram block toggle
- Accessibility enforcement scaffold
- Mentor interface with safe local fallback
- Direct ChatGPT plan inference adapter that accepts an OAuth access token instead of an API key

## What is intentionally not claimed yet

The OpenAI OAuth/Sign in with ChatGPT credential flow is not presented as production-complete in this first commit. Before shipping, implement the complete documented PKCE + loopback callback + ID-token validation + token refresh + protected credential storage flow.

The current Android project is therefore a **native foundation**, not a finished Play Store release.

## Architectural rule

AI proposes.

Nori's deterministic layer validates.

Android executes.

The user remains the owner.

## Why this direction

The existing New Era repository already contains a hosted Nori brain/router. That remains useful legacy infrastructure, but the new native direction deliberately avoids adding another API-key-dependent path when the product goal is to let eligible users authorize ChatGPT-plan usage directly in the open-source app.
