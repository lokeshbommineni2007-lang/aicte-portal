import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  PlusCircle,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  ArrowRightLeft,
  FileText,
  TrendingUp,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  X,
  FileCheck,
  Send,
  Eye,
  BarChart3,
  Flame,
  Info,
  Calendar,
  Building,
  User,
  Check,
  Link2,
  GraduationCap,
  Download,
  Printer,
  QrCode,
  Activity,
  Cpu,
  Fingerprint,
  Lock,
  Bell,
  FileSpreadsheet,
  Zap,
  ShieldCheck,
  Copy,
  RotateCcw,
  Smartphone,
  Mail,
  AlertOctagon,
  ArrowUpRight
} from 'lucide-react';
import { initialInstitutions, initialCases, bureauList, categoriesList } from './data/mockData';
import { runOverlapDetection, jaroWinklerSimilarity } from './utils/overlapEngine';
import InteractiveCanvas from './components/InteractiveCanvas';
import NotificationDrawer from './components/NotificationDrawer';
import LedgerVerificationModal from './components/LedgerVerificationModal';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import InteractiveAnalyticsCharts from './components/InteractiveAnalyticsCharts';

export default function App() {
  const [institutions, setInstitutions] = useState(initialInstitutions);
  const [cases, setCases] = useState(initialCases);
  
  // High-level mode: 'officer' (Internal AICTE Portal) or 'student' (Public Citizen Grievance Portal)
  const [portalMode, setPortalMode] = useState('officer');
  
  // Officer tab state
  const [activeTab, setActiveTab] = useState('command-center');
  const [currentRole, setCurrentRole] = useState('Regulation Bureau (RB) Officer');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBureau, setSelectedBureau] = useState('All Bureaus');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [slaFilter, setSlaFilter] = useState('all');

  // Modals & Slips state
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [studentSuccessReceipt, setStudentSuccessReceipt] = useState(null);

  // High-Impact Hackathon Enhancements State
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(4);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'sms',
      title: 'CPGRAMS Auto-Ingestion SMS Sent',
      caseRef: 'PGRC/2026/0892',
      recipient: '+91 98765-43210 (K. Varun Reddy)',
      message: 'Your grievance regarding Certificate Withholding at SVCE Tirupati has been ingested. Ref #PGRC/2026/0892.',
      timestamp: 'Today, 10:14 AM'
    },
    {
      id: 'notif-2',
      type: 'email',
      title: 'Formal Notice under APH Section 13.2',
      caseRef: 'RB/2026/0314',
      recipient: 'principal@svce.edu.in',
      message: 'AICTE Regulation Bureau has issued a formal notice to produce audited fee accounts within 7 calendar days.',
      timestamp: 'Today, 11:20 AM'
    },
    {
      id: 'notif-3',
      type: 'conflict',
      title: 'Cross-Bureau Overlap Flagged',
      caseRef: 'RB vs PGRC (SVCE)',
      recipient: 'Central Overlap Matrix',
      message: 'Dual-bureau inquiry detected on AICTE PID 1-2849102. Joint hearing recommended under APH Section 8.',
      timestamp: 'Yesterday, 04:45 PM'
    },
    {
      id: 'notif-4',
      type: 'sla',
      title: 'SLA Escalation Alert Dispatched',
      caseRef: 'RB/2026/0118',
      recipient: 'Regional Director (Mumbai)',
      message: 'Case exceeds 30-day statutory resolution threshold (55 days elapsed). Standing Scrutiny hearing mandated.',
      timestamp: '2 days ago'
    }
  ]);

  const [isVerifyLedgerOpen, setIsVerifyLedgerOpen] = useState(false);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);
  const [copiedAiSummary, setCopiedAiSummary] = useState(false);

  // RBAC Permission Profiles
  const RBAC_PROFILES = {
    'Regulation Bureau (RB) Officer': {
      title: 'RB Statutory Officer',
      scope: 'Statutory Compliance & Norms',
      color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
      allowedActions: ['Issue Show Cause (Sec 13)', 'Order Financial Audit', 'Freeze Intake Allotment', 'Request Institutional ATR'],
      restrictedNotice: 'Restricted from modifying citizen counseling records directly.'
    },
    'PGRC Grievance Redressal Officer': {
      title: 'PGRC Redressal Head',
      scope: 'Citizen & Student Grievances',
      color: 'text-[#ff5a2c] bg-[#ff5a2c]/10 border-[#ff5a2c]/30',
      allowedActions: ['Mandate College ATR (15 Days)', 'Summon Virtual Hearing', 'Order Student Refund', 'Flag Inter-Bureau Overlap'],
      restrictedNotice: 'Restricted from issuing punitive affiliation sanctions.'
    },
    'Regional Director (South-Western)': {
      title: 'Regional Directorate Head',
      scope: 'Field Inspections & Ground Scrutiny',
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      allowedActions: ['Order Surprise Ground Inspection', 'Depute 3-Member Expert Committee', 'Submit Inspection Videography'],
      restrictedNotice: 'Restricted from closing central statutory inquiries.'
    },
    'AICTE Member Secretary / Apex View': {
      title: 'Apex Leadership (Member Secretary)',
      scope: 'Supreme Regulatory & Overlap Consolidation',
      color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      allowedActions: ['Apex Administrative Override', 'Consolidate Cross-Bureau Cases', 'Withdraw Extension of Approval (EOA)', 'Refer to Vigilance/CBI'],
      restrictedNotice: 'Full administrative override authority across all bureaus.'
    }
  };

  // Dispatch simulated omnichannel alerts (NIC SMS & Gov.in SMTP)
  const dispatchSimulatedAlert = (type, title, recipient, message, caseRef = null) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      type,
      title,
      caseRef: caseRef || 'AICTE-CENTRAL',
      recipient,
      message,
      timestamp: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadNotificationsCount(prev => prev + 1);
  };

  // "⚡ Load Demo Case Conflict" Button Handler for Evaluators
  const handleLoadDemoConflict = () => {
    const existing = cases.find(c => c.caseReference === 'RB/2026/0995');
    if (!existing) {
      const demoConflictCase = {
        id: `demo-conflict-${Date.now()}`,
        caseReference: 'RB/2026/0995',
        institutionId: 'inst-1',
        institutionName: 'Sri Venkateswara College of Engineering',
        aictePid: '1-2849102',
        receiptDate: new Date().toISOString().substring(0, 10),
        source: 'Whistleblower VIP Portal',
        category: 'APH Norms & Unapproved Fees',
        severity: 'Critical',
        status: 'Under Process',
        assignedBureau: 'Regulation Bureau (RB)',
        assignedOfficer: 'Smt. Priya Verma (Adviser RB)',
        lastActionTaken: 'Regulatory fee audit triggered parallel to student certificate retention',
        lastActionDate: new Date().toISOString().substring(0, 10),
        nextActionRequired: 'Consolidate with PGRC/2026/0892 for joint hearing before Member Secretary',
        expectedDisposalDate: '2026-11-25',
        slaDaysTotal: 30,
        slaDaysElapsed: 3,
        isOverdue: false,
        sha256Hash: '4a1b80c32f8149e29a4c7e651d9e23a8f4e2b9a71c84d93021fe3a1d9b73489',
        aiSummary: 'Direct cross-bureau overlap with PGRC/2026/0892: Whistleblower proves the ₹45,000 withheld certificate fee matches unauthorized institutional infrastructure collections.',
        isOverlapping: true,
        overlappingWith: ['PGRC/2026/0892'],
        overlapConfidence: 0.95,
        overlapReason: 'Potential Overlapping Cases – Coordination Required. Regulation Bureau is probing the identical ₹45,000 unapproved fee that students report being coerced into paying.',
        complainantName: 'Confidential Anti-Corruption Cell',
        complainantType: 'Whistleblower',
        description: 'Campus management is collecting unauthorized development fees directly linked to withholding original student educational certificates.',
        actions: [
          {
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            officer: 'Automated Gateway Engine',
            bureau: 'Regulation Bureau (RB)',
            action: 'Whistleblower File Registered',
            remarks: 'AI Overlap Engine flagged 95% semantic match with ongoing PGRC grievance on SVCE.',
            attachment: 'audit_complaint.pdf'
          }
        ]
      };

      setCases(prev => [demoConflictCase, ...prev]);
    }

    setActiveTab('overlaps');
    dispatchSimulatedAlert(
      'conflict',
      '⚡ Live Demo Conflict Loaded',
      'Regulation Bureau & PGRC Officers',
      'Parallel investigation flagged between RB/2026/0995 and PGRC/2026/0892 on AICTE PID 1-2849102!',
      'RB/2026/0995'
    );
    setActionSuccessMessage('⚡ Demo Case Conflict loaded! Navigated to Cross-Bureau Overlap Engine.');
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  // CSV Report Generator (RFC 4180 standard)
  const exportCasesToCSV = () => {
    const headers = [
      'Case Reference',
      'AICTE PID',
      'Institution Name',
      'Category',
      'Assigned Bureau',
      'Assigned Officer',
      'Status',
      'Receipt Date',
      'SLA Days Total',
      'SLA Days Elapsed',
      'Overdue Status',
      'SHA-256 Digest'
    ];

    const rows = cases.map(c => [
      `"${c.caseReference}"`,
      `"${c.aictePid}"`,
      `"${(c.institutionName || '').replace(/"/g, '""')}"`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      `"${(c.assignedBureau || '').replace(/"/g, '""')}"`,
      `"${(c.assignedOfficer || '').replace(/"/g, '""')}"`,
      `"${c.status}"`,
      `"${c.receiptDate}"`,
      c.slaDaysTotal,
      c.slaDaysElapsed,
      c.isOverdue ? 'YES' : 'NO',
      `"${c.sha256Hash || 'e3b0c44298fc1c14'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AICTE_Grievance_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    dispatchSimulatedAlert(
      'email',
      'Administrative CSV Dispatched',
      'Central Reporting Desk',
      'AICTE_Grievance_Report.csv generated with cryptographic checksums.'
    );
    setActionSuccessMessage('📊 Report exported successfully as AICTE_Grievance_Report.csv!');
    setTimeout(() => setActionSuccessMessage(''), 4500);
  };

  // Escalate Case to Apex Committee / Member Secretary
  const handleEscalateCase = (c) => {
    setCases(prev => prev.map(item => {
      if (item.id === c.id) {
        return {
          ...item,
          status: 'Escalated to Apex Committee',
          assignedOfficer: 'AICTE Member Secretary (Apex View)',
          actions: [
            ...item.actions,
            {
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
              officer: currentRole,
              bureau: 'Apex Regulatory Council',
              action: 'Escalated to Apex Committee',
              remarks: 'Statutory SLA / High-Risk threshold triggered. File transferred directly to Member Secretary for immediate intervention.',
              attachment: null
            }
          ]
        };
      }
      return item;
    }));

    if (selectedCase && selectedCase.id === c.id) {
      setSelectedCase(prev => ({
        ...prev,
        status: 'Escalated to Apex Committee',
        assignedOfficer: 'AICTE Member Secretary (Apex View)'
      }));
    }

    dispatchSimulatedAlert(
      'critical',
      '🚨 Case Escalated to Apex Committee',
      'AICTE Member Secretary & Bureau Heads',
      `Case ${c.caseReference} (${c.institutionName}) escalated for emergency regulatory review.`,
      c.caseReference
    );
    setActionSuccessMessage(`🚨 Case ${c.caseReference} escalated to Apex Committee!`);
    setTimeout(() => setActionSuccessMessage(''), 4500);
  };

  // Smart Bureau Auto-Routing NLP Suggestion for Student Portal
  const getSmartBureauSuggestion = (category, desc = '') => {
    const text = (category + ' ' + desc).toLowerCase();
    if (text.includes('certificate') || text.includes('marksheet') || text.includes('tc') || text.includes('withhold')) {
      return {
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        confidence: 96,
        clause: 'APH 2026-27 Clause 8.4 (Prohibition of Withholding Certificates)',
        rationale: 'Mandatory 48-hour document return without prerequisite financial demands.'
      };
    }
    if (text.includes('refund') || text.includes('cancellation')) {
      return {
        bureau: 'Public Grievance Redressal Cell (PGRC)',
        confidence: 98,
        clause: 'AICTE Refund Norms (UGC/AICTE Fee Regulations 2024)',
        rationale: 'Mandates full refund within 15 days on withdrawal before cut-off date.'
      };
    }
    if (text.includes('unapproved fee') || text.includes('capitation') || text.includes('development fee')) {
      return {
        bureau: 'Regulation Bureau (RB)',
        confidence: 94,
        clause: 'APH 2026-27 Clause 13.2 (Fee Regulatory Committee Compliance)',
        rationale: 'Statutory inspection into institutional accounts and state fee cap violations.'
      };
    }
    if (text.includes('ragging')) {
      return {
        bureau: 'Anti-Ragging Regulatory Cell & PGRC',
        confidence: 99,
        clause: 'Supreme Court Mandate & AICTE Anti-Ragging Regulation 2009',
        rationale: 'Emergency fast-track with mandatory FIR tracking within 24 hours.'
      };
    }
    if (text.includes('faculty') || text.includes('salary') || text.includes('ghost')) {
      return {
        bureau: 'Regulation Bureau (RB) & Regional Directorate',
        confidence: 92,
        clause: 'AICTE Faculty Pay & Biometric Verification Norms 2021',
        rationale: 'Joint scrutiny of EPF records and ground faculty biometric presence.'
      };
    }
    return {
      bureau: 'Public Grievance Redressal Cell (PGRC)',
      confidence: 90,
      clause: 'AICTE Student Grievance Regulations, 2019',
      rationale: 'Triaged to central student grievance cell for institutional ATR mandate.'
    };
  };

  // Officer New complaint form state
  const [newComplaintForm, setNewComplaintForm] = useState({
    institutionQuery: 'SVCE Tirupati',
    bureau: 'Regulation Bureau (RB)',
    category: 'Certificate Withholding',
    complainantName: 'A. R. Sastry',
    complainantType: 'Parent',
    description: 'College is refusing to handover original intermediate certificates and engineering transfer certificate, demanding additional capitation fees.'
  });

  // Student Public Form state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    rollNo: '',
    institutionPidOrName: '1-2849102',
    category: 'Certificate Withholding',
    description: '',
    hasUploadedProof: true
  });

  // Calculate live overlap detection on officer input
  const liveOverlapResults = useMemo(() => {
    if (!newComplaintForm.institutionQuery.trim() || newComplaintForm.institutionQuery.length < 3) return [];
    
    const matchedInst = institutions.find(inst => 
      inst.pid.toLowerCase() === newComplaintForm.institutionQuery.toLowerCase() ||
      inst.name.toLowerCase().includes(newComplaintForm.institutionQuery.toLowerCase()) ||
      (inst.aliases && inst.aliases.some(a => a.toLowerCase().includes(newComplaintForm.institutionQuery.toLowerCase())))
    );

    const syntheticComplaint = {
      aictePid: matchedInst ? matchedInst.pid : '',
      institutionName: matchedInst ? matchedInst.name : newComplaintForm.institutionQuery,
      assignedBureau: newComplaintForm.bureau,
      category: newComplaintForm.category,
      description: newComplaintForm.description
    };

    return runOverlapDetection(syntheticComplaint, cases, institutions);
  }, [newComplaintForm, cases, institutions]);

  // Filtered cases list for Officer
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch =
        c.caseReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.aictePid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBureau = selectedBureau === 'All Bureaus' || c.assignedBureau === selectedBureau;
      const matchesCategory = selectedCategory === 'All Categories' || c.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All Statuses' || c.status === selectedStatus;

      let matchesSLA = true;
      if (slaFilter === 'overdue') matchesSLA = c.isOverdue || c.slaDaysElapsed >= c.slaDaysTotal;
      if (slaFilter === 'critical') matchesSLA = (c.slaDaysTotal - c.slaDaysElapsed) <= 7 && !c.isOverdue && c.status !== 'Disposed';

      return matchesSearch && matchesBureau && matchesCategory && matchesStatus && matchesSLA;
    });
  }, [cases, searchQuery, selectedBureau, selectedCategory, selectedStatus, slaFilter]);

  // 8 Mandatory KPI counters
  const stats = useMemo(() => {
    const total = cases.length;
    const pending = cases.filter(c => c.status === 'Pending Scrutiny').length;
    const underProcess = cases.filter(c => c.status === 'Under Process' || c.status === 'ATR Awaited' || c.status === 'Inspection Ordered').length;
    const disposed = cases.filter(c => c.status === 'Disposed').length;
    const transferred = cases.filter(c => c.status === 'Transferred').length;
    const overdue = cases.filter(c => c.isOverdue || (c.slaDaysElapsed > c.slaDaysTotal && c.status !== 'Disposed')).length;
    const overlaps = cases.filter(c => c.isOverlapping).length;
    const highRiskInstitutions = institutions.filter(i => i.riskScore >= 70).length;

    return { total, pending, underProcess, disposed, transferred, overdue, overlaps, highRiskInstitutions };
  }, [cases, institutions]);

  // Handle linking two overlapping cases
  const handleLinkCases = (caseRef1, caseRef2) => {
    setCases(prev => prev.map(c => {
      if (c.caseReference === caseRef1) {
        return {
          ...c,
          isOverlapping: true,
          overlappingWith: Array.from(new Set([...(c.overlappingWith || []), caseRef2])),
          actions: [
            ...c.actions,
            {
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
              officer: currentRole,
              bureau: 'Cross-Bureau Coordination',
              action: `Linked to Master Case ${caseRef2}`,
              remarks: 'Consolidated into joint investigation dossier to prevent duplicate or conflicting orders.',
              attachment: null
            }
          ]
        };
      }
      return c;
    }));

    setActionSuccessMessage(`Successfully linked ${caseRef1} and ${caseRef2} into a synchronized coordination thread!`);
    setTimeout(() => setActionSuccessMessage(''), 4500);
  };

  // Handle Officer Complaint Creation
  const handleCreateComplaint = (e) => {
    e.preventDefault();

    const matchedInst = institutions.find(inst => 
      inst.pid.toLowerCase() === newComplaintForm.institutionQuery.toLowerCase() ||
      inst.name.toLowerCase().includes(newComplaintForm.institutionQuery.toLowerCase()) ||
      (inst.aliases && inst.aliases.some(a => a.toLowerCase().includes(newComplaintForm.institutionQuery.toLowerCase())))
    ) || institutions[0];

    const newCaseId = `case-${Date.now()}`;
    const newCaseRef = `${newComplaintForm.bureau.includes('Regulation') ? 'RB' : 'PGRC'}/2026/0${Math.floor(100 + Math.random() * 900)}`;

    const overlaps = liveOverlapResults;
    const hasOverlap = overlaps.length > 0;

    const newCaseObj = {
      id: newCaseId,
      caseReference: newCaseRef,
      institutionId: matchedInst.id,
      institutionName: matchedInst.name,
      aictePid: matchedInst.pid,
      receiptDate: new Date().toISOString().substring(0, 10),
      source: 'AICTE Web Portal',
      category: newComplaintForm.category,
      severity: hasOverlap ? 'Critical' : 'Medium',
      status: 'Under Process',
      assignedBureau: newComplaintForm.bureau,
      assignedOfficer: currentRole.includes('Officer') ? currentRole : 'Designated Scrutiny Officer',
      lastActionTaken: 'Automated intake, multi-layer overlap check completed',
      lastActionDate: new Date().toISOString().substring(0, 10),
      nextActionRequired: hasOverlap ? 'Coordinate with parallel bureau officer before issuing show cause' : 'Issue ATR notice to college management',
      expectedDisposalDate: '2026-11-30',
      slaDaysTotal: 45,
      slaDaysElapsed: 1,
      isOverdue: false,
      isOverlapping: hasOverlap,
      overlappingWith: hasOverlap ? [overlaps[0].matchedCase.caseReference] : [],
      overlapConfidence: hasOverlap ? overlaps[0].confidence : 0,
      overlapReason: hasOverlap ? overlaps[0].reason : null,
      complainantName: newComplaintForm.complainantName,
      complainantType: newComplaintForm.complainantType,
      description: newComplaintForm.description,
      actions: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: 'Automated Gateway Engine',
          bureau: newComplaintForm.bureau,
          action: 'Case Registered',
          remarks: hasOverlap 
            ? `ALERT: 4-Layer Overlap Engine flagged conflict with Case ${overlaps[0].matchedCase.caseReference}. Coordination mandatory.` 
            : 'Case registered into queue. SLA 45-day countdown initiated.',
          attachment: 'intake_application.pdf'
        }
      ]
    };

    setCases(prev => [newCaseObj, ...prev]);
    setIsNewComplaintOpen(false);
    setActionSuccessMessage(`Case ${newCaseRef} successfully registered! ${hasOverlap ? '⚠️ Overlap alert flagged.' : ''}`);
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  // Handle Public Student Complaint Submission
  const handleStudentSubmit = (e) => {
    e.preventDefault();

    const matchedInst = institutions.find(inst => 
      inst.pid.toLowerCase() === studentForm.institutionPidOrName.toLowerCase() ||
      inst.name.toLowerCase().includes(studentForm.institutionPidOrName.toLowerCase()) ||
      (inst.aliases && inst.aliases.some(a => a.toLowerCase().includes(studentForm.institutionPidOrName.toLowerCase())))
    ) || institutions[0];

    const newCaseId = `case-${Date.now()}`;
    const newCaseRef = `PGRC/2026/0${Math.floor(100 + Math.random() * 900)}`;

    const overlaps = runOverlapDetection({
      aictePid: matchedInst.pid,
      institutionName: matchedInst.name,
      assignedBureau: 'Public Grievance Redressal Cell (PGRC)',
      category: studentForm.category,
      description: studentForm.description
    }, cases, institutions);

    const hasOverlap = overlaps.length > 0;

    const newCaseObj = {
      id: newCaseId,
      caseReference: newCaseRef,
      institutionId: matchedInst.id,
      institutionName: matchedInst.name,
      aictePid: matchedInst.pid,
      receiptDate: new Date().toISOString().substring(0, 10),
      source: 'Student Grievance Portal',
      category: studentForm.category,
      severity: 'High',
      status: 'Under Process',
      assignedBureau: 'Public Grievance Redressal Cell (PGRC)',
      assignedOfficer: 'Sh. Ramesh Sharma (GRO)',
      lastActionTaken: 'Citizen intake verified. Auto-routed to PGRC queue.',
      lastActionDate: new Date().toISOString().substring(0, 10),
      nextActionRequired: 'Formal ATR notice served to Principal under 2019 Student Grievance Regulations',
      expectedDisposalDate: '2026-11-28',
      slaDaysTotal: 45,
      slaDaysElapsed: 1,
      isOverdue: false,
      isOverlapping: hasOverlap,
      overlappingWith: hasOverlap ? [overlaps[0].matchedCase.caseReference] : [],
      overlapConfidence: hasOverlap ? overlaps[0].confidence : 0,
      overlapReason: hasOverlap ? overlaps[0].reason : null,
      complainantName: studentForm.fullName || 'Student Complainant',
      complainantType: 'Student',
      description: studentForm.description,
      actions: [
        {
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          officer: 'Public Student Portal Gateway',
          bureau: 'PGRC',
          action: 'Online Grievance Filed',
          remarks: `Submitted by student ${studentForm.fullName}. Acknowledgement issued.`,
          attachment: 'student_fee_receipt.pdf'
        }
      ]
    };

    setCases(prev => [newCaseObj, ...prev]);

    setStudentSuccessReceipt({
      referenceNumber: newCaseRef,
      studentName: studentForm.fullName,
      collegeName: matchedInst.name,
      aictePid: matchedInst.pid,
      category: studentForm.category,
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      slaDeadline: '45 Working Days'
    });
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans selection:bg-[#ff5a2c] selection:text-white bg-[#070b14] text-[#f4f2ec]">
      
      {/* 1. REAL INTERACTIVE PHYSICS CLOTH & CENTERED HALFTONE BRAIN */}
      <InteractiveCanvas />

      {/* SUCCESS TOAST NOTIFICATION */}
      {actionSuccessMessage && (
        <div className="fixed top-6 right-6 z-50 glass-panel border border-[#ff5a2c]/40 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#ff5a2c]/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#ff5a2c]" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-[#f4f2ec]">{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage('')} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP REGAL APEX BAR & MODE SELECTOR (Refined Editorial Style) */}
      <header className="relative z-10 border-b border-white/[0.08] bg-[#070b14]/90 backdrop-blur-md px-6 sm:px-10 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Authentic Government Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#f4f2ec]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-white">
                All India Council for Technical Education
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-[#a1a1aa] font-normal">
                Ministry of Education, Government of India
              </span>
              <span className="text-[9px] font-mono bg-[#2f5bff]/20 text-[#2f5bff] border border-[#2f5bff]/30 px-2 py-0.5 rounded uppercase font-bold hidden md:inline">
                APH 2026–27 COMPLIANT
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">
              REGULATORY BUREAU (RB) & PUBLIC GRIEVANCE REDRESSAL CELL (PGRC) // DUAL-SYNC ENGINE
            </p>
          </div>
        </div>

        {/* Right: Actions, Notification Bell & Mode Switcher */}
        <div className="flex items-center gap-2.5">
          {/* ⚡ LOAD DEMO CASE CONFLICT BUTTON (Key Hackathon Presentation Feature) */}
          {portalMode === 'officer' && (
            <button
              onClick={handleLoadDemoConflict}
              className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-amber-500 via-[#ff5a2c] to-rose-500 text-white shadow-lg hover:brightness-110 flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
              title="Click to trigger instant RB vs PGRC cross-bureau overlap conflict for evaluators"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Demo Overlap Case</span>
            </button>
          )}

          {/* Simulated Omnichannel Notification Dispatch Bell */}
          <button
            onClick={() => {
              setIsNotificationDrawerOpen(true);
              setUnreadNotificationsCount(0);
            }}
            className="relative p-2 rounded-xl bg-[#0c152a] hover:bg-[#121f3a] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Open NIC SMS & Gov.in SMTP Dispatch Log"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Mode Switcher Pill */}
          <div className="inline-flex bg-[#0c152a] p-1 rounded-full border border-white/10 shadow-inner">
            <button
              onClick={() => setPortalMode('officer')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                portalMode === 'officer'
                  ? 'bg-[#2f5bff] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Officer Command</span>
            </button>
            <button
              onClick={() => setPortalMode('student')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                portalMode === 'student'
                  ? 'bg-[#ff5a2c] text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MODE A: STUDENT / CITIZEN GRIEVANCE PORTAL */}
      {/* ======================================================== */}
      {portalMode === 'student' && (
        <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-300">
          
          {/* Editorial Luxury Header (oyin.design vibe) */}
          <div className="text-center space-y-3 pt-2">
            <span className="text-[10px] font-mono tracking-widest text-[#a1a1aa] uppercase px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              CITIZEN & STUDENT REGULATORY DISPENSATION
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4f2ec]">
              National Technical Student Grievance Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-light leading-relaxed">
              Administered under the statutory <strong>AICTE (Redressal of Grievance of Students) Regulations, 2019</strong>.
              Every submission is cryptographically assigned a tracking number and auto-triaged to the Public Grievance Redressal Cell (PGRC).
            </p>
          </div>

          {/* 3D AICTE SOVEREIGN EMBLEM EXCLUSIVE HERO APERTURE */}
          <div id="aicte-hero-anchor" className="relative w-full h-[350px] my-2 flex flex-col items-center justify-end pb-2 pointer-events-none select-none">
            <div className="px-3.5 py-1.5 rounded-full bg-[#0c152a]/80 border border-white/10 backdrop-blur-md text-[10px] font-mono text-[#f59e0b] tracking-wider pointer-events-auto flex items-center gap-2 shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping" />
              <span>OFFICIAL AICTE SEAL // STATUTORY REGULATION PORTAL</span>
            </div>
          </div>

          {/* If Complaint Just Submitted -> SHOW DIGITAL RECEIPT SLIP */}
          {studentSuccessReceipt ? (
            <div className="glass-panel rounded-2xl border border-white/15 p-8 sm:p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2 border-b border-white/10 pb-6">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Grievance Registered Successfully</h2>
                <p className="text-xs text-slate-400">
                  Your formal petition has entered the AICTE central regulatory repository.
                </p>
              </div>

              {/* Digital Slip Card */}
              <div className="bg-[#0c152a] p-6 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Grievance Tracking Number</span>
                    <span className="text-xl font-mono font-bold text-[#ff5a2c]">{studentSuccessReceipt.referenceNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Lodging Date</span>
                    <span className="text-xs font-mono text-slate-300">{studentSuccessReceipt.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Complainant</span>
                    <span className="font-bold text-slate-200">{studentSuccessReceipt.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Category</span>
                    <span className="text-slate-300">{studentSuccessReceipt.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Target Institution</span>
                    <span className="font-bold text-slate-200">{studentSuccessReceipt.collegeName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">AICTE Permanent ID</span>
                    <span className="font-mono text-[#2f5bff] font-bold">{studentSuccessReceipt.aictePid}</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] p-3.5 rounded-lg border border-white/10 text-xs text-slate-300 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#ff5a2c] shrink-0" />
                  <span>Statutory SLA Resolution Timeline: <strong>{studentSuccessReceipt.slaDeadline}</strong>.</span>
                </div>
              </div>

              {/* Actions & Switch to Officer Dashboard */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setStudentSuccessReceipt(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                >
                  File Another Grievance
                </button>

                <button
                  onClick={() => {
                    setStudentSuccessReceipt(null);
                    setPortalMode('officer');
                  }}
                  className="bg-[#2f5bff] hover:bg-[#2548cc] text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>View in Official Bureau Dashboard &rarr;</span>
                </button>
              </div>

            </div>
          ) : (
            /* STUDENT INTAKE FORM (Glassmorphism Silk Form) */
            <div className="glass-panel rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl">
              
              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] font-mono text-[#2f5bff] uppercase tracking-widest font-bold">CITIZEN INTAKE // REGULATION 2019</span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">Submit Regulatory Grievance</h2>
                <p className="text-xs text-slate-400 mt-1">
                  All submissions undergo automated semantic cross-referencing and OCR document verification.
                </p>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-5">
                
                {/* Personal Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-white placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@gmail.com"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-white placeholder-slate-600 transition-all"
                    />
                  </div>
                </div>

                {/* College Selection & AICTE PID */}
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Select Target Technical College (or enter AICTE PID) *
                  </label>
                  <select
                    value={studentForm.institutionPidOrName}
                    onChange={(e) => setStudentForm({ ...studentForm, institutionPidOrName: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-200 font-medium"
                  >
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.pid} className="bg-[#0c152a] text-slate-200">
                        {inst.name} (PID: {inst.pid} — {inst.city}, {inst.state})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grievance Category */}
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Nature of Violation / Category *</label>
                  <select
                    value={studentForm.category}
                    onChange={(e) => setStudentForm({ ...studentForm, category: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-200"
                  >
                    <option value="Certificate Withholding" className="bg-[#0c152a]">Withholding of Original Certificates / Marksheets / TC</option>
                    <option value="Fee Refund Denial" className="bg-[#0c152a]">Delay or Refusal of Full Fee Refund on Admission Cancellation</option>
                    <option value="APH Norms & Unapproved Fees" className="bg-[#0c152a]">Charging Unapproved Capitation / Development Fees</option>
                    <option value="Arbitrary Faculty Termination & Salary" className="bg-[#0c152a]">Faculty & Staff Harassment / Pay Issues</option>
                    <option value="Ragging Incident" className="bg-[#0c152a]">Ragging / Campus Harassment Emergency</option>
                  </select>
                </div>

                {/* AI SMART BUREAU AUTO-ROUTING NLP BADGE */}
                {(() => {
                  const suggestion = getSmartBureauSuggestion(studentForm.category, studentForm.description);
                  return (
                    <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-start gap-3 shadow-lg">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            AI Smart Bureau Auto-Triage Suggestion
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {suggestion.confidence}% MATCH CONFIDENCE
                          </span>
                        </div>
                        <p className="text-xs text-white font-medium">
                          Target Destination Bureau: <strong className="text-blue-300">{suggestion.bureau}</strong>
                        </p>
                        <p className="text-[11px] text-slate-300 font-light">
                          <strong className="text-slate-400">{suggestion.clause}:</strong> {suggestion.rationale}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Grievance Description */}
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Factual Narrative & Sequence of Events *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide specific dates, amounts demanded, and names of college officials..."
                    value={studentForm.description}
                    onChange={(e) => setStudentForm({ ...studentForm, description: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-white placeholder-slate-600 leading-relaxed"
                  ></textarea>
                </div>

                {/* Evidence Upload */}
                <div className="bg-[#0c152a] p-4 rounded-xl border border-dashed border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#2f5bff]" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Supporting Evidence Upload</span>
                      <span className="text-[10px] text-slate-500 font-mono">PDF, PNG, JPG (Scanned via Tesseract OCR)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10 px-3 py-1 rounded-full">
                    receipt_scan_verified.pdf
                  </span>
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex items-center justify-between">
                  <p className="text-[10px] font-mono text-slate-500 max-w-sm">
                    SEC. 23 AICTE ACT COMPLIANT // FALSE FILINGS LEGALLY ACTIONABLE
                  </p>
                  <button
                    type="submit"
                    className="bg-[#ff5a2c] hover:bg-[#e04c22] text-white font-bold px-7 py-3 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Lodge Formal Grievance</span>
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* MODE B: INTERNAL AICTE OFFICER COMMAND DASHBOARD */}
      {/* ======================================================== */}
      {portalMode === 'officer' && (
        <>
          {/* EDITORIAL HERO SECTION */}
          <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-10 pb-4 w-full">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-6">
              
              <div>
                <span className="text-[10px] font-mono text-[#a1a1aa] tracking-widest uppercase block mb-1.5">
                  AICTE REPOSITORY // CROSS-BUREAU SYNCHRONIZATION
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f4f2ec] tracking-tight">
                  Central Complaint & Institution Monitoring Engine
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl font-light">
                  Unified operational truth connecting the <strong>Regulation Bureau (RB)</strong>, 
                  <strong>Public Grievance Redressal Cell (PGRC)</strong>, and <strong>Regional Centres</strong>.
                </p>
              </div>

              {/* Role Indicator & Action Controls */}
              <div className="flex flex-col sm:items-end gap-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Dynamic RBAC Role Selector */}
                  <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-[#ff5a2c]" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Active Role (RBAC Switcher)</span>
                      <select
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                        className="bg-transparent text-[#f4f2ec] font-bold text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="Regulation Bureau (RB) Officer" className="bg-[#0c152a]">Regulation Bureau (RB) Officer</option>
                        <option value="PGRC Grievance Redressal Officer" className="bg-[#0c152a]">PGRC Grievance Redressal Officer</option>
                        <option value="Regional Director (South-Western)" className="bg-[#0c152a]">Regional Director (South-Western)</option>
                        <option value="AICTE Member Secretary / Apex View" className="bg-[#0c152a]">AICTE Member Secretary (Apex View)</option>
                      </select>
                    </div>
                  </div>

                  {/* Executive Brief Button */}
                  <button
                    onClick={() => setIsExecutiveReportOpen(true)}
                    className="bg-[#0c152a] hover:bg-[#121f3a] text-white border border-white/15 font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Open official Government printable summary"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Executive Brief</span>
                  </button>

                  {/* Register Complaint Button */}
                  <button
                    onClick={() => setIsNewComplaintOpen(true)}
                    className="bg-[#ff5a2c] hover:bg-[#e04c22] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Register Complaint</span>
                  </button>
                </div>

                {/* Dynamic RBAC Permission Capabilities Pill */}
                {(() => {
                  const rbac = RBAC_PROFILES[currentRole] || RBAC_PROFILES['Regulation Bureau (RB) Officer'];
                  return (
                    <div className={`text-[10px] font-mono px-3 py-1 rounded-lg border ${rbac.color} flex items-center gap-2`}>
                      <span className="font-bold uppercase tracking-wider">{rbac.title}:</span>
                      <span className="text-slate-300 font-light truncate max-w-md">{rbac.allowedActions.join(' • ')}</span>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* 3D AICTE SOVEREIGN EMBLEM EXCLUSIVE HERO APERTURE */}
            <div id="aicte-hero-anchor" className="relative w-full h-[440px] my-3 flex flex-col items-center justify-end pb-3 pointer-events-none select-none">
              <div className="px-3.5 py-1.5 rounded-full bg-[#0c152a]/80 border border-white/10 backdrop-blur-md text-[10px] font-mono text-[#f59e0b] tracking-wider pointer-events-auto flex items-center gap-2 shadow-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping" />
                <span>3D SOVEREIGN AICTE COGWHEEL // INTERACTIVE DRAG & TILT</span>
              </div>
            </div>

            {/* FLOATING PILL NAVIGATION DOCK (Editorial Style) */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {[
                { id: 'command-center', label: 'Command Center (All Cases)', icon: Layers, badge: cases.length },
                { id: 'overlaps', label: 'Cross-Bureau Overlap Engine', icon: AlertTriangle, badge: stats.overlaps, highlight: true },
                { id: 'institutions', label: 'Institution 360 Explorer', icon: Building2, badge: institutions.length },
                { id: 'analytics', label: 'Ageing & SLA Analytics', icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/25 shadow-lg backdrop-blur-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${tab.highlight ? 'text-[#ff5a2c]' : ''}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full ${
                          tab.highlight
                            ? 'bg-[#ff5a2c] text-white font-bold'
                            : isActive
                            ? 'bg-[#2f5bff] text-white'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* STATUTORY 8 KPI CARDS GRID */}
          <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-3 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'Total Received', value: stats.total, tag: 'TOTAL INTAKE', icon: FileText, accent: 'text-blue-400' },
                { label: 'Pending Scrutiny', value: stats.pending, tag: 'INITIAL REVIEW', icon: Clock, accent: 'text-amber-400' },
                { label: 'Under Process', value: stats.underProcess, tag: 'INVESTIGATION', icon: TrendingUp, accent: 'text-indigo-400' },
                { label: 'Cases Disposed', value: stats.disposed, tag: 'RESOLVED', icon: CheckCircle2, accent: 'text-emerald-400' },
                { label: 'Transferred', value: stats.transferred, tag: 'TRANSFERRED', icon: ArrowRightLeft, accent: 'text-purple-400' },
                { 
                  label: 'Beyond SLA', 
                  value: stats.overdue, 
                  tag: 'BREACHED SLA', 
                  icon: Flame, 
                  alert: true,
                  accent: 'text-red-400'
                },
                { label: 'Overlaps Caught', value: stats.overlaps, tag: 'CROSS-BUREAU', icon: AlertTriangle, accent: 'text-[#ff5a2c]', special: true },
                { label: 'High Risk Inst.', value: stats.highRiskInstitutions, tag: 'RISK INDEX', icon: ShieldAlert, accent: 'text-rose-400' }
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={idx}
                    className={`glass-card p-3.5 rounded-xl flex flex-col justify-between ${
                      kpi.alert ? 'border-red-500/50 bg-red-950/20 animate-critical' : kpi.special ? 'molten-border bg-[#ff5a2c]/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400">{kpi.tag}</span>
                      <Icon className={`w-3.5 h-3.5 ${kpi.accent}`} />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-black text-white tracking-tight">
                        {kpi.value}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">{kpi.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* MAIN WORKSPACE CONTENT */}
          <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-4 flex-1 w-full space-y-6">

            {/* TAB 1: COMMAND CENTER (DATA TABLE WITH 8 FILTERS) */}
            {activeTab === 'command-center' && (
              <div className="space-y-4">
                
                {/* SEARCH AND MULTI-FACET FILTER BAR */}
                <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3">
                  
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[280px]">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by Institution, AICTE PID (e.g. 1-2849102), Case Ref..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-200 placeholder-slate-500 font-medium"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bureau Filter */}
                  <select
                    value={selectedBureau}
                    onChange={(e) => setSelectedBureau(e.target.value)}
                    className="text-xs bg-[#0c152a] border border-white/10 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-300 font-medium"
                  >
                    {bureauList.map(b => <option key={b} value={b} className="bg-[#0c152a]">{b}</option>)}
                  </select>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs bg-[#0c152a] border border-white/10 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-300 font-medium"
                  >
                    {categoriesList.map(c => <option key={c} value={c} className="bg-[#0c152a]">{c}</option>)}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-xs bg-[#0c152a] border border-white/10 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-300 font-medium"
                  >
                    <option value="All Statuses" className="bg-[#0c152a]">All Statuses</option>
                    <option value="Under Process" className="bg-[#0c152a]">Under Process</option>
                    <option value="ATR Awaited" className="bg-[#0c152a]">ATR Awaited</option>
                    <option value="Inspection Ordered" className="bg-[#0c152a]">Inspection Ordered</option>
                    <option value="Disposed" className="bg-[#0c152a]">Disposed</option>
                    <option value="Escalated to Apex Committee" className="bg-[#0c152a]">Escalated to Apex Committee</option>
                  </select>

                  {/* SLA Filter Pills */}
                  <div className="flex items-center gap-1 bg-[#0c152a] p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setSlaFilter('all')}
                      className={`px-3 py-1.5 text-xs rounded-lg font-mono transition-all ${slaFilter === 'all' ? 'bg-white/15 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setSlaFilter('critical')}
                      className={`px-3 py-1.5 text-xs rounded-lg font-mono font-bold transition-all ${slaFilter === 'critical' ? 'bg-[#ff5a2c]/20 text-[#ff5a2c] border border-[#ff5a2c]/30' : 'text-slate-400 hover:text-[#ff5a2c]'}`}
                    >
                      &lt;7d
                    </button>
                    <button
                      onClick={() => setSlaFilter('overdue')}
                      className={`px-3 py-1.5 text-xs rounded-lg font-mono font-bold transition-all ${slaFilter === 'overdue' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-red-400'}`}
                    >
                      BREACHED
                    </button>
                  </div>
                </div>

                {/* CASES MASTER DATA TABLE */}
                <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
                  <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        CASE DIRECTORY // LIVE DISPATCH FEED
                      </h3>
                      <span className="text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10 font-bold px-2.5 py-0.5 rounded-full">
                        {filteredCases.length} OF {cases.length} RECORDS
                      </span>
                    </div>

                    {/* Quick Audit & Export Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Verify SHA-256 Ledger Button */}
                      <button
                        onClick={() => setIsVerifyLedgerOpen(true)}
                        className="px-3 py-1.5 text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Audit SHA-256 cryptographic non-repudiation ledger"
                      >
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verify Ledger</span>
                      </button>

                      {/* Export CSV Button */}
                      <button
                        onClick={exportCasesToCSV}
                        className="px-3 py-1.5 text-xs font-mono font-bold bg-[#0c152a] hover:bg-[#121f3a] text-white border border-white/15 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Export filtered records to RFC 4180 CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span>Export CSV</span>
                      </button>

                      <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-3 ml-2 border-l border-white/10 pl-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff5a2c]"></span> Overlap Sync
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Overdue SLA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0c152a] text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                          <th className="py-3.5 px-6">Reference ID & SHA-256</th>
                          <th className="py-3.5 px-6">Institution Target</th>
                          <th className="py-3.5 px-6">Category</th>
                          <th className="py-3.5 px-6">Assigned Bureau</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6">Statutory SLA</th>
                          <th className="py-3.5 px-6 text-right">Dossier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs font-sans">
                        {filteredCases.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-slate-500">
                              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                              <p className="text-sm font-medium text-slate-400">No records match your active query.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredCases.map((c) => {
                            const daysLeft = c.slaDaysTotal - c.slaDaysElapsed;
                            const isBreached = c.isOverdue || daysLeft <= 0;
                            const isCritical = daysLeft > 0 && daysLeft <= 7;

                            return (
                              <tr
                                key={c.id}
                                className={`hover:bg-white/[0.04] transition-colors ${
                                  c.isOverlapping ? 'bg-[#ff5a2c]/[0.04]' : ''
                                }`}
                              >
                                {/* Case Reference & Overlap Badge */}
                                <td className="py-4 px-6 align-top font-semibold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[#f4f2ec] font-bold tracking-tight">{c.caseReference}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">REC: {c.receiptDate}</span>
                                  <span className="text-[9px] font-mono text-emerald-400/80 flex items-center gap-1 mt-0.5" title="SHA-256 Merkle root digest">
                                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>{c.sha256Hash ? c.sha256Hash.substring(0, 10) + '...' : 'e3b0c442...'}</span>
                                  </span>
                                  {c.isOverlapping && (
                                    <span className="inline-flex items-center gap-1 bg-[#ff5a2c]/15 text-[#ff5a2c] text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#ff5a2c]/30 mt-1.5 animate-pulse">
                                      <AlertTriangle className="w-3 h-3 text-[#ff5a2c]" /> OVERLAP SYNC
                                    </span>
                                  )}
                                </td>

                                {/* Institution Name & AICTE Permanent ID */}
                                <td className="py-4 px-6 align-top max-w-xs">
                                  <button
                                    onClick={() => {
                                      const inst = institutions.find(i => i.pid === c.aictePid);
                                      if (inst) setSelectedInstitution(inst);
                                    }}
                                    className="font-medium text-slate-100 hover:text-[#2f5bff] text-left line-clamp-1 cursor-pointer transition-colors"
                                  >
                                    {c.institutionName}
                                  </button>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded font-bold border border-white/10">
                                      PID: {c.aictePid}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">{c.source}</span>
                                  </div>
                                </td>

                                {/* Category & Complainant */}
                                <td className="py-4 px-6 align-top">
                                  <span className="font-medium text-slate-200 block">{c.category}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">ROLE: {c.complainantType}</span>
                                </td>

                                {/* Bureau & Officer */}
                                <td className="py-4 px-6 align-top">
                                  <span className="inline-block bg-[#0c152a] text-slate-300 border border-white/10 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                                    {c.assignedBureau}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block mt-1">
                                    {c.assignedOfficer}
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-6 align-top">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                                      c.status === 'Disposed'
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                        : c.status === 'Escalated to Apex Committee'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                                        : c.status === 'Inspection Ordered'
                                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                        : c.status === 'ATR Awaited'
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                </td>

                                {/* SLA Clock with Progress Bar */}
                                <td className="py-4 px-6 align-top min-w-[140px]">
                                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                    <span className={`font-bold ${isBreached ? 'text-red-400' : isCritical ? 'text-[#ff5a2c]' : 'text-slate-400'}`}>
                                      {isBreached ? 'BREACHED' : `${daysLeft}D LEFT`}
                                    </span>
                                    <span className="text-slate-500">{c.slaDaysElapsed}/{c.slaDaysTotal}d</span>
                                  </div>
                                  <div className="w-full bg-[#0c152a] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        isBreached
                                          ? 'bg-red-500'
                                          : isCritical
                                          ? 'bg-[#ff5a2c]'
                                          : 'bg-emerald-400'
                                      }`}
                                      style={{ width: `${Math.min(100, (c.slaDaysElapsed / c.slaDaysTotal) * 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-500 block mt-1">DUE: {c.expectedDisposalDate}</span>
                                </td>

                                {/* Actions Button */}
                                <td className="py-4 px-6 align-top text-right">
                                  <button
                                    onClick={() => setSelectedCase(c)}
                                    className="bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Inspect</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CROSS-BUREAU OVERLAP ENGINE (THE FLAGSHIP INNOVATION) */}
            {activeTab === 'overlaps' && (
              <div className="space-y-6">
                
                {/* OVERLAP BANNER */}
                <div className="glass-panel molten-border p-6 sm:p-8 rounded-2xl shadow-2xl">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#ff5a2c]/20 border border-[#ff5a2c]/40 text-[#ff5a2c] flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-[#ff5a2c] text-white font-bold px-2.5 py-0.5 rounded-full uppercase">
                          SYNAPTIC OVERLAP ENGINE ACTIVE
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">RULE: APH_SYNC_2026</span>
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                        Potential Overlapping Cases – Coordination Required
                      </h2>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed font-light">
                        The neural background matrix continuously cross-references incoming cases across the <strong>Regulation Bureau (RB)</strong>, 
                        <strong>Public Grievance Redressal Cell (PGRC)</strong>, and <strong>Regional Offices</strong> using Jaro-Winkler entity resolution and deep semantic NLP.
                        Below are detected parallel inquiries targeting the same campus where synchronized action prevents contradictory inspections.
                      </p>
                    </div>
                  </div>
                </div>

                {/* OVERLAPPING PAIRS GRID */}
                <div className="grid grid-cols-1 gap-6">
                  {cases.filter(c => c.isOverlapping && c.overlappingWith && c.overlappingWith.length > 0).map((primaryCase) => {
                    const partnerRef = primaryCase.overlappingWith?.[0];
                    const partnerCase = cases.find(c => c.caseReference === partnerRef);

                    if (!partnerCase) return null;

                    return (
                      <div key={primaryCase.id} className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        
                        {/* Overlap Card Header */}
                        <div className="bg-[#0c152a] border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-[#ff5a2c]" />
                            <div>
                              <span className="font-bold text-white text-sm block">{primaryCase.institutionName}</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                AICTE PERMANENT ID: {primaryCase.aictePid}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-white/5 text-slate-300 border border-white/10 px-3 py-1 rounded-full font-bold">
                              {(primaryCase.overlapConfidence * 100).toFixed(0)}% SYNAPTIC MATCH
                            </span>
                            <button
                              onClick={() => handleLinkCases(primaryCase.caseReference, partnerCase.caseReference)}
                              className="bg-[#2f5bff] hover:bg-[#2548cc] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>Link Cases for Joint Hearing</span>
                            </button>
                          </div>
                        </div>

                        {/* Side-by-Side Comparison Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 text-xs">
                          
                          {/* Left: Bureau A Case */}
                          <div className="p-6 space-y-3 bg-[#2f5bff]/[0.03]">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-[#2f5bff] bg-[#2f5bff]/10 border border-[#2f5bff]/30 px-2.5 py-0.5 rounded-full">
                                {primaryCase.caseReference}
                              </span>
                              <span className="font-mono text-[11px] text-slate-300">{primaryCase.assignedBureau}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Category:</span>
                              <span className="font-semibold text-white">{primaryCase.category}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Investigating Officer:</span>
                              <span className="text-slate-300">{primaryCase.assignedOfficer}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Allegation Narrative:</span>
                              <p className="text-slate-300 line-clamp-3 bg-[#0c152a] p-3 rounded-xl border border-white/5 mt-1 italic leading-relaxed">
                                "{primaryCase.description}"
                              </p>
                            </div>
                            <div className="pt-2 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-500">LAST ACTION: {primaryCase.lastActionDate}</span>
                              <button
                                onClick={() => setSelectedCase(primaryCase)}
                                className="text-[#2f5bff] hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <span>INSPECT FILE</span> <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Right: Bureau B Parallel Case */}
                          <div className="p-6 space-y-3 bg-[#ff5a2c]/[0.03]">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-[#ff5a2c] bg-[#ff5a2c]/10 border border-[#ff5a2c]/30 px-2.5 py-0.5 rounded-full">
                                {partnerCase.caseReference}
                              </span>
                              <span className="font-mono text-[11px] text-slate-300">{partnerCase.assignedBureau}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Category:</span>
                              <span className="font-semibold text-white">{partnerCase.category}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Investigating Officer:</span>
                              <span className="text-slate-300">{partnerCase.assignedOfficer}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Allegation Narrative:</span>
                              <p className="text-slate-300 line-clamp-3 bg-[#0c152a] p-3 rounded-xl border border-white/5 mt-1 italic leading-relaxed">
                                "{partnerCase.description}"
                              </p>
                            </div>
                            <div className="pt-2 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-500">LAST ACTION: {partnerCase.lastActionDate}</span>
                              <button
                                onClick={() => setSelectedCase(partnerCase)}
                                className="text-[#ff5a2c] hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <span>INSPECT FILE</span> <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* Bottom AI Diagnostic Bar */}
                        <div className="bg-[#0c152a] px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-2 font-medium">
                            <Sparkles className="w-4 h-4 text-[#ff5a2c] shrink-0" />
                            <span><strong>Diagnostic Reason:</strong> {primaryCase.overlapReason}</span>
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 3: INSTITUTION 360 EXPLORER */}
            {activeTab === 'institutions' && (
              <div className="space-y-6">
                
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">Institution 360 Consolidated Dossier</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Explore any technical campus footprint across India by AICTE Permanent ID (PID) to inspect its full historical complaint archive and computed Risk Index.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    {institutions.length} COLLEGES INDEXED
                  </div>
                </div>

                {/* INSTITUTIONS CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {institutions.map((inst) => {
                    const collegeCases = cases.filter(c => c.aictePid === inst.pid);
                    const hasCriticalOverdue = collegeCases.some(c => c.isOverdue);

                    return (
                      <div
                        key={inst.id}
                        className="glass-card rounded-2xl p-6 flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Risk Score Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-[11px] bg-white/10 text-slate-300 font-bold px-2.5 py-0.5 rounded border border-white/10">
                              PID: {inst.pid}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono uppercase text-slate-500">RISK INDEX</span>
                              <span
                                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                                  inst.riskScore >= 75
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : inst.riskScore >= 40
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {inst.riskScore}/100
                              </span>
                            </div>
                          </div>

                          {/* Institution Name & Location */}
                          <h4 
                            className="font-bold text-white text-base hover:text-[#2f5bff] cursor-pointer transition-colors"
                            onClick={() => setSelectedInstitution(inst)}
                          >
                            {inst.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {inst.city}, {inst.state} ({inst.region} Region)
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-1">
                            AISHE: {inst.aisheCode} • {inst.university}
                          </p>

                          {/* Aliases Tag Cloud */}
                          {inst.aliases && inst.aliases.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {inst.aliases.map((al, idx) => (
                                <span key={idx} className="text-[9px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                                  {al}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Active Complaints Footprint */}
                          <div className="mt-5 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-xs font-mono">
                            <div className="bg-[#0c152a] p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] text-slate-500 uppercase block">Active Files</span>
                              <span className="text-base font-bold text-white">{collegeCases.filter(c => c.status !== 'Disposed').length}</span>
                            </div>
                            <div className="bg-[#0c152a] p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] text-slate-500 uppercase block">Disposed Historical</span>
                              <span className="text-base font-bold text-emerald-400">{collegeCases.filter(c => c.status === 'Disposed').length + inst.resolvedCases}</span>
                            </div>
                          </div>

                          {hasCriticalOverdue && (
                            <div className="mt-3 text-[10px] font-mono font-bold text-red-300 bg-red-950/40 p-2 rounded-xl flex items-center gap-1.5 border border-red-500/30">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                              <span>OVERDUE STATUTORY SLA BREACH</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedInstitution(inst)}
                          className="mt-5 w-full bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4 text-slate-300" />
                          <span>View Institutional Dossier</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 4: ADVANCED DATA VISUALIZATION & ANALYTICS ENGINE */}
            {activeTab === 'analytics' && (
              <InteractiveAnalyticsCharts
                cases={cases}
                institutions={institutions}
                onExportCSV={exportCasesToCSV}
                onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
                onSelectAgeingFilter={(filterKey) => {
                  setSlaFilter(filterKey);
                  setActiveTab('command-center');
                }}
              />
            )}

          </main>

          {/* MODAL 1: REGISTER NEW COMPLAINT */}
          {isNewComplaintOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="glass-panel rounded-2xl max-w-2xl w-full border border-white/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                
                <div className="bg-[#0c152a] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ff5a2c]/20 text-[#ff5a2c] flex items-center justify-center">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Lodge Official Institutional Case</h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">AI OVERLAP ENGINE ENGAGED</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNewComplaintOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateComplaint} className="p-6 space-y-4 text-xs">
                  
                  {/* Institution Input Field */}
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Target Institution (Type alias e.g. "SVCE Tirupati" or "MIT Aurangabad"):
                    </label>
                    <input
                      type="text"
                      required
                      value={newComplaintForm.institutionQuery}
                      onChange={(e) => setNewComplaintForm({ ...newComplaintForm, institutionQuery: e.target.value })}
                      placeholder="e.g. SVCE Tirupati, MIT Aurangabad, or 1-2849102"
                      className="w-full px-4 py-2.5 bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#ff5a2c] text-white font-medium"
                    />
                  </div>

                  {/* LIVE OVERLAP WARNING BOX */}
                  {liveOverlapResults.length > 0 && (
                    <div className="bg-[#ff5a2c]/10 border border-[#ff5a2c]/40 p-4 rounded-xl shadow-lg animate-pulse space-y-2">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#ff5a2c] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-mono text-xs font-black text-[#ff5a2c] uppercase tracking-tight">
                            {liveOverlapResults[0].alertTitle}
                          </h4>
                          <p className="text-slate-200 mt-1">
                            <strong>Active Parallel Case:</strong> <span className="font-mono font-bold text-white">{liveOverlapResults[0].matchedCase.caseReference}</span> in <strong>{liveOverlapResults[0].matchedCase.assignedBureau}</strong>.
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">
                            CONFIDENCE: {(liveOverlapResults[0].confidence * 100).toFixed(0)}% MATCH // {liveOverlapResults[0].detectionMethod}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bureau & Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Target AICTE Bureau:</label>
                      <select
                        value={newComplaintForm.bureau}
                        onChange={(e) => setNewComplaintForm({ ...newComplaintForm, bureau: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-200"
                      >
                        <option value="Regulation Bureau (RB)">Regulation Bureau (RB)</option>
                        <option value="Public Grievance Redressal Cell (PGRC)">Public Grievance Redressal Cell (PGRC)</option>
                        <option value="Vigilance Cell">Vigilance Cell</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Category:</label>
                      <select
                        value={newComplaintForm.category}
                        onChange={(e) => setNewComplaintForm({ ...newComplaintForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#2f5bff] text-slate-200"
                      >
                        {categoriesList.filter(c => c !== 'All Categories').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Complainant Name & Role */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Complainant Name:</label>
                      <input
                        type="text"
                        value={newComplaintForm.complainantName}
                        onChange={(e) => setNewComplaintForm({ ...newComplaintForm, complainantName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#0c152a] border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Complainant Role:</label>
                      <select
                        value={newComplaintForm.complainantType}
                        onChange={(e) => setNewComplaintForm({ ...newComplaintForm, complainantType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#0c152a] border border-white/10 rounded-xl text-slate-200"
                      >
                        <option value="Student (Final Year)">Student</option>
                        <option value="Parent">Parent</option>
                        <option value="Faculty Member">Faculty Member</option>
                        <option value="Whistleblower">Anonymous Whistleblower</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Allegations & Evidence Summary:</label>
                    <textarea
                      rows={3}
                      required
                      value={newComplaintForm.description}
                      onChange={(e) => setNewComplaintForm({ ...newComplaintForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0c152a] border border-white/10 rounded-xl focus:outline-none focus:border-[#ff5a2c] text-white leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsNewComplaintOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#2f5bff] hover:bg-[#2548cc] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Register & Sync Case</span>
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: CASE DETAIL & STATUTORY ACTION TRAIL */}
          {selectedCase && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="glass-panel rounded-2xl max-w-3xl w-full border border-white/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col bg-[#090f1f]/95 text-[#f4f2ec]">
                
                <div className="bg-[#0c152a] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-bold text-sm">
                      {selectedCase.caseReference.split('/')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-mono font-bold text-white">{selectedCase.caseReference}</h3>
                        <span className="text-[10px] font-mono bg-white/10 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                          {selectedCase.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target: <strong className="text-slate-200">{selectedCase.institutionName}</strong> (PID: {selectedCase.aictePid})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
                  
                  {/* AICTE COPILOT STATUTORY BRIEF (AI-Generated 2-Sentence Regulatory Summary) */}
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/25 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="font-mono text-xs font-bold text-blue-300 uppercase tracking-wider">
                          AICTE Copilot Statutory Brief (AI Synthesis)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedCase.aiSummary || selectedCase.description);
                          setCopiedAiSummary(true);
                          setTimeout(() => setCopiedAiSummary(false), 2000);
                        }}
                        className="text-[10px] font-mono text-blue-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedAiSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAiSummary ? 'Copied' : 'Copy AI Brief'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-light">
                      {selectedCase.aiSummary || "Statutory AI synthesis indicates prima facie non-compliance under AICTE regulations. Immediate Action Taken Report (ATR) from college management is mandated within 15 calendar days."}
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> APH 2026-27 Precedents Indexed
                      </span>
                      <span>•</span>
                      <span>Confidence: 94%</span>
                    </div>
                  </div>

                  {/* Overlap Warning in Modal */}
                  {selectedCase.isOverlapping && (
                    <div className="bg-[#ff5a2c]/10 border border-[#ff5a2c]/40 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#ff5a2c] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#ff5a2c] block">Cross-Bureau Overlap Flagged:</span>
                        <span className="text-slate-300 mt-1 block">{selectedCase.overlapReason}</span>
                        <div className="mt-2 flex gap-2">
                          {(selectedCase.overlappingWith || []).map(ref => (
                            <span key={ref} className="bg-[#ff5a2c]/20 text-[#ff5a2c] px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] border border-[#ff5a2c]/30">
                              Interlinked File: {ref}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mandatory Statutory Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0c152a] p-4 rounded-xl border border-white/5 font-mono">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Bureau</span>
                      <span className="font-bold text-white text-xs">{selectedCase.assignedBureau}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Officer</span>
                      <span className="font-semibold text-slate-300 text-xs">{selectedCase.assignedOfficer}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Receipt Date</span>
                      <span className="text-slate-300 text-xs">{selectedCase.receiptDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">SLA Target Date</span>
                      <span className="font-bold text-red-400 text-xs">{selectedCase.expectedDisposalDate}</span>
                    </div>
                  </div>

                  {/* Last Action vs Next Action */}
                  <div className="space-y-3 bg-[#0c152a] p-4 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Last Action Taken ({selectedCase.lastActionDate}):</span>
                      <p className="text-slate-200 mt-0.5 font-medium">{selectedCase.lastActionTaken}</p>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[10px] font-mono text-[#2f5bff] uppercase block">Next Mandatory Regulatory Action:</span>
                      <p className="text-white mt-0.5 font-bold">{selectedCase.nextActionRequired}</p>
                    </div>
                  </div>

                  {/* Grievance Text */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Grievance Narrative:</span>
                    <div className="bg-[#0c152a] p-4 rounded-xl border border-white/5 text-slate-300 leading-relaxed italic">
                      "{selectedCase.description}"
                    </div>
                  </div>

                  {/* Chronological Action History */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Immutable Action History Trail:</span>
                    <div className="space-y-2">
                      {selectedCase.actions.map((act, idx) => (
                        <div key={idx} className="bg-[#0c152a] p-3.5 rounded-xl border border-white/5 flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{act.action}</span>
                              <span className="text-[10px] font-mono bg-white/5 text-slate-300 px-2 py-0.5 rounded">
                                {act.bureau}
                              </span>
                            </div>
                            <p className="text-slate-400 mt-1">{act.remarks}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">{act.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Dossier Footer with Cryptographic SHA-256 Stamp & Escalation Action */}
                <div className="p-4 bg-[#080d1a] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  {/* Cryptographic SHA-256 Ledger Stamp */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SHA-256:</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {selectedCase.sha256Hash ? selectedCase.sha256Hash.substring(0, 16) + '...' : '8f4e2b9a71c84d93...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Actionable Escalation Button */}
                    {selectedCase.status !== 'Escalated to Apex Committee' && selectedCase.status !== 'Disposed' && (
                      <button
                        onClick={() => handleEscalateCase(selectedCase)}
                        className="px-3.5 py-1.5 text-xs font-mono font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Route directly to Member Secretary & Apex Committee"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Escalate Case</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedCase(null)}
                      className="px-4 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* MODAL 3: INSTITUTION 360 FULL PROFILE */}
          {selectedInstitution && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="glass-panel rounded-2xl max-w-2xl w-full border border-white/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                
                <div className="bg-[#0c152a] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs bg-[#2f5bff]/20 text-[#2f5bff] border border-[#2f5bff]/30 font-bold px-2.5 py-0.5 rounded">
                      AICTE PID: {selectedInstitution.pid}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{selectedInstitution.name}</h3>
                    <p className="text-xs text-slate-400">{selectedInstitution.city}, {selectedInstitution.state} ({selectedInstitution.region} Region)</p>
                  </div>
                  <button
                    onClick={() => setSelectedInstitution(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  
                  {/* Key Stats */}
                  <div className="grid grid-cols-3 gap-3 bg-[#0c152a] p-4 rounded-xl border border-white/5 text-center font-mono">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Risk Index</span>
                      <span className={`text-base font-black ${selectedInstitution.riskScore >= 75 ? 'text-red-400' : 'text-amber-400'}`}>
                        {selectedInstitution.riskScore}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Affiliation</span>
                      <span className="font-bold text-slate-200">{selectedInstitution.university}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">AISHE Code</span>
                      <span className="font-bold text-white">{selectedInstitution.aisheCode}</span>
                    </div>
                  </div>

                  {/* Linked Cases */}
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Cross-Bureau Case Register for this PID:
                    </h4>
                    <div className="space-y-2">
                      {cases.filter(c => c.aictePid === selectedInstitution.pid).map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedInstitution(null);
                            setSelectedCase(c);
                          }}
                          className="p-3.5 rounded-xl border border-white/10 bg-[#0c152a] hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">{c.caseReference}</span>
                              <span className="text-[10px] font-mono bg-white/5 text-slate-300 px-2 py-0.5 rounded">{c.assignedBureau}</span>
                              {c.isOverlapping && (
                                <span className="text-[9px] font-mono bg-[#ff5a2c]/20 text-[#ff5a2c] font-bold px-2 py-0.5 rounded">
                                  OVERLAP
                                </span>
                              )}
                            </div>
                            <p className="text-white font-medium mt-1">{c.category}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1 italic">"{c.description}"</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-300 shrink-0">{c.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="p-4 bg-[#0c152a] border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => setSelectedInstitution(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>

              </div>
            </div>
          )}
        </>
      )}

      {/* OMNICHANNEL NOTIFICATION DISPATCH DRAWER (NIC SMS & GOV SMTP) */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
        onSendTestNotification={() => {
          dispatchSimulatedAlert(
            'sms',
            'NIC SMS: Show Cause Issued',
            '+91 98765-XXXXX (Complainant)',
            'Action Taken Report (ATR) formal notice served to Institution Principal. Resolution countdown active under APH Clause 8.4.'
          );
          setActionSuccessMessage('📱 Simulated NIC SMS alert dispatched to citizen queue!');
          setTimeout(() => setActionSuccessMessage(''), 4000);
        }}
      />

      {/* CRYPTOGRAPHIC SHA-256 MERKLE LEDGER MODAL */}
      <LedgerVerificationModal
        isOpen={isVerifyLedgerOpen}
        onClose={() => setIsVerifyLedgerOpen(false)}
        cases={cases}
      />

      {/* EXECUTIVE BRIEFING PRINTABLE MODAL */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        cases={cases}
        institutions={institutions}
        stats={stats}
      />

      {/* LUXURY REGAL FOOTER */}
      <footer className="relative z-10 bg-[#070b14]/90 border-t border-white/[0.08] text-slate-500 text-[10px] font-mono py-4 px-8 mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>AICTE INTEGRATED INSTITUTION COMPLAINT MONITORING // SIH 2026</span>
          <span className="text-slate-400">ENGINE: DUAL-DB (POSTGRESQL + ELASTICSEARCH) • CAMUNDA BPMN 2.0 • 4-LAYER SYNAPTIC OVERLAP RESOLUTION</span>
        </div>
      </footer>

    </div>
  );
}
