"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Wallet,
  QrCode,
  Zap,
  Trophy,
  Star,
  Users,
  Crown,
  Award,
  CheckCircle,
  Clock,
  XCircle,
  Heart,
  DollarSign,
  BarChart3,
  Plus,
  Copy,
  ExternalLink,
  Vote,
  Target,
  Flame,
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { ConnectButton, useCurrentAccount, useCurrentWallet, useSuiClientQuery } from "@mysten/dapp-kit"

// Types
interface Team {
  id: string
  name: string
  projectName: string
  description: string
  category: string
  walletAddress: string
  prototypeUrl: string
  slidesUrl: string
  image: string
  votes: number
  totalGrants: number
  grantCount: number
  registeredAt: string
}

interface Grant {
  id: string
  teamId: string
  amount: number
  judgeId: string
  judgeName: string
  timestamp: string
  status: "pending" | "success" | "failed"
  message?: string
}

interface VoteType {
  id: string
  teamId: string
  voterAddress: string
  timestamp: string
}

type ViewMode = "teams" | "register" | "judge" | "leaderboard" | "analytics"

const categories = [
  "AI/ML",
  "Blockchain",
  "Web3",
  "Mobile",
  "IoT",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Gaming",
  "Other",
]

export default function HackathonGrantsPlatform() {
  // State Management
  const [currentView, setCurrentView] = useState<ViewMode>("teams")
  const [teams, setTeams] = useState<Team[]>([])
  const [grants, setGrants] = useState<Grant[]>([])
  const [votes, setVotes] = useState<VoteType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  /* const [isWalletConnected, setIsWalletConnected] = useState(false) */
  const [walletAddress, setWalletAddress] = useState("")
  const [userRole, setUserRole] = useState<"judge" | "audience">("audience")
  const [hasVoted, setHasVoted] = useState(false)

  // Modal States
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)

  // Form States
  const [grantAmount, setGrantAmount] = useState("")
  const [grantMessage, setGrantMessage] = useState("")
  const [currentGrant, setCurrentGrant] = useState<Grant | null>(null)

  //Slush wallet connect 
  const account = useCurrentAccount();

  const isWalletConnected = !!account;

  //SUIGraphQl balance connection
  const { data, isLoading, error } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address ?? "",
      coinType: "0x2::sui::SUI", // SUI coin type
    },
    {
      enabled: !!account?.address,
    }
  );

  function walletBalance(p0?: (prev: any) => number){

  if (!account) return <div>Connect your wallet</div>;
  if (isLoading) return <div>Loading balance...</div>;
  if (error) return <div>Error loading balance</div>;

  return (
    <>
      SUI Balance: {data?.totalBalance ?? 0}
    </>
  );
  }

  // Registration Form
  const [registerForm, setRegisterForm] = useState({
    teamName: "",
    projectName: "",
    description: "",
    category: "",
    walletAddress: "",
    prototypeUrl: "",
    slidesUrl: "",
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTeams = localStorage.getItem("hackathon-teams")
    const savedGrants = localStorage.getItem("hackathon-grants")
    const savedVotes = localStorage.getItem("hackathon-votes")
    const savedWallet = localStorage.getItem("hackathon-wallet")
    const savedRole = localStorage.getItem("hackathon-role")
    const savedHasVoted = localStorage.getItem("hackathon-has-voted")

    if (savedTeams) setTeams(JSON.parse(savedTeams))
    if (savedGrants) setGrants(JSON.parse(savedGrants))
    if (savedVotes) setVotes(JSON.parse(savedVotes))
    if (savedWallet) {
      setWalletAddress(savedWallet)

    }
    if (savedRole) setUserRole(savedRole as "judge" | "audience")
    if (savedHasVoted) setHasVoted(JSON.parse(savedHasVoted))
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("hackathon-teams", JSON.stringify(teams))
  }, [teams])

  useEffect(() => {
    localStorage.setItem("hackathon-grants", JSON.stringify(grants))
  }, [grants])

  useEffect(() => {
    localStorage.setItem("hackathon-votes", JSON.stringify(votes))
  }, [votes])

  // Filtered teams
  const filteredTeams = teams.filter(
    (team) =>
      (selectedCategory === "All" || team.category === selectedCategory) &&
      (team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Sorted teams for leaderboard
  const leaderboardTeams = [...teams].sort((a, b) => {
    const aScore = a.votes * 10 + a.totalGrants
    const bScore = b.votes * 10 + b.totalGrants
    return bScore - aScore
  })

  // Connect Wallet
  
  // Register Team
  const registerTeam = () => {
    if (!registerForm.teamName || !registerForm.projectName || !registerForm.walletAddress) return

    const newTeam: Team = {
      id: Date.now().toString(),
      name: registerForm.teamName,
      projectName: registerForm.projectName,
      description: registerForm.description,
      category: registerForm.category,
      walletAddress: registerForm.walletAddress,
      prototypeUrl: registerForm.prototypeUrl,
      slidesUrl: registerForm.slidesUrl,
      image: "/placeholder.svg?height=100&width=100",
      votes: 0,
      totalGrants: 0,
      grantCount: 0,
      registeredAt: new Date().toISOString(),
    }

    setTeams((prev) => [...prev, newTeam])
    setShowRegisterModal(false)
    setRegisterForm({
      teamName: "",
      projectName: "",
      description: "",
      category: "",
      walletAddress: "",
      prototypeUrl: "",
      slidesUrl: "",
    })
  }

  // Send Grant
  const sendGrant = async (amount: number, message = "") => {
    if (!selectedTeam || !isWalletConnected || userRole !== "judge") return

    const grant: Grant = {
      id: Date.now().toString(),
      teamId: selectedTeam.id,
      amount: amount,
      judgeId: walletAddress,
      judgeName: `Judge ${walletAddress.slice(-4)}`,
      timestamp: new Date().toISOString(),
      status: "pending",
      message: message,
    }

    setCurrentGrant(grant)
    setGrants((prev) => [grant, ...prev])

    // Simulate transaction processing
    setTimeout(() => {
      const success = Math.random() > 0.05 // 95% success rate
      const updatedGrant = {
        ...grant,
        status: success ? ("success" as const) : ("failed" as const),
      }

      setCurrentGrant(updatedGrant)
      setGrants((prev) => prev.map((g) => (g.id === grant.id ? updatedGrant : g)))

      if (success) {
        walletBalance((prev) => prev - amount)
        setTeams((prev) =>
          prev.map((team) =>
            team.id === selectedTeam.id
              ? {
                  ...team,
                  totalGrants: team.totalGrants + amount,
                  grantCount: team.grantCount + 1,
                }
              : team,
          ),
        )

        setTimeout(() => {
          setShowGrantModal(false)
          setGrantAmount("")
          setGrantMessage("")
          setCurrentGrant(null)
        }, 2000)
      }
    }, 2000)
  }

  // Vote for Team
  const voteForTeam = (teamId: string) => {
    if (!isWalletConnected || hasVoted) return

    const vote: VoteType = {
      id: Date.now().toString(),
      teamId: teamId,
      voterAddress: walletAddress,
      timestamp: new Date().toISOString(),
    }

    setVotes((prev) => [...prev, vote])
    setTeams((prev) => prev.map((team) => (team.id === teamId ? { ...team, votes: team.votes + 1 } : team)))
    setHasVoted(true)
    localStorage.setItem("hackathon-has-voted", "true")
    setShowVoteModal(false)
  }

  // Set Role
  const setRole = (role: "judge" | "audience") => {
    setUserRole(role)
    localStorage.setItem("hackathon-role", role)
  }

  const getQRCodeURL = (team: Team) => {
    return team.prototypeUrl || `${window.location.origin}/team/${team.id}`
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-orange-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-pink-400/50 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 right-10 w-2 h-2 bg-orange-400/70 rounded-full animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Zap className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                  HackGrants
                </h1>
                <p className="text-xs text-gray-400">Live Micro-Grants Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewMode)}>
                <TabsList className="bg-gray-800 border border-gray-700">
                  <TabsTrigger value="teams" className="data-[state=active]:bg-pink-500 data-[state=active]:text-black">
                    <Users className="w-4 h-4 mr-2" />
                    Teams
                  </TabsTrigger>
                  <TabsTrigger
                    value="leaderboard"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-black"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="judge" className="data-[state=active]:bg-pink-500 data-[state=active]:text-black">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Judge Panel
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-black"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <ConnectButton className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-black font-bold px-6 py-2 rounded-full shadow" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Selection */}
        {isWalletConnected && (
          <div className="mb-8 text-center">
            <p className="text-gray-400 mb-4">Select your role:</p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => setRole("audience")}
                variant={userRole === "audience" ? "default" : "outline"}
                className={
                  userRole === "audience" ? "bg-pink-500 text-black" : "border-gray-600 text-gray-300 hover:bg-gray-800"
                }
              >
                <Heart className="w-4 h-4 mr-2" />
                Audience (Vote)
              </Button>
              <Button
                onClick={() => setRole("judge")}
                variant={userRole === "judge" ? "default" : "outline"}
                className={
                  userRole === "judge" ? "bg-orange-500 text-black" : "border-gray-600 text-gray-300 hover:bg-gray-800"
                }
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Judge (Grant)
              </Button>
            </div>
          </div>
        )}

        {/* Teams View */}
        {currentView === "teams" && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Hackathon Teams
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                {userRole === "judge" ? "Grant micro-funds to promising teams! 💰" : "Vote for your favorite team! 🗳️"}
              </p>

              <Button
                onClick={() => setShowRegisterModal(true)}
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-black font-bold text-lg px-8 py-4 rounded-full"
              >
                <Plus className="w-5 h-5 mr-2" />
                Register Your Team
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search teams or projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 w-full bg-gray-900 border-gray-700 focus:border-pink-500 text-white placeholder-gray-400 rounded-full"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {["All", ...categories].map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full ${
                      selectedCategory === category
                        ? "bg-pink-500 text-black"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Teams</p>
                      <p className="text-3xl font-bold text-white">{teams.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-pink-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Votes</p>
                      <p className="text-3xl font-bold text-white">{votes.length}</p>
                    </div>
                    <Vote className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Grants Given</p>
                      <p className="text-3xl font-bold text-white">
                        ${grants.filter((g) => g.status === "success").reduce((sum, g) => sum + g.amount, 0)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Projects</p>
                      <p className="text-3xl font-bold text-white">{teams.filter((t) => t.prototypeUrl).length}</p>
                    </div>
                    <Target className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team, index) => (
                <Card
                  key={team.id}
                  className="bg-gray-900 border-gray-800 hover:border-pink-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">{team.category}</Badge>
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-400">{team.votes}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16 ring-2 ring-pink-500/30">
                        <AvatarImage src={team.image || "/placeholder.svg"} alt={team.name} />
                        <AvatarFallback className="bg-gradient-to-r from-pink-500 to-orange-500 text-black text-lg font-bold">
                          {team.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white">{team.name}</CardTitle>
                        <p className="text-sm text-pink-400 font-medium">{team.projectName}</p>
                        <p className="text-xs text-gray-400 mt-1">{team.description.slice(0, 80)}...</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-green-400">${team.totalGrants}</p>
                        <p className="text-xs text-gray-400">{team.grantCount} grants</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-400">#{index + 1}</p>
                        <p className="text-xs text-gray-400">Rank</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {userRole === "judge" ? (
                        <Button
                          onClick={() => {
                            setSelectedTeam(team)
                            setShowGrantModal(true)
                          }}
                          disabled={!isWalletConnected}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black font-bold"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Grant
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedTeam(team)
                            setShowVoteModal(true)
                          }}
                          disabled={!isWalletConnected || hasVoted}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-black font-bold"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          {hasVoted ? "Voted" : "Vote"}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTeam(team)
                          setShowQRModal(true)
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>

                      {team.prototypeUrl && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(team.prototypeUrl, "_blank")}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTeams.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No teams found</h3>
                <p className="text-gray-400">Try adjusting your search or category filter</p>
              </div>
            )}
          </>
        )}

        {/* Leaderboard View */}
        {currentView === "leaderboard" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent mb-4">
                🏆 Live Leaderboard
              </h2>
              <p className="text-xl text-gray-300">Real-time rankings based on votes and grants</p>
            </div>

            <div className="space-y-4">
              {leaderboardTeams.map((team, index) => {
                const score = team.votes * 10 + team.totalGrants
                const getRankIcon = (rank: number) => {
                  switch (rank) {
                    case 0:
                      return <Crown className="w-8 h-8 text-yellow-400" />
                    case 1:
                      return <Award className="w-8 h-8 text-gray-400" />
                    case 2:
                      return <Trophy className="w-8 h-8 text-amber-600" />
                    default:
                      return <Star className="w-8 h-8 text-blue-400" />
                  }
                }

                return (
                  <Card
                    key={team.id}
                    className={`bg-gray-900 border-gray-800 ${
                      index < 3 ? "ring-2 ring-pink-500/30" : ""
                    } transition-all duration-300`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(index)}
                          <span className="text-2xl font-bold text-white">#{index + 1}</span>
                        </div>

                        <Avatar className="w-16 h-16">
                          <AvatarImage src={team.image || "/placeholder.svg"} alt={team.name} />
                          <AvatarFallback className="bg-gradient-to-r from-pink-500 to-orange-500 text-black text-lg font-bold">
                            {team.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{team.name}</h3>
                          <p className="text-pink-400 font-medium">{team.projectName}</p>
                          <Badge className="mt-1 bg-gray-800 text-gray-300">{team.category}</Badge>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-pink-400">{team.votes}</p>
                              <p className="text-xs text-gray-400">Votes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-400">${team.totalGrants}</p>
                              <p className="text-xs text-gray-400">Grants</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-orange-400">{score}</p>
                              <p className="text-xs text-gray-400">Score</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Judge Panel */}
        {currentView === "judge" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                💰 Judge Control Panel
              </h2>
              <p className="text-xl text-gray-300 mb-6">Grant micro-funds to promising teams</p>

              <Card className="bg-gray-900 border-gray-800 max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Available Balance</p>
                    <p className="text-4xl font-bold text-green-400">${walletBalance()}</p>
                    <p className="text-gray-400 text-sm">Ready to grant</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Grant Section */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Quick Grants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.slice(0, 6).map((team) => (
                    <Card
                      key={team.id}
                      className="bg-gray-800 border-gray-700 hover:border-green-500/50 cursor-pointer transition-all duration-300"
                      onClick={() => {
                        setSelectedTeam(team)
                        setShowGrantModal(true)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={team.image || "/placeholder.svg"} alt={team.name} />
                            <AvatarFallback className="bg-green-500 text-black text-sm font-bold">
                              {team.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-white font-medium">{team.name}</p>
                            <p className="text-gray-400 text-sm">{team.projectName}</p>
                            <p className="text-green-400 text-sm">${team.totalGrants} granted</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grant History */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Grant History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grants.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No grants sent yet</p>
                ) : (
                  <div className="space-y-4">
                    {grants.slice(0, 10).map((grant) => {
                      const team = teams.find((t) => t.id === grant.teamId)
                      return (
                        <div key={grant.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                grant.status === "success"
                                  ? "bg-green-400"
                                  : grant.status === "pending"
                                    ? "bg-yellow-400 animate-pulse"
                                    : "bg-red-400"
                              }`}
                            ></div>
                            <div>
                              <p className="text-white font-medium">
                                ${grant.amount} → {team?.name}
                              </p>
                              <p className="text-gray-400 text-sm">{new Date(grant.timestamp).toLocaleString()}</p>
                              {grant.message && <p className="text-gray-300 text-sm">"{grant.message}"</p>}
                            </div>
                          </div>
                          <Badge
                            className={`${
                              grant.status === "success"
                                ? "bg-green-500/20 text-green-400"
                                : grant.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {grant.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics View */}
        {currentView === "analytics" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                📊 Live Analytics
              </h2>
              <p className="text-xl text-gray-300">Real-time hackathon insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{teams.length}</p>
                    <p className="text-gray-400 text-sm">Registered Teams</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{votes.length}</p>
                    <p className="text-gray-400 text-sm">Community Votes</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      ${grants.filter((g) => g.status === "success").reduce((sum, g) => sum + g.amount, 0)}
                    </p>
                    <p className="text-gray-400 text-sm">Total Granted</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{teams.filter((t) => t.prototypeUrl).length}</p>
                    <p className="text-gray-400 text-sm">Live Prototypes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-purple-400">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const categoryTeams = teams.filter((t) => t.category === category)
                    const percentage = teams.length > 0 ? (categoryTeams.length / teams.length) * 100 : 0
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-gray-300">{category}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-orange-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-400 text-sm w-12">{categoryTeams.length}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Team Registration Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-pink-400 text-2xl">Register Your Team</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Team Name *</label>
                <Input
                  placeholder="Awesome Team"
                  value={registerForm.teamName}
                  onChange={(e) => setRegisterForm({ ...registerForm, teamName: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Project Name *</label>
                <Input
                  placeholder="Revolutionary App"
                  value={registerForm.projectName}
                  onChange={(e) => setRegisterForm({ ...registerForm, projectName: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Category *</label>
              <Select
                value={registerForm.category}
                onValueChange={(value) => setRegisterForm({ ...registerForm, category: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-white">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Project Description *</label>
              <Textarea
                placeholder="Describe your amazing project..."
                value={registerForm.description}
                onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Wallet Address *</label>
              <Input
                placeholder="0x..."
                value={registerForm.walletAddress}
                onChange={(e) => setRegisterForm({ ...registerForm, walletAddress: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Prototype URL</label>
                <Input
                  placeholder="https://your-prototype.com"
                  value={registerForm.prototypeUrl}
                  onChange={(e) => setRegisterForm({ ...registerForm, prototypeUrl: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Slides URL</label>
                <Input
                  placeholder="https://your-slides.com"
                  value={registerForm.slidesUrl}
                  onChange={(e) => setRegisterForm({ ...registerForm, slidesUrl: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <Button
              onClick={registerTeam}
              disabled={!registerForm.teamName || !registerForm.projectName || !registerForm.walletAddress}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-black font-bold py-4"
            >
              <Plus className="w-5 h-5 mr-2" />
              Register Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grant Modal */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3 text-green-400">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedTeam?.image || "/placeholder.svg"} alt={selectedTeam?.name} />
                <AvatarFallback className="bg-green-500 text-black">
                  {selectedTeam?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span>Grant to {selectedTeam?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {currentGrant ? (
              <div className="text-center py-6">
                {currentGrant.status === "pending" && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                      <DollarSign className="w-8 h-8 text-green-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Processing Grant...</h3>
                      <p className="text-gray-400">Sending ${currentGrant.amount} to the team</p>
                    </div>
                  </div>
                )}

                {currentGrant.status === "success" && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Grant Sent Successfully! 🎉</h3>
                      <p className="text-gray-400">
                        ${currentGrant.amount} has been granted to {selectedTeam?.name}
                      </p>
                    </div>
                  </div>
                )}

                {currentGrant.status === "failed" && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Grant Failed</h3>
                      <p className="text-gray-400">Please try again or check your connection</p>
                    </div>
                    <Button
                      onClick={() => setCurrentGrant(null)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black font-bold"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Grant Amount (SUI)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    className="text-lg text-center bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Message (Optional)</label>
                  <Textarea
                    placeholder="Great work! Keep it up..."
                    value={grantMessage}
                    onChange={(e) => setGrantMessage(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    rows={2}
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-400">To:</span>
                    <span className="font-mono text-green-400">
                      {selectedTeam?.walletAddress.slice(0, 8)}...{selectedTeam?.walletAddress.slice(-6)}
                    </span>
                  </div>

                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => setGrantAmount(amount.toString())}
                      variant="outline"
                      className="border-gray-600 text-gray-300 bg-gray-900 hover:bg-green-500 hover:text-black transition-colors duration-200"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => sendGrant(Number.parseFloat(grantAmount), grantMessage)}
                  disabled={!grantAmount || !isWalletConnected}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black font-bold py-4"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Send Grant
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vote Modal */}
      <Dialog open={showVoteModal} onOpenChange={setShowVoteModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-pink-400">Vote for {selectedTeam?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-center">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={selectedTeam?.image || "/placeholder.svg"} alt={selectedTeam?.name} />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-orange-500 text-black text-2xl font-bold">
                {selectedTeam?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="text-xl font-bold text-white">{selectedTeam?.projectName}</h3>
              <p className="text-gray-400 mt-2">{selectedTeam?.description}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-300 text-sm">
                You can only vote once! Make sure this is the team you want to support.
              </p>
            </div>

            <Button
              onClick={() => selectedTeam && voteForTeam(selectedTeam.id)}
              disabled={hasVoted}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-black font-bold py-4"
            >
              <Heart className="w-5 h-5 mr-2" />
              {hasVoted ? "Already Voted" : "Cast Your Vote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-orange-400">Project QR Code</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{selectedTeam?.projectName}</h3>
              <p className="text-gray-400">{selectedTeam?.name}</p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={selectedTeam ? getQRCodeURL(selectedTeam) : ""}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">Scan to view the project prototype</p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(selectedTeam ? getQRCodeURL(selectedTeam) : "")}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                {selectedTeam?.prototypeUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedTeam.prototypeUrl, "_blank")}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
