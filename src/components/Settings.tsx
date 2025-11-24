import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { ChevronRight, Bell, Mic, Palette, Download, Info } from 'lucide-react';

export function Settings() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl">Settings</h1>
        <p className="text-sm text-gray-500">Customize your experience</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Voice Settings */}
        <div>
          <h2 className="text-lg mb-3 flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Recognition
          </h2>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Auto-confirm tasks</p>
                <p className="text-sm text-gray-500">Skip confirmation dialog</p>
              </div>
              <Switch />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Voice feedback</p>
                <p className="text-sm text-gray-500">Hear AI responses</p>
              </div>
              <Switch />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Language</p>
                <p className="text-sm text-gray-500">English (US)</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-lg mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Daily summary</p>
                <p className="text-sm text-gray-500">Get daily productivity report</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Weekly report</p>
                <p className="text-sm text-gray-500">Weekly productivity insights</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Task reminders</p>
                <p className="text-sm text-gray-500">Remind about pending tasks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>AI insights</p>
                <p className="text-sm text-gray-500">Get smart suggestions</p>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
        </div>

        {/* Appearance */}
        <div>
          <h2 className="text-lg mb-3 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </h2>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Dark mode</p>
                <p className="text-sm text-gray-500">Use dark theme</p>
              </div>
              <Switch />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p>Color scheme</p>
                <p className="text-sm text-gray-500">Blue</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </div>

        {/* Data & Privacy */}
        <div>
          <h2 className="text-lg mb-3 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data & Privacy
          </h2>
          <Card className="divide-y">
            <button className="p-4 flex items-center justify-between w-full text-left">
              <div>
                <p>Export data</p>
                <p className="text-sm text-gray-500">Download all your tasks</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-4 flex items-center justify-between w-full text-left">
              <div>
                <p>Clear cache</p>
                <p className="text-sm text-gray-500">Free up storage space</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-4 flex items-center justify-between w-full text-left text-red-600">
              <div>
                <p>Delete account</p>
                <p className="text-sm text-red-400">Permanently delete all data</p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </Card>
        </div>

        {/* About */}
        <div>
          <h2 className="text-lg mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            About
          </h2>
          <Card className="divide-y">
            <button className="p-4 flex items-center justify-between w-full text-left">
              <div>
                <p>Version</p>
                <p className="text-sm text-gray-500">1.0.0</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-4 flex items-center justify-between w-full text-left">
              <div>
                <p>Privacy Policy</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-4 flex items-center justify-between w-full text-left">
              <div>
                <p>Terms of Service</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </Card>
        </div>

        {/* Logout */}
        <Button variant="outline" className="w-full" size="lg">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
