'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, FileText, Zap, Home } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const getActiveTab = () => {
    if (pathname === '/admin' || pathname === '/admin/') return 'departments'
    if (pathname.includes('/rules')) return 'rules'
    if (pathname.includes('/sync')) return 'sync'
    return 'departments'
  }

  const getCurrentPageName = () => {
    if (pathname === '/admin' || pathname === '/admin/') return 'Departments'
    if (pathname.includes('/rules')) return 'Rules'
    if (pathname.includes('/sync')) return 'Sync'
    return 'Departments'
  }

  const handleTabChange = (value: string) => {
    if (value === 'departments') {
      router.push('/admin')
    } else {
      router.push(`/admin/${value}`)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Admin</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getCurrentPageName()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage departments, create rules, and sync transactions
        </p>
      </div>

      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Sync
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {children}
        </div>
      </Tabs>
    </div>
  )
}