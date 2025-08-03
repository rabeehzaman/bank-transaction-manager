import SetupInstructions from '@/components/SetupInstructions'

export default function SetupPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Setup Instructions</h1>
        <p className="text-muted-foreground mt-2">
          Complete these steps to configure your bank transaction manager
        </p>
      </div>
      
      <SetupInstructions />
    </main>
  )
}