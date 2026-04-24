<template>
  <div class="restocking">
    <div class="page-header">
      <h2>{{ t('restocking.title') }}</h2>
      <p>{{ t('restocking.description') }}</p>
    </div>

    <!-- Budget input -->
    <div class="card budget-card">
      <div class="budget-row">
        <label class="budget-label">{{ t('restocking.budgetCeiling') }}</label>
        <div class="budget-input-group">
          <span class="currency-prefix">{{ currencySymbol }}</span>
          <input
            v-model.number="budgetInput"
            type="number"
            min="0"
            step="100"
            :placeholder="t('restocking.budgetPlaceholder')"
            class="budget-input"
            @keyup.enter="applyBudget"
          />
          <button class="btn-apply" @click="applyBudget">{{ t('restocking.applyBudget') }}</button>
          <button v-if="activeBudget" class="btn-clear" @click="clearBudget">{{ t('restocking.clearBudget') }}</button>
        </div>
        <span v-if="activeBudget" class="budget-active-label">
          {{ t('restocking.budgetCeiling') }}: {{ currencySymbol }}{{ activeBudget.toLocaleString() }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Summary stats -->
      <div class="stats-grid">
        <div class="stat-card" :class="totalItems > 0 ? 'warning' : 'success'">
          <div class="stat-label">{{ t('restocking.itemsToRestock') }}</div>
          <div class="stat-value">{{ totalItems }}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">{{ t('restocking.highPriorityItems') }}</div>
          <div class="stat-value">{{ highPriorityCount }}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">{{ t('restocking.totalEstimatedCost') }}</div>
          <div class="stat-value">{{ currencySymbol }}{{ totalCost.toLocaleString() }}</div>
        </div>
        <div class="stat-card" :class="activeBudget ? (budgetRemaining >= 0 ? 'success' : 'danger') : ''">
          <div class="stat-label">{{ t('restocking.budgetRemaining') }}</div>
          <div class="stat-value">
            {{ activeBudget ? currencySymbol + budgetRemaining.toLocaleString() : t('restocking.noBudget') }}
          </div>
        </div>
      </div>

      <!-- Recommendations table -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('restocking.title') }} ({{ recommendations.length }})</h3>
        </div>

        <div v-if="recommendations.length === 0" class="empty-state">
          {{ t('restocking.noRecommendations') }}
        </div>

        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>{{ t('restocking.table.sku') }}</th>
                <th>{{ t('restocking.table.name') }}</th>
                <th>{{ t('restocking.table.warehouse') }}</th>
                <th>{{ t('restocking.table.trend') }}</th>
                <th class="col-num">{{ t('restocking.table.inStock') }}</th>
                <th class="col-num">{{ t('restocking.table.reorderPoint') }}</th>
                <th class="col-num">{{ t('restocking.table.daysOfStock') }}</th>
                <th class="col-num">{{ t('restocking.table.recommendedQty') }}</th>
                <th class="col-num">{{ t('restocking.table.estimatedCost') }}</th>
                <th>{{ t('restocking.table.priority') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in recommendations" :key="item.sku + item.warehouse">
                <td class="sku">{{ item.sku }}</td>
                <td>{{ translateProductName(item.name) }}</td>
                <td>{{ translateWarehouse(item.warehouse) }}</td>
                <td>
                  <span :class="['badge', item.trend]">{{ t('trends.' + item.trend) }}</span>
                </td>
                <td class="col-num" :class="{ 'text-danger': item.quantity_on_hand === 0 }">
                  {{ item.quantity_on_hand }}
                </td>
                <td class="col-num">{{ item.reorder_point }}</td>
                <td class="col-num">
                  <span :class="daysClass(item.days_of_stock)">{{ item.days_of_stock }}d</span>
                </td>
                <td class="col-num bold">{{ item.recommended_quantity }}</td>
                <td class="col-num bold">{{ currencySymbol }}{{ item.estimated_cost.toLocaleString() }}</td>
                <td>
                  <span :class="['badge', item.priority]">{{ t('priority.' + item.priority) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'

export default {
  name: 'Restocking',
  setup() {
    const { t, currentCurrency, translateProductName, translateWarehouse } = useI18n()
    const currencySymbol = computed(() => currentCurrency.value === 'JPY' ? '¥' : '$')

    const loading = ref(true)
    const error = ref(null)
    const recommendations = ref([])
    const budgetInput = ref(null)
    const activeBudget = ref(null)

    const { selectedLocation, selectedCategory, getCurrentFilters } = useFilters()

    const totalItems = computed(() => recommendations.value.length)
    const highPriorityCount = computed(() => recommendations.value.filter(r => r.priority === 'high').length)
    const totalCost = computed(() => Math.round(recommendations.value.reduce((sum, r) => sum + r.estimated_cost, 0)))
    const budgetRemaining = computed(() => activeBudget.value ? activeBudget.value - totalCost.value : null)

    const loadData = async () => {
      try {
        loading.value = true
        error.value = null
        const filters = getCurrentFilters()
        if (activeBudget.value) filters.budget = activeBudget.value
        recommendations.value = await api.getRestockingRecommendations(filters)
      } catch (err) {
        error.value = 'Failed to load recommendations: ' + err.message
      } finally {
        loading.value = false
      }
    }

    const applyBudget = () => {
      activeBudget.value = budgetInput.value || null
      loadData()
    }

    const clearBudget = () => {
      budgetInput.value = null
      activeBudget.value = null
      loadData()
    }

    const daysClass = (days) => {
      if (days < 7) return 'days-critical'
      if (days < 14) return 'days-warning'
      return 'days-ok'
    }

    watch([selectedLocation, selectedCategory], loadData)
    onMounted(loadData)

    return {
      t,
      loading,
      error,
      recommendations,
      budgetInput,
      activeBudget,
      totalItems,
      highPriorityCount,
      totalCost,
      budgetRemaining,
      currencySymbol,
      translateProductName,
      translateWarehouse,
      applyBudget,
      clearBudget,
      daysClass
    }
  }
}
</script>

<style scoped>
.restocking {
  padding: 0;
}

.budget-card {
  margin-bottom: 1.5rem;
  padding: 1.25rem 1.5rem;
}

.budget-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.budget-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.budget-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.currency-prefix {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.budget-input {
  width: 180px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
}

.budget-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-apply {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.btn-apply:hover { background: #2563eb; }

.btn-clear {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  font-family: inherit;
}

.btn-clear:hover { background: #e2e8f0; }

.budget-active-label {
  font-size: 0.813rem;
  color: #059669;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  background: #d1fae5;
  border-radius: 20px;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 0.938rem;
}

.sku {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  color: #2563eb;
}

.col-num {
  text-align: right;
}

.bold {
  font-weight: 700;
}

.text-danger {
  color: #dc2626;
  font-weight: 700;
}

.days-critical {
  color: #dc2626;
  font-weight: 700;
}

.days-warning {
  color: #d97706;
  font-weight: 600;
}

.days-ok {
  color: #64748b;
}
</style>
