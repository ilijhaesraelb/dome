import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <Link
          to="/affiliate"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-all hover:scale-105 shadow-[0_0_10px_hsl(var(--warning)/0.6),0_0_20px_hsl(var(--secondary)/0.4)] animate-pulse"
        >
          <Rocket className="h-4 w-4" />
          Earn With D.O.M.E.
        </Link>
        <h1 className="text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
