import { ref } from 'vue'

const isDark = ref(localStorage.getItem('app-theme') === 'dark')

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('app-theme', dark ? 'dark' : 'light')
}

applyTheme(isDark.value)

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  return { isDark, toggleTheme }
}
