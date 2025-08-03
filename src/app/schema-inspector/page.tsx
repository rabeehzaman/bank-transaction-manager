'use client'

import { useState } from 'react'
import { inspectBothTables } from '../../lib/schema-inspector'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export default function SchemaInspector() {
  const [inspectionResult, setInspectionResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runInspection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await inspectBothTables()
      setInspectionResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during inspection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Database Schema Inspector</h1>
        <p className="text-gray-600 mb-6">
          Inspect the schema and structure of ahli_ledger and transaction_ledger tables
        </p>
        
        <Button 
          onClick={runInspection} 
          disabled={loading}
          className="mb-6"
        >
          {loading ? 'Inspecting...' : 'Run Schema Inspection'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {inspectionResult && (
        <div className="space-y-6">
          {/* Schema Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(inspectionResult.schemas).map(([tableName, schema]: [string, any]) => (
              <Card key={tableName}>
                <CardHeader>
                  <CardTitle>{tableName} Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  {schema ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Columns:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Column Name</th>
                              <th className="text-left p-2">Data Type</th>
                              <th className="text-left p-2">Nullable</th>
                              <th className="text-left p-2">Default</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schema.columns.map((col: any, idx: number) => (
                              <tr key={idx} className="border-b">
                                <td className="p-2 font-medium">{col.column_name}</td>
                                <td className="p-2">{col.data_type}</td>
                                <td className="p-2">{col.is_nullable}</td>
                                <td className="p-2">{col.column_default || 'None'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">Failed to load schema</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Column Existence Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Column Existence Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(inspectionResult.columnChecks).map(([tableName, checks]: [string, any]) => (
                  <div key={tableName}>
                    <h4 className="font-semibold mb-2">{tableName}:</h4>
                    <ul className="space-y-1">
                      <li className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${checks.source_department ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>source_department: {checks.source_department ? 'EXISTS' : 'MISSING'}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${checks.transfer_group_id ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>transfer_group_id: {checks.transfer_group_id ? 'EXISTS' : 'MISSING'}</span>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sample Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(inspectionResult.sampleData).map(([tableName, data]: [string, any]) => (
              <Card key={tableName}>
                <CardHeader>
                  <CardTitle>{tableName} Sample Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {data && data.length > 0 ? (
                    <div className="space-y-2">
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-600">No sample data available</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}