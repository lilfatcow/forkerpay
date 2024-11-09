import { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useCounterparts } from '@/hooks/useCounterparts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateReceivableRequest } from '@monite/sdk-api';

interface InvoiceCreatorProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvoiceCreator({ onSuccess, onCancel }: InvoiceCreatorProps) {
  const { create, loading } = useInvoices();
  const { list: listCounterparts } = useCounterparts();
  const [counterparts, setCounterparts] = useState([]);
  const [formData, setFormData] = useState<CreateReceivableRequest>({
    type: 'invoice',
    currency: 'USD',
    counterpart_id: '',
    line_items: [
      {
        product_name: '',
        quantity: 1,
        unit_price: 0
      }
    ],
    payment_terms: {
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const loadCounterparts = async () => {
    const data = await listCounterparts();
    setCounterparts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await create(formData);
    if (result) {
      onSuccess?.();
    }
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          product_name: '',
          quantity: 1,
          unit_price: 0
        }
      ]
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const total = formData.line_items.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price),
    0
  );

  return (
    <SheetContent side="right" className="w-full sm:w-[800px] p-0">
      <SheetHeader className="px-6 pt-6">
        <SheetTitle>Create New Invoice</SheetTitle>
      </SheetHeader>

      <ScrollArea className="flex-1 px-6">
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={formData.counterpart_id}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  counterpart_id: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {counterparts.map((counterpart) => (
                    <SelectItem key={counterpart.id} value={counterpart.id}>
                      {counterpart.organization?.name || `${counterpart.individual?.first_name} ${counterpart.individual?.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.payment_terms.due_date}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  payment_terms: {
                    ...prev.payment_terms,
                    due_date: e.target.value
                  }
                }))}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {formData.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <Input
                      placeholder="Item description"
                      value={item.product_name}
                      onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    {formData.line_items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end text-lg font-medium">
              Total: ${total.toFixed(2)}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </div>
        </form>
      </ScrollArea>
    </SheetContent>
  );
}