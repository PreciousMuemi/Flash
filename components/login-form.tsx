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

export function LoginForm({
  className,
  handleZkLogin,
  ...props
}: React.ComponentPropsWithoutRef<"div">&{
  handleZkLogin?: () => void;
}) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 bg-slate-900", className)} {...props}>
      <Card className="max-w-sm mx-auto bg-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-100">Login</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
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
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-pink-400 hover:text-pink-300"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="bg-slate-700 border-slate-600 text-gray-100 placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-0">
                Login
              </Button>
              <Button
                variant="outline"
                className="w-full bg-slate-700/50 border-slate-600 text-gray-200 hover:bg-slate-600 hover:text-gray-100"
                onClick={handleZkLogin}
              >
                Login with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <a href="/auth/[id]/sign-in" className="underline underline-offset-4 text-pink-400 hover:text-pink-300">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}