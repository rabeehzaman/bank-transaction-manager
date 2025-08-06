'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/components/ui/sidebar'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import HelpModal from '@/components/HelpModal'

export function useKeyboardShortcuts() {
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const { setTheme, theme } = useTheme()
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, metaKey, ctrlKey, shiftKey, altKey } = event
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modKey = isMac ? metaKey : ctrlKey

    // Ignore shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as Element)?.getAttribute('contenteditable') === 'true'
    ) {
      // Only allow certain shortcuts in inputs
      if (modKey && key === 'b') {
        event.preventDefault()
        toggleSidebar()
        toast.success('Sidebar toggled')
      }
      return
    }

    // Navigation shortcuts
    if (modKey && !shiftKey && !altKey) {
      switch (key) {
        case '1':
          event.preventDefault()
          router.push('/')
          toast.success('Navigated to Dashboard')
          break
        case '2':
          event.preventDefault()
          router.push('/transactions')
          toast.success('Navigated to Transactions')
          break
        case '3':
          event.preventDefault()
          router.push('/import')
          toast.success('Navigated to Import')
          break
        case '4':
          event.preventDefault()
          router.push('/admin')
          toast.success('Navigated to Admin')
          break
        case 'b':
          event.preventDefault()
          toggleSidebar()
          toast.success('Sidebar toggled')
          break
        case 't':
          event.preventDefault()
          const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
          setTheme(nextTheme)
          toast.success(`Theme switched to ${nextTheme}`)
          break
        case 'r':
          event.preventDefault()
          window.location.reload()
          break
      }
    }

    // Help shortcut
    if (key === '?' && !modKey && !shiftKey && !altKey) {
      event.preventDefault()
      setHelpModalOpen(true)
    }

    // Escape key to close modals/dropdowns
    if (key === 'Escape') {
      // This will be handled by individual components
      // but we can add global escape handling here if needed
    }

  }, [router, toggleSidebar, setTheme, theme])

  const showShortcutsHelp = useCallback(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modKey = isMac ? 'Cmd' : 'Ctrl'
    
    toast.info(
      `Keyboard Shortcuts:
      ${modKey}+1: Dashboard
      ${modKey}+2: Transactions  
      ${modKey}+3: Import
      ${modKey}+4: Admin
      ${modKey}+B: Toggle Sidebar
      ${modKey}+T: Toggle Theme
      ${modKey}+R: Refresh Page
      ?: Show this help`,
      { duration: 6000 }
    )
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { showShortcutsHelp, helpModalOpen, setHelpModalOpen }
}

export default function KeyboardShortcuts() {
  const { helpModalOpen, setHelpModalOpen } = useKeyboardShortcuts()
  
  return (
    <HelpModal 
      isOpen={helpModalOpen} 
      onOpenChange={setHelpModalOpen}
    />
  )
}