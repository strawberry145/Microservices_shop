import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const sizeData = [
  { eu: "35", us: "5", uk: "2", cm: "22.8" },
  { eu: "36", us: "6", uk: "3", cm: "23.5" },
  { eu: "37", us: "6.5", uk: "4", cm: "23.8" },
  { eu: "38", us: "7.5", uk: "5", cm: "24.5" },
  { eu: "39", us: "8.5", uk: "6", cm: "25.1" },
  { eu: "40", us: "9", uk: "7", cm: "25.4" },
  { eu: "41", us: "10", uk: "8", cm: "26.0" },
  { eu: "42", us: "11", uk: "9", cm: "26.7" },
];

export function SizeGuideModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors font-serif italic">
          Size Guide
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-border rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Size Guide</DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif italic">
            Find your perfect fit. Our shoes generally fit true to size.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-bold text-foreground">EU</TableHead>
                <TableHead className="font-bold text-foreground">US</TableHead>
                <TableHead className="font-bold text-foreground">UK</TableHead>
                <TableHead className="font-bold text-foreground">CM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizeData.map((row) => (
                <TableRow key={row.eu} className="border-border hover:bg-secondary/50 transition-colors">
                  <TableCell className="font-medium text-foreground">{row.eu}</TableCell>
                  <TableCell className="text-muted-foreground">{row.us}</TableCell>
                  <TableCell className="text-muted-foreground">{row.uk}</TableCell>
                  <TableCell className="text-muted-foreground">{row.cm}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
