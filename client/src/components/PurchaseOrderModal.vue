<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && backlogItem" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ mode === 'create' ? 'Create Purchase Order' : 'Purchase Order Details' }}</h3>
            <button class="close-button" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="item-summary">
              <div class="item-info">
                <div class="item-name">{{ backlogItem.item_name }}</div>
                <div class="item-sku">SKU: {{ backlogItem.item_sku }}</div>
              </div>
              <span class="shortage-badge">{{ shortage }} units needed</span>
            </div>

            <!-- View mode: show existing PO -->
            <div v-if="mode === 'view' && existingPO" class="po-details">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Supplier</div>
                  <div class="info-value">{{ existingPO.supplier_name }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Quantity</div>
                  <div class="info-value">{{ existingPO.quantity }} units</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Unit Cost</div>
                  <div class="info-value">${{ existingPO.unit_cost }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total Cost</div>
                  <div class="info-value total">${{ (existingPO.quantity * existingPO.unit_cost).toLocaleString() }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Expected Delivery</div>
                  <div class="info-value">{{ existingPO.expected_delivery_date }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">
                    <span class="badge warning">{{ existingPO.status }}</span>
                  </div>
                </div>
              </div>
              <div v-if="existingPO.notes" class="notes-section">
                <div class="info-label">Notes</div>
                <div class="notes-text">{{ existingPO.notes }}</div>
              </div>
            </div>

            <!-- Create mode: form -->
            <form v-else-if="mode === 'create'" @submit.prevent="submitPO" class="po-form">
              <div class="form-group">
                <label>Supplier Name *</label>
                <input v-model="form.supplier_name" type="text" required placeholder="Enter supplier name" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Quantity *</label>
                  <input v-model.number="form.quantity" type="number" required min="1" :placeholder="shortage.toString()" />
                </div>
                <div class="form-group">
                  <label>Unit Cost ($) *</label>
                  <input v-model.number="form.unit_cost" type="number" required min="0" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div class="form-group">
                <label>Expected Delivery Date *</label>
                <input v-model="form.expected_delivery_date" type="date" required />
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea v-model="form.notes" rows="3" placeholder="Optional notes..."></textarea>
              </div>
              <div v-if="form.quantity && form.unit_cost" class="total-preview">
                Total: <strong>${{ (form.quantity * form.unit_cost).toLocaleString() }}</strong>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="close">Close</button>
            <button v-if="mode === 'create'" class="btn-primary" :disabled="submitting" @click="submitPO">
              {{ submitting ? 'Creating...' : 'Create Purchase Order' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { api } from '../api'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  backlogItem: { type: Object, default: null },
  mode: { type: String, default: 'create' }
})

const emit = defineEmits(['close', 'po-created'])

const submitting = ref(false)
const existingPO = ref(null)

const shortage = computed(() => {
  if (!props.backlogItem) return 0
  return props.backlogItem.quantity_needed - props.backlogItem.quantity_available
})

const form = ref({
  supplier_name: '',
  quantity: null,
  unit_cost: null,
  expected_delivery_date: '',
  notes: ''
})

watch(() => props.isOpen, async (open) => {
  if (open && props.mode === 'view' && props.backlogItem) {
    try {
      existingPO.value = await api.getPurchaseOrderByBacklogItem(props.backlogItem.id)
    } catch {
      existingPO.value = null
    }
  }
  if (open && props.mode === 'create') {
    form.value = { supplier_name: '', quantity: shortage.value, unit_cost: null, expected_delivery_date: '', notes: '' }
  }
})

const submitPO = async () => {
  if (!form.value.supplier_name || !form.value.quantity || !form.value.unit_cost || !form.value.expected_delivery_date) return
  submitting.value = true
  try {
    const po = await api.createPurchaseOrder({
      backlog_item_id: props.backlogItem.id,
      ...form.value
    })
    emit('po-created', po)
  } finally {
    submitting.value = false
  }
}

const close = () => emit('close')
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.close-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  transition: all 0.15s;
}

.close-button:hover { background: #f1f5f9; color: #0f172a; }

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.item-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.item-name { font-weight: 600; color: #0f172a; }
.item-sku { font-size: 0.8rem; color: #64748b; font-family: monospace; margin-top: 2px; }

.shortage-badge {
  padding: 0.25rem 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #fecaca;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.info-item { display: flex; flex-direction: column; gap: 0.25rem; }
.info-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
.info-value { font-size: 0.9rem; color: #0f172a; font-weight: 500; }
.info-value.total { font-size: 1.1rem; font-weight: 700; color: #16a34a; }

.notes-section { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0; }
.notes-text { font-size: 0.875rem; color: #475569; margin-top: 0.5rem; line-height: 1.5; }

.po-form { display: flex; flex-direction: column; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-group label { font-size: 0.875rem; font-weight: 600; color: #374151; }
.form-group input, .form-group textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  transition: border-color 0.15s;
}
.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.total-preview {
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #166534;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #334155;
  cursor: pointer;
  font-family: inherit;
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-primary {
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
.badge.warning { background: #fef3c7; color: #92400e; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-container, .modal-leave-active .modal-container { transition: transform 0.2s ease; }
.modal-enter-from .modal-container, .modal-leave-to .modal-container { transform: scale(0.95); }
</style>
