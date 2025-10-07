'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Car, Filter, CalendarDays, Clock, Calendar, Timer, AlertCircle, Sparkles, ChevronDown, ChevronUp, DollarSign, CheckCircle, Clock4, TrendingUp, Target, Search, X } from 'lucide-react'

interface Vehicle {
  plateNumber: string
  plateType: string
  bodyType: string
  vehicleMaker: string
  vehicleModel: string
  modelYear: string
  majorColor: string
  ownerName: string
  department: string
  installment: number
  deductionDay: number
  firstInstallmentDate: string
  totalMonths: number
  lastInstallmentDate: string
}

interface PaymentCalculation {
  paidMonths: number
  paidAmount: number
  totalRepayment: number
  remainingAmount: number
  remainingMonths: number
  progressPercentage: number
  nextPaymentDate: Date
  daysUntilNext: number
  isOverdue: boolean
}

const vehicleData: Vehicle[] = [
  {
    plateNumber: "ب ص و 1521 (UXB 1521)",
    plateType: "Private Transport",
    bodyType: "تويوتا (Toyota) – فان (Van)",
    vehicleMaker: "Toyota",
    vehicleModel: "Van",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "Tayseer Arabian Company",
    department: "Frozen",
    installment: 5867,
    deductionDay: 27,
    firstInstallmentDate: "3/27/23",
    totalMonths: 36,
    lastInstallmentDate: "2/27/26"
  },
  {
    plateNumber: "ب ص ب 5735 (BXB 5735)",
    plateType: "Private Transport",
    bodyType: "ايسوزو (Isuzu) – شاحنه (Truck)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck",
    modelYear: "2021",
    majorColor: "ابيض (White)",
    ownerName: "Tayseer Arabian Company",
    department: "Frozen",
    installment: 3760,
    deductionDay: 27,
    firstInstallmentDate: "7/27/22",
    totalMonths: 36,
    lastInstallmentDate: "6/27/25"
  },
  {
    plateNumber: "ب ص ن 8304 (NXB 8304)",
    plateType: "Private Transport",
    bodyType: "ايسوزو (Isuzu) – شاحنه (Truck)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck",
    modelYear: "2022",
    majorColor: "ابيض (White)",
    ownerName: "Tayseer Arabian Company",
    department: "Qurban",
    installment: 4123,
    deductionDay: 27,
    firstInstallmentDate: "3/27/23",
    totalMonths: 36,
    lastInstallmentDate: "2/27/26"
  },
  {
    plateNumber: "ب ص ب 5754 (BXB 5754)",
    plateType: "Private Transport",
    bodyType: "ايسوزو (Isuzu) – شاحنه (Truck)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck",
    modelYear: "2021",
    majorColor: "ابيض (White)",
    ownerName: "Tayseer Arabian Company",
    department: "Waleed",
    installment: 3760,
    deductionDay: 27,
    firstInstallmentDate: "7/27/22",
    totalMonths: 36,
    lastInstallmentDate: "6/27/25"
  },
  {
    plateNumber: "أ أ ط 8292 (TAA 8292)",
    plateType: "Equipment",
    bodyType: "تويوتا (Toyota) – رافعه شوكيه (Forklift)",
    vehicleMaker: "Toyota",
    vehicleModel: "Forklift",
    modelYear: "2022",
    majorColor: "اسود (Black)",
    ownerName: "Tayseer Arabian Company",
    department: "Frozen",
    installment: 4686,
    deductionDay: 27,
    firstInstallmentDate: "3/27/23",
    totalMonths: 36,
    lastInstallmentDate: "2/27/26"
  },
  {
    plateNumber: "ب ص و 1520 (UXB 1520)",
    plateType: "Private Transport",
    bodyType: "تويوتا (Toyota) – فان (Van)",
    vehicleMaker: "Toyota",
    vehicleModel: "Van",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "Tayseer Arabian Company",
    department: "Frozen",
    installment: 5867,
    deductionDay: 27,
    firstInstallmentDate: "3/27/23",
    totalMonths: 36,
    lastInstallmentDate: "2/27/26"
  },
  {
    plateNumber: "ب ص ب 5737 (BXB 5737)",
    plateType: "Private Transport",
    bodyType: "ايسوزو (Isuzu) – شاحنه (Truck)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck",
    modelYear: "2021",
    majorColor: "ابيض (White)",
    ownerName: "Tayseer Arabian Company",
    department: "Mada",
    installment: 3760,
    deductionDay: 27,
    firstInstallmentDate: "7/27/22",
    totalMonths: 36,
    lastInstallmentDate: "6/27/25"
  },
  {
    plateNumber: "ر أ ل 6496 (LAR 6496)",
    plateType: "Private Car",
    bodyType: "شانجان (Changan) – سي اس 95 (CS95)",
    vehicleMaker: "Changan",
    vehicleModel: "CS95",
    modelYear: "2022",
    majorColor: "اسود (Black)",
    ownerName: "Tayseer Arabian Company",
    department: "Frozen",
    installment: 4154,
    deductionDay: 27,
    firstInstallmentDate: "7/27/22",
    totalMonths: 36,
    lastInstallmentDate: "6/27/25"
  },
  {
    plateNumber: "ر ر ك 3027 (KRR 3027)",
    plateType: "Private Car",
    bodyType: "شيفورلية (Chevrolet) – جرووف (Groove)",
    vehicleMaker: "Chevrolet",
    vehicleModel: "Groove",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "Tayseer Arabian Company",
    department: "Jebreel",
    installment: 2763,
    deductionDay: 27,
    firstInstallmentDate: "3/27/23",
    totalMonths: 36,
    lastInstallmentDate: "2/27/26"
  },
  {
    plateNumber: "ب ط أ 6231 (ATB 6231)",
    plateType: "Private Transport",
    bodyType: "تويوتا (Toyota) – فان (Van)",
    vehicleMaker: "Toyota",
    vehicleModel: "Van",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Qurban",
    installment: 4317,
    deductionDay: 6,
    firstInstallmentDate: "8/6/23",
    totalMonths: 48,
    lastInstallmentDate: "8/6/27"
  },
  {
    plateNumber: "ب ط ح 5936 (JTB 5936)",
    plateType: "Private Transport",
    bodyType: "ايسوزو (Isuzu) – شاحنه دبل (Truck - Double Axle)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck (Double Axle)",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Team Babu",
    installment: 7117,
    deductionDay: 6,
    firstInstallmentDate: "7/6/23",
    totalMonths: 48,
    lastInstallmentDate: "7/6/27"
  },
  {
    plateNumber: "ب ط ح 5937 (JTB 5937)",
    plateType: "Private Transport",
    bodyType: "تويوتا (Toyota) – بكب غماره (Pickup - Single Cabin)",
    vehicleMaker: "Toyota",
    vehicleModel: "Pickup (Single Cabin)",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Hassan",
    installment: 2843,
    deductionDay: 6,
    firstInstallmentDate: "10/6/23",
    totalMonths: 48,
    lastInstallmentDate: "10/6/27"
  },
  {
    plateNumber: "ر د أ 5788 (ADR 5788)",
    plateType: "Private Car",
    bodyType: "سايك موتور (SAIC Motor) – ام جي زد اس (MG ZS)",
    vehicleMaker: "SAIC Motor",
    vehicleModel: "MG ZS",
    modelYear: "2022",
    majorColor: "اسود (Black)",
    ownerName: "ALRAJHI BANK",
    department: "Frozen",
    installment: 2033,
    deductionDay: 6,
    firstInstallmentDate: "10/5/22",
    totalMonths: 48,
    lastInstallmentDate: "9/5/26"
  },
  {
    plateNumber: "ب ط ط 8065 (TTB 8065)",
    plateType: "Private Transport",
    bodyType: "نيسان (Nissan) – اورفان (Urvan)",
    vehicleMaker: "Nissan",
    vehicleModel: "Urvan",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Mada",
    installment: 3146,
    deductionDay: 6,
    firstInstallmentDate: "9/6/23",
    totalMonths: 48,
    lastInstallmentDate: "9/6/27"
  },
  {
    plateNumber: "ب ع ل 4314 (LEB 4314)",
    plateType: "Private Transport",
    bodyType: "3 Wheels – ايسوزو (Isuzu) – شاحنه (Truck)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck",
    modelYear: "2025",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Frozen",
    installment: 3807,
    deductionDay: 15,
    firstInstallmentDate: "5/14/25",
    totalMonths: 48,
    lastInstallmentDate: "5/14/29"
  },
  {
    plateNumber: "ب ع ل 4315 (LEB 4315)",
    plateType: "Private Transport",
    bodyType: "3 Wheels – ايسوزو (Isuzu) – REWARD",
    vehicleMaker: "Isuzu",
    vehicleModel: "REWARD",
    modelYear: "2025",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Mada",
    installment: 3586,
    deductionDay: 14,
    firstInstallmentDate: "5/14/25",
    totalMonths: 48,
    lastInstallmentDate: "5/14/29"
  },
  {
    plateNumber: "ب ع س 4338 (SEB 4338)",
    plateType: "Private Transport",
    bodyType: "4 Wheels – ايسوزو (Isuzu) – شاحنه (Truck)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Team Babu",
    installment: 7397,
    deductionDay: 9,
    firstInstallmentDate: "10/9/24",
    totalMonths: 48,
    lastInstallmentDate: "10/9/28"
  },
  {
    plateNumber: "ب ط س 4623 (STB 4623)",
    plateType: "Private Transport",
    bodyType: "تويوتا (Toyota) – فان (Van)",
    vehicleMaker: "Toyota",
    vehicleModel: "Van",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Osaimi",
    installment: 4535,
    deductionDay: 6,
    firstInstallmentDate: "10/6/23",
    totalMonths: 48,
    lastInstallmentDate: "10/6/27"
  },
  {
    plateNumber: "ب ط ط 8060 (TTB 8060)",
    plateType: "Private Transport",
    bodyType: "نيسان (Nissan) – اورفان (Urvan)",
    vehicleMaker: "Nissan",
    vehicleModel: "Urvan",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Mada",
    installment: 3146,
    deductionDay: 6,
    firstInstallmentDate: "9/6/23",
    totalMonths: 48,
    lastInstallmentDate: "9/6/27"
  },
  {
    plateNumber: "ب ص ط 3263 (TXB 3263)",
    plateType: "Private Transport",
    bodyType: "ايسوزو (Isuzu) – شاحنه (Truck)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Truck",
    modelYear: "2022",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Frozen",
    installment: 3197,
    deductionDay: 6,
    firstInstallmentDate: "10/5/22",
    totalMonths: 48,
    lastInstallmentDate: "9/5/26"
  },
  {
    plateNumber: "ر و ق 1513 (GUR 1513)",
    plateType: "Private Car",
    bodyType: "نقل أكثر من 3.5 طن (Above 3.5 Tons) – تويوتا (Toyota)",
    vehicleMaker: "Toyota",
    vehicleModel: "RAV4",
    modelYear: "2025",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Osaimi",
    installment: 3807,
    deductionDay: 15,
    firstInstallmentDate: "5/14/25",
    totalMonths: 48,
    lastInstallmentDate: "5/14/29"
  },
  {
    plateNumber: "ب ع ل 4313 (LEB 4313)",
    plateType: "Private Transport",
    bodyType: "3 Wheels – ايسوزو (Isuzu) – REWARD",
    vehicleMaker: "Isuzu",
    vehicleModel: "REWARD",
    modelYear: "2025",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Team Babu",
    installment: 4064,
    deductionDay: 14,
    firstInstallmentDate: "5/14/25",
    totalMonths: 48,
    lastInstallmentDate: "5/14/29"
  },
  {
    plateNumber: "ر ك ي 1646 (VKR 1646)",
    plateType: "Private Car",
    bodyType: "نقل أكثر من 3.5 طن (Above 3.5 Tons) – نيسان (Nissan)",
    vehicleMaker: "Nissan",
    vehicleModel: "X-Trail",
    modelYear: "2024",
    majorColor: "اسود (Black)",
    ownerName: "ALRAJHI BANK",
    department: "Frozen",
    installment: 3690,
    deductionDay: 8,
    firstInstallmentDate: "10/9/24",
    totalMonths: 48,
    lastInstallmentDate: "10/9/28"
  },
  {
    plateNumber: "ر د أ 8650 (ADR 8650)",
    plateType: "Private Car",
    bodyType: "شانجان (Changan) – سي اس 95 (CS95)",
    vehicleMaker: "Changan",
    vehicleModel: "CS95",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Madinah",
    installment: 3215,
    deductionDay: 6,
    firstInstallmentDate: "10/5/22",
    totalMonths: 48,
    lastInstallmentDate: "9/5/26"
  },
  {
    plateNumber: "ب ط ط 8059 (TTB 8059)",
    plateType: "Private Transport",
    bodyType: "ايسوزو (Isuzu) – بكب غمارتين (Pickup - Double Cabin)",
    vehicleMaker: "Isuzu",
    vehicleModel: "Pickup (Double Cabin)",
    modelYear: "2023",
    majorColor: "ابيض (White)",
    ownerName: "ALRAJHI BANK",
    department: "Madinah",
    installment: 2735,
    deductionDay: 6,
    firstInstallmentDate: "7/6/23",
    totalMonths: 48,
    lastInstallmentDate: "7/6/27"
  }
]

const getDepartmentColor = (department: string) => {
  switch (department.toLowerCase()) {
    case 'frozen': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    case 'qurban': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    case 'waleed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    case 'mada': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
    case 'jebreel': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300'
    case 'team babu': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
    case 'hassan': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300'
    case 'osaimi': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300'
    case 'madinah': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }
}

const getDeductionDateColor = (day: number) => {
  switch (day) {
    case 6: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200'
    case 8: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200'
    case 9: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200'
    case 14: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200'
    case 15: return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300 border-cyan-200'
    case 27: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200'
  }
}

// Helper functions for payment calculations
const parseDate = (dateStr: string): Date => {
  const [month, day, year] = dateStr.split('/')
  const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)
  return new Date(fullYear, parseInt(month) - 1, parseInt(day))
}

const calculatePaymentDetails = (vehicle: Vehicle): PaymentCalculation => {
  const startDate = parseDate(vehicle.firstInstallmentDate)
  const today = new Date()

  // Calculate how many payments have been made
  let paidMonths = 0
  const paymentDate = new Date(startDate)

  while (paymentDate <= today && paidMonths < vehicle.totalMonths) {
    paidMonths++
    paymentDate.setMonth(paymentDate.getMonth() + 1)
  }

  // Ensure we don't exceed total months
  paidMonths = Math.min(paidMonths, vehicle.totalMonths)

  const paidAmount = paidMonths * vehicle.installment
  const totalRepayment = vehicle.totalMonths * vehicle.installment
  const remainingAmount = totalRepayment - paidAmount
  const remainingMonths = vehicle.totalMonths - paidMonths
  const progressPercentage = (paidMonths / vehicle.totalMonths) * 100

  // Calculate next payment date
  const nextPaymentDate = new Date(startDate)
  nextPaymentDate.setMonth(startDate.getMonth() + paidMonths)

  const daysUntilNext = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysUntilNext < 0 && remainingMonths > 0

  return {
    paidMonths,
    paidAmount,
    totalRepayment,
    remainingAmount,
    remainingMonths,
    progressPercentage,
    nextPaymentDate,
    daysUntilNext: Math.max(0, daysUntilNext),
    isOverdue
  }
}

// Helper functions for countdown calculation
const getNextDeductionDate = (day: number) => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentDay = today.getDate()

  if (currentDay <= day) {
    // This month
    return new Date(today.getFullYear(), currentMonth, day)
  } else {
    // Next month
    return new Date(today.getFullYear(), currentMonth + 1, day)
  }
}

const getCountdown = (targetDate: Date) => {
  const diff = targetDate.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  }
}

export default function VehicleLoanManager() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedOwner, setSelectedOwner] = useState<string>('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all')
  const [selectedDeductionDay, setSelectedDeductionDay] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const departments = useMemo(() => {
    const depts = Array.from(new Set(vehicleData.map(v => v.department)))
    return depts.sort()
  }, [])

  const owners = useMemo(() => {
    const ownerList = Array.from(new Set(vehicleData.map(v => v.ownerName)))
    return ownerList.sort()
  }, [])

  const deductionDays = useMemo(() => {
    const days = Array.from(new Set(vehicleData.map(v => v.deductionDay)))
    return days.sort((a, b) => a - b)
  }, [])

  const filteredVehicles = useMemo(() => {
    let filtered = vehicleData

    // Search functionality
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(vehicle => {
        const searchFields = [
          vehicle.plateNumber.toLowerCase(),
          vehicle.vehicleMaker.toLowerCase(),
          vehicle.vehicleModel.toLowerCase(),
          vehicle.installment.toString(),
          vehicle.department.toLowerCase(),
          vehicle.ownerName.toLowerCase(),
          vehicle.bodyType.toLowerCase(),
          // Also search in plate number without spaces/parentheses for better matching
          vehicle.plateNumber.replace(/[\s()]/g, '').toLowerCase()
        ]

        return searchFields.some(field => field.includes(query))
      })
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.department === selectedDepartment)
    }

    if (selectedOwner !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.ownerName === selectedOwner)
    }

    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(vehicle => {
        const paymentDetails = calculatePaymentDetails(vehicle)
        if (selectedPaymentStatus === 'completed') {
          return paymentDetails.remainingMonths === 0
        } else if (selectedPaymentStatus === '36+') {
          return paymentDetails.remainingMonths >= 36
        } else if (selectedPaymentStatus.includes('-')) {
          const [min, max] = selectedPaymentStatus.split('-').map(Number)
          return paymentDetails.remainingMonths >= min && paymentDetails.remainingMonths < max
        }
        return true
      })
    }

    if (selectedDeductionDay !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.deductionDay === parseInt(selectedDeductionDay))
    }

    return filtered
  }, [searchQuery, selectedDepartment, selectedOwner, selectedPaymentStatus, selectedDeductionDay])

  const totalInstallments = useMemo(() => {
    return filteredVehicles.reduce((sum, vehicle) => sum + vehicle.installment, 0)
  }, [filteredVehicles])

  // Real-time countdown update
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render for real-time updates
      setSelectedDepartment(prev => prev)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // KPI calculations
  const kpiData = useMemo(() => {
    const sixthVehicles = filteredVehicles.filter(v => v.deductionDay === 6)
    const midMonthVehicles = filteredVehicles.filter(v => v.deductionDay === 8 || v.deductionDay === 9)
    const midLateVehicles = filteredVehicles.filter(v => v.deductionDay === 14 || v.deductionDay === 15)

    return [
      {
        title: "Early Month (6th)",
        vehicles: sixthVehicles,
        totalAmount: sixthVehicles.reduce((sum, v) => sum + v.installment, 0),
        nextDate: getNextDeductionDate(6),
        bgGradient: "from-red-400 via-pink-400 to-red-500",
        icon: Clock,
        urgency: true
      },
      {
        title: "Mid Month (8th-9th)",
        vehicles: midMonthVehicles,
        totalAmount: midMonthVehicles.reduce((sum, v) => sum + v.installment, 0),
        nextDate: getNextDeductionDate(8), // Use 8th as reference
        bgGradient: "from-orange-400 via-amber-400 to-orange-500",
        icon: Calendar,
        urgency: false
      },
      {
        title: "Mid-Late (14th-15th)",
        vehicles: midLateVehicles,
        totalAmount: midLateVehicles.reduce((sum, v) => sum + v.installment, 0),
        nextDate: getNextDeductionDate(14), // Use 14th as reference
        bgGradient: "from-blue-400 via-cyan-400 to-blue-500",
        icon: Timer,
        urgency: false
      }
    ]
  }, [filteredVehicles])

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredVehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installments</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstallments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Loans</CardTitle>
          <CardDescription>
            Filter and manage vehicle loan information by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder="Search by plate number, vehicle, amount, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 h-6 w-6 p-0 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="department-filter" className="text-sm font-medium">
                Department:
              </label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="owner-filter" className="text-sm font-medium">
                Owner:
              </label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map(owner => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="payment-status-filter" className="text-sm font-medium">
                Payment Status:
              </label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="0-6">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Less than 6 months
                    </div>
                  </SelectItem>
                  <SelectItem value="6-12">
                    <div className="flex items-center gap-2">
                      <Clock4 className="h-4 w-4 text-orange-600" />
                      6 months - 1 year
                    </div>
                  </SelectItem>
                  <SelectItem value="12-18">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-amber-600" />
                      1 year - 1.5 years
                    </div>
                  </SelectItem>
                  <SelectItem value="18-24">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      1.5 years - 2 years
                    </div>
                  </SelectItem>
                  <SelectItem value="24-30">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      2 years - 2.5 years
                    </div>
                  </SelectItem>
                  <SelectItem value="30-36">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      2.5 years - 3 years
                    </div>
                  </SelectItem>
                  <SelectItem value="36+">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                      More than 3 years
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Completed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="deduction-day-filter" className="text-sm font-medium">
                Deduction Date:
              </label>
              <Select value={selectedDeductionDay} onValueChange={setSelectedDeductionDay}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {deductionDays.map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      <Badge variant="outline" className={`${getDeductionDateColor(day)} text-xs`}>
                        {day}th of month
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vehicle Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Expand</TableHead>
                  <TableHead className="w-32">Plate Number</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      Deduction Date
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Installment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Total Row */}
                <TableRow className="bg-muted/50 font-semibold border-b-2">
                  <TableCell className="text-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                </TableCell>
                  <TableCell colSpan={4} className="text-lg">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      <span>Total ({filteredVehicles.length} vehicles)</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-lg">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {filteredVehicles.length > 1 ? 'Multiple' : filteredVehicles[0]?.department || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-lg">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      Portfolio
                    </Badge>
                  </TableCell>
                  <TableCell className="text-lg">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      Various
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-lg font-mono">
                    <Badge variant="default" className="text-base px-4 py-2 bg-green-600 hover:bg-green-700">
                      SAR {totalInstallments.toLocaleString()}
                    </Badge>
                  </TableCell>
                </TableRow>
                {filteredVehicles.map((vehicle, index) => {
                  const paymentDetails = calculatePaymentDetails(vehicle)
                  const isExpanded = expandedRows.has(index)

                  return (
                    <React.Fragment key={index}>
                      <TableRow
                        className={`hover:bg-muted/50 transition-all duration-200 cursor-pointer ${
                          isExpanded
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-l-2 border-l-blue-400 dark:border-l-blue-500 shadow-sm'
                            : ''
                        }`}
                        onClick={() => toggleRowExpansion(index)}
                      >
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                      <div className="space-y-1">
                        <div className="text-sm font-bold">
                          {vehicle.plateNumber.split(' (')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({vehicle.plateNumber.split(' (')[1]?.replace(')', '')})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {vehicle.plateType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="font-medium">
                          {vehicle.vehicleMaker} {vehicle.vehicleModel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.bodyType}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            <span className="font-medium">{vehicle.modelYear}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full border" 
                              style={{ 
                                backgroundColor: vehicle.majorColor.includes('White') || vehicle.majorColor.includes('ابيض') ? '#ffffff' : 
                                               vehicle.majorColor.includes('Black') || vehicle.majorColor.includes('اسود') ? '#000000' :
                                               vehicle.majorColor.includes('Red') ? '#ef4444' :
                                               vehicle.majorColor.includes('Blue') ? '#3b82f6' :
                                               vehicle.majorColor.includes('Gray') ? '#6b7280' :
                                               vehicle.majorColor.includes('Yellow') ? '#eab308' :
                                               '#8b5cf6',
                                border: vehicle.majorColor.includes('White') || vehicle.majorColor.includes('ابيض') ? '1px solid #d1d5db' : 'none'
                              }}
                            />
                            <span className="text-xs text-muted-foreground">{vehicle.majorColor}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        {vehicle.ownerName}
                      </div>
                    </TableCell>
                        <TableCell>
                          <Badge className={getDepartmentColor(vehicle.department)}>
                            {vehicle.department}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-medium">
                                {paymentDetails.paidMonths}/{vehicle.totalMonths} months
                              </div>
                              <Progress value={paymentDetails.progressPercentage} className="h-2 w-20" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {paymentDetails.progressPercentage.toFixed(0)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-mono text-sm px-3 py-1 ${getDeductionDateColor(vehicle.deductionDay)}`}>
                            {vehicle.deductionDay}th
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                            SAR {vehicle.installment.toLocaleString()}
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Payment Details Row */}
                      {isExpanded && (
                        <TableRow className="bg-blue-50/80 dark:bg-blue-950/50 border-l-4 border-l-blue-400 dark:border-l-blue-500 transition-all duration-300 ease-in-out">
                          <TableCell colSpan={9} className="py-8 px-6 border-t-2 border-t-blue-200 dark:border-t-blue-700/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Payment Timeline */}
                              <Card className="border-blue-300 dark:border-blue-600 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-900/90">
                                <CardContent className="p-5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Payment Timeline</h4>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Start Date:</span>
                                      <span className="font-medium">{vehicle.firstInstallmentDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">End Date:</span>
                                      <span className="font-medium">{vehicle.lastInstallmentDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Duration:</span>
                                      <span className="font-medium">{vehicle.totalMonths} months</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                      <Progress value={paymentDetails.progressPercentage} className="h-3 mb-2" />
                                      <div className="text-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        {paymentDetails.progressPercentage.toFixed(1)}% Complete
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Payment Status */}
                              <Card className="border-green-300 dark:border-green-600 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-900/90">
                                <CardContent className="p-5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <h4 className="font-semibold text-green-900 dark:text-green-100">Payment Status</h4>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Paid Amount:</span>
                                      <span className="font-medium text-green-600">SAR {paymentDetails.paidAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Total Repayment:</span>
                                      <span className="font-medium">SAR {paymentDetails.totalRepayment.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                      <span className="text-muted-foreground">Remaining:</span>
                                      <span className="font-medium text-orange-600">SAR {paymentDetails.remainingAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Months Left:</span>
                                      <span className="font-medium">{paymentDetails.remainingMonths} months</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Next Payment */}
                              <Card className={`shadow-md hover:shadow-lg transition-shadow duration-200 ${
                                paymentDetails.isOverdue
                                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950/20'
                                  : paymentDetails.daysUntilNext <= 7
                                    ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
                                    : 'border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-900/90'
                              }`}>
                                <CardContent className="p-5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Timer className={`h-4 w-4 ${
                                      paymentDetails.isOverdue
                                        ? 'text-red-600'
                                        : paymentDetails.daysUntilNext <= 7
                                          ? 'text-yellow-600'
                                          : 'text-blue-600'
                                    }`} />
                                    <h4 className={`font-semibold ${
                                      paymentDetails.isOverdue
                                        ? 'text-red-900 dark:text-red-100'
                                        : paymentDetails.daysUntilNext <= 7
                                          ? 'text-yellow-900 dark:text-yellow-100'
                                          : 'text-blue-900 dark:text-blue-100'
                                    }`}>Next Payment</h4>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    {paymentDetails.remainingMonths > 0 ? (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Due Date:</span>
                                          <span className="font-medium">
                                            {paymentDetails.nextPaymentDate.toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Amount:</span>
                                          <span className="font-medium">SAR {vehicle.installment.toLocaleString()}</span>
                                        </div>
                                        <div className={`text-center p-2 rounded text-sm font-medium ${
                                          paymentDetails.isOverdue
                                            ? 'bg-red-100 text-red-800'
                                            : paymentDetails.daysUntilNext <= 7
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {paymentDetails.isOverdue
                                            ? (
                                                <div className="flex items-center gap-1">
                                                  <AlertCircle className="h-4 w-4" />
                                                  OVERDUE
                                                </div>
                                              )
                                            : paymentDetails.daysUntilNext === 0
                                              ? (
                                                  <div className="flex items-center gap-1">
                                                    <Clock4 className="h-4 w-4" />
                                                    DUE TODAY
                                                  </div>
                                                )
                                              : paymentDetails.daysUntilNext <= 7
                                                ? (
                                                    <div className="flex items-center gap-1">
                                                      <Timer className="h-4 w-4" />
                                                      Due in {paymentDetails.daysUntilNext} days
                                                    </div>
                                                  )
                                                : (
                                                    <div className="flex items-center gap-1">
                                                      <Calendar className="h-4 w-4" />
                                                      Due in {paymentDetails.daysUntilNext} days
                                                    </div>
                                                  )
                                          }
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-center p-3 bg-green-100 text-green-800 rounded font-medium flex items-center justify-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        LOAN COMPLETED
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No vehicles found for the selected department.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Countdown KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {kpiData.map((kpi, index) => {
          const countdown = getCountdown(kpi.nextDate)
          const IconComponent = kpi.icon
          const isUrgent = countdown.days <= 3

          return (
            <Card 
              key={index} 
              className={`relative overflow-hidden backdrop-blur-sm border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                isUrgent ? 'border-red-300 shadow-red-100' : 'border-white/20 shadow-lg'
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgGradient} opacity-90`} />
              
              {/* Animated Sparkles for Urgent */}
              {isUrgent && (
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
              )}

              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <IconComponent className={`h-6 w-6 ${isUrgent ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{kpi.title}</h3>
                      <p className="text-white/80 text-sm">
                        {kpi.vehicles.length} vehicles
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown Display */}
                <div className="mb-4">
                  <div className="flex items-center gap-4 text-2xl font-bold mb-2">
                    <div className="text-center">
                      <div className="text-3xl">{countdown.days}</div>
                      <div className="text-xs text-white/80">DAYS</div>
                    </div>
                    <div className="text-white/60">:</div>
                    <div className="text-center">
                      <div className="text-3xl">{countdown.hours}</div>
                      <div className="text-xs text-white/80">HRS</div>
                    </div>
                    <div className="text-white/60">:</div>
                    <div className="text-center">
                      <div className="text-3xl">{countdown.minutes}</div>
                      <div className="text-xs text-white/80">MIN</div>
                    </div>
                  </div>
                  
                  {isUrgent && (
                    <div className="flex items-center gap-1 text-yellow-200 animate-pulse">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">URGENT - Due Soon!</span>
                    </div>
                  )}
                </div>

                {/* Amount Badge */}
                <div className="flex justify-between items-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-sm text-white/80">Total Amount</div>
                    <div className="text-xl font-bold">
                      SAR {kpi.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Progress Ring */}
                  <div className="relative">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="2"
                        strokeDasharray={`${Math.max(0, 100 - countdown.days * 3)} 100`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {Math.max(0, 30 - countdown.days)}d
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}