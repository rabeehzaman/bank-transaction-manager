'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Keyboard, 
  Navigation, 
  Search, 
  Filter, 
  Palette,
  RefreshCw,
  HelpCircle
} from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function HelpModal({ isOpen, onOpenChange }: HelpModalProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? 'Cmd' : 'Ctrl'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Help & Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Learn how to navigate and use the Bank Transaction Manager efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span>Show this help</span>
                <Badge variant="outline">?</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Navigate to Dashboard</span>
                <Badge variant="outline">{modKey} + 1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Navigate to Transactions</span>
                <Badge variant="outline">{modKey} + 2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Navigate to Import</span>
                <Badge variant="outline">{modKey} + 3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Navigate to Admin</span>
                <Badge variant="outline">{modKey} + 4</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Toggle Sidebar</span>
                <Badge variant="outline">{modKey} + B</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Toggle Theme</span>
                <Badge variant="outline">{modKey} + T</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Refresh Page</span>
                <Badge variant="outline">{modKey} + R</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Features Guide */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
              <Navigation className="w-4 h-4" />
              Features Guide
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="flex items-center gap-2 font-medium text-sm">
                  <Search className="w-4 h-4" />
                  Transaction Search & Filtering
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the search bar to find transactions by description, amount, or reference. 
                  Apply filters by bank, department, status, and date range for precise results.
                </p>
              </div>
              
              <div>
                <h4 className="flex items-center gap-2 font-medium text-sm">
                  <Filter className="w-4 h-4" />
                  Advanced Filtering
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Filters are searchable dropdowns. Type to quickly find banks or departments. 
                  Active filters are shown with a counter and can be cleared all at once.
                </p>
              </div>

              <div>
                <h4 className="flex items-center gap-2 font-medium text-sm">
                  <Palette className="w-4 h-4" />
                  Theme Customization
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Switch between light, dark, and system themes using the theme toggle in the sidebar 
                  or the keyboard shortcut {modKey}+T.
                </p>
              </div>

              <div>
                <h4 className="flex items-center gap-2 font-medium text-sm">
                  <RefreshCw className="w-4 h-4" />
                  Data Management
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Import Excel files from banks, manage departments and categorization rules, 
                  and view interactive dashboards with charts and analytics.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tips */}
          <div>
            <h3 className="text-lg font-semibold mb-3">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Hover over transaction descriptions to see detailed information in a popup</li>
              <li>• Use the breadcrumb navigation to keep track of your location</li>
              <li>• The sidebar can be collapsed to save space - it remembers your preference</li>
              <li>• Filters support type-ahead search for quick selection</li>
              <li>• All forms include real-time validation and helpful error messages</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}