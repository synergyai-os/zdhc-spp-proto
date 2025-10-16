/// file: src/lib/stores/checkout.svelte.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// ==========================================
// TYPES
// ==========================================
export interface CheckoutExpert {
  assignmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceVersionName: string;
  serviceParentName: string;
  role: 'lead' | 'regular';
  price: number; // €100 per service version
  isUserVerified: boolean;
}

export interface PaymentDetails {
  method: 'credit_card' | 'bank_transfer';
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
  bankReference?: string;
}

export interface CheckoutState {
  selectedExpertIds: string[];
  experts: CheckoutExpert[];
  paymentMethod: 'credit_card' | 'bank_transfer';
  paymentDetails: PaymentDetails;
  totalAmount: number;
  isLoading: boolean;
  error: string | null;
}

// ==========================================
// STORAGE UTILITIES
// ==========================================
const STORAGE_KEY = 'spp_checkout_state';

function loadFromStorage(): Partial<CheckoutState> | null {
  if (!browser) return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading checkout state from localStorage:', error);
    return null;
  }
}

function saveToStorage(state: CheckoutState): void {
  if (!browser) return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving checkout state to localStorage:', error);
  }
}

function clearStorage(): void {
  if (!browser) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing checkout state from localStorage:', error);
  }
}

// ==========================================
// STORE
// ==========================================
function createCheckoutStore() {
  const initialState: CheckoutState = {
    selectedExpertIds: [],
    experts: [],
    paymentMethod: 'credit_card',
    paymentDetails: {
      method: 'credit_card',
    },
    totalAmount: 0,
    isLoading: false,
    error: null,
  };

  const { subscribe, set, update } = writable<CheckoutState>(initialState);

  return {
    subscribe,
    
    // Initialize store with experts data
    initializeExperts: (experts: CheckoutExpert[]) => {
      update(state => {
        const newState = {
          ...state,
          experts,
          totalAmount: calculateTotalAmount(experts, state.selectedExpertIds),
          error: null,
        };
        saveToStorage(newState);
        return newState;
      });
    },
    
    // Toggle expert selection
    toggleExpertSelection: (assignmentId: string) => {
      update(state => {
        const expert = state.experts.find(e => e.assignmentId === assignmentId);
        if (!expert || !expert.isUserVerified) {
          return state; // Don't allow selection of unverified experts
        }
        
        const isSelected = state.selectedExpertIds.includes(assignmentId);
        const newSelectedIds = isSelected
          ? state.selectedExpertIds.filter(id => id !== assignmentId)
          : [...state.selectedExpertIds, assignmentId];
        
        const newState = {
          ...state,
          selectedExpertIds: newSelectedIds,
          totalAmount: calculateTotalAmount(state.experts, newSelectedIds),
        };
        saveToStorage(newState);
        return newState;
      });
    },
    
    // Select all verified experts
    selectAllVerifiedExperts: () => {
      update(state => {
        const verifiedExpertIds = state.experts
          .filter(expert => expert.isUserVerified)
          .map(expert => expert.assignmentId);
        
        const newState = {
          ...state,
          selectedExpertIds: verifiedExpertIds,
          totalAmount: calculateTotalAmount(state.experts, verifiedExpertIds),
        };
        saveToStorage(newState);
        return newState;
      });
    },
    
    // Clear all selections
    clearAllSelections: () => {
      update(state => {
        const newState = {
          ...state,
          selectedExpertIds: [],
          totalAmount: 0,
        };
        saveToStorage(newState);
        return newState;
      });
    },
    
    // Set payment method
    setPaymentMethod: (method: 'credit_card' | 'bank_transfer') => {
      update(state => {
        const newState = {
          ...state,
          paymentMethod: method,
          paymentDetails: {
            ...state.paymentDetails,
            method,
          },
        };
        saveToStorage(newState);
        return newState;
      });
    },
    
    // Update payment details
    updatePaymentDetails: (details: Partial<PaymentDetails>) => {
      update(state => {
        const newState = {
          ...state,
          paymentDetails: {
            ...state.paymentDetails,
            ...details,
          },
        };
        saveToStorage(newState);
        return newState;
      });
    },
    
    // Set loading state
    setLoading: (isLoading: boolean) => {
      update(state => ({
        ...state,
        isLoading,
      }));
    },
    
    // Set error state
    setError: (error: string | null) => {
      update(state => ({
        ...state,
        error,
      }));
    },
    
    // Clear all checkout data
    clearCheckout: () => {
      set(initialState);
      clearStorage();
    },
    
    // Get selected experts
    getSelectedExperts: (): CheckoutExpert[] => {
      let selectedExperts: CheckoutExpert[] = [];
      const unsubscribe = subscribe(state => {
        selectedExperts = state.experts.filter(expert => 
          state.selectedExpertIds.includes(expert.assignmentId)
        );
      });
      unsubscribe();
      return selectedExperts;
    },
    
    // Check if expert is selected
    isExpertSelected: (assignmentId: string): boolean => {
      let isSelected = false;
      const unsubscribe = subscribe(state => {
        isSelected = state.selectedExpertIds.includes(assignmentId);
      });
      unsubscribe();
      return isSelected;
    },
    
    // Get verification status summary
    getVerificationSummary: () => {
      let summary = { verified: 0, unverified: 0, total: 0 };
      const unsubscribe = subscribe(state => {
        summary = {
          verified: state.experts.filter(e => e.isUserVerified).length,
          unverified: state.experts.filter(e => !e.isUserVerified).length,
          total: state.experts.length,
        };
      });
      unsubscribe();
      return summary;
    },
  };
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function calculateTotalAmount(experts: CheckoutExpert[], selectedIds: string[]): number {
  return experts
    .filter(expert => selectedIds.includes(expert.assignmentId))
    .reduce((total, expert) => total + expert.price, 0);
}

// ==========================================
// EXPORT STORE
// ==========================================
export const checkoutStore = createCheckoutStore();

// ==========================================
// DERIVED STORES
// ==========================================
import { derived } from 'svelte/store';

// Selected experts count
export const selectedExpertsCount = derived(
  checkoutStore,
  ($store) => $store.selectedExpertIds.length
);

// Total amount for display
export const totalAmountDisplay = derived(
  checkoutStore,
  ($store) => `€${$store.totalAmount.toFixed(2)}`
);

// Can proceed to payment
export const canProceedToPayment = derived(
  checkoutStore,
  ($store) => $store.selectedExpertIds.length > 0 && !$store.isLoading
);

// Payment method display name
export const paymentMethodDisplay = derived(
  checkoutStore,
  ($store) => $store.paymentMethod === 'credit_card' ? 'Credit Card' : 'Bank Transfer'
);
