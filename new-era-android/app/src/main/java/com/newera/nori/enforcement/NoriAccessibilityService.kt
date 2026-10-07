package com.newera.nori.enforcement

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.newera.nori.data.NoriStore

class NoriAccessibilityService : AccessibilityService() {
    private lateinit var store: NoriStore
    private var overlay: LinearLayout? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        store = NoriStore(applicationContext)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val pkg = event?.packageName?.toString() ?: return
        if (!::store.isInitialized) store = NoriStore(applicationContext)

        if (store.focusActive.value && pkg in store.blockedPackages.value) {
            showBlockLayer()
        } else {
            hideBlockLayer()
        }
    }

    override fun onInterrupt() = Unit

    override fun onDestroy() {
        hideBlockLayer()
        super.onDestroy()
    }

    private fun showBlockLayer() {
        if (overlay != null) return

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
            background = GradientDrawable().apply {
                setColor(Color.rgb(12, 13, 18))
                cornerRadius = 36f
            }
        }

        root.addView(TextView(this).apply {
            text = "NORI"
            textSize = 18f
            setTextColor(Color.rgb(184, 164, 255))
            gravity = Gravity.CENTER
        })

        root.addView(TextView(this).apply {
            text = "Focus session active"
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        })

        root.addView(TextView(this).apply {
            text = "This app is unavailable under your current focus rule."
            textSize = 16f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
        })

        root.addView(Button(this).apply {
            text = "Return to Home"
            setOnClickListener {
                startActivity(
                    Intent(Intent.ACTION_MAIN)
                        .addCategory(Intent.CATEGORY_HOME)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            }
        })

        val params = WindowManager.LayoutParams(
            (resources.displayMetrics.widthPixels * 0.88f).toInt(),
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            android.graphics.PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        windowManager.addView(root, params)
        overlay = root
    }

    private fun hideBlockLayer() {
        overlay?.let { runCatching { windowManager.removeView(it) } }
        overlay = null
    }
}
