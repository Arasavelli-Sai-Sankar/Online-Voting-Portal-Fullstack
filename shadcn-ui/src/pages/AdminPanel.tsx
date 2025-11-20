import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { LogOut, Plus, Edit, Trash2, PlayCircle, StopCircle, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface Participant {
  id: string;
  name: string;
  description: string;
  image: string;
  votes: number;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { logout, participants, addParticipant, updateParticipant, deleteParticipant, votingStatus, toggleVoting, users, getResults } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });

  const [opinionAnalysis, setOpinionAnalysis] = useState<{
    summary: string;
    sentiment: string;
    message?: string;
    feedback?: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('opinionAnalysis');
      if (raw) setOpinionAnalysis(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  const results = getResults();
  const totalVotes = results.reduce((sum, p) => sum + p.votes, 0);
  const totalUsers = users.length;
  const votedUsers = users.filter((u) => u.hasVoted).length;

  const pieData = results.map((p) => ({ name: p.name, value: p.votes }));
  const barData = results.map((p) => ({ name: p.name, votes: p.votes }));

  // === Handlers ===
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleToggleVoting = () => {
    toggleVoting();
    toast.success(`Voting ${votingStatus.isActive ? 'stopped' : 'started'} successfully`);
  };

  const handleAddParticipant = () => {
    if (!formData.name || !formData.description || !formData.image) {
      toast.error('Please fill all fields');
      return;
    }
    addParticipant({ name: formData.name, description: formData.description, image: formData.image });
    setFormData({ name: '', description: '', image: '' });
    setIsAddDialogOpen(false);
    toast.success('Participant added successfully');
  };

  const openEditDialog = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      description: participant.description,
      image: participant.image,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditParticipant = () => {
    if (!editingParticipant) return;
    updateParticipant(editingParticipant.id, { name: formData.name, description: formData.description, image: formData.image });
    setIsEditDialogOpen(false);
    toast.success('Participant updated successfully');
  };

  const handleDeleteParticipant = (id: string) => {
    deleteParticipant(id);
    toast.success('Participant deleted');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Admin Control Panel
            </h1>
            <p className="text-sm text-muted-foreground">Manage voting system</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length}</div>
              <p className="text-xs text-muted-foreground">Active candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                {votedUsers} of {totalUsers} users voted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">Voting Status</CardTitle>
              {votingStatus.isActive ? (
                <PlayCircle className="h-4 w-4 text-green-600" />
              ) : (
                <StopCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <Badge variant={votingStatus.isActive ? 'default' : 'secondary'} className="mb-2">
                {votingStatus.isActive ? 'Active' : 'Closed'}
              </Badge>
              <Button onClick={handleToggleVoting} size="sm" className="w-full">
                {votingStatus.isActive ? 'Stop Voting' : 'Start Voting'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution</CardTitle>
              <CardDescription>Current voting statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={80} labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vote Count</CardTitle>
              <CardDescription>Total votes by candidate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Manage Participants */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>Manage Participants</CardTitle>
              <CardDescription>Add, edit, or remove candidates</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-600 to-orange-600">
                  <Plus className="mr-2 h-4 w-4" /> Add Participant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Participant</DialogTitle>
                  <DialogDescription>Enter participant details below</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddParticipant} className="w-full">
                    Add Participant
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="truncate">{p.description}</TableCell>
                    <TableCell><Badge variant="outline">{p.votes}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteParticipant(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Participant</DialogTitle>
              <DialogDescription>Update participant details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>
              <Button onClick={handleEditParticipant} className="w-full">
                Update Participant
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Opinion Analysis */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Latest Opinion Analysis</CardTitle>
            <CardDescription>Summary and sentiment from feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {opinionAnalysis ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(opinionAnalysis.timestamp || '').toLocaleString() || '—'}
                </p>
                <p><span className="font-semibold">Summary:</span> {opinionAnalysis.summary}</p>
                <p><span className="font-semibold">Sentiment:</span> <Badge>{opinionAnalysis.sentiment}</Badge></p>
                {opinionAnalysis.feedback && (
                  <p><span className="font-semibold">Feedback:</span> {opinionAnalysis.feedback}</p>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      const raw = localStorage.getItem('opinionAnalysis');
                      if (raw) setOpinionAnalysis(JSON.parse(raw));
                      else setOpinionAnalysis(null);
                      toast.success('Analysis refreshed');
                    } catch {
                      toast.error('Failed to refresh');
                    }
                  }}
                >
                  Refresh
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No analysis available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
