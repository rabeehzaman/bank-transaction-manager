'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Info, 
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FileUpload {
  file: File | null
  bank: string
  uploading: boolean
  progress: number
  error: string | null
}

interface ProcessingLog {
  id: string
  file_name: string
  account_number: string | null
  status: string
  transactions_count: number
  duplicates_found: number
  error_message: string | null
  created_at: string
  processing_started_at: string | null
  processing_completed_at: string | null
}

const BANK_BUCKETS = {
  'Rajhi': 'bank-statements',
  'Ahli': 'ahlighadeer', 
  'GIB': 'gibbank'
} as const

export default function ExcelImport() {
  const [upload, setUpload] = useState<FileUpload>({
    file: null,
    bank: '',
    uploading: false,
    progress: 0,
    error: null
  })

  const [logs, setLogs] = useState<ProcessingLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // File dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUpload(prev => ({ ...prev, file, error: null }))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDropRejected: () => {
      toast.error('Please upload only Excel files (.xlsx or .xls)')
    }
  })

  // Load processing logs
  const loadLogs = useCallback(async (selectedBank?: string) => {
    if (!supabase) return

    try {
      setLoadingLogs(true)
      
      let allLogs: ProcessingLog[] = []

      // If a specific bank is selected, only load logs from that bank
      if (selectedBank && selectedBank !== '') {
        switch (selectedBank) {
          case 'Rajhi':
            const { data: generalLogs } = await supabase
              .from('file_processing_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20)
            allLogs = (generalLogs || []).map(log => ({ ...log, bank: 'Rajhi' }))
            break
          case 'Ahli':
            const { data: ahliLogs } = await supabase
              .from('ahli_file_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20)
            allLogs = (ahliLogs || []).map(log => ({ ...log, bank: 'Ahli' }))
            break
          case 'GIB':
            const { data: gibLogs } = await supabase
              .from('gib_file_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20)
            allLogs = (gibLogs || []).map(log => ({ ...log, bank: 'GIB' }))
            break
        }
      } else {
        // Load all logs when no specific bank is selected
        const { data: generalLogs } = await supabase
          .from('file_processing_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        const { data: ahliLogs } = await supabase
          .from('ahli_file_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        const { data: gibLogs } = await supabase
          .from('gib_file_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        // Combine and sort all logs
        allLogs = [
          ...(generalLogs || []).map(log => ({ ...log, bank: 'Rajhi' })),
          ...(ahliLogs || []).map(log => ({ ...log, bank: 'Ahli' })),
          ...(gibLogs || []).map(log => ({ ...log, bank: 'GIB' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }

      setLogs(allLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
      toast.error('Failed to load processing logs')
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Reload logs when bank selection changes
  useEffect(() => {
    loadLogs(upload.bank)
  }, [upload.bank, loadLogs])

  // Handle file upload
  const handleUpload = async () => {
    if (!upload.file || !upload.bank || !supabase) return

    const bucketName = BANK_BUCKETS[upload.bank as keyof typeof BANK_BUCKETS]
    
    setUpload(prev => ({ ...prev, uploading: true, progress: 0, error: null }))

    try {
      // Create unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `${timestamp}_${upload.file.name}`

      // Upload file to appropriate bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, upload.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      setUpload(prev => ({ ...prev, progress: 100 }))
      toast.success(`File uploaded successfully to ${upload.bank} bucket`)
      
      // Reset form
      setUpload({
        file: null,
        bank: '',
        uploading: false,
        progress: 0,
        error: null
      })

      // Refresh logs after a short delay to see processing start
      setTimeout(() => {
        loadLogs(upload.bank)
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUpload(prev => ({ ...prev, error: errorMessage }))
      toast.error(`Upload failed: ${errorMessage}`)
    } finally {
      setUpload(prev => ({ ...prev, uploading: false }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'completed' ? 'default' : 
                   status === 'failed' ? 'destructive' : 'secondary'
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Excel File Import
                </CardTitle>
                <CardDescription>
                  Upload Excel files to the appropriate bank bucket for automatic processing
                </CardDescription>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Info className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>File Upload Guide</SheetTitle>
                    <SheetDescription>
                      Learn how to upload bank statements correctly
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="font-medium">Supported Banks</h4>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Rajhi Bank:</strong> Uploads to bank-statements bucket</li>
                        <li>• <strong>Ahli Bank:</strong> Uploads to ahlighadeer bucket</li>
                        <li>• <strong>GIB Bank:</strong> Uploads to gibbank bucket</li>
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium">File Requirements</h4>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li>• File formats: .xlsx, .xls</li>
                        <li>• Maximum file size: 50MB</li>
                        <li>• Files are automatically processed after upload</li>
                        <li>• Duplicate transactions are detected and handled</li>
                      </ul>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Select Bank</label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose the bank that issued the statement you&apos;re uploading</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={upload.bank} 
                onValueChange={(value) => setUpload(prev => ({ ...prev, bank: value }))}
                disabled={upload.uploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose bank for this file" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rajhi">
                    <div className="flex items-center gap-2">
                      <span>Rajhi Bank</span>
                      <Badge variant="outline" className="text-xs">bank-statements</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Ahli">
                    <div className="flex items-center gap-2">
                      <span>Ahli Bank</span>
                      <Badge variant="outline" className="text-xs">ahlighadeer</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="GIB">
                    <div className="flex items-center gap-2">
                      <span>GIB Bank</span>
                      <Badge variant="outline" className="text-xs">gibbank</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${upload.uploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {upload.file ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">File Ready</span>
                </div>
                <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto">
                  <div className="flex items-start justify-between gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={upload.file.name}>
                        {upload.file.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{(upload.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{upload.file.type || 'Excel file'}</span>
                        <span>{new Date(upload.file.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUpload(prev => ({ ...prev, file: null }))
                      }}
                      className="p-1 h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click to change file or remove to select a different one
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop the Excel file here' : 'Drag & drop an Excel file here'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  or click to select (.xlsx, .xls files only)
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">Max 50MB</Badge>
                  <Badge variant="outline" className="text-xs">Auto-processed</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {upload.uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{upload.progress}%</span>
              </div>
              <Progress value={upload.progress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {upload.error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{upload.error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button 
            onClick={handleUpload}
            disabled={!upload.file || !upload.bank || upload.uploading}
            className="w-full"
          >
            {upload.uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </CardContent>
      </Card>

      {/* Processing Logs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Processing Logs</CardTitle>
              <CardDescription>
                {upload.bank ? 
                  `Recent file processing activity for ${upload.bank} Bank` :
                  'Recent file processing activity and edge function logs'
                }
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadLogs(upload.bank)}
              disabled={loadingLogs}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex justify-center py-8">
              <Clock className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processing logs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Duplicates</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.file_name}
                      {log.error_message && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={log.error_message}>
                          {log.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(log as { bank?: string }).bank || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell>{log.transactions_count || 0}</TableCell>
                    <TableCell>{log.duplicates_found || 0}</TableCell>
                    <TableCell>
                      {log.processing_started_at ? 
                        new Date(log.processing_started_at).toLocaleString() : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      {log.processing_completed_at ? 
                        new Date(log.processing_completed_at).toLocaleString() : 
                        '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  )
}