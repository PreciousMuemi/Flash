"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import {
  AlertTriangle,
  Bell,
  Building,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  ListChecks,
  ReceiptText,
  Repeat,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"

type ClaimStatus =
  | "Pending Supervisor Approval"
  | "Pending Finance Review"
  | "Pending Final Approval"
  | "Approved"
  | "Paid"
  | "Rejected"

type ClaimCategory = "Travel" | "Supplies" | "Other"

type DuplicatePolicy = "block" | "warn"

interface Claim {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  description: string
  supplier: string
  fund: string
  costCenter: string
  projectId?: string
  claimCategory: ClaimCategory
  claimDate: string
  status: ClaimStatus
  supportingDocument?: string
  hasOutstandingAdvance: boolean
  outstandingAdvanceAmount: number
  linkedAdvanceId?: string
  createdAt: string
  duplicateOf?: string
  atsBalanceAtSubmission: number
  paidDate?: string
}

interface StaffAdvance {
  id: string
  employeeId: string
  employeeName: string
  fund: string
  costCenter: string
  issuedAmount: number
  settledAmount: number
  outstandingAmount: number
  lastActivity: string
  status: "Open" | "Settled"
}

interface BudgetBucket {
  fund: string
  costCenter: string
  ats: number
  committed: number
  actual: number
}

interface Employee {
  id: string
  name: string
  costCenter: string
  defaultFund: string
  defaultProject?: string
}

interface Project {
  id: string
  name: string
  fund: string
}

type PettyCashStatus =
  | "Draft"
  | "Submitted"
  | "Pending Finance Review"
  | "Approved"
  | "Disbursed"
  | "Retired"
  | "Rejected"

interface PettyCashRequest {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  costCenter: string
  fund: string
  purpose: string
  requestDate: string
  status: PettyCashStatus
  supportingDocument?: string
  cycleRuleId?: string
  isAccountabilityPending: boolean
  disbursedDate?: string
  accountabilityDueDate?: string
}

interface PettyCashRule {
  id: string
  employeeId: string
  employeeName: string
  frequency: "Weekly" | "Monthly" | "Quarterly"
  defaultAmount: number
  nextGenerationDate: string
  active: boolean
}

interface PettyCashAccountability {
  id: string
  requestId: string
  requestAmount: number
  receipts?: string
  amountRetired: number
  excessOrShortfall: number
  notes?: string
  verifiedBy?: string
  status: "Pending" | "Verified"
  submittedOn: string
  verifiedOn?: string
}

interface AuditLogEntry {
  id: string
  entityType: "claim" | "petty_cash" | "rule" | "accountability"
  entityId: string
  actor: string
  message: string
  timestamp: string
}

interface NotificationItem {
  id: string
  event: string
  recipient: string
  message: string
  timestamp: string
}

interface GLEntry {
  id: string
  reference: string
  debitAccount: string
  creditAccount: string
  amount: number
  timestamp: string
  memo: string
}

const claimCategories: ClaimCategory[] = ["Travel", "Supplies", "Other"]

const funds = [
  { id: "FUND-GEN", name: "General Fund" },
  { id: "FUND-DONOR-A", name: "Donor Fund A" },
  { id: "FUND-DONOR-B", name: "Donor Fund B" },
]

const costCenters = [
  { id: "CC-NBO-OPS", name: "Nairobi Operations" },
  { id: "CC-KSM-FIELD", name: "Kisumu Field" },
  { id: "CC-MSA-LAB", name: "Mombasa Lab" },
]

const employees: Employee[] = [
  {
    id: "EMP-001",
    name: "Alice Wanjiru",
    costCenter: "CC-NBO-OPS",
    defaultFund: "FUND-GEN",
    defaultProject: "PRJ-OPS",
  },
  {
    id: "EMP-002",
    name: "Brian Otieno",
    costCenter: "CC-KSM-FIELD",
    defaultFund: "FUND-DONOR-A",
    defaultProject: "PRJ-AGRI",
  },
  {
    id: "EMP-003",
    name: "Chipo Moyo",
    costCenter: "CC-MSA-LAB",
    defaultFund: "FUND-DONOR-B",
    defaultProject: "PRJ-HEALTH",
  },
]

const projects: Project[] = [
  { id: "PRJ-OPS", name: "Operations Core", fund: "FUND-GEN" },
  { id: "PRJ-AGRI", name: "AgriLivelihoods", fund: "FUND-DONOR-A" },
  { id: "PRJ-HEALTH", name: "Maternal Health Scale-Up", fund: "FUND-DONOR-B" },
]

const todayISO = new Date().toISOString().slice(0, 10)

const addDays = (baseISO: string, days: number) => {
  const date = new Date(baseISO)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const nextDateFromFrequency = (
  current: string,
  frequency: PettyCashRule["frequency"],
) => {
  const date = new Date(current)
  if (frequency === "Weekly") {
    date.setDate(date.getDate() + 7)
  } else if (frequency === "Monthly") {
    date.setMonth(date.getMonth() + 1)
  } else {
    date.setMonth(date.getMonth() + 3)
  }
  return date.toISOString().slice(0, 10)
}

const initialAdvanceRegister: StaffAdvance[] = [
  {
    id: "ADV-001",
    employeeId: "EMP-001",
    employeeName: "Alice Wanjiru",
    fund: "FUND-GEN",
    costCenter: "CC-NBO-OPS",
    issuedAmount: 40000,
    settledAmount: 25000,
    outstandingAmount: 15000,
    lastActivity: addDays(todayISO, -12),
    status: "Open",
  },
  {
    id: "ADV-002",
    employeeId: "EMP-002",
    employeeName: "Brian Otieno",
    fund: "FUND-DONOR-A",
    costCenter: "CC-KSM-FIELD",
    issuedAmount: 30000,
    settledAmount: 30000,
    outstandingAmount: 0,
    lastActivity: addDays(todayISO, -32),
    status: "Settled",
  },
]

const initialBudgetBuckets: Record<string, BudgetBucket> = {
  "CC-NBO-OPS::FUND-GEN": {
    costCenter: "CC-NBO-OPS",
    fund: "FUND-GEN",
    ats: 250000,
    committed: 40000,
    actual: 120000,
  },
  "CC-KSM-FIELD::FUND-DONOR-A": {
    costCenter: "CC-KSM-FIELD",
    fund: "FUND-DONOR-A",
    ats: 185000,
    committed: 30000,
    actual: 95000,
  },
  "CC-MSA-LAB::FUND-DONOR-B": {
    costCenter: "CC-MSA-LAB",
    fund: "FUND-DONOR-B",
    ats: 210000,
    committed: 20000,
    actual: 87000,
  },
}

const initialPettyCashRules: PettyCashRule[] = [
  {
    id: "PCR-001",
    employeeId: "EMP-002",
    employeeName: "Brian Otieno",
    frequency: "Weekly",
    defaultAmount: 10000,
    nextGenerationDate: addDays(todayISO, -1),
    active: true,
  },
  {
    id: "PCR-002",
    employeeId: "EMP-003",
    employeeName: "Chipo Moyo",
    frequency: "Monthly",
    defaultAmount: 15000,
    nextGenerationDate: addDays(todayISO, 12),
    active: true,
  },
]

const claimWorkflowOrder: ClaimStatus[] = [
  "Pending Supervisor Approval",
  "Pending Finance Review",
  "Pending Final Approval",
  "Approved",
  "Paid",
]

const pettyCashWorkflowOrder: PettyCashStatus[] = [
  "Submitted",
  "Pending Finance Review",
  "Approved",
  "Disbursed",
  "Retired",
]

const currency = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value)

const getBudgetKey = (costCenter: string, fund: string) => `${costCenter}::${fund}`

const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" }) : "—"

export default function FocusControlsDashboard() {
  const [activeTab, setActiveTab] = useState("claims")
  const [claims, setClaims] = useState<Claim[]>([])
  const [advanceRegister, setAdvanceRegister] = useState(initialAdvanceRegister)
  const [budgetBuckets, setBudgetBuckets] = useState<Record<string, BudgetBucket>>(initialBudgetBuckets)
  const [pettyCashRequests, setPettyCashRequests] = useState<PettyCashRequest[]>([])
  const [pettyCashRules, setPettyCashRules] = useState(initialPettyCashRules)
  const [pettyCashAccountabilities, setPettyCashAccountabilities] = useState<PettyCashAccountability[]>([])
  const [pettyCashFloatBalance, setPettyCashFloatBalance] = useState(250000)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [glEntries, setGlEntries] = useState<GLEntry[]>([])
  const [claimConfig, setClaimConfig] = useState({
    duplicatePolicy: "block" as DuplicatePolicy,
    requireSupportingDocs: true,
  })
  const [pettyCashConfig, setPettyCashConfig] = useState({ requireSupportingDocs: false })

  const defaultEmployee = employees[0]
  const [claimForm, setClaimForm] = useState({
    employeeId: defaultEmployee?.id ?? "",
    claimCategory: "Travel" as ClaimCategory,
    amount: "",
    supplier: "",
    description: "",
    fund: defaultEmployee?.defaultFund ?? funds[0].id,
    costCenter: defaultEmployee?.costCenter ?? costCenters[0].id,
    projectId: defaultEmployee?.defaultProject ?? "",
    claimDate: todayISO,
    supportingDoc: "",
    advanceToClear: "",
  })

  const [pettyCashForm, setPettyCashForm] = useState({
    employeeId: defaultEmployee?.id ?? "",
    amount: "",
    fund: defaultEmployee?.defaultFund ?? funds[0].id,
    costCenter: defaultEmployee?.costCenter ?? costCenters[0].id,
    purpose: "",
    supportingDoc: "",
    cycleRuleId: "",
    requestDate: todayISO,
  })

  const [accountabilityForm, setAccountabilityForm] = useState({
    requestId: "",
    receipts: "",
    amountRetired: "",
    notes: "",
  })

  const employeeOutstanding = (employeeId: string) =>
    advanceRegister
      .filter((advance) => advance.employeeId === employeeId)
      .reduce((sum, advance) => sum + advance.outstandingAmount, 0)

  const outstandingPettyCash = (employeeId: string) =>
    pettyCashRequests.some(
      (req) =>
        req.employeeId === employeeId &&
        ["Approved", "Disbursed"].includes(req.status) &&
        req.isAccountabilityPending,
    )

  const recordAudit = (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    setAuditLog((prev) => [
      {
        ...entry,
        id: generateId("AUD"),
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const pushNotification = (notification: Omit<NotificationItem, "id" | "timestamp">) => {
    setNotifications((prev) => [
      {
        ...notification,
        id: generateId("NTF"),
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const applyBudgetCommit = (costCenter: string, fund: string, amount: number) => {
    if (amount <= 0) return
    setBudgetBuckets((prev) => {
      const key = getBudgetKey(costCenter, fund)
      const bucket = prev[key] ?? { fund, costCenter, ats: 0, committed: 0, actual: 0 }
      return {
        ...prev,
        [key]: {
          ...bucket,
          ats: Math.max(bucket.ats - amount, 0),
          committed: bucket.committed + amount,
        },
      }
    })
  }

  const convertCommitToActual = (costCenter: string, fund: string, amount: number) => {
    if (amount <= 0) return
    setBudgetBuckets((prev) => {
      const key = getBudgetKey(costCenter, fund)
      const bucket = prev[key]
      if (!bucket) return prev
      return {
        ...prev,
        [key]: {
          ...bucket,
          committed: Math.max(bucket.committed - amount, 0),
          actual: bucket.actual + amount,
        },
      }
    })
  }

  const releaseBudget = (costCenter: string, fund: string, amount: number) => {
    if (amount <= 0) return
    setBudgetBuckets((prev) => {
      const key = getBudgetKey(costCenter, fund)
      const bucket = prev[key]
      if (!bucket) return prev
      return {
        ...prev,
        [key]: {
          ...bucket,
          ats: bucket.ats + amount,
          committed: Math.max(bucket.committed - amount, 0),
        },
      }
    })
  }

  const duplicateClaim = (amount: number) =>
    claims.find(
      (claim) =>
        claim.claimDate === claimForm.claimDate &&
        claim.supplier.trim().toLowerCase() === claimForm.supplier.trim().toLowerCase() &&
        claim.description.trim().toLowerCase() === claimForm.description.trim().toLowerCase() &&
        claim.amount === amount,
    )

  const handleClaimSubmit = () => {
    const amount = Number(claimForm.amount)
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid amount", description: "Claim amount must be greater than zero" })
      return
    }
    if (!claimForm.description.trim()) {
      toast({ title: "Description required", description: "Provide a short business justification" })
      return
    }
    if (claimConfig.requireSupportingDocs && !claimForm.supportingDoc.trim()) {
      toast({ title: "Supporting document missing", description: "Receipts or approvals are mandatory" })
      return
    }

    const outstanding = employeeOutstanding(claimForm.employeeId)
    if (outstanding > 0 && !claimForm.advanceToClear) {
      toast({
        title: "Outstanding advance detected",
        description: `Outstanding of ${currency(outstanding)} must be cleared before new reimbursement claims`,
      })
      return
    }

    const budgetKey = getBudgetKey(claimForm.costCenter, claimForm.fund)
    const bucket = budgetBuckets[budgetKey]
    if (!bucket || bucket.ats < amount) {
      toast({
        title: "Budget exceeded",
        description: "Insufficient ATS for selected fund/cost centre",
      })
      return
    }

    if (claimForm.projectId) {
      const project = projects.find((proj) => proj.id === claimForm.projectId)
      if (project && project.fund !== claimForm.fund) {
        toast({ title: "Fund mismatch", description: "Claim fund must match the project donor fund" })
        return
      }
    }

    const duplicate = duplicateClaim(amount)
    if (duplicate && claimConfig.duplicatePolicy === "block") {
      toast({
        title: "Potential duplicate",
        description: `Matches claim ${duplicate.id}. Review before submitting again.`,
      })
      return
    }

    const employee = employees.find((emp) => emp.id === claimForm.employeeId)

    const newClaim: Claim = {
      id: generateId("CLM"),
      employeeId: claimForm.employeeId,
      employeeName: employee?.name || "Unknown",
      amount,
      description: claimForm.description,
      supplier: claimForm.supplier,
      fund: claimForm.fund,
      costCenter: claimForm.costCenter,
      projectId: claimForm.projectId || undefined,
      claimCategory: claimForm.claimCategory,
      claimDate: claimForm.claimDate,
      status: "Pending Supervisor Approval",
      supportingDocument: claimForm.supportingDoc,
      hasOutstandingAdvance: outstanding > 0,
      outstandingAdvanceAmount: outstanding,
      linkedAdvanceId: claimForm.advanceToClear || undefined,
      createdAt: new Date().toISOString(),
      duplicateOf: duplicate?.id,
      atsBalanceAtSubmission: bucket.ats,
    }

    setClaims((prev) => [newClaim, ...prev])
    applyBudgetCommit(newClaim.costCenter, newClaim.fund, amount)

    recordAudit({
      actor: newClaim.employeeName,
      entityId: newClaim.id,
      entityType: "claim",
      message: `Claim submitted for ${currency(amount)}`,
    })

    pushNotification({
      event: "Claim Submitted",
      recipient: "Supervisor",
      message: `${newClaim.employeeName} submitted claim ${newClaim.id}`,
    })

    if (duplicate && claimConfig.duplicatePolicy === "warn") {
      pushNotification({
        event: "Duplicate warning",
        recipient: "Finance",
        message: `Claim ${newClaim.id} flagged as possible duplicate of ${duplicate.id}`,
      })
    }

    setClaimForm((prev) => ({
      ...prev,
      amount: "",
      supplier: "",
      description: "",
      supportingDoc: "",
      advanceToClear: "",
    }))

    toast({
      title: "Claim submitted",
      description: `Workflow started for ${newClaim.id}`,
    })
  }

  const getNextClaimStatus = (status: ClaimStatus) => {
    const index = claimWorkflowOrder.indexOf(status)
    if (index === -1 || index >= claimWorkflowOrder.length - 2) return null
    return claimWorkflowOrder[index + 1]
  }

  const handleClaimAdvance = (claimId: string, actor: string) => {
    setClaims((prev) =>
      prev.map((claim) => {
        if (claim.id !== claimId) return claim
        const nextStatus = getNextClaimStatus(claim.status)
        if (!nextStatus) return claim
        recordAudit({
          actor,
          entityId: claim.id,
          entityType: "claim",
          message: `Moved to ${nextStatus}`,
        })

        if (nextStatus === "Pending Finance Review") {
          pushNotification({ event: "Supervisor approved", recipient: "Finance", message: `Claim ${claim.id} ready for finance check` })
        }
        if (nextStatus === "Pending Final Approval") {
          pushNotification({ event: "Finance cleared", recipient: "FAD/ND", message: `Claim ${claim.id} awaiting FAD/ND approval` })
        }
        if (nextStatus === "Approved") {
          pushNotification({ event: "Claim approved", recipient: claim.employeeName, message: `${claim.id} approved and ready for payment` })
        }
        return { ...claim, status: nextStatus }
      }),
    )
  }

  const handleClaimPayment = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId)
    if (!claim || claim.status !== "Approved") {
      toast({ title: "Approval required", description: "Only approved claims can be paid" })
      return
    }

    convertCommitToActual(claim.costCenter, claim.fund, claim.amount)

    const entry: GLEntry = {
      id: generateId("GL"),
      reference: claim.id,
      debitAccount:
        claim.claimCategory === "Travel"
          ? "7501 Travel Expense"
          : claim.claimCategory === "Supplies"
            ? "7602 Supplies Expense"
            : "7701 Other Staff Expense",
      creditAccount: "1001 Bank",
      amount: claim.amount,
      timestamp: new Date().toISOString(),
      memo: `Claim payment for ${claim.employeeName}`,
    }

    setGlEntries((prev) => [entry, ...prev])

    if (claim.linkedAdvanceId) {
      setAdvanceRegister((prev) =>
        prev.map((advance) => {
          if (advance.id !== claim.linkedAdvanceId) return advance
          const newOutstanding = Math.max(advance.outstandingAmount - claim.amount, 0)
          return {
            ...advance,
            outstandingAmount: newOutstanding,
            settledAmount: advance.settledAmount + Math.min(advance.outstandingAmount, claim.amount),
            status: newOutstanding === 0 ? "Settled" : advance.status,
            lastActivity: new Date().toISOString(),
          }
        }),
      )
    }

    setClaims((prev) =>
      prev.map((item) => (item.id === claim.id ? { ...item, status: "Paid", paidDate: new Date().toISOString() } : item)),
    )

    recordAudit({ actor: "Finance", entityId: claim.id, entityType: "claim", message: "Marked as paid" })
    pushNotification({ event: "Claim paid", recipient: claim.employeeName, message: `${claim.id} has been paid` })
  }

  const handleClaimRejection = (claimId: string, actor: string) => {
    const claim = claims.find((c) => c.id === claimId)
    if (!claim || claim.status === "Paid") return
    releaseBudget(claim.costCenter, claim.fund, claim.amount)
    setClaims((prev) => prev.map((item) => (item.id === claim.id ? { ...item, status: "Rejected" } : item)))
    recordAudit({ actor, entityId: claim.id, entityType: "claim", message: "Claim rejected" })
    pushNotification({ event: "Claim rejected", recipient: claim.employeeName, message: `${claim.id} was rejected` })
  }

  const handleClaimFieldChange = <K extends keyof typeof claimForm>(field: K, value: (typeof claimForm)[K]) => {
    setClaimForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "employeeId") {
        const employee = employees.find((emp) => emp.id === value)
        if (employee) {
          next.costCenter = employee.costCenter
          next.fund = employee.defaultFund
          next.projectId = employee.defaultProject || ""
          next.advanceToClear = ""
        }
      }
      return next
    })
  }

  const handlePettyCashFieldChange = <K extends keyof typeof pettyCashForm>(field: K, value: (typeof pettyCashForm)[K]) => {
    setPettyCashForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "employeeId") {
        const employee = employees.find((emp) => emp.id === value)
        if (employee) {
          next.costCenter = employee.costCenter
          next.fund = employee.defaultFund
        }
      }
      return next
    })
  }

  const handlePettyCashSubmit = () => {
    const amount = Number(pettyCashForm.amount)
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid amount", description: "Requested petty cash must be positive" })
      return
    }
    if (!pettyCashForm.purpose.trim()) {
      toast({ title: "Purpose required", description: "Describe why the float is needed" })
      return
    }
    if (pettyCashConfig.requireSupportingDocs && !pettyCashForm.supportingDoc.trim()) {
      toast({ title: "Attach supporting doc", description: "Attachment required by configuration" })
      return
    }
    if (outstandingPettyCash(pettyCashForm.employeeId)) {
      toast({ title: "Outstanding accountability", description: "Retire the previous petty cash before requesting a new one" })
      return
    }
    const budgetKey = getBudgetKey(pettyCashForm.costCenter, pettyCashForm.fund)
    const bucket = budgetBuckets[budgetKey]
    if (!bucket || bucket.ats < amount) {
      toast({ title: "Budget exceeded", description: "Insufficient ATS for petty cash" })
      return
    }
    const employee = employees.find((emp) => emp.id === pettyCashForm.employeeId)
    if (employee && employee.defaultFund !== pettyCashForm.fund) {
      toast({ title: "Donor restriction", description: "Employee assigned fund differs from requested fund" })
      return
    }

    const request: PettyCashRequest = {
      id: generateId("PCRQ"),
      employeeId: pettyCashForm.employeeId,
      employeeName: employee?.name || "Unknown",
      amount,
      costCenter: pettyCashForm.costCenter,
      fund: pettyCashForm.fund,
      purpose: pettyCashForm.purpose,
      requestDate: pettyCashForm.requestDate,
      status: "Submitted",
      supportingDocument: pettyCashForm.supportingDoc || undefined,
      cycleRuleId: pettyCashForm.cycleRuleId || undefined,
      isAccountabilityPending: true,
    }

    setPettyCashRequests((prev) => [request, ...prev])
    applyBudgetCommit(request.costCenter, request.fund, request.amount)

    recordAudit({
      actor: request.employeeName,
      entityId: request.id,
      entityType: "petty_cash",
      message: `Request submitted for ${currency(request.amount)}`,
    })

    pushNotification({ event: "Petty cash submitted", recipient: "Supervisor", message: `${request.id} awaiting initial approval` })

    setPettyCashForm((prev) => ({
      ...prev,
      amount: "",
      purpose: "",
      supportingDoc: pettyCashConfig.requireSupportingDocs ? prev.supportingDoc : "",
    }))
  }

  const getNextPettyCashStatus = (status: PettyCashStatus) => {
    if (status === "Draft") return "Submitted"
    const index = pettyCashWorkflowOrder.indexOf(status)
    if (index === -1 || index >= pettyCashWorkflowOrder.length - 2) return null
    return pettyCashWorkflowOrder[index + 1]
  }

  const handlePettyCashAdvance = (requestId: string, actor: string) => {
    setPettyCashRequests((prev) =>
      prev.map((request) => {
        if (request.id !== requestId) return request
        const nextStatus = getNextPettyCashStatus(request.status)
        if (!nextStatus) return request
        if (request.status === "Draft" && nextStatus === "Submitted") {
          applyBudgetCommit(request.costCenter, request.fund, request.amount)
        }
        recordAudit({ actor, entityId: request.id, entityType: "petty_cash", message: `Advanced to ${nextStatus}` })
        if (nextStatus === "Pending Finance Review") {
          pushNotification({ event: "Supervisor approved", recipient: "Finance", message: `${request.id} needs compliance review` })
        }
        if (nextStatus === "Approved") {
          pushNotification({ event: "Petty cash approved", recipient: "Cashier", message: `${request.id} ready for disbursement` })
        }
        return { ...request, status: nextStatus }
      }),
    )
  }

  const handlePettyCashDisbursement = (requestId: string) => {
    const request = pettyCashRequests.find((req) => req.id === requestId)
    if (!request || request.status !== "Approved") {
      toast({ title: "Approval required", description: "Only approved petty cash can be disbursed" })
      return
    }
    if (pettyCashFloatBalance < request.amount) {
      toast({ title: "Insufficient float", description: "Top up the petty cash float before disbursing" })
      return
    }
    setPettyCashFloatBalance((prev) => prev - request.amount)

    const entry: GLEntry = {
      id: generateId("GL"),
      reference: request.id,
      debitAccount: "1350 Employee Advances",
      creditAccount: "1110 Petty Cash",
      amount: request.amount,
      timestamp: new Date().toISOString(),
      memo: `Petty cash disbursed to ${request.employeeName}`,
    }
    setGlEntries((prev) => [entry, ...prev])

    const disbursedAt = new Date().toISOString()
    const dueDate = addDays(disbursedAt.slice(0, 10), 14)

    setPettyCashRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: "Disbursed",
              disbursedDate: disbursedAt,
              accountabilityDueDate: dueDate,
            }
          : item,
      ),
    )

    recordAudit({ actor: "Cashier", entityId: request.id, entityType: "petty_cash", message: "Disbursed to employee" })
    pushNotification({ event: "Petty cash disbursed", recipient: request.employeeName, message: `${request.id} disbursed. Accountability due in 14 days.` })
  }

  const handleAccountabilitySubmit = () => {
    const request = pettyCashRequests.find((req) => req.id === accountabilityForm.requestId)
    const amountRetired = Number(accountabilityForm.amountRetired)
    if (!request || request.status !== "Disbursed") {
      toast({ title: "Select a disbursed request" })
      return
    }
    if (!amountRetired || amountRetired <= 0) {
      toast({ title: "Enter retired amount" })
      return
    }
    if (!accountabilityForm.receipts.trim()) {
      toast({ title: "Receipts required", description: "Upload or link receipts" })
      return
    }

    const excessOrShortfall = request.amount - amountRetired

    const accountability: PettyCashAccountability = {
      id: generateId("ACC"),
      requestId: request.id,
      requestAmount: request.amount,
      receipts: accountabilityForm.receipts,
      amountRetired,
      excessOrShortfall,
      notes: accountabilityForm.notes,
      status: "Pending",
      submittedOn: new Date().toISOString(),
    }

    setPettyCashAccountabilities((prev) => [accountability, ...prev])
    recordAudit({ actor: request.employeeName, entityId: accountability.id, entityType: "accountability", message: `Submitted retirement with ${currency(amountRetired)}` })
    pushNotification({ event: "Accountability submitted", recipient: "Finance", message: `${request.id} submitted for verification` })

    setAccountabilityForm({ requestId: "", receipts: "", amountRetired: "", notes: "" })
  }

  const handleAccountabilityVerification = (accountabilityId: string) => {
    const accountability = pettyCashAccountabilities.find((acc) => acc.id === accountabilityId)
    if (!accountability || accountability.status === "Verified") return
    const request = pettyCashRequests.find((req) => req.id === accountability.requestId)
    if (!request) return

    convertCommitToActual(request.costCenter, request.fund, Math.min(request.amount, accountability.amountRetired))
    if (accountability.excessOrShortfall > 0) {
      releaseBudget(request.costCenter, request.fund, accountability.excessOrShortfall)
      setPettyCashFloatBalance((prev) => prev + accountability.excessOrShortfall)
      setGlEntries((prev) => [
        {
          id: generateId("GL"),
          reference: accountability.id,
          debitAccount: "1110 Petty Cash",
          creditAccount: "1350 Employee Advances",
          amount: accountability.excessOrShortfall,
          timestamp: new Date().toISOString(),
          memo: `${request.id} excess returned`,
        },
        ...prev,
      ])
    }

    if (accountability.excessOrShortfall < 0) {
      const shortfall = Math.abs(accountability.excessOrShortfall)
      setGlEntries((prev) => [
        {
          id: generateId("GL"),
          reference: accountability.id,
          debitAccount: "7805 Petty Cash Variance",
          creditAccount: "2130 Employee Payable",
          amount: shortfall,
          timestamp: new Date().toISOString(),
          memo: `${request.id} shortfall recorded`,
        },
        ...prev,
      ])
      pushNotification({ event: "Accountability shortfall", recipient: request.employeeName, message: `KES ${shortfall.toLocaleString()} payable back to Finance` })
    }

    setPettyCashAccountabilities((prev) =>
      prev.map((item) =>
        item.id === accountability.id
          ? { ...item, status: "Verified", verifiedOn: new Date().toISOString(), verifiedBy: "Finance" }
          : item,
      ),
    )

    setPettyCashRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? { ...item, status: "Retired", isAccountabilityPending: false }
          : item,
      ),
    )

    recordAudit({ actor: "Finance", entityId: accountability.id, entityType: "accountability", message: "Accountability verified" })
    pushNotification({ event: "Accountability verified", recipient: request.employeeName, message: `${request.id} closed successfully` })
  }

  useEffect(() => {
    const runRuleAutomation = () => {
      const today = new Date()
      const todayIso = today.toISOString().slice(0, 10)
      const newDrafts: PettyCashRequest[] = []
      setPettyCashRules((prev) =>
        prev.map((rule) => {
          if (!rule.active) return rule
          if (new Date(rule.nextGenerationDate) <= today) {
            const employee = employees.find((emp) => emp.id === rule.employeeId)
            const request: PettyCashRequest = {
              id: generateId("PCRQ"),
              employeeId: rule.employeeId,
              employeeName: rule.employeeName,
              amount: rule.defaultAmount,
              costCenter: employee?.costCenter || costCenters[0].id,
              fund: employee?.defaultFund || funds[0].id,
              purpose: `${rule.frequency} petty cash cycle`,
              requestDate: todayIso,
              status: "Draft",
              cycleRuleId: rule.id,
              isAccountabilityPending: true,
            }
            newDrafts.push(request)
            return { ...rule, nextGenerationDate: nextDateFromFrequency(rule.nextGenerationDate, rule.frequency) }
          }
          return rule
        }),
      )
      if (newDrafts.length) {
        setPettyCashRequests((prev) => [...newDrafts, ...prev])
        newDrafts.forEach((draft) => {
          recordAudit({ actor: "Scheduler", entityId: draft.id, entityType: "petty_cash", message: "Recurring petty cash generated" })
          pushNotification({ event: "Recurring petty cash", recipient: draft.employeeName, message: `${draft.id} drafted automatically` })
        })
      }
    }
    runRuleAutomation()
    const interval = setInterval(runRuleAutomation, 60000)
    return () => clearInterval(interval)
  }, [])

  const outstandingAdvancesTotal = useMemo(
    () => advanceRegister.reduce((sum, advance) => sum + advance.outstandingAmount, 0),
    [advanceRegister],
  )

  const pendingClaims = claims.filter((claim) => claim.status !== "Paid" && claim.status !== "Rejected")
  const openPettyCash = pettyCashRequests.filter(
    (req) => req.status === "Disbursed" && req.isAccountabilityPending,
  )

  const claimsByFund = useMemo(() => {
    const map: Record<string, number> = {}
    claims.forEach((claim) => {
      map[claim.fund] = (map[claim.fund] || 0) + claim.amount
    })
    return Object.entries(map)
  }, [claims])

  const staffClaimRegister = claims
  const advanceVsClaims = advanceRegister.map((advance) => {
    const clearedByClaims = claims.filter((claim) => claim.linkedAdvanceId === advance.id && claim.status === "Paid")
    const clearedAmount = clearedByClaims.reduce((sum, claim) => sum + claim.amount, 0)
    return {
      advance,
      clearedAmount,
      remaining: advance.outstandingAmount,
    }
  })

  const claimsByFundReport = claimsByFund.map(([fundId, amount]) => ({
    fund: funds.find((fund) => fund.id === fundId)?.name || fundId,
    amount,
  }))

  const pettyCashOutstandingReport = pettyCashRequests
    .filter((req) => req.status === "Disbursed" && req.isAccountabilityPending)
    .map((req) => ({
      request: req,
      agingDays: Math.floor(
        (Date.now() - new Date(req.disbursedDate || req.requestDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
    }))

  const pettyCashRegister = pettyCashRequests

  const stats = [
    {
      title: "Outstanding Advances",
      value: currency(outstandingAdvancesTotal),
      icon: Wallet,
      trend: `${advanceRegister.filter((adv) => adv.status === "Open").length} employees`,
    },
    {
      title: "Claims in Workflow",
      value: pendingClaims.length.toString(),
      icon: ClipboardList,
      trend: `${claims.filter((claim) => claim.status === "Pending Finance Review").length} pending Finance`,
    },
    {
      title: "Open Petty Cash",
      value: openPettyCash.length.toString(),
      icon: ReceiptText,
      trend: `${currency(openPettyCash.reduce((sum, req) => sum + req.amount, 0))} awaiting retirement`,
    },
    {
      title: "GL Entries",
      value: glEntries.length.toString(),
      icon: Building,
      trend: "Latest transactions logged",
    },
  ]

  const sectionTitle = (title: string, description?: string) => (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-slate-400">{description}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-pink-400">Appendix 5 & Appendix 6</p>
              <h1 className="text-3xl font-bold text-white md:text-4xl">Staff Claims & Petty Cash Control Center</h1>
              <p className="text-slate-400">Hard stops for advances, budgets, funds, supporting docs, workflows, GL, automation.</p>
            </div>
            <Badge className="bg-green-500/20 text-green-300">Compliance Mode</Badge>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-slate-800 bg-slate-900/70">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-full bg-slate-800/70 p-3">
                    <stat.icon className="h-5 w-5 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.trend}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900">
            <TabsTrigger value="claims">P5 · Staff Claims</TabsTrigger>
            <TabsTrigger value="petty">P6 · Petty Cash</TabsTrigger>
            <TabsTrigger value="reports">Reports & Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-slate-800 bg-slate-900/70 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-300">
                    <FileText className="h-5 w-5" /> Claim Intake (Hard Stops)
                  </CardTitle>
                  <p className="text-sm text-slate-400">Blocks outstanding advances, enforces documents, donor compliance, ATS budget check</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Employee</Label>
                      <Select
                        value={claimForm.employeeId}
                        onValueChange={(value) => handleClaimFieldChange("employeeId", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-amber-300">
                        Outstanding advance: {currency(employeeOutstanding(claimForm.employeeId))}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-300">Claim Date</Label>
                      <Input
                        type="date"
                        value={claimForm.claimDate}
                        onChange={(event) => handleClaimFieldChange("claimDate", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Amount (KES)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={claimForm.amount}
                        onChange={(event) => handleClaimFieldChange("amount", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Category</Label>
                      <Select
                        value={claimForm.claimCategory}
                        onValueChange={(value) => handleClaimFieldChange("claimCategory", value as ClaimCategory)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {claimCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Fund</Label>
                      <Select
                        value={claimForm.fund}
                        onValueChange={(value) => handleClaimFieldChange("fund", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select fund" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {funds.map((fund) => (
                            <SelectItem key={fund.id} value={fund.id}>
                              {fund.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Cost Centre</Label>
                      <Select
                        value={claimForm.costCenter}
                        onValueChange={(value) => handleClaimFieldChange("costCenter", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select cost centre" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {costCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Project (Optional)</Label>
                      <Select
                        value={claimForm.projectId}
                        onValueChange={(value) => handleClaimFieldChange("projectId", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Link project" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          <SelectItem value="">No project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Advance to clear</Label>
                      <Select
                        value={claimForm.advanceToClear}
                        onValueChange={(value) => handleClaimFieldChange("advanceToClear", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select advance" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          <SelectItem value="">None</SelectItem>
                          {advanceRegister
                            .filter((advance) => advance.employeeId === claimForm.employeeId && advance.outstandingAmount > 0)
                            .map((advance) => (
                              <SelectItem key={advance.id} value={advance.id}>
                                {advance.id} · {currency(advance.outstandingAmount)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Supplier / Description</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        placeholder="Supplier"
                        value={claimForm.supplier}
                        onChange={(event) => handleClaimFieldChange("supplier", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                      <Textarea
                        placeholder="Narration"
                        rows={2}
                        value={claimForm.description}
                        onChange={(event) => handleClaimFieldChange("description", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Supporting Documents (URL)</Label>
                      <Input
                        placeholder="Link to receipts"
                        value={claimForm.supportingDoc}
                        onChange={(event) => handleClaimFieldChange("supportingDoc", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                      <p className="font-medium text-white">Submission Gatekeepers</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4">
                        <li>No outstanding advances unless this claim clears one</li>
                        <li>ATS budget & donor fund enforced</li>
                        <li>Supporting docs required ({claimConfig.requireSupportingDocs ? "ON" : "OFF"})</li>
                        <li>Duplicate policy: {claimConfig.duplicatePolicy === "block" ? "Block" : "Warn"}</li>
                      </ul>
                    </div>
                  </div>

                  <Button onClick={handleClaimSubmit} className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-black">
                    Fire Compliance Checks
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-300">
                    <ShieldCheck className="h-5 w-5" /> Claim Safeguards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                    <div>
                      <p className="text-sm text-slate-400">Require supporting docs</p>
                      <p className="text-xs text-slate-500">Blocks submission without receipts</p>
                    </div>
                    <Switch
                      checked={claimConfig.requireSupportingDocs}
                      onCheckedChange={(value) => setClaimConfig((prev) => ({ ...prev, requireSupportingDocs: value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                    <div>
                      <p className="text-sm text-slate-400">Duplicate behaviour</p>
                      <p className="text-xs text-slate-500">Block or warn on matches</p>
                    </div>
                    <Select
                      value={claimConfig.duplicatePolicy}
                      onValueChange={(value) => setClaimConfig((prev) => ({ ...prev, duplicatePolicy: value as DuplicatePolicy }))}
                    >
                      <SelectTrigger className="w-32 border-slate-700 bg-slate-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-900 text-white">
                        <SelectItem value="block">Block</SelectItem>
                        <SelectItem value="warn">Warn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-slate-800" />

                  <div>
                    <p className="text-sm font-semibold text-white">Advance Register</p>
                    <div className="mt-3 space-y-3">
                      {advanceRegister.map((advance) => (
                        <div key={advance.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{advance.id}</p>
                              <p className="text-xs text-slate-400">{advance.employeeName}</p>
                            </div>
                            <Badge className={cn("text-xs", advance.status === "Open" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300")}>
                              {advance.status}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                            <div>
                              <p>Outstanding</p>
                              <p className="font-semibold text-white">{currency(advance.outstandingAmount)}</p>
                            </div>
                            <div>
                              <p>Last Activity</p>
                              <p>{formatDate(advance.lastActivity)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-300">
                  <ListChecks className="h-5 w-5" /> Claim Workflow Queue
                </CardTitle>
                <p className="text-sm text-slate-400">Supervisor → Finance → FAD/ND → Approved → Paid</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-400">Claim</TableHead>
                      <TableHead className="text-slate-400">Employee</TableHead>
                      <TableHead className="text-slate-400">Fund / CC</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-right text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500">
                          No claims submitted yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell>
                            <p className="font-semibold text-white">{claim.id}</p>
                            <p className="text-xs text-slate-500">{currency(claim.amount)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-white">{claim.employeeName}</p>
                            <p className="text-xs text-slate-500">{claim.claimCategory}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-slate-500">{claim.fund}</p>
                            <p className="text-xs text-slate-500">{claim.costCenter}</p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-xs",
                                claim.status === "Paid"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : claim.status === "Rejected"
                                    ? "bg-red-500/20 text-red-300"
                                    : "bg-slate-800 text-slate-200",
                              )}
                            >
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {claim.status !== "Paid" && claim.status !== "Rejected" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClaimAdvance(claim.id, "Workflow")}
                                className="border-slate-700 text-slate-200"
                              >
                                Advance
                              </Button>
                            )}
                            {claim.status === "Approved" && (
                              <Button size="sm" onClick={() => handleClaimPayment(claim.id)} className="bg-emerald-500 text-black">
                                Mark Paid
                              </Button>
                            )}
                            {claim.status !== "Paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClaimRejection(claim.id, "Workflow")}
                                className="text-red-400"
                              >
                                Reject
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="petty" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-slate-800 bg-slate-900/70 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-300">
                    <Wallet className="h-5 w-5" /> Petty Cash Request
                  </CardTitle>
                  <p className="text-sm text-slate-400">Blocks new requests until accountability is cleared. Budget + fund enforced.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Employee</Label>
                      <Select
                        value={pettyCashForm.employeeId}
                        onValueChange={(value) => handlePettyCashFieldChange("employeeId", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {outstandingPettyCash(pettyCashForm.employeeId) && (
                        <p className="mt-1 text-xs text-amber-400">Accountability pending · request blocked</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-slate-300">Request Date</Label>
                      <Input
                        type="date"
                        value={pettyCashForm.requestDate}
                        onChange={(event) => handlePettyCashFieldChange("requestDate", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Amount (KES)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={pettyCashForm.amount}
                        onChange={(event) => handlePettyCashFieldChange("amount", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Cycle Rule</Label>
                      <Select
                        value={pettyCashForm.cycleRuleId}
                        onValueChange={(value) => handlePettyCashFieldChange("cycleRuleId", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Manual" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          <SelectItem value="">Manual</SelectItem>
                          {pettyCashRules.map((rule) => (
                            <SelectItem key={rule.id} value={rule.id}>
                              {rule.employeeName} · {rule.frequency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Fund</Label>
                      <Select
                        value={pettyCashForm.fund}
                        onValueChange={(value) => handlePettyCashFieldChange("fund", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select fund" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {funds.map((fund) => (
                            <SelectItem key={fund.id} value={fund.id}>
                              {fund.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Cost Centre</Label>
                      <Select
                        value={pettyCashForm.costCenter}
                        onValueChange={(value) => handlePettyCashFieldChange("costCenter", value)}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select cost centre" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {costCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Purpose</Label>
                    <Textarea
                      rows={3}
                      placeholder="Describe the petty cash usage"
                      value={pettyCashForm.purpose}
                      onChange={(event) => handlePettyCashFieldChange("purpose", event.target.value)}
                      className="border-slate-700 bg-slate-900 text-white"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Supporting Docs (Optional)</Label>
                      <Input
                        placeholder="Link"
                        value={pettyCashForm.supportingDoc}
                        onChange={(event) => handlePettyCashFieldChange("supportingDoc", event.target.value)}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                      <p className="font-semibold text-white">Controls</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4">
                        <li>Blocks if accountability pending</li>
                        <li>Budget + donor guardrails</li>
                        <li>Recurring cycles auto-draft</li>
                        <li>Float balance: {currency(pettyCashFloatBalance)}</li>
                      </ul>
                    </div>
                  </div>

                  <Button onClick={handlePettyCashSubmit} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black">
                    Submit for Approval
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-300">
                    <Repeat className="h-5 w-5" /> Recurring Rule Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-300">
                  {pettyCashRules.map((rule) => (
                    <div key={rule.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{rule.employeeName}</p>
                          <p className="text-xs text-slate-400">{rule.frequency} · Next {formatDate(rule.nextGenerationDate)}</p>
                        </div>
                        <Badge className="bg-slate-800 text-slate-200">KES {rule.defaultAmount.toLocaleString()}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Rule ID: {rule.id}</p>
                    </div>
                  ))}
                  <Separator className="bg-slate-800" />
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                    <div>
                      <p className="text-sm text-slate-400">Require documents on petty cash</p>
                      <p className="text-xs text-slate-500">Toggle for optional attachments</p>
                    </div>
                    <Switch
                      checked={pettyCashConfig.requireSupportingDocs}
                      onCheckedChange={(value) => setPettyCashConfig({ requireSupportingDocs: value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-200">
                    <Clock className="h-5 w-5" /> Petty Cash Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-slate-400">Request</TableHead>
                        <TableHead className="text-slate-400">Employee</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pettyCashRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-slate-500">
                            No petty cash requests yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        pettyCashRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <p className="font-semibold text-white">{request.id}</p>
                              <p className="text-xs text-slate-500">{currency(request.amount)}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-white">{request.employeeName}</p>
                              <p className="text-xs text-slate-500">{request.purpose}</p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  request.status === "Retired"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : request.status === "Rejected"
                                      ? "bg-red-500/20 text-red-300"
                                      : "bg-slate-800 text-slate-200",
                                )}
                              >
                                {request.status}
                              </Badge>
                              {request.status === "Disbursed" && request.accountabilityDueDate && (
                                <p className="text-xs text-amber-300">Due {formatDate(request.accountabilityDueDate)}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {request.status !== "Disbursed" && request.status !== "Retired" && request.status !== "Rejected" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-700 text-slate-200"
                                  onClick={() => handlePettyCashAdvance(request.id, "Workflow")}
                                >
                                  Advance
                                </Button>
                              )}
                              {request.status === "Approved" && (
                                <Button size="sm" className="bg-emerald-500 text-black" onClick={() => handlePettyCashDisbursement(request.id)}>
                                  Disburse
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lime-200">
                    <CheckCircle2 className="h-5 w-5" /> Accountability & Retirement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Disbursed Request</Label>
                      <Select
                        value={accountabilityForm.requestId}
                        onValueChange={(value) => setAccountabilityForm((prev) => ({ ...prev, requestId: value }))}
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-900 text-white">
                          {pettyCashRequests
                            .filter((request) => request.status === "Disbursed")
                            .map((request) => (
                              <SelectItem key={request.id} value={request.id}>
                                {request.id} · {currency(request.amount)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Amount Retired</Label>
                      <Input
                        type="number"
                        value={accountabilityForm.amountRetired}
                        onChange={(event) => setAccountabilityForm((prev) => ({ ...prev, amountRetired: event.target.value }))}
                        className="border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Receipts (URL)</Label>
                    <Input
                      value={accountabilityForm.receipts}
                      onChange={(event) => setAccountabilityForm((prev) => ({ ...prev, receipts: event.target.value }))}
                      className="border-slate-700 bg-slate-900 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Notes</Label>
                    <Textarea
                      rows={2}
                      value={accountabilityForm.notes}
                      onChange={(event) => setAccountabilityForm((prev) => ({ ...prev, notes: event.target.value }))}
                      className="border-slate-700 bg-slate-900 text-white"
                    />
                  </div>
                  <Button onClick={handleAccountabilitySubmit} className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black">
                    Submit Accountability
                  </Button>

                  <Separator className="bg-slate-800" />

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-slate-400">Accountability</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-right text-slate-400">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pettyCashAccountabilities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-500">
                            No submissions yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        pettyCashAccountabilities.map((accountability) => (
                          <TableRow key={accountability.id}>
                            <TableCell>
                              <p className="font-semibold text-white">{accountability.id}</p>
                              <p className="text-xs text-slate-500">{currency(accountability.amountRetired)}</p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  accountability.status === "Verified"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-amber-500/20 text-amber-300",
                                )}
                              >
                                {accountability.status}
                              </Badge>
                              <p className="text-xs text-slate-500">
                                {accountability.excessOrShortfall === 0
                                  ? "Balanced"
                                  : accountability.excessOrShortfall > 0
                                    ? `${currency(accountability.excessOrShortfall)} returned`
                                    : `${currency(Math.abs(accountability.excessOrShortfall))} shortfall`}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              {accountability.status === "Pending" && (
                                <Button size="sm" onClick={() => handleAccountabilityVerification(accountability.id)}>
                                  Verify
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <ClipboardList className="h-5 w-5 text-pink-300" /> Staff Claim Register
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {staffClaimRegister.length === 0 ? (
                    <p className="text-sm text-slate-500">No claims captured</p>
                  ) : (
                    staffClaimRegister.slice(0, 6).map((claim) => (
                      <div key={claim.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{claim.id}</p>
                            <p className="text-xs text-slate-500">{claim.employeeName}</p>
                          </div>
                          <Badge className="bg-slate-800 text-slate-200">{claim.status}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <div>
                            <p>Amount</p>
                            <p className="font-semibold text-white">{currency(claim.amount)}</p>
                          </div>
                          <div>
                            <p>Fund / Project</p>
                            <p>
                              {claim.fund} {claim.projectId ? `· ${claim.projectId}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-amber-300" /> Advance vs Claim Reconciliation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {advanceVsClaims.map(({ advance, clearedAmount, remaining }) => (
                    <div key={advance.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{advance.employeeName}</p>
                          <p className="text-xs text-slate-500">{advance.id}</p>
                        </div>
                        <Badge className={cn("text-xs", remaining === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-200")}> 
                          {remaining === 0 ? "Settled" : "Outstanding"}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-400">
                        <div>
                          <p>Advance</p>
                          <p className="font-semibold text-white">{currency(advance.issuedAmount)}</p>
                        </div>
                        <div>
                          <p>Cleared by claims</p>
                          <p className="font-semibold text-white">{currency(clearedAmount)}</p>
                        </div>
                        <div>
                          <p>Remaining</p>
                          <p className="font-semibold text-white">{currency(remaining)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingDown className="h-5 w-5 text-sky-300" /> Claims by Donor Fund
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {claimsByFundReport.length === 0 ? (
                  <p className="text-sm text-slate-500">No claims yet</p>
                ) : (
                  claimsByFundReport.map((bucket) => (
                    <div key={bucket.fund} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-sm text-slate-400">{bucket.fund}</p>
                      <p className="text-2xl font-semibold text-white">{currency(bucket.amount)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-emerald-300" /> Petty Cash Register
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pettyCashRegister.length === 0 ? (
                    <p className="text-sm text-slate-500">No petty cash activity yet</p>
                  ) : (
                    pettyCashRegister.slice(0, 6).map((request) => (
                      <div key={request.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{request.id}</p>
                          <Badge className="bg-slate-800 text-slate-200">{request.status}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <div>
                            <p>Employee</p>
                            <p className="font-semibold text-white">{request.employeeName}</p>
                          </div>
                          <div>
                            <p>Purpose</p>
                            <p>{request.purpose}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Bell className="h-5 w-5 text-amber-300" /> Outstanding Petty Cash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pettyCashOutstandingReport.length === 0 ? (
                    <p className="text-sm text-slate-500">No outstanding petty cash</p>
                  ) : (
                    pettyCashOutstandingReport.map(({ request, agingDays }) => (
                      <div key={request.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{request.id}</p>
                          <Badge className="bg-amber-500/20 text-amber-200">{agingDays} days</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{request.employeeName}</p>
                        <p className="text-xs text-slate-500">{currency(request.amount)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-blue-300" /> General Ledger Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-400">Reference</TableHead>
                    <TableHead className="text-slate-400">Debit / Credit</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {glEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500">
                        No GL entries yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    glEntries.slice(0, 6).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <p className="font-semibold text-white">{entry.reference}</p>
                          <p className="text-xs text-slate-500">{formatDate(entry.timestamp)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-slate-400">Dr {entry.debitAccount}</p>
                          <p className="text-xs text-slate-400">Cr {entry.creditAccount}</p>
                        </TableCell>
                        <TableCell>{currency(entry.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5 text-pink-300" /> Notifications & Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div>
                {sectionTitle("Notifications", "Auto alerts per workflow event")}
                <div className="space-y-3 text-sm text-slate-300">
                  {notifications.slice(0, 6).map((notification) => (
                    <div key={notification.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <p className="font-semibold text-white">{notification.event}</p>
                      <p className="text-xs text-slate-400">To: {notification.recipient}</p>
                      <p className="text-xs text-slate-500">{notification.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && <p className="text-xs text-slate-500">No notifications</p>}
                </div>
              </div>
              <div>
                {sectionTitle("Audit Trail", "Appendix AC-P5-06 & AC-P6-05")}
                <div className="space-y-3 text-sm text-slate-300">
                  {auditLog.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <p className="font-semibold text-white">{entry.entityType.toUpperCase()} · {entry.entityId}</p>
                      <p className="text-xs text-slate-400">{entry.actor}</p>
                      <p className="text-xs text-slate-500">{entry.message}</p>
                      <p className="text-[10px] text-slate-600">{formatDate(entry.timestamp)}</p>
                    </div>
                  ))}
                  {auditLog.length === 0 && <p className="text-xs text-slate-500">No audit entries yet</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
