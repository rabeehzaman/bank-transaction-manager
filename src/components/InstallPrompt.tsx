'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    setIsIOS(isIOSDevice)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show install dialog after a delay (better UX)
      setTimeout(() => {
        if (!localStorage.getItem('installPromptDismissed')) {
          setShowInstallDialog(true)
        }
      }, 30000) // Show after 30 seconds
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallDialog(false)
      toast.success('App installed successfully!')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowInstallDialog(true)
      } else {
        toast.error('Installation not available')
      }
      return
    }

    // Show the install prompt
    await deferredPrompt.prompt()
    
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      toast.success('Installing app...')
    } else {
      toast.info('Installation cancelled')
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowInstallDialog(false)
  }

  const handleDismiss = () => {
    setShowInstallDialog(false)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  // Don't show anything if already installed
  if (isInstalled) {
    return null
  }

  return (
    <>
      {/* Install Button in Header (always visible if not installed) */}
      {!isInstalled && (deferredPrompt || isIOS) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInstallDialog(true)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Install App</span>
        </Button>
      )}

      {/* Install Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Install Bank Transaction Manager
            </DialogTitle>
            <DialogDescription>
              Install the app for a better experience with offline access and faster performance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Benefits */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Benefits of installing:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Work offline with cached data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Faster loading and performance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Quick access from home screen
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Background sync for changes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Full-screen experience
                </li>
              </ul>
            </div>

            {/* iOS Instructions */}
            {isIOS && (
              <Alert>
                <Smartphone className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">To install on iOS:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Tap the Share button <span className="inline-block w-4 h-4 align-middle">⬆️</span></li>
                      <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                      <li>Tap &quot;Add&quot; to confirm</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Desktop/Android Instructions */}
            {!isIOS && !deferredPrompt && (
              <Alert>
                <Monitor className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">To install:</p>
                    <p className="text-sm">
                      Look for the install icon in your browser&apos;s address bar or menu.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDismiss}>
              Not Now
            </Button>
            {!isIOS && deferredPrompt && (
              <Button onClick={handleInstall}>
                <Download className="w-4 h-4 mr-2" />
                Install Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}