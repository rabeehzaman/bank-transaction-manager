'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Car, Filter, CalendarDays, Clock, Calendar, Timer, AlertCircle, Sparkles } from 'lucide-react'

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
    deductionDay: 27
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
    deductionDay: 27
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
    installment: 4200,
    deductionDay: 27
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
    deductionDay: 27
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
    deductionDay: 27
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
    deductionDay: 27
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
    deductionDay: 27
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
    deductionDay: 27
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
    installment: 2700,
    deductionDay: 27
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
    deductionDay: 6
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
    deductionDay: 6
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
    deductionDay: 6
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
    deductionDay: 6
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
    deductionDay: 6
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
    deductionDay: 15
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
    deductionDay: 14
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
    deductionDay: 9
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
    deductionDay: 6
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
    deductionDay: 6
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
    deductionDay: 6
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
    deductionDay: 15
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
    deductionDay: 14
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
    deductionDay: 8
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
    deductionDay: 6
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
    deductionDay: 6
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
  const [currentTime, setCurrentTime] = useState(new Date())

  const departments = useMemo(() => {
    const depts = Array.from(new Set(vehicleData.map(v => v.department)))
    return depts.sort()
  }, [])

  const owners = useMemo(() => {
    const ownerList = Array.from(new Set(vehicleData.map(v => v.ownerName)))
    return ownerList.sort()
  }, [])

  const filteredVehicles = useMemo(() => {
    let filtered = vehicleData
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.department === selectedDepartment)
    }
    
    if (selectedOwner !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.ownerName === selectedOwner)
    }
    
    return filtered
  }, [selectedDepartment, selectedOwner])

  const totalInstallments = useMemo(() => {
    return filteredVehicles.reduce((sum, vehicle) => sum + vehicle.installment, 0)
  }, [filteredVehicles])

  // Real-time countdown update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
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
  }, [filteredVehicles, currentTime])

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
          </div>

          {/* Vehicle Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Plate Number</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Department</TableHead>
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
                      Various
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-lg font-mono">
                    <Badge variant="default" className="text-base px-4 py-2 bg-green-600 hover:bg-green-700">
                      SAR {totalInstallments.toLocaleString()}
                    </Badge>
                  </TableCell>
                </TableRow>
                {filteredVehicles.map((vehicle, index) => (
                  <TableRow key={index}>
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
                ))}
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