package com.newera.nori.data

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class NoriStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("nori_state", Context.MODE_PRIVATE)

    private val _blockedPackages = MutableStateFlow(
        prefs.getStringSet(KEY_BLOCKED_PACKAGES, emptySet())?.toSet() ?: emptySet()
    )
    val blockedPackages: StateFlow<Set<String>> = _blockedPackages

    private val _focusActive = MutableStateFlow(prefs.getBoolean(KEY_FOCUS_ACTIVE, false))
    val focusActive: StateFlow<Boolean> = _focusActive

    fun toggleBlockedPackage(packageName: String) {
        val next = _blockedPackages.value.toMutableSet().apply {
            if (!add(packageName)) remove(packageName)
        }
        prefs.edit().putStringSet(KEY_BLOCKED_PACKAGES, next).apply()
        _blockedPackages.value = next
    }

    fun setFocusActive(active: Boolean) {
        prefs.edit().putBoolean(KEY_FOCUS_ACTIVE, active).apply()
        _focusActive.value = active
    }

    companion object {
        private const val KEY_BLOCKED_PACKAGES = "blocked_packages"
        private const val KEY_FOCUS_ACTIVE = "focus_active"
    }
}
