import TransactionManager from '@/components/TransactionManager'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bank Transaction Manager</h1>
        <p className="text-muted-foreground mt-2">
          Unified view of Ahli and Rajhi bank transactions with transfer linking
        </p>
      </div>
      
      <TransactionManager />
    </main>
  )
}