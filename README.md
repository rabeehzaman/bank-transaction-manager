# Bank Transaction Manager

A unified web interface for managing bank transactions from Ahli and Rajhi banks with transfer linking capabilities.

## Features

- **Unified Transaction View**: Combines transactions from `ahli_ledger` and `transaction_ledger` tables
- **Advanced Filtering**: Filter by date, bank, department, and linking status
- **Transfer Linking**: Manually link interbank transfers with smart matching suggestions
- **Department Tagging**: Assign and manage source departments for transactions
- **Summary Dashboard**: View department-wise summaries and transfer statistics
- **Real-time Updates**: Automatic data synchronization with Supabase

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase project with `ahli_ledger` and `transaction_ledger` tables
- Supabase project credentials (URL and anon key)

### 2. Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Supabase Configuration

1. **Get your Supabase credentials**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to your project: `gnwfsddjfhtrczoozpfd`
   - Go to Settings → API
   - Copy the **anon public** key (not service role)
   - Update `.env.local` with the correct anon key

2. **Create required tables**:
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL scripts in the `/sql` directory or visit `/setup` page in the app

## Usage

Visit `http://localhost:3000` to access the application.
- **Setup Page**: Visit `/setup` for detailed configuration instructions
- **Transactions**: Main interface for managing transactions
- **Dashboard**: Summary view with analytics

## Database Schema

### Required Source Tables (must exist in your Supabase project):
- `ahli_ledger` - Ahli Bank transactions
- `transaction_ledger` - Rajhi Bank transactions

### Application Tables (created automatically):
- `linked_transfers` - Stores transfer group associations
- `transaction_tags` - Stores department assignments and metadata

## Quick Start

1. Update your `.env.local` with the correct Supabase anon key
2. Run the SQL scripts from the `/sql` directory in your Supabase dashboard
3. Start the app with `npm run dev`
4. Visit the setup page for detailed instructions

## Tech Stack

- **Next.js 15** with TypeScript
- **Supabase** for database
- **ShadCN/UI** + **Tailwind CSS** for UI
- **PostgreSQL** database

## License

Internal use only. Ensure compliance with your organization's data policies.
