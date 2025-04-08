// users/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { toast } from "@/components/ui/use-toast"

// User type definition
interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  status: "active" | "inactive" | "pending"
  lastActive: string
  phone?: string
  location?: string
  joinDate: string
  avatar?: string | null
  permissions: string[]
  name: string
}
// Activity log type
type ActivityLog = {
  id: number
  user: string
  action: string
  time: string
  initials: string
}

// User roles with descriptions
const userRoles = [
  { value: "administrator", label: "Administrator", description: "Full access to all system features" },
  { value: "data_analyst", label: "Data Analyst", description: "Can view and analyze data, generate reports" },
  { value: "field_technician", label: "Field Technician", description: "Manages devices and field operations" },
  { value: "researcher", label: "Researcher", description: "Access to data for research purposes" },
  { value: "viewer", label: "Viewer", description: "Read-only access to dashboards and reports" },
]

// Role permission mappings
const rolePermissions = {
  administrator: ["manage_devices", "manage_users", "view_reports", "edit_reports", "view_devices", "system_settings"],
  data_analyst: ["view_devices", "view_reports", "edit_reports", "export_data"],
  field_technician: ["view_devices", "manage_devices", "view_reports", "export_data"],
  researcher: ["view_devices", "view_reports", "edit_reports", "export_data"],
  viewer: ["view_devices", "view_reports"]
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all-users")
  const [activityList, setActivityList] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    location: "",
  })

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/users/')
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        const data = await response.json()
        
        // Transform the data to include the computed name property
        const transformedUsers = data.map((user: any) => ({
          ...user,
          // Add lastActive and joinDate if not coming from API
          lastActive: user.lastActive || "Never",
          joinDate: user.joinDate || new Date(user.created_at).toISOString().split('T')[0],
          permissions: user.permissions || rolePermissions[user.role as keyof typeof rolePermissions] || [],
          // Add a name property for compatibility
          name: `${user.first_name} ${user.last_name}`
        }))
        
        setUsers(transformedUsers)
        
        // Initialize with some mock activity logs if empty
        if (data.length > 0 && activityList.length === 0) {
          const initialActivities = [
            {
              id: 1,
              user: `${data[0].first_name} ${data[0].last_name}`,
              action: "Logged in to the system",
              time: "10 minutes ago",
              initials: getInitials(`${data[0].first_name} ${data[0].last_name}`),
            },
            {
              id: 2,
              user: data[1] ? `${data[1].first_name} ${data[1].last_name}` : "Admin User",
              action: "Generated a new air quality report",
              time: "2 hours ago",
              initials: getInitials(data[1] ? `${data[1].first_name} ${data[1].last_name}` : "AU"),
            }
          ]
          setActivityList(initialActivities)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData({
      ...formData,
      [id]: value
    })
  }

  // Handle role selection
  const handleRoleSelect = (value: string) => {
    setFormData({
      ...formData,
      role: value
    })
  }

  // Handle form submission
  const handleAddUser = async () => {
    try {
      // Create the user data object
      const newUser = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        role: formData.role,
        status: "pending" as const,
        phone: formData.phone,
        location: formData.location,
        password: formData.password,
      }

      // Send the request to the backend
      const response = await fetch('http://127.0.0.1:8000/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add user')
      }

      const createdUser = await response.json()
      
      // Transform the created user to match our frontend User type
      const transformedUser = {
        ...createdUser,
        lastActive: "Never",
        joinDate: new Date(createdUser.created_at).toISOString().split('T')[0],
        permissions: rolePermissions[createdUser.role as keyof typeof rolePermissions] || [],
        name: `${createdUser.first_name} ${createdUser.last_name}`
      }

      // Update the local state with the new user
      setUsers([...users, transformedUser])
      
      // Add an activity log entry
      const newActivity = {
        id: activityList.length + 1,
        user: "You",
        action: `Added a new user: ${transformedUser.name}`,
        time: "Just now",
        initials: "YO",
      }
      
      setActivityList([newActivity, ...activityList])

      // Reset form and close dialog
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: "",
        location: "",
      })
      setIsAddUserOpen(false)
      
      toast({
        title: "Success",
        description: "User added successfully",
      })
    } catch (error: any) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      })
    }
  }

  // Filter users based on search term, role filter, and status filter
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Count users by status
  const activeUsers = users.filter((u) => u.status === "active").length
  const inactiveUsers = users.filter((u) => u.status === "inactive").length
  const pendingUsers = users.filter((u) => u.status === "pending").length

  // Function to get status badge
  const getStatusBadge = (status: "active" | "inactive" | "pending") => {
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
  }

  // Function to get initials from name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "US"; // Return "US" (User) as fallback if no name is provided
    
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    )
  }

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
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input 
                  id="phone" 
                  placeholder="+256 7XX XXX XXX" 
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={handleRoleSelect} value={formData.role} required>
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
                <Input 
                  id="location" 
                  placeholder="Kampala, Uganda" 
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.role}>
                Add User
              </Button>
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
                style={{ width: `${users.length > 0 ? (activeUsers / users.length) * 100 : 0}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}%
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
                style={{ width: `${users.length > 0 ? (pendingUsers / users.length) * 100 : 0}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {users.length > 0 ? Math.round((pendingUsers / users.length) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 w-[400px]">
          <TabsTrigger value="all-users">All Users</TabsTrigger>
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
                    <option value="data_analyst">Data Analyst</option>
                    <option value="field_technician">Field Technician</option>
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
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={user.avatar || ""} alt={`${user.first_name} ${user.last_name}`} />
                                <AvatarFallback>{getInitials(`${user.first_name} ${user.last_name}`)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{`${user.first_name} ${user.last_name}`}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{user.role}</td>
                          <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                          <td className="py-3 px-4">{user.lastActive}</td>
                          <td className="py-3 px-4">{user.location || "-"}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3 flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
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
                {activityList.length > 0 ? (
                  activityList.map((log) => (
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
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No activity logs found
                  </div>
                )}
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