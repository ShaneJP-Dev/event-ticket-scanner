"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addEvent } from "@/lib/actions";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2),
  date: z.string(),
});

export default function AddEventForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
    await addEvent(data);
    toast.success(`✅ Event "${data.name}" added successfully`);
    form.reset();
  })}
      className="space-y-4 max-w-md"
    >
      <Input placeholder="Event name" {...form.register("name")} />
      <Input type="date" {...form.register("date")} />
      <Button type="submit">Add Event</Button>
    </form>
  );
}
