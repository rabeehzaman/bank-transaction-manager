import { supabase } from './supabase'

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_identity: string
  identity_generation: string | null
}

export interface TableSchema {
  table_name: string
  columns: ColumnInfo[]
}

export async function getTableSchema(tableName: string): Promise<TableSchema | null> {
  try {
    // Query the information_schema to get column details
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, is_identity, identity_generation')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (error) {
      console.error(`Error fetching schema for ${tableName}:`, error)
      return null
    }

    return {
      table_name: tableName,
      columns: data as ColumnInfo[]
    }
  } catch (error) {
    console.error(`Error in getTableSchema for ${tableName}:`, error)
    return null
  }
}

export async function getSampleData(tableName: string, limit: number = 3) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit)

    if (error) {
      console.error(`Error fetching sample data for ${tableName}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Error in getSampleData for ${tableName}:`, error)
    return null
  }
}

export async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .eq('column_name', columnName)

    if (error) {
      console.error(`Error checking column ${columnName} in ${tableName}:`, error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error(`Error in checkColumnExists:`, error)
    return false
  }
}

export async function inspectBothTables() {
  console.log('=== SCHEMA INSPECTION REPORT ===')
  
  // Get schemas for both tables
  const ahliSchema = await getTableSchema('ahli_ledger')
  const transactionSchema = await getTableSchema('transaction_ledger')
  
  // Get sample data
  const ahliSamples = await getSampleData('ahli_ledger', 3)
  const transactionSamples = await getSampleData('transaction_ledger', 3)
  
  // Check for specific columns
  const ahliHasSourceDept = await checkColumnExists('ahli_ledger', 'source_department')
  const ahliHasTransferGroup = await checkColumnExists('ahli_ledger', 'transfer_group_id')
  const transactionHasSourceDept = await checkColumnExists('transaction_ledger', 'source_department')
  const transactionHasTransferGroup = await checkColumnExists('transaction_ledger', 'transfer_group_id')

  return {
    schemas: {
      ahli_ledger: ahliSchema,
      transaction_ledger: transactionSchema
    },
    sampleData: {
      ahli_ledger: ahliSamples,
      transaction_ledger: transactionSamples
    },
    columnChecks: {
      ahli_ledger: {
        source_department: ahliHasSourceDept,
        transfer_group_id: ahliHasTransferGroup
      },
      transaction_ledger: {
        source_department: transactionHasSourceDept,
        transfer_group_id: transactionHasTransferGroup
      }
    }
  }
}