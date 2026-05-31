import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, LogOut, Save } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LayoutActionBarProps {
  showSaveContinue?: boolean;
  className?: string;
}

const WORKFLOW_ROUTES = [
  "/onboarding",
  "/portal/passport",
  "/portal/documents",
  "/portal/forms",
  "/portal/packet",
  "/portal/attorney",
  "/portal",
] as const;

const isVisible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
};

const matchesWorkflowRoute = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`);

const getNextWorkflowRoute = (pathname: string) => {
  const currentRoute = WORKFLOW_ROUTES.find((route) => pathname === route)
    ?? WORKFLOW_ROUTES.find((route) => matchesWorkflowRoute(pathname, route));
  if (!currentRoute) return null;
  const currentIndex = WORKFLOW_ROUTES.indexOf(currentRoute);
  if (currentIndex === -1 || currentIndex === WORKFLOW_ROUTES.length - 1) return null;
  return WORKFLOW_ROUTES[currentIndex + 1];
};

const LayoutActionBar = ({ showSaveContinue = false, className }: LayoutActionBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const triggerPageAction = () => {
    const explicitTarget = document.querySelector<HTMLElement>("[data-save-and-continue-target='true'], [data-save-continue-target='true']");
    if (explicitTarget && isVisible(explicitTarget)) {
      explicitTarget.click();
      return true;
    }

    const buttonPatterns = [/save and continue/i, /^save$/i, /save/i, /continue/i, /create passport/i];
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
      .filter((button) => !button.closest("[data-global-action-bar='true']"))
      .filter((button) => !button.disabled && isVisible(button));

    for (const pattern of buttonPatterns) {
      const match = buttons.find((button) => pattern.test(button.innerText.trim()));
      if (match) {
        match.click();
        return true;
      }
    }

    const form = document.querySelector<HTMLFormElement>("main form, form");
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
      return true;
    }

    return false;
  };

  const handleSaveAndContinue = () => {
    window.dispatchEvent(new CustomEvent("app:save-and-continue", { detail: { pathname: location.pathname } }));

    if (triggerPageAction()) return;

    const nextRoute = getNextWorkflowRoute(location.pathname);
    if (nextRoute) {
      navigate(nextRoute);
      return;
    }

    toast.info("No save action was found on this page.");
  };

  return (
    <div
      data-global-action-bar="true"
      className={cn(
        "sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <BackButton />
        <div className="flex items-center gap-2">
          {showSaveContinue ? (
            <Button type="button" onClick={handleSaveAndContinue} className="gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save & Continue</span>
              <span className="sm:hidden">Save</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LayoutActionBar;
