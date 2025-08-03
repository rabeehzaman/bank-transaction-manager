'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Banknote, Settings, Database } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Banknote className="h-6 w-6" />
              <span className="font-bold text-lg">Bank Transaction Manager</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              asChild
              size="sm"
            >
              <Link href="/">
                <Database className="w-4 h-4 mr-2" />
                Transactions
              </Link>
            </Button>

            <Button
              variant={isActive('/setup') ? 'default' : 'ghost'}
              asChild
              size="sm"
            >
              <Link href="/setup">
                <Settings className="w-4 h-4 mr-2" />
                Setup
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}