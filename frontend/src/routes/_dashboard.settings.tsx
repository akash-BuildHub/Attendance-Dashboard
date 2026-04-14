import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [notifications, setNotifications] = useState({ email: true, whatsapp: false, push: true });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" icon={<SettingsIcon className="h-5 w-5 text-primary" />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Shift Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Morning Shift", value: "06:00-14:00" },
              { label: "Day Shift", value: "08:00-17:00" },
              { label: "Evening Shift", value: "14:00-22:00" },
              { label: "Night Shift", value: "22:00-06:00" },
            ].map((shift) => (
              <div key={shift.label} className="flex items-center justify-between">
                <Label className="text-sm">{shift.label}</Label>
                <Input className="w-40 text-center" defaultValue={shift.value} />
              </div>
            ))}
            <Button className="w-full mt-2">Save Shifts</Button>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Access Control</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Aswin", role: "Admin", access: "Full" },
              { name: "Akash", role: "Employee", access: "Standard" },
              { name: "Greeshma", role: "Security", access: "Gate Only" },
            ].map((user) => (
              <div key={user.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">{user.access}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div><Label>Email Notifications</Label><p className="text-xs text-muted-foreground mt-0.5">Receive alerts via email</p></div>
                <Switch checked={notifications.email} onCheckedChange={(v) => setNotifications({ ...notifications, email: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>WhatsApp Alerts</Label><p className="text-xs text-muted-foreground mt-0.5">Critical alerts via WhatsApp</p></div>
                <Switch checked={notifications.whatsapp} onCheckedChange={(v) => setNotifications({ ...notifications, whatsapp: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Push Notifications</Label><p className="text-xs text-muted-foreground mt-0.5">Browser push notifications</p></div>
                <Switch checked={notifications.push} onCheckedChange={(v) => setNotifications({ ...notifications, push: v })} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



