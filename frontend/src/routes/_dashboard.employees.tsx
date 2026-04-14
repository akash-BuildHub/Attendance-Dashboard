import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Plus, Download, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { mockEmployees, type Employee } from "@/data/mockEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export const Route = createFileRoute("/_dashboard/employees")({
  component: EmployeesPage,
});

const COMPANY_OPTIONS = [
  "WAWU",
  "CAP",
  "Owlytics",
  "Grow",
  "Perform100x",
  "SIB",
  "career cafe co",
  "CEO2",
  "karu mitra",
  "Legal Quotient",
  "Startup TV",
] as const;

const SHIFT_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDobInput(value: string) {
  const trimmed = value.trim();
  if (ISO_DOB_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const dmyMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dmyMatch) {
    return trimmed;
  }

  const [, dd, mm, yyyy] = dmyMatch;
  return `${yyyy}-${mm}-${dd}`;
}

function isValidDob(value: string) {
  if (!ISO_DOB_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function normalizeShiftInput(value: string) {
  return value.replace(/\s+/g, "");
}

function to12HourClock(time24: string) {
  const [hourString, minute] = time24.split(":");
  const hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${suffix}`;
}

function formatShiftTo12Hour(value: string) {
  const normalized = normalizeShiftInput(value);
  if (!SHIFT_TIME_PATTERN.test(normalized)) {
    return "";
  }
  const [start, end] = normalized.split("-");
  return `${to12HourClock(start)} - ${to12HourClock(end)}`;
}

function formatShiftForMaskedInput(value: string) {
  const normalized = normalizeShiftInput(value);
  if (!SHIFT_TIME_PATTERN.test(normalized)) {
    return "00:00 - 00:00";
  }
  const [start, end] = normalized.split("-");
  return `${start} - ${end}`;
}

function extractShiftDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatShiftDigitsAsMask(digits: string) {
  const padded = (digits + "00000000").slice(0, 8);
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)} - ${padded.slice(4, 6)}:${padded.slice(6, 8)}`;
}

function parseShiftFromMaskedInput(value: string) {
  const match = value.trim().match(/^(\d{2}):(\d{2})\s-\s(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const normalizedRange = `${match[1]}:${match[2]}-${match[3]}:${match[4]}`;
  if (!isValidShift(normalizedRange)) {
    return null;
  }
  return normalizedRange;
}

function isValidShift(value: string) {
  if (!SHIFT_TIME_PATTERN.test(value)) {
    return false;
  }

  const [startTime, endTime] = value.split("-");
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  return startTotalMinutes < endTotalMinutes;
}

function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return employees;

    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(query) ||
        employee.employeeId.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query)
    );
  }, [employees, deferredSearch]);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee({
      ...employee,
      dob: normalizeDobInput(employee.dob),
      shift: normalizeShiftInput(employee.shift),
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (shiftFromEdit?: string) => {
    if (!editingEmployee) return;

    const sanitizedEmployee: Employee = {
      ...editingEmployee,
      dob: normalizeDobInput(editingEmployee.dob),
      shift: normalizeShiftInput(shiftFromEdit ?? editingEmployee.shift),
    };

    if (!isValidDob(sanitizedEmployee.dob)) {
      window.alert("Date of Birth must be a valid date in YYYY-MM-DD format.");
      return;
    }

    if (!isValidShift(sanitizedEmployee.shift)) {
      window.alert("Shift Timing must be valid in 24-hour format (HH:mm - HH:mm).");
      return;
    }

    setEmployees((prev) => prev.map((employee) => (employee.id === sanitizedEmployee.id ? sanitizedEmployee : employee)));
    setEditDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteRequest = (employee: Employee) => {
    setEmployeeToDelete(employee);
  };

  const handleDeleteConfirm = () => {
    if (!employeeToDelete) return;
    setEmployees((prev) => prev.filter((employee) => employee.id !== employeeToDelete.id));
    setEmployeeToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input placeholder="EMP-009" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" placeholder="******" />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_OPTIONS.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input placeholder="Engineering" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Timing</Label>
                    <Input
                      placeholder="08:00 AM - 05:00 PM"
                      title="Use hh:mm AM - hh:mm PM format (example: 08:00 AM - 05:00 PM)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button>Save Employee</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card className="p-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or department..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">S/N</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Shift</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((employee, index) => (
              <TableRow key={employee.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell className="text-muted-foreground">{employee.employeeId}</TableCell>
                <TableCell className="hidden md:table-cell">{employee.company}</TableCell>
                <TableCell className="hidden md:table-cell">{employee.department}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{formatShiftTo12Hour(employee.shift)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(employee)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteRequest(employee)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && <EditEmployeeForm employee={editingEmployee} onChange={setEditingEmployee} onSave={handleSaveEdit} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(employeeToDelete)} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm employee deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {employeeToDelete
                ? `Are you sure you want to delete ${employeeToDelete.name} (${employeeToDelete.employeeId})?`
                : "Are you sure you want to delete this employee?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditEmployeeForm({
  employee,
  onChange,
  onSave,
}: {
  employee: Employee;
  onChange: (employee: Employee) => void;
  onSave: (shiftFromEdit?: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [shiftMaskedValue, setShiftMaskedValue] = useState(formatShiftForMaskedInput(employee.shift));
  const companyOptions = COMPANY_OPTIONS.includes(employee.company as (typeof COMPANY_OPTIONS)[number])
    ? COMPANY_OPTIONS
    : [employee.company, ...COMPANY_OPTIONS];

  useEffect(() => {
    setShiftMaskedValue(formatShiftForMaskedInput(employee.shift));
  }, [employee.shift]);

  const handleSaveClick = () => {
    const parsedShift = parseShiftFromMaskedInput(shiftMaskedValue);
    if (!parsedShift) {
      window.alert("Shift Timing must be valid in HH:mm - HH:mm format.");
      return;
    }

    onSave(parsedShift);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={employee.name} onChange={(e) => onChange({ ...employee, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Employee ID</Label>
          <Input value={employee.employeeId} onChange={(e) => onChange({ ...employee, employeeId: e.target.value })} />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={employee.password}
              onChange={(e) => onChange({ ...employee, password: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Company</Label>
          <Select value={employee.company} onValueChange={(value) => onChange({ ...employee, company: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companyOptions.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Input value={employee.department} onChange={(e) => onChange({ ...employee, department: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={employee.dob}
            onChange={(e) => onChange({ ...employee, dob: normalizeDobInput(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Shift Timing</Label>
          <Input
            value={shiftMaskedValue}
            placeholder="00:00 - 00:00"
            title="Fixed HH:mm - HH:mm format. Edit digits only."
            inputMode="numeric"
            maxLength={13}
            onChange={(e) => {
              const nextDigits = extractShiftDigits(e.target.value);
              setShiftMaskedValue(formatShiftDigitsAsMask(nextDigits));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={employee.role} onValueChange={(value) => onChange({ ...employee, role: value as "Admin" | "Employee" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Employee">Employee</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveClick}>Save Changes</Button>
      </div>
    </div>
  );
}
