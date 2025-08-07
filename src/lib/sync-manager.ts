// Sync Manager for handling offline queue and background sync
import { transactionService } from './supabase'
import offlineStore from './offline-store'
import { toast } from 'sonner'

class SyncManager {
  private syncing = false
  private syncInterval: NodeJS.Timeout | null = null

  // Initialize sync manager
  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event)
      })
    }

    // Start periodic sync if online
    if (navigator.onLine) {
      this.startPeriodicSync()
    }

    // Register service worker
    this.registerServiceWorker()
  }

  // Register service worker
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-custom.js')
        console.log('Service Worker registered:', registration)
        
        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Check every hour
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  // Handle coming online
  private handleOnline() {
    console.log('Connection restored')
    toast.success('Back online! Syncing data...')
    this.syncPendingAssignments()
    this.startPeriodicSync()
  }

  // Handle going offline
  private handleOffline() {
    console.log('Connection lost')
    toast.warning('You are offline. Changes will be synced when connection is restored.')
    this.stopPeriodicSync()
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(event: MessageEvent) {
    switch (event.data.type) {
      case 'SYNC_ASSIGNMENTS':
        this.syncPendingAssignments()
        break
      case 'CACHE_TRANSACTIONS':
        offlineStore.storeTransactions(event.data.payload)
        break
    }
  }

  // Start periodic sync
  private startPeriodicSync() {
    if (this.syncInterval) return

    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingAssignments()
      }
    }, 5 * 60 * 1000)
  }

  // Stop periodic sync
  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Sync pending department assignments
  async syncPendingAssignments() {
    if (this.syncing || !navigator.onLine) return

    this.syncing = true
    console.log('Syncing pending assignments...')

    try {
      const pendingAssignments = await offlineStore.getPendingAssignments()
      
      if (pendingAssignments.length === 0) {
        console.log('No pending assignments to sync')
        return
      }

      let successCount = 0
      let failureCount = 0

      for (const assignment of pendingAssignments) {
        try {
          // Get transaction details from offline store
          const transactions = await offlineStore.getTransactions()
          const transaction = transactions.find(t => t.content_hash === assignment.transactionHash)
          
          if (!transaction) {
            console.error('Transaction not found for assignment:', assignment)
            await offlineStore.removePendingAssignment(assignment.id)
            continue
          }

          // Try to sync the assignment
          await transactionService.assignDepartment(
            transaction.Bank,
            new Date(transaction.Date).toISOString().split('T')[0],
            transaction.Description,
            transaction.net_amount,
            assignment.departmentId
          )

          // Remove from pending queue
          await offlineStore.removePendingAssignment(assignment.id)
          successCount++
        } catch (error) {
          console.error('Failed to sync assignment:', error)
          failureCount++

          // Update retry count
          const newRetries = assignment.retries + 1
          if (newRetries >= 3) {
            // Max retries reached, remove from queue
            await offlineStore.removePendingAssignment(assignment.id)
            toast.error(`Failed to sync department assignment after 3 attempts`)
          } else {
            await offlineStore.updateAssignmentRetries(assignment.id, newRetries)
          }
        }
      }

      // Update last sync time
      await offlineStore.setSetting('lastSyncTime', Date.now())

      // Show sync results
      if (successCount > 0) {
        toast.success(`Synced ${successCount} department assignment${successCount > 1 ? 's' : ''}`)
      }
      if (failureCount > 0) {
        toast.error(`Failed to sync ${failureCount} assignment${failureCount > 1 ? 's' : ''}`)
      }

      console.log(`Sync complete: ${successCount} success, ${failureCount} failures`)
    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Failed to sync offline changes')
    } finally {
      this.syncing = false
    }
  }

  // Queue department assignment for offline sync
  async queueDepartmentAssignment(
    transactionHash: string,
    departmentId: string,
    departmentName: string
  ) {
    await offlineStore.queueDepartmentAssignment(transactionHash, departmentId, departmentName)
    
    // If online, sync immediately
    if (navigator.onLine) {
      setTimeout(() => this.syncPendingAssignments(), 1000)
    }
  }

  // Cache transactions for offline access
  async cacheTransactions(transactions: any[]) {
    await offlineStore.storeTransactions(transactions)
    console.log(`Cached ${transactions.length} transactions for offline access`)
  }

  // Get cached transactions
  async getCachedTransactions() {
    return offlineStore.getTransactions()
  }

  // Get sync status
  async getSyncStatus() {
    const stats = await offlineStore.getCacheStats()
    return {
      ...stats,
      isOnline: navigator.onLine,
      isSyncing: this.syncing
    }
  }

  // Clear all cached data
  async clearCache() {
    await offlineStore.clearStore('transactions')
    await offlineStore.clearStore('pendingAssignments')
    await offlineStore.clearStore('settings')
    
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
    
    toast.success('Cache cleared successfully')
  }

  // Force sync now
  async forceSyncNow() {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline')
      return
    }
    
    toast.info('Starting manual sync...')
    await this.syncPendingAssignments()
  }
}

// Export singleton instance
export const syncManager = new SyncManager()

// Initialize on import
if (typeof window !== 'undefined') {
  syncManager.init()
}

export default syncManager