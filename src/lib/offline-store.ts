// Offline Storage Manager using IndexedDB
// Handles offline data storage and synchronization

interface OfflineTransaction {
  id: string
  data: any
  timestamp: number
}

interface PendingAssignment {
  id: string
  transactionHash: string
  departmentId: string
  departmentName: string
  timestamp: number
  retries: number
}

class OfflineStore {
  private dbName = 'BTMOfflineStore'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' })
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('pendingAssignments')) {
          const assignmentStore = db.createObjectStore('pendingAssignments', { keyPath: 'id' })
          assignmentStore.createIndex('timestamp', 'timestamp', { unique: false })
          assignmentStore.createIndex('transactionHash', 'transactionHash', { unique: false })
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }

        console.log('IndexedDB stores created')
      }
    })
  }

  // Store transactions for offline access
  async storeTransactions(transactions: any[]): Promise<void> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction(['transactions'], 'readwrite')
    const store = tx.objectStore('transactions')

    // Clear old transactions first within the same transaction
    const clearRequest = store.clear()
    
    return new Promise((resolve, reject) => {
      clearRequest.onsuccess = () => {
        // Store new transactions after clearing
        for (const transaction of transactions) {
          const offlineTransaction: OfflineTransaction = {
            id: transaction.content_hash || `${transaction.Date}_${transaction.Description}`,
            data: transaction,
            timestamp: Date.now()
          }
          store.put(offlineTransaction)
        }
      }
      
      tx.oncomplete = () => {
        console.log(`Stored ${transactions.length} transactions offline`)
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    })
  }

  // Get offline transactions
  async getTransactions(): Promise<any[]> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction(['transactions'], 'readonly')
    const store = tx.objectStore('transactions')
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const offlineTransactions = request.result as OfflineTransaction[]
        const transactions = offlineTransactions.map(t => t.data)
        resolve(transactions)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Queue department assignment for sync
  async queueDepartmentAssignment(
    transactionHash: string,
    departmentId: string,
    departmentName: string
  ): Promise<void> {
    if (!this.db) await this.init()

    const assignment: PendingAssignment = {
      id: `${transactionHash}_${Date.now()}`,
      transactionHash,
      departmentId,
      departmentName,
      timestamp: Date.now(),
      retries: 0
    }

    const tx = this.db!.transaction(['pendingAssignments'], 'readwrite')
    const store = tx.objectStore('pendingAssignments')
    store.put(assignment)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('Department assignment queued for sync')
        this.registerBackgroundSync()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    })
  }

  // Get pending assignments
  async getPendingAssignments(): Promise<PendingAssignment[]> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction(['pendingAssignments'], 'readonly')
    const store = tx.objectStore('pendingAssignments')
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result as PendingAssignment[])
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Remove synced assignment
  async removePendingAssignment(id: string): Promise<void> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction(['pendingAssignments'], 'readwrite')
    const store = tx.objectStore('pendingAssignments')
    store.delete(id)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Update assignment retry count
  async updateAssignmentRetries(id: string, retries: number): Promise<void> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction(['pendingAssignments'], 'readwrite')
    const store = tx.objectStore('pendingAssignments')
    const request = store.get(id)

    request.onsuccess = () => {
      const assignment = request.result as PendingAssignment
      if (assignment) {
        assignment.retries = retries
        store.put(assignment)
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Store setting
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction(['settings'], 'readwrite')
    const store = tx.objectStore('settings')
    store.put({ key, value, timestamp: Date.now() })

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Get setting
  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction(['settings'], 'readonly')
    const store = tx.objectStore('settings')
    const request = store.get(key)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Clear a specific store
  async clearStore(storeName: string): Promise<void> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction([storeName], 'readwrite')
    const store = tx.objectStore(storeName)
    store.clear()

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Register background sync
  private async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('sync-department-assignments')
        console.log('Background sync registered')
      } catch (error) {
        console.error('Failed to register background sync:', error)
      }
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    transactionCount: number
    pendingAssignments: number
    lastSync: number | null
  }> {
    if (!this.db) await this.init()

    const stats = {
      transactionCount: 0,
      pendingAssignments: 0,
      lastSync: null as number | null
    }

    // Count transactions
    const txTransactions = this.db!.transaction(['transactions'], 'readonly')
    const transactionStore = txTransactions.objectStore('transactions')
    const transactionCount = await new Promise<number>((resolve) => {
      const request = transactionStore.count()
      request.onsuccess = () => resolve(request.result)
    })
    stats.transactionCount = transactionCount

    // Count pending assignments
    const txAssignments = this.db!.transaction(['pendingAssignments'], 'readonly')
    const assignmentStore = txAssignments.objectStore('pendingAssignments')
    const assignmentCount = await new Promise<number>((resolve) => {
      const request = assignmentStore.count()
      request.onsuccess = () => resolve(request.result)
    })
    stats.pendingAssignments = assignmentCount

    // Get last sync time
    stats.lastSync = await this.getSetting('lastSyncTime')

    return stats
  }
}

// Export singleton instance
export const offlineStore = new OfflineStore()

// Initialize on import
if (typeof window !== 'undefined') {
  offlineStore.init().catch(console.error)
}

export default offlineStore