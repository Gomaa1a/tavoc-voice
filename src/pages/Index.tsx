import { VoiceAgent } from "@/components/VoiceAgent";
import Chat from "@/components/Chat";
import Dashboard from "@/components/Dashboard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, Brain, Headphones } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            TAVOC Academy
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero section */}
          <div className="text-center mb-16 space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Your AI Learning
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Voice Assistant
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience personalized education with our advanced voice AI. 
              Get instant answers, explanations, and guidance on your learning journey.
            </p>
          </div>

          <div className="mb-16">
            <Tabs defaultValue="voice">
              <TabsList>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              </TabsList>

              <TabsContent value="voice">
                <div className="py-6">
                  <VoiceAgent />
                </div>
              </TabsContent>

              <TabsContent value="chat">
                <div className="py-6">
                  <Chat />
                </div>
              </TabsContent>

              <TabsContent value="dashboard">
                <div className="py-6">
                  <Dashboard />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-2xl bg-card shadow-card hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Smart Learning</h3>
              <p className="text-muted-foreground">
                AI-powered conversations that adapt to your learning style and pace
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card shadow-card hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Natural Voice</h3>
              <p className="text-muted-foreground">
                Speak naturally and get clear, conversational responses
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card shadow-card hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">24/7 Available</h3>
              <p className="text-muted-foreground">
                Your personal tutor is always ready to help, anytime you need
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-border">
        <p className="text-center text-muted-foreground">
          © 2025 TAVOC Academy. Powered by advanced AI voice technology.
        </p>
      </footer>
    </div>
  );
};

export default Index;
