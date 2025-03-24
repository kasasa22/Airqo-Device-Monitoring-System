"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  Shield,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"

// Sample user data
const sampleUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@airqo.net",
    role: "Administrator",
    status: "active",
    lastActive: "10 minutes ago",
    phone: "+256 701 234 567",
    location: "Kampala, Uganda",
    joinDate: "2023-01-15",
    avatar: null,
    permissions: ["manage_devices", "manage_users", "view_reports", "edit_reports"],
  },
  {
    id: 2,
    name: "Sarah Smith",
    email: "sarah.smith@airqo.net",
    role: "Data Analyst",
    status: "active",
    lastActive: "2 hours ago",
    phone: "+256 702 345 678",
    location: "Nairobi, Kenya",
    joinDate: "2023-02-20",
    avatar: null,
    permissions: ["view_devices", "view_reports", "edit_reports"],
  },
  {
    id: 3,
    name: "Michael Johnson",
    email: "michael.johnson@airqo.net",
    role: "Field Technician",
    status: "active",
    lastActive: "1 day ago",
    phone: "+256 703 456 789",
    location: "Kampala, Uganda",
    joinDate: "2023-03-10",
    avatar: null,
    permissions: ["view_devices", "manage_devices", "view_reports"],
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@airqo.net",
    role: "Researcher",
    status: "inactive",
    lastActive: "2 weeks ago",
    phone: "+256 704 567 890",
    location: "Dar es Salaam, Tanzania",
    joinDate: "2023-04-05",
    avatar: null,
    permissions: ["view_devices", "view_reports"],
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david.wilson@airqo.net",
    role: "Administrator",
    status: "active",
    lastActive: "30 minutes ago",
    phone: "+256 705 678 901",
    location: "Kampala, Uganda",
    joinDate: "2023-01-05",
    avatar: null,
    permissions: ["manage_devices", "manage_users", "view_reports", "edit_reports"],
  },
  {
    id: 6,
    name: "Jennifer Brown",
    email: "jennifer.brown@airqo.net",
    role: "Data Analyst",
    status: "pending",
    lastActive: "Never",
    phone: "+256 706 789 012",
    location: "Accra, Ghana",
    joinDate: "2023-06-15",
    avatar: null,
    permissions: ["view_devices", "view_reports"],
  },
  {
    id: 7,
    name: "Robert Taylor",
    email: "robert.taylor@airqo.net",
    role: "Field Technician",
    status: "active",
    lastActive: "5 hours ago",
    phone: "+256 707 890 123",
    location: "Nairobi, Kenya",
    joinDate: "2023-02-28",
    avatar: null,
    permissions: ["view_devices", "manage_devices", "view_reports"],
  },
  {
    id: 8,
    name: "Lisa Anderson",
    email: "lisa.anderson@airqo.net",
    role: "Researcher",
    status: "active",
    lastActive: "1 hour ago",
    phone: "+256 708 901 234",
    location: "Kampala, Uganda",
    joinDate: "2023-03-20",
    avatar: null,
    permissions: ["view_devices", "view_reports", "edit_reports"],
  },
]

// Sample activity logs
const activityLogs = [
  {
    id: 1,
    user: "John Doe",
    action: "Logged in to the system",
    time: "10 minutes ago",
    initials: "JD",
  },
  {
    id: 2,
    user: "Sarah Smith",
    action: "Generated a new air quality report",
    time: "2 hours ago",
    initials: "SS",
  },
  {
    id: 3,
    user: "David Wilson",
    action: "Added a new user: Jennifer Brown",
    time: "5 hours ago",
    initials: "DW",
  },
  {
    id: 4,
    user: "Michael Johnson",
    action: "Updated device KLA003 firmware",
    time: "1 day ago",
    initials: "MJ",
  },
  {
    id: 5,
    user: "John Doe",
    action: "Modified system permission settings",
    time: "2 days ago",
    initials: "JD",
  },
  {
    id: 6,
    user: "Robert Taylor",
    action: "Registered new device NBI003",
    time: "3 days ago",
    initials: "RT",
  },
]

// User roles with descriptions
const userRoles = [
  { value: "administrator", label: "Administrator", description: "Full access to all system features" },
  { value: "data_analyst", label: "Data Analyst", description: "Can view and analyze data, generate reports" },
  { value: "field_technician", label: "Field Technician", description: "Manages devices and field operations" },
  { value: "researcher", label: "Researcher", description: "Access to data for research purposes" },
  { value: "viewer", label: "Viewer", description: "Read-only access to dashboards and reports" },
]

export default function UsersPage() {
  const [users] = useState(sampleUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all-users")

  // Filter users based on search term, role filter, and status filter
  const getFilteredUsers = useCallback(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const filteredUsers = getFilteredUsers()

  // Count users by status
  const activeUsers = users.filter((u) => u.status === "active").length
  const inactiveUsers = users.filter((u) => u.status === "inactive").length
  const pendingUsers = users.filter((u) => u.status === "pending").length

  // Function to get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }, [])

  // Function to get initials from name
  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Enter the details of the new user. They will receive an email invitation to set up their account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" placeholder="+256 7XX XXX XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div>{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Kampala, Uganda" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddUserOpen(false)}>Add User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered users across all roles</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="mr-2 h-5 w-5 text-green-500" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{activeUsers}</div>
            <div className="flex items-center mt-1">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${(activeUsers / users.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((activeUsers / users.length) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserX className="mr-2 h-5 w-5 text-yellow-500" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{pendingUsers}</div>
            <div className="flex items-center mt-1">
              <div
                className="h-2 bg-yellow-500 rounded-full"
                style={{ width: `${(pendingUsers / users.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((pendingUsers / users.length) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 w-[400px]">
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="all-users">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                User List
              </CardTitle>
              <CardDescription>Manage users and their access to the system</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    className="border rounded-md p-2 bg-white"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="administrator">Administrator</option>
                    <option value="data analyst">Data Analyst</option>
                    <option value="field technician">Field Technician</option>
                    <option value="researcher">Researcher</option>
                  </select>
                  <select
                    className="border rounded-md p-2 bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Last Active</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={user.avatar || ""} alt={user.name} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{user.role}</td>
                        <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                        <td className="py-3 px-4">{user.lastActive}</td>
                        <td className="py-3 px-4">{user.location}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3 flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                User Permissions
              </CardTitle>
              <CardDescription>Manage access rights and permissions for different user roles</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Permission</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Administrator</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Data Analyst</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Field Technician</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Researcher</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">View Devices</td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50 transition-colors bg-gray-50/50">
                      <td className="py-3 px-4 font-medium">Manage Devices</td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">View Reports</td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50 transition-colors bg-gray-50/50">
                      <td className="py-3 px-4 font-medium">Edit Reports</td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">Manage Users</td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50 transition-colors bg-gray-50/50">
                      <td className="py-3 px-4 font-medium">System Settings</td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">Export Data</td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="text-sm text-muted-foreground">
                <AlertCircle className="inline-block h-4 w-4 mr-1" />
                Changes to role permissions will affect all users with that role
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                User Activity Log
              </CardTitle>
              <CardDescription>Recent user actions and system events</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback>{log.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{log.user}</p>
                        <p className="text-sm text-muted-foreground">{log.action}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{log.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3 flex justify-between">
              <div className="text-sm text-muted-foreground">Showing recent activity from the last 7 days</div>
              <Button variant="outline" size="sm">
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

