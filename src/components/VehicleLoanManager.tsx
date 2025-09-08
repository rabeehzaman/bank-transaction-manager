'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Car, Filter } from 'lucide-react'

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
    installment: 5867
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
    installment: 3760
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
    installment: 4200
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
    installment: 3760
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
    installment: 4686
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
    installment: 5867
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
    installment: 3760
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
    installment: 4154
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
    installment: 2700
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
    installment: 4317
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
    installment: 7117
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
    installment: 2843
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
    installment: 2033
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
    installment: 3146
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
    installment: 3807
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
    installment: 3586
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
    installment: 7397
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
    installment: 4535
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
    installment: 3146
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
    installment: 3197
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
    installment: 3807
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
    installment: 4064
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
    installment: 3690
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
    installment: 3215
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
    installment: 2735
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

export default function VehicleLoanManager() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedOwner, setSelectedOwner] = useState<string>('all')

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
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Installment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Total Row */}
                <TableRow className="bg-muted/50 font-semibold border-b-2">
                  <TableCell colSpan={6} className="text-lg">
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
                  <TableCell className="text-right text-lg font-mono">
                    <Badge variant="default" className="text-base px-4 py-2 bg-green-600 hover:bg-green-700">
                      SAR {totalInstallments.toLocaleString()}
                    </Badge>
                  </TableCell>
                </TableRow>
                {filteredVehicles.map((vehicle, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono font-medium">
                      {vehicle.plateNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {vehicle.plateType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {vehicle.vehicleMaker} {vehicle.vehicleModel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.bodyType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.modelYear}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                        <span className="text-sm">{vehicle.majorColor}</span>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.ownerName}</TableCell>
                    <TableCell>
                      <Badge className={getDepartmentColor(vehicle.department)}>
                        {vehicle.department}
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
    </div>
  )
}