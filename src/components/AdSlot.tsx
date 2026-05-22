export function AdSlot({ label = "Advertisement", publisherId }: { label?: string; publisherId?: string }) {
  // Placeholder — replace with real AdSense <ins> tags once approved.
  // When publisherId is set, this is where the AdSense block would go.
  return (
    <div className="my-8 flex h-32 w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
      {publisherId ? `Ad slot · ${publisherId}` : label}
    </div>
  );
}
