import { LayoutDashboard, ClipboardList, BookOpen, Sparkles, FolderArchive, PlayCircle, TrendingUp, CreditCard } from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, blurb: "Overview, streak and quick stats" },
  { id: "mocks", label: "Mocks & Sectionals", icon: ClipboardList, blurb: "Full-length IPMAT Indore, Rohtak and JIPMAT tests" },
  { id: "topics", label: "Topic Tests", icon: BookOpen, blurb: "Quant, VARC and LR practice by topic and level" },
  { id: "ai", label: "AI Practice", icon: Sparkles, blurb: "Generate fresh questions and get step-by-step feedback", badge: "New" },
  { id: "pyps", label: "PYPs & Syllabus", icon: FolderArchive, blurb: "Past year papers and the exam syllabus" },
  { id: "videos", label: "Video Lectures", icon: PlayCircle, blurb: "Concept videos with progress tracking" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, blurb: "Error log and performance trends" },
  { id: "pricing", label: "Pricing / Plans", icon: CreditCard, blurb: "Choose the plan that fits your prep" },
];
