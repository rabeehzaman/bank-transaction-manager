import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspectTables() {
  console.log('=== UPDATED SCHEMA INSPECTION REPORT ===\n')
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('ahli_ledger')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('Testing connection with direct query...')
      console.error('Connection test failed:', testError)
      return
    }
    
    console.log('✅ Connection successful!')
    
    // Get sample data from both tables
    console.log('\n--- AHLI LEDGER SAMPLE ---')
    const { data: ahliData, error: ahliError } = await supabase
      .from('ahli_ledger')
      .select('*')
      .limit(3)
    
    if (ahliError) {
      console.error('Error fetching ahli_ledger:', ahliError)
    } else {
      console.log(`Found ${ahliData?.length || 0} sample records`)
      if (ahliData && ahliData.length > 0) {
        console.log('Columns:', Object.keys(ahliData[0]))
        console.log('Sample record:', JSON.stringify(ahliData[0], null, 2))
      }
    }
    
    console.log('\n--- TRANSACTION LEDGER SAMPLE ---')
    const { data: transactionData, error: transactionError } = await supabase
      .from('transaction_ledger')
      .select('*')
      .limit(3)
    
    if (transactionError) {
      console.error('Error fetching transaction_ledger:', transactionError)
    } else {
      console.log(`Found ${transactionData?.length || 0} sample records`)
      if (transactionData && transactionData.length > 0) {
        console.log('Columns:', Object.keys(transactionData[0]))
        console.log('Sample record:', JSON.stringify(transactionData[0], null, 2))
      }
    }

    // Test the new auxiliary tables
    console.log('\n--- AUXILIARY TABLES ---')
    const { data: linksData, error: linksError } = await supabase
      .from('linked_transfers')
      .select('*')
      .limit(1)
    
    if (linksError) {
      console.error('Error with linked_transfers:', linksError)
    } else {
      console.log('✅ linked_transfers table exists')
    }

    const { data: tagsData, error: tagsError } = await supabase
      .from('transaction_tags')
      .select('*')
      .limit(1)
    
    if (tagsError) {
      console.error('Error with transaction_tags:', tagsError)
    } else {
      console.log('✅ transaction_tags table exists')
    }
    
  } catch (error) {
    console.error('Inspection failed:', error)
  }
}

inspectTables()