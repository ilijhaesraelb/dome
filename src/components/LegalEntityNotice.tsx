interface LegalEntityNoticeProps {
  className?: string;
}

const LegalEntityNotice = ({ className = "text-xs text-muted-foreground/60 text-center" }: LegalEntityNoticeProps) => (
  <p className={className}>
    DOME AI is owned and operated by Accelerated Real Estate Investment Corp. (AREI GROUP), a Delaware corporation
    authorized to conduct business in New York. DOME AI is a service platform and trade name (DBA) operated by AREI
    GROUP.
  </p>
);

export default LegalEntityNotice;
