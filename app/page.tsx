"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Wallet, QrCode, Send, Copy, CheckCircle, Clock, XCircle, Users, TrendingUp } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

// Mock data for teams
const mockTeams = [
  {
    id: "1",
    name: "Crypto Innovators",
    image: "/placeholder.svg?height=100&width=100",
    walletAddress: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
    description: "Building the future of DeFi",
    totalTips: 1250.5,
    tipCount: 42,
    recentTips: [
      { amount: 25.0, from: "0x9876...5432", timestamp: "2 hours ago" },
      { amount: 50.0, from: "0x1234...8765", timestamp: "5 hours ago" },
    ],
  },
  {
    id: "2",
    name: "NFT Creators Guild",
    image: "/placeholder.svg?height=100&width=100",
    walletAddress: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u",
    description: "Digital art and collectibles",
    totalTips: 890.25,
    tipCount: 28,
    recentTips: [
      { amount: 15.0, from: "0x5678...9012", timestamp: "1 hour ago" },
      { amount: 100.0, from: "0x3456...7890", timestamp: "3 hours ago" },
    ],
  },
  {
    id: "3",
    name: "Web3 Developers",
    image: "/placeholder.svg?height=100&width=100",
    walletAddress: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    description: "Open source blockchain tools",
    totalTips: 2100.75,
    tipCount: 67,
    recentTips: [
      { amount: 75.0, from: "0x2468...1357", timestamp: "30 minutes ago" },
      { amount: 30.0, from: "0x1357...2468", timestamp: "4 hours ago" },
    ],
  },
  {
    id: "4",
    name: "DeFi Research Lab",
    image: "/placeholder.svg?height=100&width=100",
    walletAddress: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w",
    description: "Advancing decentralized finance",
    totalTips: 1680.9,
    tipCount: 35,
    recentTips: [
      { amount: 200.0, from: "0x9753...1864", timestamp: "6 hours ago" },
      { amount: 45.0, from: "0x8642...9753", timestamp: "8 hours ago" },
    ],
  },
]

type TransactionStatus = "idle" | "pending" | "success" | "failed"

interface TipTransaction {
  id: string
  teamId: string
  amount: number
  status: TransactionStatus
  timestamp: string
}

export default function TippingSystemMVP() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<(typeof mockTeams)[0] | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [tipAmount, setTipAmount] = useState("")
  const [showTipModal, setShowTipModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [transactions, setTransactions] = useState<TipTransaction[]>([])
  const [currentTransaction, setCurrentTransaction] = useState<TipTransaction | null>(null)

  const filteredTeams = mockTeams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const connectWallet = async () => {
    // Simulate wallet connection
    setTimeout(() => {
      setIsWalletConnected(true)
      setWalletAddress("0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0")
    }, 1000)
  }

  const disconnectWallet = () => {
    setIsWalletConnected(false)
    setWalletAddress("")
  }

  const sendTip = async () => {
    if (!selectedTeam || !tipAmount || !isWalletConnected) return

    const transaction: TipTransaction = {
      id: Date.now().toString(),
      teamId: selectedTeam.id,
      amount: Number.parseFloat(tipAmount),
      status: "pending",
      timestamp: new Date().toISOString(),
    }

    setCurrentTransaction(transaction)
    setTransactions((prev) => [transaction, ...prev])

    // Simulate transaction processing
    setTimeout(() => {
      const success = Math.random() > 0.1 // 90% success rate
      const updatedTransaction = {
        ...transaction,
        status: success ? ("success" as TransactionStatus) : ("failed" as TransactionStatus),
      }

      setCurrentTransaction(updatedTransaction)
      setTransactions((prev) => prev.map((tx) => (tx.id === transaction.id ? updatedTransaction : tx)))

      if (success) {
        setTimeout(() => {
          setShowTipModal(false)
          setTipAmount("")
          setCurrentTransaction(null)
        }, 2000)
      }
    }, 3000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getQRCodeURL = (teamId: string) => {
    return `${window.location.origin}/tip/${teamId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-teal-600 bg-clip-text text-transparent">
                TipFlow
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {isWalletConnected ? (
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connected
                  </Badge>
                  <span className="text-sm text-gray-600 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectWallet}
                    className="border-violet-200 hover:bg-violet-50"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search teams or wallet addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border-violet-200 focus:border-violet-400 focus:ring-violet-400 rounded-xl shadow-sm"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm font-medium">Total Teams</p>
                  <p className="text-3xl font-bold">{mockTeams.length}</p>
                </div>
                <Users className="w-8 h-8 text-violet-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Total Tips</p>
                  <p className="text-3xl font-bold">
                    ${mockTeams.reduce((sum, team) => sum + team.totalTips, 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-coral-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">Active Tips</p>
                  <p className="text-3xl font-bold">{mockTeams.reduce((sum, team) => sum + team.tipCount, 0)}</p>
                </div>
                <Send className="w-8 h-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 ring-4 ring-violet-100">
                    <AvatarImage src={team.image || "/placeholder.svg"} alt={team.name} />
                    <AvatarFallback className="bg-gradient-to-r from-violet-500 to-teal-500 text-white text-lg font-bold">
                      {team.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-800 group-hover:text-violet-600 transition-colors">
                      {team.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">${team.totalTips.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{team.tipCount} tips received</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-violet-100 to-teal-100 text-violet-700 border-0">
                    Active
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-700">
                      {team.walletAddress.slice(0, 8)}...{team.walletAddress.slice(-6)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(team.walletAddress)}
                      className="h-6 w-6 p-0 hover:bg-violet-100"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      setSelectedTeam(team)
                      setShowTipModal(true)
                    }}
                    disabled={!isWalletConnected}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Tip
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTeam(team)
                      setShowQRModal(true)
                    }}
                    className="border-violet-200 hover:bg-violet-50 hover:border-violet-300"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>

                {/* Recent Tips */}
                {team.recentTips.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Recent Tips</p>
                    <div className="space-y-1">
                      {team.recentTips.slice(0, 2).map((tip, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">
                            ${tip.amount} from {tip.from.slice(0, 6)}...{tip.from.slice(-4)}
                          </span>
                          <span className="text-gray-400">{tip.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-violet-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-violet-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        )}
      </main>

      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedTeam?.image || "/placeholder.svg"} alt={selectedTeam?.name} />
                <AvatarFallback className="bg-gradient-to-r from-violet-500 to-teal-500 text-white">
                  {selectedTeam?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span>Tip {selectedTeam?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {currentTransaction ? (
              <div className="text-center py-6">
                {currentTransaction.status === "pending" && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-violet-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8 text-violet-600 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Processing Transaction</h3>
                      <p className="text-gray-500">Please wait while we process your tip...</p>
                    </div>
                  </div>
                )}

                {currentTransaction.status === "success" && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Tip Sent Successfully!</h3>
                      <p className="text-gray-500">
                        ${currentTransaction.amount} has been sent to {selectedTeam?.name}
                      </p>
                    </div>
                  </div>
                )}

                {currentTransaction.status === "failed" && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Transaction Failed</h3>
                      <p className="text-gray-500">Please try again or check your wallet connection</p>
                    </div>
                    <Button
                      onClick={() => setCurrentTransaction(null)}
                      className="bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip Amount (USD)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="text-lg text-center border-violet-200 focus:border-violet-400 focus:ring-violet-400"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Recipient:</span>
                    <span className="font-mono text-gray-800">
                      {selectedTeam?.walletAddress.slice(0, 8)}...{selectedTeam?.walletAddress.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-600">Network Fee:</span>
                    <span className="text-gray-800">~$0.01</span>
                  </div>
                </div>

                <Button
                  onClick={sendTip}
                  disabled={!tipAmount || !isWalletConnected}
                  className="w-full bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Tip
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code for {selectedTeam?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG
                  value={selectedTeam ? getQRCodeURL(selectedTeam.id) : ""}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Scan this QR code to tip {selectedTeam?.name}</p>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(selectedTeam ? getQRCodeURL(selectedTeam.id) : "")}
                className="border-violet-200 hover:bg-violet-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
