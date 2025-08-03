import { supabase } from './supabase'

export async function getTableSchemaSQL(tableName: string) {
  try {
    // Get detailed column information using SQL
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: tableName
    })

    if (error) {
      console.log('RPC not available, trying direct SQL query...')
      
      // Alternative: Use a direct query if RPC is not set up
      const { data: columnData, error: columnError } = await supabase
        .from('information_schema.columns')
        .select(`
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          ordinal_position
        `)
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position')

      if (columnError) {
        throw columnError
      }

      return columnData
    }

    return data
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error)
    return null
  }
}

export async function getTableConstraints(tableName: string) {
  try {
    const { data, error } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type
      `)
      .eq('table_name', tableName)
      .eq('table_schema', 'public')

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error getting constraints for ${tableName}:`, error)
    return null
  }
}

export async function checkIfTableExists(tableName: string) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')

    if (error) {
      throw error
    }

    return data && data.length > 0
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

export async function getComprehensiveTableInfo(tableName: string) {
  const exists = await checkIfTableExists(tableName)
  
  if (!exists) {
    return {
      exists: false,
      message: `Table '${tableName}' does not exist in the public schema`
    }
  }

  const schema = await getTableSchemaSQL(tableName)
  const constraints = await getTableConstraints(tableName)
  const sampleData = await getSampleDataDirect(tableName, 5)

  return {
    exists: true,
    table_name: tableName,
    schema,
    constraints,
    sampleData
  }
}

async function getSampleDataDirect(tableName: string, limit: number) {
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
    console.error(`Error in getSampleDataDirect:`, error)
    return null
  }
}