'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { 
  Database, 
  Upload, 
  Shield, 
  Building2, 
  Settings, 
  RefreshCw,
  Keyboard
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useKeyboardShortcuts } from '@/components/KeyboardShortcuts'
import AppIcon from '@/components/AppIcon'

const navigationItems = [
  {
    title: 'Transactions',
    icon: Database,
    href: '/transactions',
  },
  {
    title: 'Import',
    icon: Upload,
    href: '/import',
  },
  {
    title: 'Admin',
    icon: Shield,
    href: '/admin',
    subItems: [
      {
        title: 'Departments',
        icon: Building2,
        href: '/admin',
      },
      {
        title: 'Rules',
        icon: Settings,
        href: '/admin/rules',
      },
      {
        title: 'Sync',
        icon: RefreshCw,
        href: '/admin/sync',
      },
    ],
  },
]

export default function SidebarNav() {
  const pathname = usePathname()
  const { setHelpModalOpen } = useKeyboardShortcuts()

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <AppIcon size={28} variant="solid" className="flex-shrink-0" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
            Bank Transaction Manager
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  
                  {item.subItems && (
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(subItem.href)}
                          >
                            <Link href={subItem.href}>
                              <subItem.icon />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Bank Transaction Manager v1.0
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="group-data-[collapsible=icon]:hidden">
              <button 
                onClick={() => setHelpModalOpen?.(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Keyboard className="w-3 h-3" />
                <span>? for shortcuts</span>
              </button>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}