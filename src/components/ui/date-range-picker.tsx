"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
// CalendarIcon currently unused
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  placeholder: _placeholder = "Select date range" // Defined but not currently used
}: DateRangePickerProps) {
  const [openFrom, setOpenFrom] = React.useState(false)
  const [openTo, setOpenTo] = React.useState(false)
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(dateRange?.from)
  const [dateTo, setDateTo] = React.useState<Date | undefined>(dateRange?.to)

  React.useEffect(() => {
    setDateFrom(dateRange?.from)
    setDateTo(dateRange?.to)
  }, [dateRange])

  const handleFromDateChange = (date: Date | undefined) => {
    setDateFrom(date)
    setOpenFrom(false)
    
    // If "to" date is before "from" date, clear it
    if (date && dateTo && dateTo < date) {
      setDateTo(undefined)
      onDateRangeChange?.({ from: date, to: undefined })
    } else {
      onDateRangeChange?.({ from: date, to: dateTo })
    }
  }

  const handleToDateChange = (date: Date | undefined) => {
    setDateTo(date)
    setOpenTo(false)
    onDateRangeChange?.({ from: dateFrom, to: date })
  }

  const clearDates = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    onDateRangeChange?.(undefined)
  }

  const setPresetRange = (days: number) => {
    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - days)
    setDateFrom(pastDate)
    setDateTo(today)
    onDateRangeChange?.({ from: pastDate, to: today })
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Popover open={openFrom} onOpenChange={setOpenFrom}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal text-left"
              >
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={handleFromDateChange}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex-1">
          <Popover open={openTo} onOpenChange={setOpenTo}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal text-left"
              >
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={handleToDateChange}
                captionLayout="dropdown"
                disabled={dateFrom ? { before: dateFrom } : undefined}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={clearDates}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresetRange(7)}
          className="flex-1"
        >
          Last 7 days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresetRange(30)}
          className="flex-1"
        >
          Last 30 days
        </Button>
      </div>
    </div>
  )
}