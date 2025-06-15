import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignUpForm({
  className,
  handleZkLogin,
  ...props
}: React.ComponentPropsWithoutRef<"div">&{
    handleZkLogin?: () => void;
}) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 bg-slate-900", className)} {...props}>
      <Card className="max-w-md mx-auto bg-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-100">Create Account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name" className="text-gray-200">First name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="John"
                    required
                    className="bg-slate-700 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name" className="text-gray-200">Last name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Doe"
                    required
                    className="bg-slate-700 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="bg-slate-700 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Create a strong password"
                  required 
                  className="bg-slate-700 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-gray-200">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Confirm your password"
                  required 
                  className="bg-slate-700 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-0">
                Create Account
              </Button>
              <Button className="w-full bg-slate-700/50 border-slate-600 text-gray-200 hover:bg-slate-600 hover:text-gray-100" onClick={handleZkLogin}>
                Sign up with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <a href="/auth/[id]/sign-in" className="underline underline-offset-4 text-pink-400 hover:text-pink-300">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}