<template>
  <div class="app">
    <header class="top-nav">
      <div class="nav-container">
        <div class="logo">
          <h1>{{ t('nav.companyName') }}</h1>
          <span class="subtitle">{{ t('nav.subtitle') }}</span>
        </div>
        <nav class="nav-tabs">
          <router-link to="/" :class="{ active: $route.path === '/' }">
            {{ t('nav.overview') }}
          </router-link>
          <router-link to="/inventory" :class="{ active: $route.path === '/inventory' }">
            {{ t('nav.inventory') }}
          </router-link>
          <router-link to="/orders" :class="{ active: $route.path === '/orders' }">
            {{ t('nav.orders') }}
          </router-link>
          <router-link to="/spending" :class="{ active: $route.path === '/spending' }">
            {{ t('nav.finance') }}
          </router-link>
          <router-link to="/demand" :class="{ active: $route.path === '/demand' }">
            {{ t('nav.demandForecast') }}
          </router-link>
          <router-link to="/reports" :class="{ active: $route.path === '/reports' }">
            {{ t('nav.reports') }}
          </router-link>
          <router-link to="/restocking" :class="{ active: $route.path === '/restocking' }">
            {{ t('nav.restocking') }}
          </router-link>
        </nav>
        <LanguageSwitcher />
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </div>
    </header>
    <FilterBar />
    <main class="main-content">
      <router-view />
    </main>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const { isDark, toggleTheme } = useTheme()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask,
      isDark,
      toggleTheme
    }
  }
}
</script>

<style>
/* ── Theme variables ─────────────────────────────────────── */
:root {
  --bg-body:        #f8fafc;
  --bg-nav:         #ffffff;
  --bg-card:        #ffffff;
  --bg-thead:       #f8fafc;
  --bg-row-hover:   #f8fafc;
  --text-primary:   #0f172a;
  --text-secondary: #1e293b;
  --text-muted:     #64748b;
  --text-table:     #334155;
  --text-th:        #475569;
  --border:         #e2e8f0;
  --border-light:   #f1f5f9;
  --border-subtle:  #cbd5e1;
  --nav-link:       #64748b;
  --nav-hover-bg:   #f1f5f9;
  --nav-hover-text: #0f172a;
  --nav-active-bg:  #eff6ff;
  --nav-active-text:#2563eb;
  --nav-active-bar: #2563eb;
  --shadow-nav:     rgba(0,0,0,0.05);
  --shadow-card:    rgba(0,0,0,0.06);
}

[data-theme="dark"] {
  --bg-body:        #0f172a;
  --bg-nav:         #1e293b;
  --bg-card:        #1e293b;
  --bg-thead:       #0f172a;
  --bg-row-hover:   #162032;
  --text-primary:   #f1f5f9;
  --text-secondary: #e2e8f0;
  --text-muted:     #94a3b8;
  --text-table:     #cbd5e1;
  --text-th:        #94a3b8;
  --border:         #334155;
  --border-light:   #1e293b;
  --border-subtle:  #475569;
  --nav-link:       #94a3b8;
  --nav-hover-bg:   #0f172a;
  --nav-hover-text: #f1f5f9;
  --nav-active-bg:  #172554;
  --nav-active-text:#60a5fa;
  --nav-active-bar: #60a5fa;
  --shadow-nav:     rgba(0,0,0,0.3);
  --shadow-card:    rgba(0,0,0,0.2);
}

/* ── Reset ────────────────────────────────────────────────── */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-body);
  color: var(--text-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background 0.2s, color 0.2s;
}

.app { display: flex; flex-direction: column; min-height: 100vh; }

/* ── Nav ──────────────────────────────────────────────────── */
.top-nav {
  background: var(--bg-nav);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 3px 0 var(--shadow-nav);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background 0.2s, border-color 0.2s;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  height: 70px;
}

.nav-container > .nav-tabs   { margin-left: auto; margin-right: 1rem; }
.nav-container > .language-switcher { margin-right: 1rem; }

.logo { display: flex; align-items: baseline; gap: 0.75rem; }

.logo h1 {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 0.813rem;
  color: var(--text-muted);
  font-weight: 400;
  padding-left: 0.75rem;
  border-left: 1px solid var(--border);
}

.nav-tabs { display: flex; gap: 0.25rem; }

.nav-tabs a {
  padding: 0.625rem 1.25rem;
  color: var(--nav-link);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.938rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-tabs a:hover  { color: var(--nav-hover-text); background: var(--nav-hover-bg); }
.nav-tabs a.active { color: var(--nav-active-text); background: var(--nav-active-bg); }

.nav-tabs a.active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0; right: 0;
  height: 2px;
  background: var(--nav-active-bar);
}

/* ── Dark mode toggle ─────────────────────────────────────── */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: 0.75rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.theme-toggle:hover { background: var(--nav-hover-bg); color: var(--text-primary); border-color: var(--border-subtle); }
.theme-toggle svg   { width: 18px; height: 18px; }

/* ── Layout ───────────────────────────────────────────────── */
.main-content {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

/* ── Page header ──────────────────────────────────────────── */
.page-header { margin-bottom: 1.5rem; }

.page-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  letter-spacing: -0.025em;
}

.page-header p { color: var(--text-muted); font-size: 0.938rem; }

/* ── Stats grid ───────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-card);
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.stat-card:hover { border-color: var(--border-subtle); box-shadow: 0 4px 12px var(--shadow-card); }

.stat-label {
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.625rem;
}

.stat-value { font-size: 2.25rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.025em; }

.stat-card.warning .stat-value { color: #ea580c; }
.stat-card.success .stat-value { color: #059669; }
.stat-card.danger  .stat-value { color: #dc2626; }
.stat-card.info    .stat-value { color: #2563eb; }

/* ── Card ─────────────────────────────────────────────────── */
.card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid var(--border);
  margin-bottom: 1.25rem;
  transition: background 0.2s, border-color 0.2s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--border);
}

.card-title { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.025em; }

/* ── Table ────────────────────────────────────────────────── */
.table-container { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; }

thead {
  background: var(--bg-thead);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--text-th);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border-light);
  color: var(--text-table);
  font-size: 0.875rem;
}

tbody tr { transition: background-color 0.15s ease; }
tbody tr:hover { background: var(--bg-row-hover); }

/* ── Badges ───────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 0.313rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.success    { background: #d1fae5; color: #065f46; }
.badge.warning    { background: #fed7aa; color: #92400e; }
.badge.danger     { background: #fecaca; color: #991b1b; }
.badge.info       { background: #dbeafe; color: #1e40af; }
.badge.increasing { background: #d1fae5; color: #065f46; }
.badge.decreasing { background: #fecaca; color: #991b1b; }
.badge.stable     { background: #e0e7ff; color: #3730a3; }
.badge.high       { background: #fecaca; color: #991b1b; }
.badge.medium     { background: #fed7aa; color: #92400e; }
.badge.low        { background: #dbeafe; color: #1e40af; }

/* ── States ───────────────────────────────────────────────── */
.loading { text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.938rem; }

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.938rem;
}

[data-theme="dark"] .error {
  background: #2d0f0f;
  border-color: #7f1d1d;
  color: #fca5a5;
}
</style>
