'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { syncManager } from '@/lib/sync-manager'
import { cn } from '@/lib/utils'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState({
    transactionCount: 0,
    pendingAssignments: 0,
    lastSync: null as number | null,
    isSyncing: false
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Update sync status
    const updateSyncStatus = async () => {
      const status = await syncManager.getSyncStatus()
      setSyncStatus(status)
    }

    // Set up event listeners
    const handleOnline = () => {
      setIsOnline(true)
      updateSyncStatus()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      updateSyncStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update status periodically
    const interval = setInterval(updateSyncStatus, 10000) // Every 10 seconds

    // Initial update
    updateSyncStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const handleSyncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }))
    await syncManager.forceSyncNow()
    const status = await syncManager.getSyncStatus()
    setSyncStatus(status)
  }

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 px-2",
              !isOnline && "text-yellow-600 hover:text-yellow-700"
            )}
          >
            {isOnline ? (
              <>
                <Cloud className="w-4 h-4" />
                {syncStatus.pendingAssignments > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 text-xs">
                    {syncStatus.pendingAssignments}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4" />
                <span className="text-xs font-medium">Offline</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">Offline Mode</span>
                  </>
                )}
              </div>
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "Connected" : "No Connection"}
              </Badge>
            </div>

            {/* Sync Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sync Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cached Transactions:</span>
                  <span className="font-medium">{syncStatus.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Changes:</span>
                  <span className={cn(
                    "font-medium",
                    syncStatus.pendingAssignments > 0 && "text-yellow-600"
                  )}>
                    {syncStatus.pendingAssignments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {formatLastSync(syncStatus.lastSync)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncNow}
                disabled={!isOnline || syncStatus.isSyncing}
                className="flex-1"
              >
                {syncStatus.isSyncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Sync Now
                  </>
                )}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => syncManager.clearCache()}
                  >
                    Clear Cache
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear all offline data</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Offline Message */}
            {!isOnline && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  You&apos;re working offline. Changes will be synced automatically when you reconnect.
                </p>
              </div>
            )}

            {/* Pending Changes Message */}
            {syncStatus.pendingAssignments > 0 && isOnline && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  {syncStatus.pendingAssignments} department assignment{syncStatus.pendingAssignments > 1 ? 's' : ''} waiting to sync.
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}