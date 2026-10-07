package com.newera.nori

import android.app.Application
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.newera.nori.data.MentorContext
import com.newera.nori.data.NoriStore
import com.newera.nori.data.Priority
import com.newera.nori.data.StudySession
import com.newera.nori.data.Task
import com.newera.nori.mentor.LocalMentorService
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlin.math.max

private val NoriScheme = darkColorScheme(
    primary = Color(0xFFB8A4FF),
    onPrimary = Color(0xFF24114A),
    background = Color(0xFF0C0D12),
    surface = Color(0xFF111219),
    surfaceContainer = Color(0xFF181921),
    surfaceContainerHigh = Color(0xFF20212B),
)

class NewEraViewModel(app: Application) : AndroidViewModel(app) {
    private val store = NoriStore(app)
    private val mentor = LocalMentorService()

    private val _tasks = MutableStateFlow(
        listOf(
            Task("bio", "Biology Unit 3 recall", "Biology", 35, Priority.CRITICAL),
            Task("math", "Math U4 problem set", "Math", 45, Priority.HIGH),
            Task("eng", "English Unit 2 review", "English", 25, Priority.HIGH),
            Task("chem", "Chemistry concept review", "Chemistry", 30, Priority.NORMAL),
        )
    )
    val tasks: StateFlow<List<Task>> = _tasks

    val focusActive = store.focusActive
    val blockedPackages = store.blockedPackages

    private val _session = MutableStateFlow<StudySession?>(null)
    val session: StateFlow<StudySession?> = _session

    private val _decisionText = MutableStateFlow("Nori has no current intervention.")
    val decisionText: StateFlow<String> = _decisionText

    private val _tab = MutableStateFlow(0)
    val tab: StateFlow<Int> = _tab

    fun selectTab(value: Int) { _tab.value = value }

    fun start(task: Task) {
        _session.value = StudySession(task, task.minutes * 60)
        store.setFocusActive(true)
        viewModelScope.launch {
            while (true) {
                delay(1000)
                val current = _session.value ?: break
                val next = current.copy(completedSeconds = current.completedSeconds + 1)
                _session.value = next
                if (next.completedSeconds >= next.totalSeconds) {
                    store.setFocusActive(false)
                    _decisionText.value = "Session complete. Record the result before starting another task."
                    break
                }
            }
        }
    }

    fun stop() { store.setFocusActive(false) }

    fun toggleBlocked(pkg: String) = store.toggleBlockedPackage(pkg)

    fun evaluate() {
        viewModelScope.launch {
            val decision = mentor.evaluate(
                MentorContext(
                    currentTask = _session.value?.task,
                    session = _session.value,
                )
            )
            _decisionText.value = decision.headline + " — " + decision.action
        }
    }
}

class MainActivity : ComponentActivity() {
    private val vm by viewModels<NewEraViewModel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { MaterialTheme(colorScheme = NoriScheme) { NewEraApp(vm) } }
    }
}

@Composable
private fun NewEraApp(vm: NewEraViewModel) {
    val tab by vm.tab.collectAsState()

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceContainer) {
                val items = listOf(
                    Triple("Today", Icons.Default.Dashboard, 0),
                    Triple("Mentor", Icons.Default.Psychology, 1),
                    Triple("Focus", Icons.Default.Timer, 2),
                    Triple("Progress", Icons.Default.Flag, 3),
                )
                items.forEach { item ->
                    NavigationBarItem(
                        selected = tab == item.third,
                        onClick = { vm.selectTab(item.third) },
                        icon = { Icon(item.second, item.first) },
                        label = { Text(item.first) },
                    )
                }
            }
        },
    ) { pad ->
        when (tab) {
            0 -> Today(vm, Modifier.padding(pad))
            1 -> Mentor(vm, Modifier.padding(pad))
            2 -> Focus(vm, Modifier.padding(pad))
            else -> Progress(vm, Modifier.padding(pad))
        }
    }
}

@Composable
private fun Today(vm: NewEraViewModel, modifier: Modifier) {
    val tasks by vm.tasks.collectAsState()
    val session by vm.session.collectAsState()
    val decision by vm.decisionText.collectAsState()

    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Spacer(Modifier.height(16.dp))
            Text("NEW ERA", color = Color(0xFFB8A4FF), fontWeight = FontWeight.Bold)
            Text("Good evening.", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text("Execution first. Judgment when it matters.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { NoriCard("Nori", decision) }
        item {
            if (session == null) {
                Card(colors = CardDefaults.cardColors(MaterialTheme.colorScheme.primaryContainer)) {
                    Column(Modifier.padding(18.dp)) {
                        Text("NEXT", fontWeight = FontWeight.Bold)
                        Text(tasks.first().title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(10.dp))
                        FilledTonalButton(onClick = { vm.start(tasks.first()) }, modifier = Modifier.fillMaxWidth()) {
                            Text("Start focus")
                        }
                    }
                }
            } else SessionCard(vm, session)
        }
        item { Text("Today's priorities", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        items(tasks) { task ->
            Card(colors = CardDefaults.cardColors(MaterialTheme.colorScheme.surfaceContainer)) {
                Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(task.subject, color = Color(0xFFB8A4FF))
                        Text(task.title, fontWeight = FontWeight.Bold)
                        Text(task.minutes.toString() + " min • " + task.priority.name.lowercase(), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    IconButton(onClick = { vm.start(task) }) { Icon(Icons.Default.Timer, "Start") }
                }
            }
        }
        item { Spacer(Modifier.height(20.dp)) }
    }
}

@Composable
private fun Mentor(vm: NewEraViewModel, modifier: Modifier) {
    val decision by vm.decisionText.collectAsState()

    Column(modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("MENTOR", color = Color(0xFFB8A4FF), fontWeight = FontWeight.Bold)
        Text("Advanced judgment layer", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(
            "Production target: current state + current question -> authorized ChatGPT plan usage -> typed proposal -> local validator.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Button(onClick = { vm.evaluate() }, modifier = Modifier.fillMaxWidth()) {
            Text("Evaluate current situation")
        }
        NoriCard("Current decision", decision)
        NoriCard(
            "Connection target",
            "Use Sign in with ChatGPT and chatgpt.tokens.use.direct. Do not add an API-key input to this product.",
        )
    }
}

@Composable
private fun Focus(vm: NewEraViewModel, modifier: Modifier) {
    val session by vm.session.collectAsState()
    val active by vm.focusActive.collectAsState()
    val blocked by vm.blockedPackages.collectAsState()

    Column(modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("FOCUS", color = Color(0xFFB8A4FF), fontWeight = FontWeight.Bold)
        Text(if (active) "Session active" else "Ready", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        if (session == null) NoriCard("No active session", "Start a task from Today.") else SessionCard(vm, session)
        Text("Blocked packages: " + blocked.size)
        Text(
            "Blocking is deterministic and user-configured. AI proposals never invent device permissions.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedButton(
            onClick = { vm.toggleBlocked("com.instagram.android") },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if ("com.instagram.android" in blocked) "Unblock Instagram" else "Block Instagram")
        }
    }
}

@Composable
private fun Progress(vm: NewEraViewModel, modifier: Modifier) {
    val tasks by vm.tasks.collectAsState()
    val done = tasks.count { it.completed }
    Column(modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("PROGRESS", color = Color(0xFFB8A4FF), fontWeight = FontWeight.Bold)
        Text("Mastery over metrics", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(done.toString() + " / " + tasks.size + " priority tasks complete")
        LinearProgressIndicator(
            progress = { if (tasks.isEmpty()) 0f else done.toFloat() / tasks.size },
            modifier = Modifier.fillMaxWidth(),
        )
        listOf("Error Notebook", "Retrieval Engine", "Spaced Review", "Assessment Lab").forEach { item ->
            Surface(color = MaterialTheme.colorScheme.surfaceContainer, shape = RoundedCornerShape(18.dp)) {
                Text(item, Modifier.fillMaxWidth().padding(16.dp))
            }
        }
    }
}

@Composable
private fun SessionCard(vm: NewEraViewModel, session: StudySession?) {
    if (session == null) return
    val ratio = (session.completedSeconds.toFloat() / max(1, session.totalSeconds)).coerceIn(0f, 1f)
    Card(colors = CardDefaults.cardColors(MaterialTheme.colorScheme.surfaceContainerHigh)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("CURRENT SESSION", color = Color(0xFFB8A4FF), fontWeight = FontWeight.Bold)
            Text(session.task.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(formatSeconds(session.totalSeconds - session.completedSeconds), fontSize = 42.sp, fontWeight = FontWeight.Bold)
            LinearProgressIndicator(progress = { ratio }, modifier = Modifier.fillMaxWidth())
            OutlinedButton(onClick = { vm.stop() }, modifier = Modifier.fillMaxWidth()) { Text("End session") }
        }
    }
}

@Composable
private fun NoriCard(title: String, body: String) {
    Card(colors = CardDefaults.cardColors(MaterialTheme.colorScheme.surfaceContainerHigh)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, color = Color(0xFFB8A4FF), fontWeight = FontWeight.Bold)
            Text(body, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        }
    }
}

private fun formatSeconds(seconds: Int): String {
    val safe = max(0, seconds)
    return "%02d:%02d".format(safe / 60, safe % 60)
}
