import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, CheckCircle, XCircle } from "lucide-react";
import { mockDocuments, docStatusColors } from "@/data/mockData";
import { useT } from "@/hooks/useT";

const Documents = () => {
  const t = useT();
  const [search, setSearch] = useState("");
  const filtered = mockDocuments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.caseName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("practDocs.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("practDocs.totalDocs", { count: mockDocuments.length })}</p>
        </div>
        <Button className="gap-2"><Upload className="w-4 h-4" /> {t("practDocs.upload")}</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t("practDocs.searchDocs")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.caseName} · {doc.category} · {t("docs.uploaded")} {doc.uploadDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={docStatusColors[doc.status]}>{doc.status}</Badge>
                  {doc.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success"><CheckCircle className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"><XCircle className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
