import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Upload, Shield, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Bank Transaction Manager. Get started with managing your transactions below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="grid" aria-label="Dashboard navigation cards">
        <Card className="hover-lift animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              View Transactions
            </CardTitle>
            <CardDescription>
              Browse and manage all bank transactions with advanced filtering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="button-press w-full">
              <Link href="/transactions">Open Transactions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload Excel files from banks for automatic processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="button-press w-full">
              <Link href="/import">Import Files</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Manage Departments
            </CardTitle>
            <CardDescription>
              Create and manage transaction departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="button-press w-full">
              <Link href="/admin/departments">Manage Departments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Panel
            </CardTitle>
            <CardDescription>
              Access administrative functions and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="button-press w-full">
              <Link href="/admin">Admin Panel</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}