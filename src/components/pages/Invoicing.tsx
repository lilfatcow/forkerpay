import { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { InvoiceCreator } from '@/components/invoices/InvoiceCreator';
import { Plus, Search, FileText, MoreVertical, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReceivableResponse } from '@monite/sdk-api';

export function Invoicing() {
  const { list, markAsPaid, loading } = useInvoices();
  const [invoices, setInvoices] = useState<ReceivableResponse[]>([]);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadInvoices = async () => {
    const data = await list();
    setInvoices(data);
  };

  const handleMarkAsPaid = async (id: string) => {
    const success = await markAsPaid(id);
    if (success) {
      loadInvoices();
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.document_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.counterpart_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-8 py-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium">Invoicing & Receivables</h1>
          <Button onClick={() => setShowCreateInvoice(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              {searchQuery ? (
                <>
                  <p className="text-muted-foreground">No invoices found matching "{searchQuery}"</p>
                  <Button variant="link" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="font-medium">No invoices yet</h3>
                  <p className="text-muted-foreground">Create your first invoice to get started</p>
                  <Button className="mt-4" onClick={() => setShowCreateInvoice(true)}>
                    Create Invoice
                  </Button>
                </>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {invoice.counterpart_name || 'Unnamed Client'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invoice #{invoice.document_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        ${invoice.amount?.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due {new Date(invoice.due_date || '').toLocaleDateString()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
          <InvoiceCreator
            onSuccess={() => {
              setShowCreateInvoice(false);
              loadInvoices();
            }}
            onCancel={() => setShowCreateInvoice(false)}
          />
        </Sheet>
      </div>
    </div>
  );
}