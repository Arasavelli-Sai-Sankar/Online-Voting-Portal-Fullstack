import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { LogOut, Vote, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useEffect } from 'react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, vote, participants, votingStatus, getResults } = useAuth();

  const handleVote = (participantId: string) => {
    const success = vote(participantId);
    if (success) {
      toast.success('Vote cast successfully!');
    } else {
      toast.error('Failed to cast vote. You may have already voted or voting is closed.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const results = getResults();
  const totalVotes = results.reduce((sum, p) => sum + p.votes, 0);

  const pieData = results.map((p) => ({
    name: p.name,
    value: p.votes,
  }));

  const barData = results.map((p) => ({
    name: p.name,
    votes: p.votes,
    percentage: totalVotes > 0 ? ((p.votes / totalVotes) * 100).toFixed(1) : 0,
  }));

  const [feedback, setFeedback] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ summary: string; sentiment: string; message?: string } | null>(null);

  const handleOpinionSubmit = async () => {
    const text = feedback.trim();
    if (!text) {
      toast.error('Please enter your opinion before submitting.');
      return;
    }
    try {
      setAnalyzing(true);
      const res = await fetch('http://localhost:8086/api/analyze-opinion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: text }),
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = await res.json();
      setAnalysisResult({ summary: data.summary, sentiment: data.sentiment, message: data.message });
      // Persist latest analysis so Admin Panel can show it
      localStorage.setItem(
        'opinionAnalysis',
        JSON.stringify({
          summary: data.summary,
          sentiment: data.sentiment,
          message: data.message,
          feedback: text,
          timestamp: new Date().toISOString(),
        }),
      );
      toast.success('Opinion analyzed successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to analyze opinion: ${message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Voting Portal
            </h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Vote className="h-6 w-6" />
                Voting Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {votingStatus.isActive ? 'Voting is Active' : 'Voting has Ended'}
                  </p>
                  <p className="text-sm opacity-90">
                    {user?.hasVoted ? 'You have already voted' : 'Cast your vote below'}
                  </p>
                </div>
                <Badge variant={votingStatus.isActive ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                  {votingStatus.isActive ? 'Active' : 'Closed'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {votingStatus.isActive && !user?.hasVoted && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Vote className="h-8 w-8 text-blue-600" />
              Cast Your Vote
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participants.map((participant, index) => (
                <Card
                  key={participant.id}
                  className="hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <img
                      src={participant.image}
                      alt={participant.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <CardTitle className="text-xl">{participant.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">{participant.description}</CardDescription>
                    <Button
                      onClick={() => handleVote(participant.id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Vote for {participant.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {user?.hasVoted && votingStatus.isActive && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-6 w-6" />
                  Thank You for Voting!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-600">
                  Your vote has been recorded. Results will be available after the voting period ends.
                </p>

                {/* Opinion textarea + submit */}
                <div className="mt-6 space-y-3">
                  <Label htmlFor="opinion">Share your opinion about the participant</Label>
                  <Textarea
                    id="opinion"
                    placeholder="Type your opinion here..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <Button
                    onClick={handleOpinionSubmit}
                    disabled={analyzing || !feedback.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {analyzing ? 'Analyzing...' : 'Submit Opinion'}
                  </Button>

                  {analysisResult && (
                    <div className="text-sm text-green-700">
                      Analysis submitted. Admin can view the summary and sentiment.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!votingStatus.isActive && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                Voting Results
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Vote Distribution</CardTitle>
                    <CardDescription>Percentage of votes by candidate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
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
                    <CardDescription>Total votes received by each candidate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="votes" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Results</CardTitle>
                  <CardDescription>Complete breakdown of voting results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map((participant, index) => (
                      <div key={participant.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-lg">
                              #{index + 1}
                            </Badge>
                            <span className="font-semibold">{participant.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-lg">{participant.votes}</span>
                            <span className="text-muted-foreground ml-2">
                              ({totalVotes > 0 ? ((participant.votes / totalVotes) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={totalVotes > 0 ? (participant.votes / totalVotes) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Votes</span>
                        <span className="text-xl">{totalVotes}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}