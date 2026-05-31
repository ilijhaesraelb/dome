/**
 * FormSectionDeepLinks — renders a compact list of section deep-links for a
 * given form code, so professionals can jump straight to the section they
 * want to review (no forced beginner sequence).
 */
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getFormSections, formSectionDeepLink } from "@/lib/tax-pro/form-sections";
import { Badge } from "@/components/ui/badge";

interface Props {
  fileId: string;
  formCode: string;
}

export const FormSectionDeepLinks = ({ fileId, formCode }: Props) => {
  const sections = getFormSections(formCode);
  if (!sections.length) return null;

  return (
    <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((s) => (
        <Link
          key={s.key}
          to={formSectionDeepLink(fileId, formCode, s.key)}
          className="group flex items-center justify-between rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:border-primary hover:bg-accent"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{s.label}</p>
            {s.hint && (
              <p className="truncate text-[10px] text-muted-foreground">{s.hint}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[9px] uppercase">{s.key}</Badge>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FormSectionDeepLinks;