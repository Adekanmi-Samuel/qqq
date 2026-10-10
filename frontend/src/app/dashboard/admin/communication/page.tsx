"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import {
  Mail, Settings, FileText, Send, CheckCircle2,
  AlertCircle, Search, Loader2, Plus, Edit2, Trash2
} from "lucide-react";
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { API_URL } from "@/lib/config";


interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailLog {
  id: string;
  recipientEmail: string;
  subject: string;
  status: "SENT" | "FAILED" | "PENDING";
  sentAt: string;
}

export default function CommunicationDashboard() {
  // cookie auth: token always null
  const [activeTab, setActiveTab] = useState<"compose" | "templates" | "logs" | "settings">("compose");

  // State for different tabs
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);

  // Compose State
  const [composeData, setComposeData] = useState({
    recipientType: "ALL_PARENTS", // or class ID
    subject: "",
    body: "",
    templateId: "none",
  });

  useEffect(() => {
    if (activeTab === "templates") fetchTemplates();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/email/templates`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/email/logs`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      // Logic to send email via backend route
      const res = await fetch(`${API_URL}/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify(composeData),
      });
      const data = await res.json();
      if (data.success) {
        alert("Emails sent successfully!");
        setComposeData({ ...composeData, subject: "", body: "" });
      } else {
        alert(data.error || "Failed to send emails");
      }
    } catch (err) {
      alert("Error sending emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-ink font-fraunces">Communication Hub</h1>
          <p className="text-sm text-gray-500 font-sans mt-1">Manage parent emails, newsletters, and templates.</p>
        </div>
      </div>

      <div className="flex items-center space-x-1 border-b border-gray-200">
        {[
          { id: "compose", label: "Compose", icon: Mail },
          { id: "templates", label: "Templates", icon: FileText },
          { id: "logs", label: "History", icon: CheckCircle2 },
          { id: "settings", label: "SMTP Settings", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-schoolhub-600 text-schoolhub-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === "compose" && (
          <div className="grid gap-6 max-w-4xl">
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">New Message</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <Select 
                    value={composeData.recipientType} 
                    onValueChange={(v) => setComposeData({ ...composeData, recipientType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_PARENTS">All Parents</SelectItem>
                      <SelectItem value="JSS1_PARENTS">JSS 1 Parents</SelectItem>
                      <SelectItem value="JSS2_PARENTS">JSS 2 Parents</SelectItem>
                      <SelectItem value="SS1_PARENTS">SS 1 Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template (Optional)</label>
                  <Select 
                    value={composeData.templateId} 
                    onValueChange={(v) => {
                      const t = templates.find(temp => temp.id === v);
                      if (t) {
                        setComposeData({ ...composeData, templateId: v, subject: t.subject, body: t.body });
                      } else {
                        setComposeData({ ...composeData, templateId: "none" });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Blank)</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-schoolhub-500"
                    placeholder="Enter subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={8}
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-schoolhub-500 resize-y"
                    placeholder="Type your message here. You can use placeholders like {{parentName}} and {{studentName}}."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSendEmail} disabled={loading || !composeData.subject || !composeData.body}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send Message
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Email Templates</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Template
              </Button>
            </div>
            
            {loading ? (
               <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-schoolhub-500" /></div>
            ) : templates.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No templates created yet.</p>
               </div>
            ) : (
               <div className="grid gap-4 md:grid-cols-2">
                  {templates.map(t => (
                     <Card key={t.id} className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-semibold text-gray-900">{t.name}</h3>
                           <div className="flex space-x-1">
                              <button className="p-1 text-gray-400 hover:text-schoolhub-600 rounded"><Edit2 className="w-4 h-4" /></button>
                              <button className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Subj: {t.subject}</p>
                        <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">{t.body}</p>
                        <Button variant="outline" size="sm" className="w-full mt-auto" onClick={() => {
                           setComposeData({ ...composeData, templateId: t.id, subject: t.subject, body: t.body });
                           setActiveTab("compose");
                        }}>
                           Use Template
                        </Button>
                     </Card>
                  ))}
               </div>
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4 max-w-5xl">
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Email History</h2>
              <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-schoolhub-500" />
              </div>
            </div>

            {loading ? (
               <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-schoolhub-500" /></div>
            ) : (
               <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {logs.length === 0 ? (
                           <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No email history found.</td></tr>
                        ) : logs.map(log => (
                           <tr key={log.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {new Date(log.sentAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                 {log.recipientEmail}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                                 {log.subject}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    log.status === "SENT" ? "bg-green-100 text-green-800" :
                                    log.status === "FAILED" ? "bg-red-100 text-red-800" :
                                    "bg-yellow-100 text-yellow-800"
                                 }`}>
                                    {log.status}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl">
             <Card className="p-6">
               <div className="flex items-start mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg mr-4">
                     <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                     <h2 className="text-lg font-medium text-gray-900">SMTP Configuration</h2>
                     <p className="text-sm text-gray-500">Configure your custom email server for sending parent communications.</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="smtp.gmail.com" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="465 or 587" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                     <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="school@example.com" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Password / App Password</label>
                     <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="••••••••••••" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                     <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Test Academy" />
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                     <Button variant="outline">Test Connection</Button>
                     <Button>Save Configuration</Button>
                  </div>
               </div>
             </Card>
          </div>
        )}
      </div>
    </div>
  );
}
